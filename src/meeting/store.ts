import { create } from 'zustand'
import { ApiError } from '@/shared/lib/httpClient'
import { speakPrincess, splitVoiceReply, stopSpeaking } from '@/shared/lib/speechReply'
import { chimeListening, chimeReady } from './earcon'
import { initVoiceFromStorage } from './voice'
import {
  appendTranscript,
  askMeeting,
  createMeeting,
  finishMeeting,
  refreshNotes,
  updateLineSpeaker,
  uploadMeetingAudio,
} from './api'
import { MeetingNotesOut } from './types'
import {
  ActiveRecording,
  abortRecording,
  extensionForMime,
  isRecordingSupported,
  startRecording,
} from './recorder'
import {
  FinalSegment,
  LiveTranscription,
  speechRecognitionAvailable,
  startTranscription,
} from './transcription'

/**
 * idle      — совещание не идёт
 * starting  — запрашиваем микрофон / создаём сессию
 * recording — идёт запись
 * finishing — останавливаем, грузим аудио, закрываем сессию
 * saved     — сессия сохранена (панель показывает ссылку на список)
 */
export type MeetingPhase = 'idle' | 'starting' | 'recording' | 'finishing' | 'saved'

/** Пауза между финальными фрагментами, после которой считаем, что сменился спикер. */
const SPEAKER_PAUSE_MS = 2500
/** Как часто досылаем накопленные реплики на бэк. */
const FLUSH_INTERVAL_MS = 3000
/** Сколько новых реплик должно накопиться, чтобы авто-пересчитать заметки. */
const NOTES_NEW_LINES_THRESHOLD = 8
/** Ждём продолжения вопроса после «Марина …» столько мс, если тело уже есть. */
const ARM_GAP_WITH_BODY_MS = 1400
/** …и столько, если сказали только «Марина» без вопроса. */
const ARM_GAP_EMPTY_MS = 3000
/** Предохранитель: не держим «слушаю» дольше этого. */
const ARM_MAX_MS = 15000

/** Что сейчас делает Марина по голосовому обращению. */
export type AssistantState = 'idle' | 'armed' | 'thinking' | 'answering'

export interface TranscriptLine {
  localId: string
  /** серверный id — есть, когда строка долетела на бэк */
  lineId: number | null
  speaker: string
  text: string
  atMs: number
  synced: boolean
  /** реплика-обращение к Марине по слову «Марина» */
  isAssistantQuery: boolean
}

/**
 * Реплика — обращение к Марине, если начинается со слова «Марина».
 * Возвращает тело вопроса (без обращения) или null, если это не триггер.
 * Пустая строка в результате = позвали, но вопроса ещё нет.
 */
export function detectMarinaTrigger(text: string): string | null {
  const trimmed = text.trim()
  // «Марина» в начале, дальше не буква (т.е. отдельное слово)
  const m = trimmed.match(/^марина(?![а-яёa-z])/iu)
  if (!m) return null
  return trimmed.slice(m[0].length).replace(/^[\s,!.:;—–-]+/u, '').trim()
}

/** Убирает ведущее «Марина …» из продолжения вопроса, если оно повторилось. */
function stripLeadMarina(text: string): string {
  const body = detectMarinaTrigger(text)
  return body === null ? text.trim() : body
}

function friendlyError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Нет доступа к микрофону. Разрешите доступ в браузере и попробуйте снова.'
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'Микрофон не найден. Подключите его и попробуйте снова.'
    }
  }
  if (error instanceof ApiError || error instanceof Error) return error.message
  return 'Не удалось выполнить действие в режиме «Совещание»'
}

function otherSpeaker(speaker: string): string {
  return speaker === 'Спикер 2' ? 'Спикер 1' : 'Спикер 2'
}

function nextSpeaker(prev: TranscriptLine | undefined, gapMs: number): string {
  if (!prev) return 'Спикер 1'
  return gapMs > SPEAKER_PAUSE_MS ? otherSpeaker(prev.speaker) : prev.speaker
}

interface MeetingState {
  phase: MeetingPhase
  panelOpen: boolean
  meetingId: number | null
  startedAt: number | null
  savedMeetingId: number | null
  error: string | null

  transcript: TranscriptLine[]
  interim: string
  /** Проставлено, если распознавание недоступно/запрещено (запись всё равно идёт). */
  speechNotice: string | null

  notes: MeetingNotesOut | null
  /** false — бэк ответил 409 (нет ключа ИИ): авто-пересчёт и кнопку отключаем. */
  notesAiEnabled: boolean
  notesRefreshing: boolean

  /** Ответ Марины на последнее голосовое обращение «Марина, …» (markdown). */
  assistantAnswer: string | null
  /** idle → armed (услышала имя) → thinking → answering → idle */
  assistantState: AssistantState
  /** Разовая пометка, если голосовой вызов недоступен (нет ключа ИИ). */
  voiceTriggerNotice: string | null

  start: () => Promise<void>
  finish: () => Promise<void>
  setLineSpeaker: (localId: string, speaker: string) => void
  requestNotesRefresh: () => void
  dismissAssistantAnswer: () => void
  openPanel: () => void
  closePanel: () => void
  reset: () => void
}

let active: ActiveRecording | null = null
let transcriber: LiveTranscription | null = null
let flushTimer: ReturnType<typeof setInterval> | null = null
let flushing = false
let linesAtLastNotesRefresh = 0
let armTimer: ReturnType<typeof setTimeout> | null = null
let armMaxTimer: ReturnType<typeof setTimeout> | null = null
let pendingQuestion = ''

export const useMeetingStore = create<MeetingState>((set, get) => {
  function stopSideEffects() {
    transcriber?.stop()
    transcriber = null
    if (flushTimer !== null) {
      clearInterval(flushTimer)
      flushTimer = null
    }
    clearArmTimers()
    pendingQuestion = ''
    stopSpeaking()
  }

  async function flushTranscript(): Promise<boolean> {
    if (flushing) return false
    const { meetingId, transcript } = get()
    if (meetingId === null) return true
    const pending = transcript.filter((line) => !line.synced)
    if (pending.length === 0) return true

    flushing = true
    try {
      const created = await appendTranscript(
        meetingId,
        pending.map((line) => ({
          speaker: line.speaker,
          text: line.text,
          at_ms: line.atMs,
          is_assistant_query: line.isAssistantQuery,
        })),
      )
      // бэк возвращает строки в том же порядке — сшиваем по позиции
      set((state) => {
        const byLocalId = new Map(pending.map((line, i) => [line.localId, created[i]]))
        return {
          transcript: state.transcript.map((line) => {
            const match = byLocalId.get(line.localId)
            return match ? { ...line, lineId: match.id, synced: true } : line
          }),
        }
      })
      maybeAutoRefreshNotes()
      return true
    } catch {
      // не страшно — строки остаются несинхронизированными, попробуем ещё раз
      return false
    } finally {
      flushing = false
    }
  }

  /** На finish пытаемся дослать остаток настойчивее — потом сессия закроется. */
  async function drainTranscript(attempts = 3): Promise<void> {
    for (let i = 0; i < attempts; i += 1) {
      if (await flushTranscript()) return
      await new Promise((resolve) => setTimeout(resolve, 600))
    }
  }

  async function refreshNotesNow(): Promise<void> {
    const { meetingId, notesAiEnabled, notesRefreshing, transcript } = get()
    if (meetingId === null || !notesAiEnabled || notesRefreshing) return
    set({ notesRefreshing: true })
    const linesNow = transcript.length
    try {
      const notes = await refreshNotes(meetingId)
      set({ notes })
      linesAtLastNotesRefresh = linesNow
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        set({ notesAiEnabled: false }) // нет ключа ИИ — больше не дёргаем
      }
      // прочее — молча, попробуем в следующий раз
    } finally {
      set({ notesRefreshing: false })
    }
  }

  function maybeAutoRefreshNotes() {
    const { notesAiEnabled, transcript } = get()
    if (!notesAiEnabled) return
    if (transcript.length - linesAtLastNotesRefresh >= NOTES_NEW_LINES_THRESHOLD) {
      void refreshNotesNow()
    }
  }

  function clearArmTimers() {
    if (armTimer !== null) {
      clearTimeout(armTimer)
      armTimer = null
    }
    if (armMaxTimer !== null) {
      clearTimeout(armMaxTimer)
      armMaxTimer = null
    }
  }

  function scheduleArmFire(gapMs: number) {
    if (armTimer !== null) clearTimeout(armTimer)
    armTimer = setTimeout(() => {
      void fireQuestion()
    }, gapMs)
  }

  /** Услышали «Марина …» — сигнал и режим сбора вопроса. */
  function armQuestion(body: string) {
    pendingQuestion = body
    set({ assistantState: 'armed', assistantAnswer: null, error: null })
    chimeListening()
    scheduleArmFire(body ? ARM_GAP_WITH_BODY_MS : ARM_GAP_EMPTY_MS)
    armMaxTimer = setTimeout(() => {
      void fireQuestion()
    }, ARM_MAX_MS)
  }

  async function fireQuestion(): Promise<void> {
    clearArmTimers()
    const question = pendingQuestion.trim()
    pendingQuestion = ''
    const { meetingId } = get()
    if (meetingId === null) {
      set({ assistantState: 'idle' })
      return
    }
    if (!question) {
      set({ assistantState: 'idle' })
      void speakPrincess('Слушаю').catch(() => {})
      return
    }

    // Вопрос закончился — «Уже думаю» и уходим думать. Запись/транскрипция
    // при этом не прекращаются; новые «Марина …» игнорируются, пока не idle.
    set({ assistantState: 'thinking', assistantAnswer: null })
    void speakPrincess('Уже думаю').catch(() => {})

    let written: string
    let spoken: string
    try {
      const res = await askMeeting(meetingId, question)
      const parts = splitVoiceReply(res.answer_markdown)
      written = parts.written
      spoken = parts.spoken
    } catch (error) {
      set({ assistantState: 'idle' })
      if (error instanceof ApiError && error.status === 503) {
        set({ voiceTriggerNotice: 'Голосовой вызов Марины отключён: не задан ключ ИИ.' })
      } else {
        set({ assistantAnswer: '_Не удалось получить ответ. Попробуйте ещё раз._' })
      }
      return
    }

    // Закончила думать — сигнал, короткий ответ голосом, развёрнутый — текстом.
    chimeReady()
    set({ assistantState: 'answering', assistantAnswer: written })
    await new Promise<void>((resolve) => {
      void speakPrincess(spoken, { onEnd: resolve, onError: resolve })
    })
    set({ assistantState: 'idle' })
  }

  function handleFinalSegment(segment: FinalSegment) {
    const state = get()
    const st = state.assistantState
    const voiceOff = state.voiceTriggerNotice !== null

    let partOfQuestion = false
    if (!voiceOff) {
      if (st === 'idle') {
        const body = detectMarinaTrigger(segment.text)
        if (body !== null) {
          partOfQuestion = true
          armQuestion(body)
        }
      } else if (st === 'armed') {
        // продолжение вопроса в следующей реплике
        partOfQuestion = true
        const extra = stripLeadMarina(segment.text)
        pendingQuestion = `${pendingQuestion} ${extra}`.trim()
        scheduleArmFire(ARM_GAP_WITH_BODY_MS)
      }
      // thinking / answering — Марина занята, реплику не трогаем
    }

    set((s) => {
      const prev = s.transcript[s.transcript.length - 1]
      const line: TranscriptLine = {
        localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        lineId: null,
        speaker: nextSpeaker(prev, segment.gapMs),
        text: segment.text,
        atMs: segment.atMs,
        synced: false,
        isAssistantQuery: partOfQuestion,
      }
      return { transcript: [...s.transcript, line] }
    })
  }

  return {
    phase: 'idle',
    panelOpen: false,
    meetingId: null,
    startedAt: null,
    savedMeetingId: null,
    error: null,
    transcript: [],
    interim: '',
    speechNotice: null,
    notes: null,
    notesAiEnabled: true,
    notesRefreshing: false,
    assistantAnswer: null,
    assistantState: 'idle' as const,
    voiceTriggerNotice: null,

    start: async () => {
      const { phase } = get()
      if (phase === 'starting' || phase === 'recording' || phase === 'finishing') {
        set({ panelOpen: true })
        return
      }
      linesAtLastNotesRefresh = 0
      clearArmTimers()
      pendingQuestion = ''
      initVoiceFromStorage()
      set({
        phase: 'starting',
        panelOpen: true,
        error: null,
        savedMeetingId: null,
        transcript: [],
        interim: '',
        speechNotice: null,
        notes: null,
        notesAiEnabled: true,
        notesRefreshing: false,
        assistantAnswer: null,
        assistantState: 'idle',
        voiceTriggerNotice: null,
      })

      if (!isRecordingSupported()) {
        set({ phase: 'idle', error: 'Этот браузер не поддерживает запись с микрофона.' })
        return
      }

      // Сначала микрофон (это и есть запрос доступа), только потом создаём сессию —
      // при отказе на бэке не остаётся пустого совещания.
      try {
        active = await startRecording()
      } catch (error) {
        abortRecording()
        active = null
        set({ phase: 'idle', error: friendlyError(error) })
        return
      }

      let meetingId: number
      try {
        const meeting = await createMeeting(null)
        meetingId = meeting.id
      } catch (error) {
        abortRecording()
        active = null
        set({ phase: 'idle', meetingId: null, startedAt: null, error: friendlyError(error) })
        return
      }

      const startedAt = Date.now()
      set({ phase: 'recording', meetingId, startedAt })

      transcriber = startTranscription({
        startedAt,
        onFinal: handleFinalSegment,
        onInterim: (text) => set({ interim: text }),
        onUnavailable: (reason) => set({ speechNotice: reason, interim: '' }),
      })
      flushTimer = setInterval(() => {
        void flushTranscript()
      }, FLUSH_INTERVAL_MS)
    },

    finish: async () => {
      const { phase, meetingId } = get()
      if (phase !== 'recording' || meetingId === null) return
      set({ phase: 'finishing', error: null, interim: '' })

      stopSideEffects()
      await drainTranscript().catch(() => {})

      try {
        const recording = active
        const blob = recording ? await recording.stop() : null
        active = null
        if (blob && blob.size > 0) {
          const ext = extensionForMime(recording?.mimeType ?? 'audio/webm')
          await uploadMeetingAudio(meetingId, blob, `meeting-${meetingId}.${ext}`)
        }
        await finishMeeting(meetingId)
        // Бэк на finish уже пересчитал заметки по всему транскрипту — подтянем их.
        await refreshNotesNow().catch(() => {})
        set({ phase: 'saved', savedMeetingId: meetingId, meetingId: null, startedAt: null })
      } catch (error) {
        // Сессия могла не закрыться — возвращаем в recording, чтобы можно было
        // повторить «Завершить» (аудио уже остановлено, дойдёт без него).
        set({ phase: 'recording', error: friendlyError(error) })
      }
    },

    setLineSpeaker: (localId, speaker) => {
      const line = get().transcript.find((l) => l.localId === localId)
      if (!line || line.speaker === speaker) return
      set((state) => ({
        transcript: state.transcript.map((l) => (l.localId === localId ? { ...l, speaker } : l)),
      }))
      const { meetingId } = get()
      if (meetingId !== null && line.lineId !== null) {
        void updateLineSpeaker(meetingId, line.lineId, speaker).catch((error) =>
          set({ error: friendlyError(error) }),
        )
      }
    },

    requestNotesRefresh: () => {
      void refreshNotesNow()
    },

    dismissAssistantAnswer: () => set({ assistantAnswer: null }),

    openPanel: () => set({ panelOpen: true }),
    closePanel: () => set({ panelOpen: false }),

    reset: () => {
      stopSideEffects()
      stopSpeaking()
      abortRecording()
      active = null
      linesAtLastNotesRefresh = 0
      clearArmTimers()
      pendingQuestion = ''
      set({
        phase: 'idle',
        panelOpen: false,
        meetingId: null,
        startedAt: null,
        savedMeetingId: null,
        error: null,
        transcript: [],
        interim: '',
        speechNotice: null,
        notes: null,
        notesAiEnabled: true,
        notesRefreshing: false,
        assistantAnswer: null,
        assistantState: 'idle',
        voiceTriggerNotice: null,
      })
    },
  }
})

export { speechRecognitionAvailable }

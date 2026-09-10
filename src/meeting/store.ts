import { create } from 'zustand'
import { ApiError } from '@/shared/lib/httpClient'
import {
  appendTranscript,
  createMeeting,
  finishMeeting,
  updateLineSpeaker,
  uploadMeetingAudio,
} from './api'
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

export interface TranscriptLine {
  localId: string
  /** серверный id — есть, когда строка долетела на бэк */
  lineId: number | null
  speaker: string
  text: string
  atMs: number
  synced: boolean
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

  start: () => Promise<void>
  finish: () => Promise<void>
  setLineSpeaker: (localId: string, speaker: string) => void
  openPanel: () => void
  closePanel: () => void
  reset: () => void
}

let active: ActiveRecording | null = null
let transcriber: LiveTranscription | null = null
let flushTimer: ReturnType<typeof setInterval> | null = null
let flushing = false

export const useMeetingStore = create<MeetingState>((set, get) => {
  function stopSideEffects() {
    transcriber?.stop()
    transcriber = null
    if (flushTimer !== null) {
      clearInterval(flushTimer)
      flushTimer = null
    }
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
        pending.map((line) => ({ speaker: line.speaker, text: line.text, at_ms: line.atMs })),
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

  function handleFinalSegment(segment: FinalSegment) {
    set((state) => {
      const prev = state.transcript[state.transcript.length - 1]
      const line: TranscriptLine = {
        localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        lineId: null,
        speaker: nextSpeaker(prev, segment.gapMs),
        text: segment.text,
        atMs: segment.atMs,
        synced: false,
      }
      return { transcript: [...state.transcript, line] }
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

    start: async () => {
      const { phase } = get()
      if (phase === 'starting' || phase === 'recording' || phase === 'finishing') {
        set({ panelOpen: true })
        return
      }
      set({
        phase: 'starting',
        panelOpen: true,
        error: null,
        savedMeetingId: null,
        transcript: [],
        interim: '',
        speechNotice: null,
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

    openPanel: () => set({ panelOpen: true }),
    closePanel: () => set({ panelOpen: false }),

    reset: () => {
      stopSideEffects()
      abortRecording()
      active = null
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
      })
    },
  }
})

export { speechRecognitionAvailable }

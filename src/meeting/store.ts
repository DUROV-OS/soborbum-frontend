import { create } from 'zustand'
import { ApiError } from '@/shared/lib/httpClient'
import { createMeeting, finishMeeting, uploadMeetingAudio } from './api'
import {
  ActiveRecording,
  abortRecording,
  extensionForMime,
  isRecordingSupported,
  startRecording,
} from './recorder'

/**
 * idle      — совещание не идёт
 * starting  — запрашиваем микрофон / создаём сессию
 * recording — идёт запись
 * finishing — останавливаем, грузим аудио, закрываем сессию
 * saved     — сессия сохранена (панель показывает ссылку на список)
 */
export type MeetingPhase = 'idle' | 'starting' | 'recording' | 'finishing' | 'saved'

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

interface MeetingState {
  phase: MeetingPhase
  panelOpen: boolean
  meetingId: number | null
  startedAt: number | null
  savedMeetingId: number | null
  error: string | null

  start: () => Promise<void>
  finish: () => Promise<void>
  openPanel: () => void
  closePanel: () => void
  reset: () => void
}

let active: ActiveRecording | null = null

export const useMeetingStore = create<MeetingState>((set, get) => ({
  phase: 'idle',
  panelOpen: false,
  meetingId: null,
  startedAt: null,
  savedMeetingId: null,
  error: null,

  start: async () => {
    const { phase } = get()
    if (phase === 'starting' || phase === 'recording' || phase === 'finishing') {
      set({ panelOpen: true })
      return
    }
    set({ phase: 'starting', panelOpen: true, error: null, savedMeetingId: null })

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

    try {
      const meeting = await createMeeting(null)
      set({ phase: 'recording', meetingId: meeting.id, startedAt: Date.now() })
    } catch (error) {
      abortRecording()
      active = null
      set({ phase: 'idle', meetingId: null, startedAt: null, error: friendlyError(error) })
    }
  },

  finish: async () => {
    const { phase, meetingId } = get()
    if (phase !== 'recording' || meetingId === null) return
    set({ phase: 'finishing', error: null })

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
      // Сессия могла не закрыться — оставляем в recording, чтобы можно было
      // повторить «Завершить».
      set({ phase: 'recording', error: friendlyError(error) })
    }
  },

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),

  reset: () => {
    abortRecording()
    active = null
    set({
      phase: 'idle',
      panelOpen: false,
      meetingId: null,
      startedAt: null,
      savedMeetingId: null,
      error: null,
    })
  },
}))

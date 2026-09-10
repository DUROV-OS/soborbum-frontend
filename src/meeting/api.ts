import { API_BASE, apiRequest, downloadFile, getToken } from '@/shared/lib/httpClient'
import { MeetingDetailOut, MeetingNotesOut, MeetingOut, TranscriptLineOut } from './types'

export interface TranscriptLineIn {
  speaker: string
  text: string
  at_ms: number
  is_assistant_query?: boolean
}

const SECTION = 'ai'

/** POST /api/ai/meetings — создать сессию совещания */
export function createMeeting(title?: string | null): Promise<MeetingOut> {
  return apiRequest<MeetingOut>({
    section: SECTION,
    path: '/meetings',
    method: 'POST',
    body: { title: title ?? null },
  })
}

/** GET /api/ai/meetings — свои совещания, новые сверху */
export function listMeetings(): Promise<MeetingOut[]> {
  return apiRequest<MeetingOut[]>({ section: SECTION, path: '/meetings' })
}

/** GET /api/ai/meetings/:id */
export function getMeeting(id: number): Promise<MeetingDetailOut> {
  return apiRequest<MeetingDetailOut>({ section: SECTION, path: `/meetings/${id}` })
}

/** POST /api/ai/meetings/:id/audio — загрузка записанного блоба целиком */
export function uploadMeetingAudio(id: number, blob: Blob, filename: string): Promise<MeetingOut> {
  const form = new FormData()
  form.append('file', blob, filename)
  return apiRequest<MeetingOut>({ section: SECTION, path: `/meetings/${id}/audio`, method: 'POST', form })
}

/** POST /api/ai/meetings/:id/finish */
export function finishMeeting(id: number): Promise<MeetingOut> {
  return apiRequest<MeetingOut>({ section: SECTION, path: `/meetings/${id}/finish`, method: 'POST' })
}

/** POST /api/ai/meetings/:id/transcript — батч распознанных реплик, вернёт созданные строки по порядку */
export function appendTranscript(id: number, lines: TranscriptLineIn[]): Promise<TranscriptLineOut[]> {
  return apiRequest<TranscriptLineOut[]>({
    section: SECTION,
    path: `/meetings/${id}/transcript`,
    method: 'POST',
    body: { lines },
  })
}

/** PATCH /api/ai/meetings/:id/transcript/:lineId — ручная правка спикера строки */
export function updateLineSpeaker(id: number, lineId: number, speaker: string): Promise<TranscriptLineOut> {
  return apiRequest<TranscriptLineOut>({
    section: SECTION,
    path: `/meetings/${id}/transcript/${lineId}`,
    method: 'PATCH',
    body: { speaker },
  })
}

/** POST /api/ai/meetings/:id/ask — «Спросить Марину о совещании», ответ markdown-текстом */
export function askMeeting(id: number, question: string): Promise<{ answer_markdown: string }> {
  return apiRequest<{ answer_markdown: string }>({
    section: SECTION,
    path: `/meetings/${id}/ask`,
    method: 'POST',
    body: { question },
    timeoutMs: 180_000,
  })
}

/** POST /api/ai/meetings/:id/notes/refresh — пересчёт ИИ-заметок по транскрипту */
export function refreshNotes(id: number, force = false): Promise<MeetingNotesOut> {
  return apiRequest<MeetingNotesOut>({
    section: SECTION,
    path: `/meetings/${id}/notes/refresh`,
    method: 'POST',
    query: force ? { force: true } : undefined,
    timeoutMs: 180_000,
  })
}

/** GET /api/ai/meetings/:id/document — скачать markdown-документ совещания для базы знаний */
export function downloadMeetingDocument(id: number, filename: string): Promise<void> {
  return downloadFile(SECTION, `/meetings/${id}/document`, filename)
}

/**
 * Тянет запись совещания с авторизацией и отдаёт object URL для <audio>.
 * Плеер не умеет слать Bearer-заголовок сам, поэтому качаем блоб вручную —
 * так же, как downloadFileById в httpClient. Вызывающий обязан
 * URL.revokeObjectURL при размонтировании.
 */
export async function fetchMeetingAudioObjectUrl(id: number): Promise<string> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/${SECTION}/meetings/${id}/audio`, { headers })
  if (!response.ok) throw new Error('Не удалось загрузить запись совещания')
  return URL.createObjectURL(await response.blob())
}

import { API_BASE, apiRequest, getToken } from '@/shared/lib/httpClient'
import { MeetingDetailOut, MeetingOut, TranscriptLineOut } from './types'

export interface TranscriptLineIn {
  speaker: string
  text: string
  at_ms: number
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

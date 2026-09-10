import { API_BASE, apiRequest, getToken } from '@/shared/lib/httpClient'
import { MeetingDetailOut, MeetingOut } from './types'

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

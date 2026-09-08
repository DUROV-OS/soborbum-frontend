import { apiRequest } from '@/shared/lib/httpClient'
import { MaxChatHistory, MaxSendResult } from './types'

const SECTION = 'max'

/** Ключ localStorage: id нашего участника в MAX. Узнаём его из ответа на
 * первое отправленное сообщение (`message.sender`) и дальше используем,
 * чтобы отличать исходящие сообщения от входящих в истории. */
const VIEWER_ID_KEY = 'soborbum.max.viewer_id'

export function getMaxViewerId(): number | null {
  const raw = localStorage.getItem(VIEWER_ID_KEY)
  return raw === null ? null : Number(raw)
}

export function setMaxViewerId(id: number): void {
  localStorage.setItem(VIEWER_ID_KEY, String(id))
}

export interface GetChatParams {
  /** Сколько последних сообщений вернуть (по умолчанию 50). */
  limit?: number
  /** Сколько дополнительно подгрузить назад от самого старого. */
  backward?: number
}

/** GET /api/max/chats/:chatId */
export function getChat(chatId: number, params: GetChatParams = {}): Promise<MaxChatHistory> {
  return apiRequest<MaxChatHistory>({
    section: SECTION,
    path: `/chats/${chatId}`,
    query: { limit: params.limit, backward: params.backward },
  })
}

/** POST /api/max/messages */
export function sendMessage(chatId: number, text: string, notify = true): Promise<MaxSendResult> {
  return apiRequest<MaxSendResult>({
    section: SECTION,
    path: '/messages',
    method: 'POST',
    body: { chat_id: chatId, text, notify },
  })
}

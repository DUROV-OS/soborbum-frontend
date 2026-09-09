import { apiRequest } from '@/shared/lib/httpClient'
import { MaxChatHistory, MaxChatList, MaxMediaUrl, MaxSendResult } from './types'

const SECTION = 'max'

/**
 * GET /api/max/chats — все чаты организации с последним сообщением в каждом,
 * самые свежие сверху. `limit` — сколько первых вернуть (по умолчанию все).
 */
export function listChats(limit?: number): Promise<MaxChatList> {
  return apiRequest<MaxChatList>({ section: SECTION, path: '/chats', query: { limit } })
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

/**
 * GET /api/max/attachment — одноразовая ссылка на скачивание вложения типа
 * FILE. Домен `fd.oneme.ru`, без CORS: годится только для навигации
 * (`window.open` / `<a download>`), не для `fetch`.
 */
export async function getAttachmentUrl(
  chatId: number,
  messageId: string,
  fileId: string,
): Promise<string> {
  const res = await apiRequest<{ url: string }>({
    section: SECTION,
    path: '/attachment',
    query: { chat_id: chatId, message_id: messageId, file_id: fileId },
  })
  return res.url
}

/**
 * GET /api/max/media — воспроизводимая ссылка на вложение VIDEO или AUDIO
 * (голосовое). `mediaId` — `videoId` либо `audioId` из attach.
 */
export function getMediaUrl(
  chatId: number,
  messageId: string,
  mediaId: string,
): Promise<MaxMediaUrl> {
  return apiRequest<MaxMediaUrl>({
    section: SECTION,
    path: '/media',
    query: { chat_id: chatId, message_id: messageId, media_id: mediaId },
  })
}

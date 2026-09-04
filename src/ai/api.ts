import { apiRequest } from '@/shared/lib/httpClient'
import { AskRequest, AskResponse, ChatDetailOut, ChatDomain, ChatMode, ChatOut, PendingActionOut } from './types'

const SECTION = 'ai'

function askPath(domain: ChatDomain): string {
  return domain === 'general' ? '/chat/ask' : `/${domain}/ask`
}

/** POST /api/ai/{domain}/ask (or /api/ai/chat/ask for domain "general") */
export function askDomain(domain: ChatDomain, request: AskRequest): Promise<AskResponse> {
  return apiRequest<AskResponse>({ section: SECTION, path: askPath(domain), method: 'POST', body: request })
}

/** GET /api/ai/chats */
export function listChats(domain?: ChatDomain): Promise<ChatOut[]> {
  return apiRequest<ChatOut[]>({ section: SECTION, path: '/chats', query: { domain } })
}

/** GET /api/ai/chats/:id */
export function getChat(id: number): Promise<ChatDetailOut> {
  return apiRequest<ChatDetailOut>({ section: SECTION, path: `/chats/${id}` })
}

/** DELETE /api/ai/chats/:id */
export function deleteChat(id: number): Promise<void> {
  return apiRequest<void>({ section: SECTION, path: `/chats/${id}`, method: 'DELETE' })
}

/** PATCH /api/ai/chats/:id/mode */
export function updateChatMode(id: number, mode: ChatMode): Promise<ChatOut> {
  return apiRequest<ChatOut>({ section: SECTION, path: `/chats/${id}/mode`, method: 'PATCH', body: { mode } })
}

/** GET /api/ai/pending-actions */
export function listPendingActions(chatId?: number): Promise<PendingActionOut[]> {
  return apiRequest<PendingActionOut[]>({ section: SECTION, path: '/pending-actions', query: { chat_id: chatId } })
}

/** POST /api/ai/pending-actions/:id/approve */
export function approvePendingAction(id: number): Promise<AskResponse> {
  return apiRequest<AskResponse>({ section: SECTION, path: `/pending-actions/${id}/approve`, method: 'POST' })
}

/** POST /api/ai/pending-actions/:id/reject */
export function rejectPendingAction(id: number): Promise<AskResponse> {
  return apiRequest<AskResponse>({ section: SECTION, path: `/pending-actions/${id}/reject`, method: 'POST' })
}

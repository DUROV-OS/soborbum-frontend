import { SectionId } from '@/shared/sections'

export type ChatDomain = 'clients' | 'production' | 'cycle' | 'warehouse' | 'marketing' | 'tasks' | 'general'

export type ChatMode = 'no_actions' | 'require_approval' | 'auto_approve'

export type PendingActionStatus = 'pending' | 'approved' | 'rejected'

export interface AskRequest {
  chat_id?: number | null
  message: string
  mode?: ChatMode
}

export interface PendingActionOut {
  id: number
  chat_id: number
  message_id: number
  tool_name: string
  tool_input: Record<string, unknown>
  status: PendingActionStatus
  decided_by_id: number | null
  decided_at: string | null
  created_at: string
}

export interface AskResponse {
  chat_id: number
  status: 'completed' | 'pending_approval'
  reply: string | null
  pending_actions: PendingActionOut[]
}

export interface ChatOut {
  id: number
  domain: ChatDomain
  mode: ChatMode
  title: string | null
  created_at: string
}

export interface MessageContentBlock {
  type?: string
  text?: string
  name?: string
  input?: Record<string, unknown>
  id?: string
  [key: string]: unknown
}

export interface MessageOut {
  id: number
  role: string
  content: MessageContentBlock[]
  tool_resolutions: Record<string, unknown> | null
  created_at: string
}

export interface ChatDetailOut extends ChatOut {
  messages: MessageOut[]
}

/** Разделы, у которых есть свой домен ИИ на бэкенде — у «Монтажа» такого домена нет. */
export const DOMAIN_TO_SECTION: Record<Exclude<ChatDomain, 'general'>, SectionId> = {
  clients: 'clients',
  production: 'production',
  cycle: 'cycle',
  warehouse: 'warehouse',
  marketing: 'marketing',
  tasks: 'tasks',
}

export const DOMAIN_LABEL: Record<ChatDomain, string> = {
  general: 'Общий',
  clients: 'Клиенты',
  production: 'Производство',
  cycle: 'Цикл клиента',
  warehouse: 'Склад',
  marketing: 'Маркетинг',
  tasks: 'Задачи',
}

export const MODE_LABEL: Record<ChatMode, string> = {
  no_actions: 'Без действий',
  require_approval: 'Одобрение',
  auto_approve: 'Автоматически',
}

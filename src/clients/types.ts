export type ClientStage = 'lead' | 'discussion' | 'approval' | 'payment' | 'postpayment'

/** Одиночный заказ — один дом в производстве. Множественный — несколько домов
 * у одного клиента, под каждый на стадии производства заводится отдельный проект. */
export type OrderType = 'single' | 'multiple'

export const ORDER_TYPES: { key: OrderType; label: string }[] = [
  { key: 'single', label: 'Одиночный' },
  { key: 'multiple', label: 'Множественный' },
]

export function orderTypeLabel(type: OrderType | null): string {
  return ORDER_TYPES.find((o) => o.key === type)?.label ?? '—'
}

export const CLIENT_STAGES: { key: ClientStage; label: string }[] = [
  { key: 'lead', label: 'Лид' },
  { key: 'discussion', label: 'Обсуждение' },
  { key: 'approval', label: 'Согласование' },
  { key: 'payment', label: 'Оплата' },
  { key: 'postpayment', label: 'Постоплата' },
]

export interface FileAsset {
  id: number
  filename: string
  content_type: string
  purpose: string
  uploaded_by_id: number
  created_at: string
}

export interface ClientNote {
  id: number
  client_id: number
  author_id: number
  text: string
  created_at: string
}

/** Способ связи с клиентом: мессенджер/канал и адрес в нём. */
export interface ClientContact {
  messenger: string
  contact: string
}

/** Подсказки для поля «мессенджер» — не ограничение, просто частые варианты. */
export const MESSENGER_SUGGESTIONS = ['Telegram', 'WhatsApp', 'Viber', 'Телефон', 'Email', 'VK']

export interface Client {
  id: number
  cycle_id: number
  stage: ClientStage
  created_at: string
  full_name: string
  phone: string
  email: string
  contacts: ClientContact[]
  order_type: OrderType | null
  wishes_description: string | null
  estimated_price: number | null
  house_area: number | null
  layout_notes: string | null
  project_locked_at: string | null
  houses_count: number
  final_price: number | null
  installation_address: string | null
  contract_file: FileAsset | null
  house_project_file: FileAsset | null
  documents_locked_at: string | null
  is_paid: boolean | null
  payment_locked_at: string | null
  notes: ClientNote[]
}

export interface ClientCreateInput {
  full_name: string
  phone: string
  email: string
  contacts: ClientContact[]
}

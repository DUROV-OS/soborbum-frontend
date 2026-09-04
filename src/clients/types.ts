export type ClientStage = 'lead' | 'discussion' | 'approval' | 'payment' | 'postpayment'

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

export interface Client {
  id: number
  cycle_id: number
  stage: ClientStage
  created_at: string
  full_name: string
  phone: string
  email: string
  inn: string
  passport_number: string
  birth_date: string
  wishes_description: string | null
  estimated_price: number | null
  house_area: number | null
  layout_notes: string | null
  project_locked_at: string | null
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
  inn: string
  passport_number: string
  birth_date: string
}

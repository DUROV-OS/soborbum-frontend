import { Attachment } from '@/shared/ui/FileDrop'

export type ClientStage = 'lead' | 'discussion' | 'approval' | 'payment' | 'postpayment'

export const CLIENT_STAGES: { key: ClientStage; label: string }[] = [
  { key: 'lead', label: 'Лид' },
  { key: 'discussion', label: 'Обсуждение' },
  { key: 'approval', label: 'Согласование' },
  { key: 'payment', label: 'Оплата' },
  { key: 'postpayment', label: 'Постоплата' },
]

export interface ClientBasicInfo {
  fullName: string
  phone: string
  email: string
  inn: string
}

export interface ClientProjectInfo {
  wishes: string
  houseType: string
  area: number
  estimatedPrice: number
}

export interface ClientDocumentInfo {
  finalPrice: number
  installAddress: string
  projectFile: Attachment
  contractFile: Attachment
}

export interface ClientPaymentInfo {
  received: boolean
}

export interface Client {
  id: string
  stage: ClientStage
  createdAt: string
  basic: ClientBasicInfo
  project: Partial<ClientProjectInfo>
  document: Partial<ClientDocumentInfo>
  payment: Partial<ClientPaymentInfo>
  notes: string
}

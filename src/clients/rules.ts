import { Client, ClientStage, CLIENT_STAGES } from './types'

const STAGE_ORDER = CLIENT_STAGES.map((s) => s.key)

export function stageIndex(stage: ClientStage): number {
  return STAGE_ORDER.indexOf(stage)
}

export function stageLabel(stage: ClientStage): string {
  return CLIENT_STAGES.find((s) => s.key === stage)?.label ?? stage
}

export function nextStageOf(stage: ClientStage): ClientStage | null {
  const index = stageIndex(stage)
  return index < STAGE_ORDER.length - 1 ? STAGE_ORDER[index + 1] : null
}

export type ClientFieldGroup = 'project' | 'document' | 'payment'

const GROUP_APPEARS_AT: Record<ClientFieldGroup, ClientStage> = {
  project: 'discussion',
  document: 'approval',
  payment: 'payment',
}

export function isGroupVisible(client: Client, group: ClientFieldGroup): boolean {
  return stageIndex(client.stage) >= stageIndex(GROUP_APPEARS_AT[group])
}

export function isGroupEditable(client: Client, group: ClientFieldGroup): boolean {
  return client.stage === GROUP_APPEARS_AT[group]
}

export function missingProjectFields(client: Client): string[] {
  const missing: string[] = []
  const p = client.project
  if (!p.wishes) missing.push('пожелания по проекту')
  if (!p.houseType) missing.push('тип дома')
  if (!p.area) missing.push('площадь')
  if (!p.estimatedPrice) missing.push('ориентировочная цена')
  return missing
}

export function missingDocumentFields(client: Client): string[] {
  const missing: string[] = []
  const d = client.document
  if (!d.finalPrice) missing.push('итоговая цена')
  if (!d.installAddress) missing.push('адрес установки')
  if (!d.projectFile) missing.push('файл проекта дома')
  if (!d.contractFile) missing.push('файл договора')
  return missing
}

export function missingPaymentFields(client: Client): string[] {
  return client.payment.received === undefined ? ['статус оплаты'] : []
}

export function blockersForAdvance(client: Client): string[] {
  switch (client.stage) {
    case 'lead':
      return []
    case 'discussion':
      return missingProjectFields(client)
    case 'approval':
      return missingDocumentFields(client)
    case 'payment': {
      const missing = missingPaymentFields(client)
      if (missing.length > 0) return missing
      return client.payment.received ? [] : ['оплата ещё не подтверждена']
    }
    case 'postpayment':
      return ['клиент уже на финальной стадии цикла продаж']
  }
}

export function canAdvance(client: Client): boolean {
  return blockersForAdvance(client).length === 0 && nextStageOf(client.stage) !== null
}

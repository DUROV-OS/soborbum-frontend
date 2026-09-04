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

export type ClientFieldGroup = 'project' | 'documents' | 'payment'

const GROUP_APPEARS_AT: Record<ClientFieldGroup, ClientStage> = {
  project: 'discussion',
  documents: 'approval',
  payment: 'payment',
}

/**
 * Валидность переходов и блокировку полей проверяет бэкенд (см. *_locked_at
 * и текст ошибки на transition). Здесь — только то, что решает, какие
 * панели показывать и когда включать поля ввода, для самого интерфейса.
 */
export function isGroupVisible(client: Client, group: ClientFieldGroup): boolean {
  return stageIndex(client.stage) >= stageIndex(GROUP_APPEARS_AT[group])
}

export function isGroupEditable(client: Client, group: ClientFieldGroup): boolean {
  if (group === 'project') return client.project_locked_at === null
  if (group === 'documents') return client.documents_locked_at === null
  return client.payment_locked_at === null
}

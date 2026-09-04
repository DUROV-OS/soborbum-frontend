import { generateId, nowIso, withLatency } from '@/shared/lib/mockApi'
import { loadState, saveState } from '@/shared/lib/storage'
import { emitClientReachedPostpayment } from '@/shared/lib/cycleEvents'
import { registerSyncResolver, requestSyncTask } from '@/shared/lib/taskSync'
import { SEED_CLIENTS } from './mock'
import { blockersForAdvance, nextStageOf, stageLabel } from './rules'
import {
  Client,
  ClientBasicInfo,
  ClientDocumentInfo,
  ClientPaymentInfo,
  ClientProjectInfo,
} from './types'

const STORAGE_KEY = 'soborbum.clients'

let clients: Client[] = loadState(STORAGE_KEY, SEED_CLIENTS)

function persist() {
  saveState(STORAGE_KEY, clients)
}

function find(id: string): Client {
  const client = clients.find((c) => c.id === id)
  if (!client) throw new Error('Клиент не найден')
  return client
}

function openStageTask(client: Client) {
  requestSyncTask({
    source: 'clients',
    sourceRefId: client.id,
    title: `Клиент «${client.basic.fullName}»: ${stageLabel(client.stage)}`,
    description: 'Довести клиента до следующей стадии цикла продаж.',
    assigneeAccessSection: 'clients',
  })
}

/** GET /api/clients */
export function listClients(): Promise<Client[]> {
  return withLatency([...clients])
}

/** GET /api/clients/:id */
export function getClient(id: string): Promise<Client | undefined> {
  return withLatency(clients.find((c) => c.id === id))
}

/** POST /api/clients */
export function createClient(basic: ClientBasicInfo): Promise<Client> {
  const client: Client = {
    id: generateId('cl'),
    stage: 'lead',
    createdAt: nowIso(),
    basic,
    project: {},
    document: {},
    payment: {},
    notes: '',
  }
  clients = [client, ...clients]
  persist()
  openStageTask(client)
  return withLatency(client)
}

/** PATCH /api/clients/:id/project */
export function updateProjectInfo(id: string, patch: Partial<ClientProjectInfo>): Promise<Client> {
  const client = find(id)
  client.project = { ...client.project, ...patch }
  persist()
  return withLatency(client)
}

/** PATCH /api/clients/:id/document */
export function updateDocumentInfo(id: string, patch: Partial<ClientDocumentInfo>): Promise<Client> {
  const client = find(id)
  client.document = { ...client.document, ...patch }
  persist()
  return withLatency(client)
}

/** PATCH /api/clients/:id/payment */
export function updatePaymentInfo(id: string, patch: Partial<ClientPaymentInfo>): Promise<Client> {
  const client = find(id)
  client.payment = { ...client.payment, ...patch }
  persist()
  return withLatency(client)
}

/** PATCH /api/clients/:id/notes */
export function updateNotes(id: string, notes: string): Promise<Client> {
  const client = find(id)
  client.notes = notes
  persist()
  return withLatency(client)
}

export interface AdvanceResult {
  ok: boolean
  reason?: string
}

/** POST /api/clients/:id/advance-stage */
export function advanceStage(id: string): AdvanceResult {
  const client = find(id)
  const blockers = blockersForAdvance(client)
  if (blockers.length > 0) {
    return { ok: false, reason: `Не заполнено: ${blockers.join(', ')}` }
  }
  const next = nextStageOf(client.stage)
  if (!next) return { ok: false, reason: 'Клиент уже на финальной стадии' }

  client.stage = next
  persist()
  openStageTask(client)
  if (next === 'postpayment') emitClientReachedPostpayment(client.id)
  return { ok: true }
}

registerSyncResolver('clients', (clientId) => {
  try {
    return advanceStage(clientId)
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'Ошибка' }
  }
})

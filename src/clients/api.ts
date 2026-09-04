import { apiRequest } from '@/shared/lib/httpClient'
import { Client, ClientCreateInput, ClientNote } from './types'

const SECTION = 'clients'

/** GET /api/clients/ */
export function listClients(): Promise<Client[]> {
  return apiRequest<Client[]>({ section: SECTION, path: '/' })
}

/** GET /api/clients/:id */
export function getClient(id: number): Promise<Client> {
  return apiRequest<Client>({ section: SECTION, path: `/${id}` })
}

/** POST /api/clients/ */
export function createClient(input: ClientCreateInput): Promise<Client> {
  return apiRequest<Client>({ section: SECTION, path: '/', method: 'POST', body: input })
}

export interface ProjectUpdateInput {
  wishes_description?: string
  estimated_price?: number
  house_area?: number
  layout_notes?: string
}

/** PATCH /api/clients/:id/project */
export function updateProject(id: number, patch: ProjectUpdateInput): Promise<Client> {
  return apiRequest<Client>({ section: SECTION, path: `/${id}/project`, method: 'PATCH', body: patch })
}

export interface DocumentsUpdateInput {
  final_price?: number
  installation_address?: string
}

/** PATCH /api/clients/:id/documents */
export function updateDocuments(id: number, patch: DocumentsUpdateInput): Promise<Client> {
  return apiRequest<Client>({ section: SECTION, path: `/${id}/documents`, method: 'PATCH', body: patch })
}

/** PATCH /api/clients/:id/payment */
export function updatePayment(id: number, is_paid: boolean): Promise<Client> {
  return apiRequest<Client>({ section: SECTION, path: `/${id}/payment`, method: 'PATCH', body: { is_paid } })
}

async function uploadFile(id: number, kind: 'contract-file' | 'house-project-file', file: File): Promise<Client> {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<Client>({ section: SECTION, path: `/${id}/${kind}`, method: 'POST', form })
}

/** POST /api/clients/:id/contract-file */
export function uploadContractFile(id: number, file: File): Promise<Client> {
  return uploadFile(id, 'contract-file', file)
}

/** POST /api/clients/:id/house-project-file */
export function uploadHouseProjectFile(id: number, file: File): Promise<Client> {
  return uploadFile(id, 'house-project-file', file)
}

/** POST /api/clients/:id/notes */
export function addNote(id: number, text: string): Promise<ClientNote> {
  return apiRequest<ClientNote>({ section: SECTION, path: `/${id}/notes`, method: 'POST', body: { text } })
}

/** PATCH /api/clients/:id/notes/:noteId */
export function updateNote(id: number, noteId: number, text: string): Promise<ClientNote> {
  return apiRequest<ClientNote>({
    section: SECTION,
    path: `/${id}/notes/${noteId}`,
    method: 'PATCH',
    body: { text },
  })
}

/** DELETE /api/clients/:id/notes/:noteId */
export function deleteNote(id: number, noteId: number): Promise<void> {
  return apiRequest<void>({ section: SECTION, path: `/${id}/notes/${noteId}`, method: 'DELETE' })
}

/** POST /api/clients/:id/transition */
export function advanceStage(id: number): Promise<Client> {
  return apiRequest<Client>({ section: SECTION, path: `/${id}/transition`, method: 'POST' })
}

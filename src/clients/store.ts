import { create } from 'zustand'
import { ApiError } from '@/shared/lib/httpClient'
import * as clientsApi from './api'
import { Client, ClientCreateInput } from './types'

export interface ActionResult {
  ok: boolean
  reason?: string
}

interface ClientsState {
  clients: Client[]
  loading: boolean
  load: () => Promise<void>
  create: (input: ClientCreateInput) => Promise<Client>
  updateProject: (id: number, patch: clientsApi.ProjectUpdateInput) => Promise<ActionResult>
  updateDocuments: (id: number, patch: clientsApi.DocumentsUpdateInput) => Promise<ActionResult>
  updatePayment: (id: number, isPaid: boolean) => Promise<ActionResult>
  uploadContractFile: (id: number, file: File) => Promise<ActionResult>
  uploadHouseProjectFile: (id: number, file: File) => Promise<ActionResult>
  addNote: (id: number, text: string) => Promise<ActionResult>
  updateNote: (id: number, noteId: number, text: string) => Promise<ActionResult>
  deleteNote: (id: number, noteId: number) => Promise<ActionResult>
  advance: (id: number) => Promise<ActionResult>
}

function reasonOf(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Не удалось выполнить действие'
}

export const useClientsStore = create<ClientsState>((set, get) => {
  function replace(client: Client) {
    set({ clients: get().clients.map((c) => (c.id === client.id ? client : c)) })
  }

  async function applyClientMutation(mutation: () => Promise<Client>): Promise<ActionResult> {
    try {
      replace(await mutation())
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: reasonOf(error) }
    }
  }

  async function applyNoteMutation(id: number, mutation: () => Promise<unknown>): Promise<ActionResult> {
    try {
      await mutation()
      const client = await clientsApi.getClient(id)
      replace(client)
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: reasonOf(error) }
    }
  }

  return {
    clients: [],
    loading: true,

    load: async () => {
      const clients = await clientsApi.listClients()
      set({ clients, loading: false })
    },

    create: async (input) => {
      const client = await clientsApi.createClient(input)
      set({ clients: [client, ...get().clients] })
      return client
    },

    updateProject: (id, patch) => applyClientMutation(() => clientsApi.updateProject(id, patch)),
    updateDocuments: (id, patch) => applyClientMutation(() => clientsApi.updateDocuments(id, patch)),
    updatePayment: (id, isPaid) => applyClientMutation(() => clientsApi.updatePayment(id, isPaid)),
    uploadContractFile: (id, file) => applyClientMutation(() => clientsApi.uploadContractFile(id, file)),
    uploadHouseProjectFile: (id, file) => applyClientMutation(() => clientsApi.uploadHouseProjectFile(id, file)),
    advance: (id) => applyClientMutation(() => clientsApi.advanceStage(id)),

    addNote: (id, text) => applyNoteMutation(id, () => clientsApi.addNote(id, text)),
    updateNote: (id, noteId, text) => applyNoteMutation(id, () => clientsApi.updateNote(id, noteId, text)),
    deleteNote: (id, noteId) => applyNoteMutation(id, () => clientsApi.deleteNote(id, noteId)),
  }
})

import { create } from 'zustand'
import { requestCloseSyncedTask } from '@/shared/lib/taskSync'
import * as clientsApi from './api'
import {
  Client,
  ClientBasicInfo,
  ClientDocumentInfo,
  ClientPaymentInfo,
  ClientProjectInfo,
} from './types'

interface ClientsState {
  clients: Client[]
  loading: boolean
  load: () => Promise<void>
  create: (basic: ClientBasicInfo) => Promise<Client>
  updateProject: (id: string, patch: Partial<ClientProjectInfo>) => Promise<void>
  updateDocument: (id: string, patch: Partial<ClientDocumentInfo>) => Promise<void>
  updatePayment: (id: string, patch: Partial<ClientPaymentInfo>) => Promise<void>
  updateNotes: (id: string, notes: string) => Promise<void>
  advance: (id: string) => Promise<clientsApi.AdvanceResult>
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  loading: true,

  load: async () => {
    const clients = await clientsApi.listClients()
    set({ clients, loading: false })
  },

  create: async (basic) => {
    const client = await clientsApi.createClient(basic)
    set({ clients: [client, ...get().clients] })
    return client
  },

  updateProject: async (id, patch) => {
    const updated = await clientsApi.updateProjectInfo(id, patch)
    set({ clients: get().clients.map((c) => (c.id === id ? updated : c)) })
  },

  updateDocument: async (id, patch) => {
    const updated = await clientsApi.updateDocumentInfo(id, patch)
    set({ clients: get().clients.map((c) => (c.id === id ? updated : c)) })
  },

  updatePayment: async (id, patch) => {
    const updated = await clientsApi.updatePaymentInfo(id, patch)
    set({ clients: get().clients.map((c) => (c.id === id ? updated : c)) })
  },

  updateNotes: async (id, notes) => {
    const updated = await clientsApi.updateNotes(id, notes)
    set({ clients: get().clients.map((c) => (c.id === id ? updated : c)) })
  },

  advance: async (id) => {
    const result = clientsApi.advanceStage(id)
    if (result.ok) {
      requestCloseSyncedTask('clients', id)
      const client = await clientsApi.getClient(id)
      if (client) set({ clients: get().clients.map((c) => (c.id === id ? client : c)) })
    }
    return result
  },
}))

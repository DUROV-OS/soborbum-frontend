import { create } from 'zustand'
import { ApiError } from '@/shared/lib/httpClient'
import * as boardApi from './api'
import { buildIndexes, edgeKeysAlongPath, pathBetween } from './lib/tree'
import { BoardNode, BoardNodeChange, BoardProposal } from './types'

function reasonOf(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Не удалось выполнить действие'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Сколько нода «пульсирует» и держит подсказку с одним предложением от ИИ о том, что в ней меняется. */
const NODE_DISPLAY_MS = 3600
const TRAVEL_MS = 350
const FALLBACK_NOTE = 'Обновлено с учётом изменений по дереву.'

interface BoardState {
  tree: BoardNode | null
  loading: boolean
  error: string | null

  popoverNodeId: number | null
  proposalNodeId: number | null
  proposal: BoardProposal | null
  proposalLoading: boolean
  proposalError: string | null
  /** Заполняется после принятия предложения — таблица изменений в панели показывается, пока не null. */
  appliedChanges: BoardNodeChange[] | null

  animating: boolean
  activeNodeId: number | null
  /** Одно предложение от ИИ о том, что конкретно меняется в текущей активной ноде. */
  activeNote: string | null
  activeEdgeKeys: Set<string>
  actualizing: boolean

  loadTree: () => Promise<void>
  openPopover: (nodeId: number) => void
  closePopover: () => void
  openProposal: (nodeId: number) => void
  closeProposal: () => void
  sendMessage: (message: string) => Promise<void>
  reject: (comment: string) => Promise<void>
  accept: () => Promise<void>
  runActualize: () => Promise<void>
}

export const useBoardStore = create<BoardState>((set, get) => {
  async function playAnimation(changes: BoardNodeChange[]) {
    const tree = get().tree
    if (!tree) return
    const indexes = buildIndexes(tree)
    const queue = changes.filter((c) => c.change_type !== 'deleted' && indexes.byId.has(c.node_id))

    set({ animating: true })
    let previousId: number | null = null
    for (const change of queue) {
      if (previousId !== null) {
        const path = pathBetween(indexes, previousId, change.node_id)
        if (path && path.length > 2) {
          set({ activeEdgeKeys: new Set(edgeKeysAlongPath(path)), activeNodeId: null, activeNote: null })
          await sleep(TRAVEL_MS)
        }
      }
      set({ activeNodeId: change.node_id, activeEdgeKeys: new Set(), activeNote: change.note || FALLBACK_NOTE })
      await sleep(NODE_DISPLAY_MS)
      previousId = change.node_id
    }
    set({ animating: false, activeNodeId: null, activeNote: null, activeEdgeKeys: new Set() })
  }

  return {
    tree: null,
    loading: false,
    error: null,

    popoverNodeId: null,
    proposalNodeId: null,
    proposal: null,
    proposalLoading: false,
    proposalError: null,
    appliedChanges: null,

    animating: false,
    activeNodeId: null,
    activeNote: null,
    activeEdgeKeys: new Set(),
    actualizing: false,

    loadTree: async () => {
      set({ loading: true, error: null })
      try {
        const tree = await boardApi.getTree()
        set({ tree, loading: false })
      } catch (error) {
        set({ loading: false, error: reasonOf(error) })
      }
    },

    openPopover: (nodeId) => set({ popoverNodeId: nodeId }),
    closePopover: () => set({ popoverNodeId: null }),

    openProposal: (nodeId) =>
      set({
        proposalNodeId: nodeId,
        proposal: null,
        proposalError: null,
        appliedChanges: null,
        popoverNodeId: null,
      }),

    closeProposal: () => {
      const proposal = get().proposal
      if (proposal && proposal.status === 'pending') {
        boardApi.cancelProposal(proposal.id).catch(() => {})
      }
      set({
        proposalNodeId: null,
        proposal: null,
        proposalError: null,
        proposalLoading: false,
        appliedChanges: null,
      })
    },

    sendMessage: async (message) => {
      const nodeId = get().proposalNodeId
      if (nodeId === null) return
      set({ proposalLoading: true, proposalError: null })
      try {
        const proposal = await boardApi.proposeChange(nodeId, message)
        set({ proposal, proposalLoading: false })
      } catch (error) {
        set({ proposalLoading: false, proposalError: reasonOf(error) })
      }
    },

    reject: async (comment) => {
      const proposal = get().proposal
      if (!proposal) return
      set({ proposalLoading: true, proposalError: null })
      try {
        const result = await boardApi.respondToProposal(proposal.id, 'reject', comment)
        set({ proposal: result.proposal, proposalLoading: false })
      } catch (error) {
        set({ proposalLoading: false, proposalError: reasonOf(error) })
      }
    },

    accept: async () => {
      const proposal = get().proposal
      if (!proposal) return
      set({ proposalLoading: true, proposalError: null })
      try {
        const result = await boardApi.respondToProposal(proposal.id, 'accept')
        const tree = await boardApi.getTree()
        set({
          tree,
          proposal: result.proposal,
          proposalLoading: false,
          appliedChanges: result.changes,
        })
        await playAnimation(result.changes)
      } catch (error) {
        set({ proposalLoading: false, proposalError: reasonOf(error) })
      }
    },

    runActualize: async () => {
      set({ actualizing: true, error: null })
      try {
        const result = await boardApi.actualize()
        const tree = await boardApi.getTree()
        set({ tree, actualizing: false })
        await playAnimation(result.changes)
      } catch (error) {
        set({ actualizing: false, error: reasonOf(error) })
      }
    },
  }
})

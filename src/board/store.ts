import { create } from 'zustand'
import { ApiError } from '@/shared/lib/httpClient'
import * as boardApi from './api'
import { buildIndexes, buildTourSteps } from './lib/tree'
import { BoardNode, BoardNodeChange, BoardProposal } from './types'

function reasonOf(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Не удалось выполнить действие'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Быстрый структурный «обзорный» проход по дереву — рёбра и ноды просто подсвечиваются по очереди. */
const TOUR_EDGE_MS = 320
const TOUR_NODE_MS = 480
/** Сколько держится всплывающая подсказка с фразой ИИ о конкретной ноде, в конце — уже по существу. */
const NOTE_DISPLAY_MS = 3600
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
  /** Ноды, подсвеченные прямо сейчас — пульсирующей рамкой (может быть несколько сразу). */
  activeNodeIds: Set<number>
  activeEdgeKeys: Set<string>
  /** Нода, под которой сейчас показывается всплывающая подсказка (фаза резюме, после экскурсии). */
  noteNodeId: number | null
  /** Одно предложение от ИИ о том, что конкретно меняется в ноде noteNodeId. */
  activeNote: string | null
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
  /**
   * Экскурсия по дереву от originId (см. buildTourSteps), а затем — вразнобой —
   * всплывающие подсказки с фразой ИИ по каждой реально изменённой ноде.
   */
  async function playAnimation(originId: number, changes: BoardNodeChange[]) {
    const tree = get().tree
    if (!tree) return
    const indexes = buildIndexes(tree)

    set({ animating: true })

    for (const step of buildTourSteps(indexes, originId, tree.id)) {
      if ('edges' in step) {
        set({ activeEdgeKeys: new Set(step.edges), activeNodeIds: new Set() })
        await sleep(TOUR_EDGE_MS)
      } else {
        set({ activeNodeIds: new Set(step.nodes), activeEdgeKeys: new Set() })
        await sleep(TOUR_NODE_MS)
      }
    }
    set({ activeNodeIds: new Set(), activeEdgeKeys: new Set() })

    const notes = shuffled(changes.filter((c) => c.change_type !== 'deleted' && indexes.byId.has(c.node_id)))
    for (const change of notes) {
      set({
        activeNodeIds: new Set([change.node_id]),
        noteNodeId: change.node_id,
        activeNote: change.note || FALLBACK_NOTE,
      })
      await sleep(NOTE_DISPLAY_MS)
    }

    set({ animating: false, activeNodeIds: new Set(), noteNodeId: null, activeNote: null })
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
    activeNodeIds: new Set(),
    activeEdgeKeys: new Set(),
    noteNodeId: null,
    activeNote: null,
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
        await playAnimation(proposal.node_id, result.changes)
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
        await playAnimation(tree.id, result.changes)
      } catch (error) {
        set({ actualizing: false, error: reasonOf(error) })
      }
    },
  }
})

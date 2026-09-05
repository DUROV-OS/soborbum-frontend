import { create } from 'zustand'
import { ApiError } from '@/shared/lib/httpClient'
import * as aiApi from './api'
import { AskResponse, ChatDetailOut, ChatDomain, ChatMode, ChatOut, FileAssetOut, PendingActionOut } from './types'

function reasonOf(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Не удалось выполнить действие'
}

interface AiState {
  chats: ChatOut[]
  chatsLoading: boolean
  activeChat: ChatDetailOut | null
  loadingChat: boolean
  draftDomain: ChatDomain | null
  draftMode: ChatMode
  pendingActions: PendingActionOut[]
  sending: boolean
  /** Только что отправленное сообщение, пока ответ ещё не пришёл — рисуется как временный пузырь. */
  optimisticMessage: string | null
  /** Файлы, уже загруженные на бэкенд (POST /ai/files) и ждущие следующего send(). */
  attachments: FileAssetOut[]
  uploadingAttachment: boolean
  error: string | null

  loadChats: (domain?: ChatDomain) => Promise<void>
  openChat: (id: number) => Promise<void>
  startDraft: (domain: ChatDomain, mode?: ChatMode) => void
  send: (message: string) => Promise<AskResponse | null>
  addAttachment: (file: File) => Promise<void>
  removeAttachment: (id: number) => void
  setMode: (mode: ChatMode) => Promise<void>
  renameChat: (id: number, title: string | null) => Promise<void>
  resolveAction: (id: number, decision: 'approve' | 'reject') => Promise<AskResponse | null>
  removeChat: (id: number) => Promise<void>
}

export const useAiStore = create<AiState>((set, get) => {
  async function refreshChat(chatId: number) {
    const [chat, pendingActions] = await Promise.all([
      aiApi.getChat(chatId),
      aiApi.listPendingActions(chatId),
    ])
    set({ activeChat: chat, pendingActions })
    set((state) => ({
      chats: state.chats.some((c) => c.id === chat.id)
        ? state.chats.map((c) => (c.id === chat.id ? chat : c))
        : [chat, ...state.chats],
    }))
  }

  return {
    chats: [],
    chatsLoading: false,
    activeChat: null,
    loadingChat: false,
    draftDomain: null,
    draftMode: 'require_approval',
    pendingActions: [],
    sending: false,
    optimisticMessage: null,
    attachments: [],
    uploadingAttachment: false,
    error: null,

    loadChats: async (domain) => {
      set({ chatsLoading: true })
      try {
        const chats = await aiApi.listChats(domain)
        set({ chats, chatsLoading: false })
      } catch (error) {
        set({ chatsLoading: false, error: reasonOf(error) })
      }
    },

    openChat: async (id) => {
      set({ loadingChat: true, draftDomain: null, optimisticMessage: null, attachments: [] })
      try {
        await refreshChat(id)
        set({ loadingChat: false })
      } catch (error) {
        set({ loadingChat: false, error: reasonOf(error) })
      }
    },

    startDraft: (domain, mode = 'require_approval') => {
      set({
        activeChat: null,
        pendingActions: [],
        draftDomain: domain,
        draftMode: mode,
        optimisticMessage: null,
        attachments: [],
      })
    },

    send: async (message) => {
      const { activeChat, draftDomain, draftMode, attachments } = get()
      const domain = activeChat?.domain ?? draftDomain
      if (!domain) return null
      const mode = activeChat?.mode ?? draftMode
      const placeholder = message || (attachments.length > 0 ? `📎 ${attachments.length} файл(ов)` : message)
      set({ sending: true, error: null, optimisticMessage: placeholder, attachments: [] })
      try {
        const response = await aiApi.askDomain(domain, {
          chat_id: activeChat?.id ?? null,
          message,
          file_ids: attachments.map((a) => a.id),
          mode,
        })
        await refreshChat(response.chat_id)
        set({ sending: false, draftDomain: null, optimisticMessage: null })
        return response
      } catch (error) {
        // Файлы уже загружены на бэкенд (у них есть id) - возвращаем их в composer, чтобы
        // не заставлять сотрудника выбирать их заново.
        set({ sending: false, error: reasonOf(error), attachments })
        // Сообщение пользователя (и всё, что успело сохраниться на сервере до сбоя) уже
        // могло быть закоммичено бэкендом раньше самого падения — подтягиваем реальное
        // состояние чата вместо того, чтобы оставить на экране только текст ошибки.
        const chatId = get().activeChat?.id
        if (chatId) await refreshChat(chatId).catch(() => {})
        else get().loadChats().catch(() => {})
        set({ optimisticMessage: null })
        return null
      }
    },

    addAttachment: async (file) => {
      set({ uploadingAttachment: true, error: null })
      try {
        const asset = await aiApi.uploadAttachment(file)
        set((state) => ({ attachments: [...state.attachments, asset], uploadingAttachment: false }))
      } catch (error) {
        set({ uploadingAttachment: false, error: reasonOf(error) })
      }
    },

    removeAttachment: (id) => {
      set((state) => ({ attachments: state.attachments.filter((a) => a.id !== id) }))
    },

    setMode: async (mode) => {
      const chat = get().activeChat
      if (!chat) {
        set({ draftMode: mode })
        return
      }
      try {
        const updated = await aiApi.updateChatMode(chat.id, mode)
        set((state) => ({
          activeChat: state.activeChat ? { ...state.activeChat, mode: updated.mode } : state.activeChat,
          chats: state.chats.map((c) => (c.id === updated.id ? { ...c, mode: updated.mode } : c)),
        }))
      } catch (error) {
        set({ error: reasonOf(error) })
      }
    },

    renameChat: async (id, title) => {
      try {
        const updated = await aiApi.updateChatTitle(id, title)
        set((state) => ({
          activeChat: state.activeChat?.id === id ? { ...state.activeChat, title: updated.title } : state.activeChat,
          chats: state.chats.map((c) => (c.id === id ? { ...c, title: updated.title } : c)),
        }))
      } catch (error) {
        set({ error: reasonOf(error) })
      }
    },

    resolveAction: async (id, decision) => {
      try {
        const response = decision === 'approve' ? await aiApi.approvePendingAction(id) : await aiApi.rejectPendingAction(id)
        await refreshChat(response.chat_id)
        return response
      } catch (error) {
        set({ error: reasonOf(error) })
        return null
      }
    },

    removeChat: async (id) => {
      try {
        await aiApi.deleteChat(id)
        set((state) => ({
          chats: state.chats.filter((c) => c.id !== id),
          activeChat: state.activeChat?.id === id ? null : state.activeChat,
          pendingActions: state.activeChat?.id === id ? [] : state.pendingActions,
        }))
      } catch (error) {
        set({ error: reasonOf(error) })
      }
    },
  }
})

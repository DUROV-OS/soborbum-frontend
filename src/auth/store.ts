import { create } from 'zustand'
import { getToken, setToken } from '@/shared/lib/httpClient'
import { SectionId } from '@/shared/sections'
import * as authApi from './api'
import { Account } from './types'

interface AuthState {
  current: Account | null
  accounts: Account[]
  booting: boolean
  error: string | null
  bootstrap: () => Promise<void>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loadAccounts: () => Promise<void>
  hasAccess: (section: SectionId) => boolean
  updateAccess: (id: number, moduleAccess: SectionId[]) => Promise<void>
  addAccount: (input: Omit<authApi.CreateAccountInput, 'email'> & { email: string }) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  current: null,
  accounts: [],
  booting: true,
  error: null,

  bootstrap: async () => {
    if (!getToken()) {
      set({ booting: false })
      return
    }
    try {
      const current = await authApi.me()
      set({ current, booting: false })
      get().loadAccounts().catch(() => {})
    } catch {
      setToken(null)
      set({ current: null, booting: false })
    }
  },

  login: async (email, password) => {
    set({ error: null })
    try {
      const current = await authApi.login(email, password)
      set({ current })
      get().loadAccounts().catch(() => {})
      return true
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Не удалось войти' })
      return false
    }
  },

  logout: () => {
    setToken(null)
    set({ current: null, accounts: [] })
  },

  /** GET /auth/users требует роль admin — для рабочих аккаунтов тихо остаётся пустым (см. вызовы в bootstrap/login). */
  loadAccounts: async () => {
    const accounts = await authApi.listAccounts()
    set({ accounts })
  },

  hasAccess: (section) => {
    const account = get().current
    if (!account) return false
    if (account.role === 'admin') return true
    // GET /api/dashboard/today гейтится на бэкенде модулем AI — см. shared/sections.ts
    if (section === 'today') return account.module_access.includes('ai')
    return account.module_access.includes(section)
  },

  updateAccess: async (id, moduleAccess) => {
    const updated = await authApi.updateAccountAccess(id, moduleAccess)
    set((state) => ({ accounts: state.accounts.map((a) => (a.id === id ? updated : a)) }))
  },

  addAccount: async (input) => {
    const created = await authApi.createAccount(input)
    set((state) => ({ accounts: [...state.accounts, created] }))
  },
}))

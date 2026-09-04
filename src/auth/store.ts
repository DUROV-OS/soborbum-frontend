import { create } from 'zustand'
import { loadState, saveState } from '@/shared/lib/storage'
import { SectionId } from '@/shared/sections'
import * as authApi from './api'
import { Account } from './types'

const SESSION_KEY = 'soborbum.auth.session'

interface AuthState {
  accounts: Account[]
  currentAccountId: string | null
  loading: boolean
  loadAccounts: () => Promise<void>
  login: (accountId: string) => void
  logout: () => void
  hasAccess: (section: SectionId) => boolean
  updateAccess: (accountId: string, sectionAccess: SectionId[]) => Promise<void>
  addAccount: (input: { name: string; title: string; sectionAccess: SectionId[] }) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accounts: [],
  currentAccountId: loadState<string | null>(SESSION_KEY, null),
  loading: true,

  loadAccounts: async () => {
    const accounts = await authApi.listAccounts()
    set({ accounts, loading: false })
  },

  login: (accountId) => {
    saveState(SESSION_KEY, accountId)
    set({ currentAccountId: accountId })
  },

  logout: () => {
    saveState(SESSION_KEY, null)
    set({ currentAccountId: null })
  },

  hasAccess: (section) => {
    const account = get().accounts.find((a) => a.id === get().currentAccountId)
    if (!account) return false
    if (account.role === 'admin') return true
    return account.sectionAccess.includes(section)
  },

  updateAccess: async (accountId, sectionAccess) => {
    const updated = await authApi.updateAccountAccess(accountId, sectionAccess)
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === accountId ? updated : a)),
    }))
  },

  addAccount: async (input) => {
    const created = await authApi.createAccount(input)
    set((state) => ({ accounts: [...state.accounts, created] }))
  },
}))

export function useCurrentAccount(): Account | null {
  const accounts = useAuthStore((s) => s.accounts)
  const currentAccountId = useAuthStore((s) => s.currentAccountId)
  return accounts.find((a) => a.id === currentAccountId) ?? null
}

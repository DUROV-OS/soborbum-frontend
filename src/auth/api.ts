import { generateId, withLatency } from '@/shared/lib/mockApi'
import { loadState, saveState } from '@/shared/lib/storage'
import { SectionId } from '@/shared/sections'
import { SEED_ACCOUNTS } from './mock'
import { Account } from './types'

const STORAGE_KEY = 'soborbum.auth.accounts'

let accounts: Account[] = loadState(STORAGE_KEY, SEED_ACCOUNTS)

function persist() {
  saveState(STORAGE_KEY, accounts)
}

/** GET /api/accounts */
export function listAccounts(): Promise<Account[]> {
  return withLatency([...accounts])
}

/** GET /api/accounts/:id */
export function getAccount(id: string): Promise<Account | undefined> {
  return withLatency(accounts.find((a) => a.id === id))
}

/** POST /api/accounts */
export function createAccount(input: { name: string; title: string; sectionAccess: SectionId[] }): Promise<Account> {
  const account: Account = {
    id: generateId('acc'),
    name: input.name,
    title: input.title,
    role: 'worker',
    sectionAccess: input.sectionAccess,
  }
  accounts = [...accounts, account]
  persist()
  return withLatency(account)
}

/** PATCH /api/accounts/:id/access */
export function updateAccountAccess(id: string, sectionAccess: SectionId[]): Promise<Account> {
  accounts = accounts.map((a) => (a.id === id ? { ...a, sectionAccess } : a))
  persist()
  const updated = accounts.find((a) => a.id === id)
  if (!updated) throw new Error('Account not found')
  return withLatency(updated)
}

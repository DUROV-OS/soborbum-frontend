import { useState } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useCurrentAccount } from '../store'

export function RoleSwitcher() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const accounts = useAuthStore((s) => s.accounts)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const current = useCurrentAccount()

  if (!current) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-pill border border-border px-3 py-1.5 text-left hover:bg-surface-muted"
      >
        <span>
          <span className="block text-[13px] font-medium leading-tight text-ink">
            {current.name}
          </span>
          <span className="block text-[11px] leading-tight text-muted">{current.title}</span>
        </span>
        <ChevronDown size={14} className="text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-border bg-surface p-1.5 shadow-xl">
            <div className="px-2.5 py-1.5 text-[11px] text-muted">
              Переключить аккаунт (демо)
            </div>
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => {
                  login(account.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-sm px-2.5 py-2 text-left text-[13px] hover:bg-surface-muted ${
                  account.id === current.id ? 'text-brand-dark' : 'text-ink'
                }`}
              >
                {account.name}
                <span className="text-[11px] text-muted">{account.title}</span>
              </button>
            ))}
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => {
                logout()
                setOpen(false)
                navigate('/login', { replace: true })
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-[13px] text-danger hover:bg-danger-bg"
            >
              <LogOut size={14} />
              Выйти
            </button>
          </div>
        </>
      )}
    </div>
  )
}

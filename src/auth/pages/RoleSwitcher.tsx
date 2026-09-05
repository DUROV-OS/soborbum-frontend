import { useState } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { QUICK_LOGIN } from '../demoAccounts'
import { useAuthStore } from '../store'

export function RoleSwitcher() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const current = useAuthStore((s) => s.current)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)

  if (!current) return null

  async function switchTo(email: string, password: string) {
    setOpen(false)
    await login(email, password)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-pill border border-border px-3 py-1.5 text-left hover:bg-surface-muted"
      >
        <span>
          <span className="block text-[13px] font-medium leading-tight text-ink">
            {current.full_name}
          </span>
          <span className="block text-[11px] leading-tight text-muted">
            {current.role === 'admin' ? 'Администратор' : 'Сотрудник'}
          </span>
        </span>
        <ChevronDown size={14} className="text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-border bg-surface p-1.5 shadow-xl">
            <div className="px-2.5 py-1.5 text-[11px] text-muted">Переключить аккаунт (демо)</div>
            {QUICK_LOGIN.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => switchTo(account.email, account.password)}
                className={`flex w-full items-center justify-between rounded-sm px-2.5 py-2 text-left text-[13px] hover:bg-surface-muted ${
                  account.email === current.email ? 'text-brand-dark' : 'text-ink'
                }`}
              >
                {account.label}
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

import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'

export function LoginPage() {
  const navigate = useNavigate()
  const accounts = useAuthStore((s) => s.accounts)
  const login = useAuthStore((s) => s.login)

  function handleLogin(accountId: string) {
    login(accountId)
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-[22px] font-medium text-brand-dark">Soborbum</div>
          <p className="mt-1 text-[13px] text-muted">
            Система управления производством модульных домов
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-2">
          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => handleLogin(account.id)}
              className="flex w-full items-center justify-between rounded-sm px-3 py-3 text-left transition-colors hover:bg-surface-muted"
            >
              <span>
                <span className="block text-[13px] font-medium text-ink">{account.name}</span>
                <span className="block text-[12px] text-muted">{account.title}</span>
              </span>
              <span className="text-[12px] text-brand-dark">Войти</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-[12px] text-muted">
          Backend в разработке — вход по выбору учётной записи для демонстрации
        </p>
      </div>
    </div>
  )
}

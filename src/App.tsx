import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useAuthStore } from '@/auth/store'
import { AppRouter } from '@/app/router'

export function App() {
  const loadAccounts = useAuthStore((s) => s.loadAccounts)
  const accountsLoaded = useAuthStore((s) => s.accounts.length > 0)

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  if (!accountsLoaded) {
    return <div className="flex h-screen items-center justify-center text-[13px] text-muted">Загрузка…</div>
  }

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}

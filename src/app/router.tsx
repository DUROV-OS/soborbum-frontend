import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/auth/pages/LoginPage'
import { AccessMatrixPage } from '@/auth/pages/AccessMatrixPage'
import { useAuthStore } from '@/auth/store'
import { SECTIONS } from '@/shared/sections'
import { AccessGate } from './AccessGate'
import { AppShell } from './AppShell'
import { Placeholder } from './Placeholder'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const currentAccountId = useAuthStore((s) => s.currentAccountId)
  if (!currentAccountId) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RootRedirect() {
  const hasAccess = useAuthStore((s) => s.hasAccess)
  const first = SECTIONS.find((s) => !s.adminOnly && hasAccess(s.id))
  return <Navigate to={first?.path ?? '/admin'} replace />
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<RootRedirect />} />
        <Route
          path="/clients/*"
          element={
            <AccessGate section="clients">
              <Placeholder title="Клиенты" />
            </AccessGate>
          }
        />
        <Route
          path="/production/*"
          element={
            <AccessGate section="production">
              <Placeholder title="Производство" />
            </AccessGate>
          }
        />
        <Route
          path="/montage/*"
          element={
            <AccessGate section="montage">
              <Placeholder title="Монтаж" />
            </AccessGate>
          }
        />
        <Route
          path="/cycles/*"
          element={
            <AccessGate section="cycles">
              <Placeholder title="Цикл клиента" />
            </AccessGate>
          }
        />
        <Route
          path="/warehouse/*"
          element={
            <AccessGate section="warehouse">
              <Placeholder title="Склад" />
            </AccessGate>
          }
        />
        <Route
          path="/marketing/*"
          element={
            <AccessGate section="marketing">
              <Placeholder title="Маркетинг" />
            </AccessGate>
          }
        />
        <Route
          path="/tasks/*"
          element={
            <AccessGate section="tasks">
              <Placeholder title="Задачи" />
            </AccessGate>
          }
        />
        <Route path="/admin" element={<AccessMatrixPage />} />
        <Route path="*" element={<RootRedirect />} />
      </Route>
    </Routes>
  )
}

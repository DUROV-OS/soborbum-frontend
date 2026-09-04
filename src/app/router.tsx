import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/auth/pages/LoginPage'
import { AccessMatrixPage } from '@/auth/pages/AccessMatrixPage'
import { useAuthStore } from '@/auth/store'
import { ClientDetailPage } from '@/clients/pages/ClientDetailPage'
import { ClientsBoardPage } from '@/clients/pages/ClientsBoardPage'
import { TasksPage } from '@/tasks/pages/TasksPage'
import { ModuleDetailPage } from '@/production/pages/ModuleDetailPage'
import { ProductionDetailPage } from '@/production/pages/ProductionDetailPage'
import { ProductionOverviewPage } from '@/production/pages/ProductionOverviewPage'
import { MontageDetailPage } from '@/montage/pages/MontageDetailPage'
import { MontageOverviewPage } from '@/montage/pages/MontageOverviewPage'
import { MarketingPage } from '@/marketing/pages/MarketingPage'
import { WarehousePage } from '@/warehouse/pages/WarehousePage'
import { SECTIONS } from '@/shared/sections'
import { AccessGate } from './AccessGate'
import { AppShell } from './AppShell'
import { Placeholder } from './Placeholder'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const current = useAuthStore((s) => s.current)
  if (!current) return <Navigate to="/login" replace />
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
          path="/clients"
          element={
            <AccessGate section="clients">
              <ClientsBoardPage />
            </AccessGate>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <AccessGate section="clients">
              <ClientDetailPage />
            </AccessGate>
          }
        />
        <Route
          path="/production"
          element={
            <AccessGate section="production">
              <ProductionOverviewPage />
            </AccessGate>
          }
        />
        <Route
          path="/production/modules/:id"
          element={
            <AccessGate section="production">
              <ModuleDetailPage />
            </AccessGate>
          }
        />
        <Route
          path="/production/:id"
          element={
            <AccessGate section="production">
              <ProductionDetailPage />
            </AccessGate>
          }
        />
        <Route
          path="/montage"
          element={
            <AccessGate section="installation">
              <MontageOverviewPage />
            </AccessGate>
          }
        />
        <Route
          path="/montage/:id"
          element={
            <AccessGate section="installation">
              <MontageDetailPage />
            </AccessGate>
          }
        />
        <Route
          path="/cycles/*"
          element={
            <AccessGate section="cycle">
              <Placeholder title="Цикл клиента" />
            </AccessGate>
          }
        />
        <Route
          path="/warehouse"
          element={
            <AccessGate section="warehouse">
              <WarehousePage />
            </AccessGate>
          }
        />
        <Route
          path="/marketing"
          element={
            <AccessGate section="marketing">
              <MarketingPage />
            </AccessGate>
          }
        />
        <Route
          path="/tasks"
          element={
            <AccessGate section="tasks">
              <TasksPage />
            </AccessGate>
          }
        />
        <Route path="/admin" element={<AccessMatrixPage />} />
        <Route path="*" element={<RootRedirect />} />
      </Route>
    </Routes>
  )
}

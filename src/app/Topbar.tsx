import { useLocation } from 'react-router-dom'
import { RoleSwitcher } from '@/auth/pages/RoleSwitcher'
import { SECTIONS } from '@/shared/sections'

export function Topbar() {
  const location = useLocation()
  const section = SECTIONS.find((s) => location.pathname.startsWith(s.path))

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-[15px] font-medium text-ink">{section?.label ?? 'Soborbum'}</h1>
      <RoleSwitcher />
    </header>
  )
}

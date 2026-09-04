import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { RoleSwitcher } from '@/auth/pages/RoleSwitcher'
import { SECTIONS } from '@/shared/sections'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation()
  const section = SECTIONS.find((s) => location.pathname.startsWith(s.path))

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Открыть меню"
          className="-ml-1 rounded-sm p-1.5 text-ink hover:bg-surface-muted lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="truncate text-[15px] font-medium text-ink">{section?.label ?? 'Soborbum'}</h1>
      </div>
      <RoleSwitcher />
    </header>
  )
}

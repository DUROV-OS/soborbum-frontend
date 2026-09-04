import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/auth/store'
import { SECTIONS } from '@/shared/sections'

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const hasAccess = useAuthStore((s) => s.hasAccess)
  const current = useAuthStore((s) => s.current)
  const visibleSections = SECTIONS.filter((section) => {
    if (section.alwaysVisible) return true
    if (section.adminOnly) return current?.role === 'admin'
    return hasAccess(section.id)
  })

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 items-center border-b border-border px-5">
        <span className="text-[15px] font-medium tracking-tight text-brand-dark">Soborbum</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {visibleSections.map((section) => {
            const Icon = section.icon
            return (
              <li key={section.id}>
                <NavLink
                  to={section.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'bg-brand/10 text-brand-dark'
                        : 'text-ink/70 hover:bg-surface-muted hover:text-ink'
                    }`
                  }
                >
                  <Icon size={17} strokeWidth={1.75} />
                  {section.label}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="blueprint-grid h-16 border-t border-border" />
    </aside>
  )
}

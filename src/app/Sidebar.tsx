import { NavLink } from 'react-router-dom'
import { useAuthStore, useCurrentAccount } from '@/auth/store'
import { SECTIONS } from '@/shared/sections'

export function Sidebar() {
  const hasAccess = useAuthStore((s) => s.hasAccess)
  const account = useCurrentAccount()
  const visibleSections = SECTIONS.filter((section) => {
    if (section.adminOnly) return account?.role === 'admin'
    return hasAccess(section.id)
  })

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
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

import { NavLink, useLocation } from 'react-router-dom'
import { ArrowUpRight, X } from 'lucide-react'
import { useAuthStore } from '@/auth/store'
import { SECTIONS, SectionId, WORK_SECTION_IDS } from '@/shared/sections'

/** Верхнеуровневое меню — ровно семь пунктов, единым списком, без подгрупп. */
const MENU: SectionId[] = ['today', 'tasks', 'work', 'ai', 'chats', 'board', 'admin']

/** Пути операционных разделов — по ним «Работа» тоже считается активной. */
const WORK_PATHS = ['/work', ...WORK_SECTION_IDS.map((id) => SECTIONS.find((s) => s.id === id)!.path)]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const hasAccess = useAuthStore((s) => s.hasAccess)
  const { pathname } = useLocation()

  // «Работа» видна, если доступен хотя бы один операционный раздел.
  const showWork = WORK_SECTION_IDS.some((id) => hasAccess(id))
  const canSee = (id: SectionId) => (id === 'work' ? showWork : hasAccess(id))
  const items = MENU.flatMap((id) => {
    const section = SECTIONS.find((s) => s.id === id)
    return section && canSee(id) ? [section] : []
  })
  const workActive = WORK_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  return (
    <aside
      aria-label="Главное меню"
      className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-60 shrink-0 flex-col bg-sidebar text-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex h-20 shrink-0 items-center justify-between px-6">
        <NavLink to="/today" onClick={onClose} className="text-[22px] font-semibold tracking-tight">
          Durov OS<span className="text-white/55">.</span>
        </NavLink>
        <button type="button" onClick={onClose} aria-label="Закрыть меню" className="rounded-lg p-2 text-white/60 lg:hidden">
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
        <ul className="space-y-1">
          {items.map((section) => {
            const Icon = section.icon
            return (
              <li key={section.id} className={section.id === 'admin' ? 'mt-2 border-t border-white/10 pt-2' : undefined}>
                <NavLink
                  to={section.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                      (section.id === 'work' ? workActive : isActive)
                        ? 'bg-white font-medium text-sidebar'
                        : 'text-white/75 hover:bg-sidebar-accent hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={1.6} />
                  <span className="flex-1">{section.label}</span>
                  {section.id === 'ai' && <ArrowUpRight size={14} className="opacity-50" />}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="m-4 rounded-xl border border-white/15 p-4">
        <p className="text-[12px] font-medium text-white/85">Больше времени на главное</p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/50">Люди, процессы и решения — в одном рабочем пространстве.</p>
      </div>
    </aside>
  )
}

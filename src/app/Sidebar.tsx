import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAuthStore } from '@/auth/store'
import { SECTIONS, SectionId } from '@/shared/sections'

const GROUPS: { title: string; ids: SectionId[] }[] = [
  { title: 'Рабочее пространство', ids: ['today', 'tasks', 'board', 'agents'] },
  { title: 'Операции', ids: ['cycle', 'clients', 'production', 'warehouse', 'installation', 'marketing'] },
  { title: 'Команда', ids: ['admin'] },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const hasAccess = useAuthStore((s) => s.hasAccess)
  return (
    <aside aria-label="Главное меню" className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-60 shrink-0 flex-col bg-[#172525] text-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-20 shrink-0 items-center justify-between px-6">
        <NavLink to="/today" onClick={onClose} className="text-[22px] font-semibold tracking-tight">Durov OS<span className="text-[#bce4ce]">.</span></NavLink>
        <button type="button" onClick={onClose} aria-label="Закрыть меню" className="rounded-lg p-2 text-white/60 lg:hidden"><X size={18} /></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {GROUPS.map((group) => {
          const sections = group.ids.flatMap((id) => { const section = SECTIONS.find((s) => s.id === id); return section && hasAccess(id) ? [section] : [] })
          if (!sections.length) return null
          return <div key={group.title} className="mt-5"><p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.13em] text-white/45">{group.title}</p>
            <ul className="space-y-1">{sections.map((section) => { const Icon = section.icon; return <li key={section.id}>
              <NavLink to={section.path} onClick={onClose} className={({ isActive }) => `group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${isActive ? 'bg-[#c9ead8] font-medium text-[#172e25]' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}>
                <Icon size={18} strokeWidth={1.6} /><span className="flex-1">{section.label}</span>
              </NavLink>
            </li> })}</ul></div>
        })}
      </nav>
      <div className="m-4 rounded-xl border border-white/10 p-4"><p className="text-[12px] font-medium text-white/85">Больше времени на главное</p><p className="mt-1 text-[11px] leading-relaxed text-white/45">Люди, процессы и решения — в одном рабочем пространстве.</p></div>
    </aside>
  )
}

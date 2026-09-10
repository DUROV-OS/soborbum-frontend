import { NavLink } from 'react-router-dom'
import { ArrowUpRight, Briefcase } from 'lucide-react'
import { useAuthStore } from '@/auth/store'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SECTIONS, SectionId } from '@/shared/sections'

/**
 * Раздел «Работа» — хаб операционных разделов. Плоская сетка виджетов,
 * без деления на подгруппы (в отличие от вкладки «Работа» в прототипе
 * company-control). Каждый виджет ведёт в свой раздел; показывается только
 * при доступе к нему. Сам маршрут не гейтится — при отсутствии доступа
 * показывается пустое состояние, а пункт меню скрывается в Sidebar.
 */
const WORK_TILES: { id: SectionId; note: string }[] = [
  { id: 'cycle', note: 'Все клиенты по этапам сделки' },
  { id: 'clients', note: 'Карточки клиентов, оплаты и документы' },
  { id: 'production', note: 'Заказы в цехе и потребность в материалах' },
  { id: 'warehouse', note: 'Остатки, приход и именованный резерв' },
  { id: 'installation', note: 'Доставка и монтаж на объектах клиентов' },
  { id: 'marketing', note: 'Заявки, каналы и рекламные кампании' },
]

export function WorkPage() {
  const hasAccess = useAuthStore((s) => s.hasAccess)
  const tiles = WORK_TILES.flatMap((tile) => {
    const section = SECTIONS.find((s) => s.id === tile.id)
    return section && hasAccess(tile.id) ? [{ ...tile, section }] : []
  })

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[20px] font-medium text-ink">Работа</h1>
        <p className="mt-1 text-[13px] text-muted">Операционные разделы компании — процессы, исполнение и контроль.</p>
      </div>

      {tiles.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={22} />}
          title="Нет доступных разделов"
          description="Операционные разделы появятся здесь, когда вам выдадут к ним доступ."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map(({ section, note }) => {
            const Icon = section.icon
            return (
              <NavLink
                key={section.id}
                to={section.path}
                className="group flex items-start gap-3 rounded-md border border-border bg-surface p-4 transition-colors hover:border-brand/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted text-brand-dark">
                  <Icon size={20} strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-[14px] font-medium text-ink">
                    {section.label}
                    <ArrowUpRight size={14} className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
                  </span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-muted">{note}</span>
                </span>
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { NavLink } from 'react-router-dom'
import { ArrowUpRight, Briefcase, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/auth/store'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SECTIONS, SectionId } from '@/shared/sections'

type Heat = 'red' | 'amber' | 'green'

/**
 * Раздел «Работа» — хаб. Плоская сетка крупных виджетов, каждый ведёт в свой
 * раздел. Внутри виджета — блок с ответом Марины «стоит заняться: …» и
 * подсветкой по тому, насколько «горит» раздел (красный / жёлтый / зелёный).
 *
 * heat/advice сейчас замоканы. Раздел «Поставщики» — тоже мок (страница-
 * заглушка), показывается всем. «Бухгалтерия» — уже рабочий раздел, гейтится
 * доступом как остальные.
 */
const TILES: { id: SectionId; note: string; heat: Heat; advice: string; mock?: boolean }[] = [
  { id: 'cycle', note: 'Все клиенты по этапам сделки', heat: 'green', advice: 'всё движется по плану, ручного вмешательства не требуется' },
  { id: 'clients', note: 'Карточки клиентов, оплаты и документы', heat: 'amber', advice: '2 клиента на этапе оплаты без подтверждённого поступления' },
  { id: 'production', note: 'Заказы в цехе и потребность в материалах', heat: 'red', advice: 'модули DH-83 ждут материалы — линия простаивает второй день' },
  { id: 'warehouse', note: 'Остатки, приход и именованный резерв', heat: 'red', advice: 'по 3 позициям свободный остаток 0 при открытой потребности' },
  { id: 'installation', note: 'Доставка и монтаж на объектах клиентов', heat: 'amber', advice: 'бригада освободится завтра — подтвердите дату выезда к Самофалову' },
  { id: 'marketing', note: 'Заявки, каналы и рекламные кампании', heat: 'green', advice: 'план публикаций на неделю согласован, лиды в норме' },
  { id: 'meetings', note: 'Прошедшие совещания, заметки и решения', heat: 'amber', advice: 'по совещанию от 9 сентября 4 задачи без исполнителя' },
  { id: 'chats', note: 'Все переписки с клиентами и командой в MAX', heat: 'amber', advice: '5 диалогов с клиентами без ответа более суток' },
  { id: 'accounting', note: 'Реестр движения денег: приход, расход, статьи и статусы', heat: 'amber', advice: 'проверьте черновики проводок, ожидающие согласования' },
  { id: 'suppliers', note: 'Контакты, прайс-листы и оплаты поставщикам', heat: 'green', advice: 'прайсы актуальны, просроченных оплат нет', mock: true },
]

const HEAT_BLOCK: Record<Heat, string> = {
  red: 'border-danger/70 bg-danger-bg/60',
  amber: 'border-warning/70 bg-warning-bg/60',
  green: 'border-success/70 bg-success-bg/60',
}
const HEAT_TEXT: Record<Heat, string> = {
  red: 'text-danger',
  amber: 'text-warning',
  green: 'text-success',
}

export function WorkPage() {
  const hasAccess = useAuthStore((s) => s.hasAccess)
  const tiles = TILES.flatMap((tile) => {
    const section = SECTIONS.find((s) => s.id === tile.id)
    if (!section) return []
    // мок-разделы видят все; остальные — по доступу
    return tile.mock || hasAccess(tile.id) ? [{ ...tile, section }] : []
  })

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-ink">Работа</h1>
        <p className="mt-1 text-[13px] text-muted">Разделы компании — процессы, исполнение и контроль. У каждого — короткая сводка от Марины.</p>
      </div>

      {tiles.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={22} />}
          title="Нет доступных разделов"
          description="Разделы появятся здесь, когда вам выдадут к ним доступ."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tiles.map(({ section, note, heat, advice, mock }) => {
            const Icon = section.icon
            return (
              <NavLink
                key={section.id}
                to={section.path}
                className="group flex min-h-[240px] flex-col rounded-xl border border-border bg-surface p-5 shadow-card transition-colors hover:border-brand/40 hover:shadow-panel"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-brand-dark">
                    <Icon size={22} strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[15px] font-medium text-ink">
                      {section.label}
                      {mock && <span className="rounded-pill bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">мок</span>}
                      <ArrowUpRight size={15} className="ml-auto text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">{note}</p>
                  </div>
                </div>

                <div className={`mt-4 flex-1 rounded-lg border-l-[3px] p-3.5 ${HEAT_BLOCK[heat]}`}>
                  <div className={`mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold ${HEAT_TEXT[heat]}`}>
                    <Sparkles size={14} className="text-ai-accent" />
                    стоит заняться:
                  </div>
                  <p className="text-[15px] leading-relaxed text-ink">{advice}</p>
                </div>
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

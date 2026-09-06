import { useEffect } from 'react'
import { StatWidget } from '@/shared/ui/StatWidget'
import { Chip } from '@/shared/ui/Chip'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { GOLD, LEGAL_GOLD } from '../data'
import { useAgentsStore } from '../store'
import { DayPoint, LegalMix, LegalVerdict, TraceRow } from '../types'

const GOLD_HAVE = GOLD.reduce((sum, row) => sum + row.gold, 0)
const GOLD_NEED = GOLD.length * 50

export function AdminAgentsPanel() {
  const stats = useAgentsStore((s) => s.stats)
  const statsLoading = useAgentsStore((s) => s.statsLoading)
  const statsError = useAgentsStore((s) => s.statsError)
  const loadStats = useAgentsStore((s) => s.loadStats)

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  if (statsLoading && !stats) {
    return <LoadingState label="Загрузка живых следов…" />
  }

  if (statsError && !stats) {
    return (
      <EmptyState
        title="Панель не открылась"
        description={statsError}
        action={
          <button type="button" onClick={() => void loadStats()} className="text-[13px] text-brand">
            Повторить
          </button>
        }
      />
    )
  }

  const totals = stats?.totals ?? { runs: 0, blocked: 0, escalated: 0, released: 0 }
  const week = stats?.week ?? []
  const legal = stats?.legal ?? { allow: 0, allow_with_conditions: 0, escalate_human: 0, block: 0 }
  const traces = stats?.traces ?? []
  const routingHint = stats?.routing[0] ? `${stats.routing[0].title} чаще всех` : 'пока без маршрутов'

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatWidget label="Gold-примеров" value={GOLD_HAVE} hint={`из ${GOLD_NEED} до приёмки обучения`} tone="brand" />
        <StatWidget
          label="Legal gold"
          value={`${LEGAL_GOLD.have}/${LEGAL_GOLD.target}`}
          hint="Только юрист или владелец. Это разметка, не следы API"
          tone="warning"
        />
        <StatWidget label="Блоков" value={totals.blocked} hint="Живые вердикты legal gate" tone="danger" />
        <StatWidget label="Выпусков без риска" value={totals.released} hint={`из ${totals.runs} живых прогонов`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <WeekChart week={week} />
        <LegalMixCard mix={legal} total={totals.runs} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <GoldBars />
        <TraceList traces={traces} routingHint={routingHint} />
      </div>

      <p className="text-[12px] text-muted">
        Следы и вердикты — с /api/agents/runs. Gold остаётся контрактом разметки: 50 на роль и 30 legal gold, иначе
        не говорим «обучен».
      </p>
    </div>
  )
}

function WeekChart({ week }: { week: DayPoint[] }) {
  const max = Math.max(...week.map((d) => d.runs), 1)
  const height = 168
  const gap = 16
  const bar = 28
  const width = Math.max(week.length, 1) * (bar + gap)
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-[18px] font-semibold tracking-tight text-ink">Следы по дням</h2>
        <p className="mt-1 text-[12px] text-muted">Последние семь дней. Пустой столбец — в этот день прогонов не было.</p>
      </div>
      <div className="px-5 py-5 sm:px-6">
        {week.length === 0 ? (
          <EmptyState title="Неделя ещё не собрана" description="Появится после первого ответа API." />
        ) : (
          <>
            <svg viewBox={`0 0 ${width} ${height + 28}`} className="h-52 w-full" role="img" aria-label="Столбцы прогонов по дням">
              {week.map((day, index) => {
                const x = index * (bar + gap)
                const h = (day.runs / max) * height
                const blocked = day.runs ? (day.blocked / day.runs) * h : 0
                const escalated = day.runs ? (day.escalated / day.runs) * h : 0
                const released = day.runs ? (day.released / day.runs) * h : 0
                let y = height - h
                return (
                  <g key={day.date}>
                    <rect x={x} y={y} width={bar} height={released} fill="rgb(31 143 92)" />
                    <rect x={x} y={(y += released)} width={bar} height={escalated} fill="rgb(144 94 22)" />
                    <rect x={x} y={(y += escalated)} width={bar} height={blocked} fill="rgb(181 72 63)" />
                    <text x={x + bar / 2} y={height + 20} textAnchor="middle" fill="rgb(100 115 117)" fontSize="11">
                      {day.date}
                    </text>
                  </g>
                )
              })}
            </svg>
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
              <Legend swatch="rgb(31 143 92)" label="выпущен" />
              <Legend swatch="rgb(144 94 22)" label="к человеку" />
              <Legend swatch="rgb(181 72 63)" label="блок" />
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function LegalMixCard({ mix, total }: { mix: LegalMix; total: number }) {
  const slices = [
    { label: 'allow', value: mix.allow, color: 'rgb(31 143 92)' },
    { label: 'с оговорками', value: mix.allow_with_conditions, color: 'rgb(90 130 150)' },
    { label: 'escalate', value: mix.escalate_human, color: 'rgb(144 94 22)' },
    { label: 'block', value: mix.block, color: 'rgb(181 72 63)' },
  ]
  const visible =
    total === 0
      ? slices.filter((slice) => slice.label !== 'с оговорками')
      : slices.filter((slice) => slice.value > 0)
  const ringTotal = total || 1
  let acc = 0
  const r = 54
  const c = 2 * Math.PI * r
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-[18px] font-semibold tracking-tight text-ink">Legal gate</h2>
        <p className="mt-1 text-[12px] text-muted">Живые вердикты. Block нельзя ослабить моделью.</p>
      </div>
      <div className="flex items-center gap-6 px-5 py-5 sm:px-6">
        <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label="Доли вердиктов юриста">
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgb(225 232 232)" strokeWidth="16" />
          {total > 0 &&
            slices
              .filter((slice) => slice.value > 0)
              .map((slice) => {
                const dash = (slice.value / ringTotal) * c
                const offset = acc
                acc += dash
                return (
                  <circle
                    key={slice.label}
                    cx="70"
                    cy="70"
                    r={r}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="16"
                    strokeDasharray={`${dash} ${c - dash}`}
                    strokeDashoffset={-offset + c / 4}
                    transform="rotate(-90 70 70)"
                  />
                )
              })}
          <text x="70" y="66" textAnchor="middle" fill="rgb(28 43 43)" fontSize="22" fontWeight="600">
            {total}
          </text>
          <text x="70" y="86" textAnchor="middle" fill="rgb(100 115 117)" fontSize="11">
            запросов
          </text>
        </svg>
        <ul className="space-y-2 text-[13px]">
          {(visible.length ? visible : slices).map((slice) => (
            <li key={slice.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-pill" style={{ background: slice.color }} />
              <span className="text-ink">{slice.label}</span>
              <span className="tabular text-muted">{slice.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function GoldBars() {
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-[18px] font-semibold tracking-tight text-ink">Разметка до «обучен»</h2>
        <p className="mt-1 text-[12px] text-muted">Цель — 50 gold на роль. Координатор ещё без отдельных примеров.</p>
      </div>
      <ul className="divide-y divide-border">
        {GOLD.map((row) => {
          const pct = Math.min(100, Math.round((row.gold / row.target) * 100))
          return (
            <li key={row.id} className="px-5 py-3 sm:px-6">
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="text-ink">{row.title}</span>
                <span className="tabular text-muted">
                  {row.gold}/{row.target}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-pill bg-surface-muted">
                <div className="h-full rounded-pill bg-brand" style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function TraceList({ traces, routingHint }: { traces: TraceRow[]; routingHint: string }) {
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-[18px] font-semibold tracking-tight text-ink">Последние следы</h2>
        <p className="mt-1 text-[12px] text-muted">{routingHint}</p>
      </div>
      {traces.length === 0 ? (
        <div className="px-5 py-8 sm:px-6">
          <EmptyState
            title="Живых следов ещё нет"
            description="Прогоните запрос на вкладке «Команда». Стартовый gold сюда не подмешиваем."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {traces.map((trace) => (
            <li key={trace.trace_id ?? trace.id} className="px-5 py-3.5 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-ink">{trace.text}</p>
                <Chip tone={legalChipTone(trace.legal)}>{legalChipLabel(trace.legal)}</Chip>
              </div>
              <p className="mt-1 text-[12px] text-muted">{trace.agents.join(' · ') || 'координатор'}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function legalChipTone(legal: LegalVerdict) {
  if (legal === 'block') return 'danger' as const
  if (legal === 'allow') return 'success' as const
  return 'warning' as const
}

function legalChipLabel(legal: LegalVerdict) {
  if (legal === 'escalate_human') return 'человек'
  if (legal === 'allow_with_conditions') return 'с оговорками'
  return legal
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-pill" style={{ background: swatch }} />
      {label}
    </span>
  )
}

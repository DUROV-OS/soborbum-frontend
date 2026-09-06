import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import * as trends from '../trends'

/**
 * «Тренды ниши» — срез Google Trends по бизнесу «модульные дома»:
 * спрос по ключевым запросам (рост / направление), регионы РФ и набирающие
 * темы. Грузится один раз при открытии вкладки, независимо от формы поиска
 * выше; регион фиксирован (РФ) — бэкенд подставляет geo=RU по умолчанию.
 */

const TIMEFRAMES: [string, string][] = [
  ['today 3-m', '3 месяца'],
  ['today 12-m', 'Год'],
  ['today 5-y', '5 лет'],
]

const DIRECTION: Record<trends.NicheDirection, { label: string; cls: string; Icon: typeof Minus }> = {
  rising: { label: 'растёт', cls: 'text-[#2b6950]', Icon: ArrowUpRight },
  falling: { label: 'падает', cls: 'text-[#b8544f]', Icon: ArrowDownRight },
  flat: { label: 'ровно', cls: 'text-muted', Icon: Minus },
  'n/a': { label: '—', cls: 'text-muted', Icon: Minus },
}

interface Data {
  overview: trends.NicheOverview | null
  regions: trends.NicheRegions | null
  rising: trends.NicheRising | null
}

export function NicheTrends() {
  const [timeframe, setTimeframe] = useState('today 12-m')
  const [group, setGroup] = useState<string | null>(null)
  const [data, setData] = useState<Data>({ overview: null, regions: null, rising: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.allSettled([
      trends.nicheOverview({ timeframe }),
      trends.nicheRegions({ timeframe }),
      trends.nicheRising({ timeframe, limit: 24 }),
    ]).then(([ov, rg, rs]) => {
      if (!alive) return
      setData({
        overview: ov.status === 'fulfilled' ? ov.value : null,
        regions: rg.status === 'fulfilled' ? rg.value : null,
        rising: rs.status === 'fulfilled' ? rs.value : null,
      })
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [timeframe])

  const groups = useMemo(() => {
    const set = new Set<string>()
    data.overview?.topics.forEach((t) => set.add(t.group))
    return [...set]
  }, [data.overview])

  const topics = useMemo(() => {
    const all = data.overview?.topics ?? []
    return group ? all.filter((t) => t.group === group) : all
  }, [data.overview, group])

  return (
    <section className="rounded-md border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-1.5 text-[14px] font-medium text-ink">
            <TrendingUp size={15} />
            Тренды ниши · модульные дома
          </h3>
          <p className="mt-0.5 text-[12px] text-muted">
            Спрос в России по данным Google Trends: значения 0–100 относительно пика за период.
          </p>
        </div>
        <div className="flex shrink-0 gap-1 self-start rounded-md border border-border p-0.5">
          {TIMEFRAMES.map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTimeframe(k)}
              className={`rounded px-2 py-1 text-[12px] ${
                timeframe === k ? 'bg-surface-muted font-medium text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-4">
          <LoadingState label="Собираем данные Google Trends…" />
        </div>
      ) : !data.overview && !data.regions && !data.rising ? (
        <div className="mt-4">
          <EmptyState
            icon={<TrendingUp size={28} />}
            title="Google Trends недоступен"
            description="Сервис ограничивает частоту запросов. Данные подтянутся при следующем открытии."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <SubHeader
              title="Спрос по запросам"
              hint={
                data.overview?.unavailable.length
                  ? `Google не отдал: ${data.overview.unavailable.length}`
                  : undefined
              }
            />
            {groups.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                <GroupChip label="Все" active={group === null} onClick={() => setGroup(null)} />
                {groups.map((g) => (
                  <GroupChip key={g} label={g} active={group === g} onClick={() => setGroup(g)} />
                ))}
              </div>
            )}
            {topics.length ? (
              <ul className="divide-y divide-border">
                {topics.map((t) => (
                  <TopicRow key={t.keyword} topic={t} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-[13px] text-muted">Нет данных за период.</p>
            )}
          </div>

          <div>
            <SubHeader
              title="Регионы России"
              hint={data.regions?.keywords.length ? `по запросам: ${data.regions.keywords.join(', ')}` : undefined}
            />
            <RegionBars regions={data.regions?.regions ?? []} />
          </div>

          <div>
            <SubHeader
              title="Набирающие темы"
              hint={data.rising?.seeds_used.length ? `из ${data.rising.seeds_used.length} запросов` : undefined}
            />
            <RisingList rising={data.rising} />
          </div>
        </div>
      )}
    </section>
  )
}

function SubHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <span className="text-[13px] font-medium text-ink">{title}</span>
      {hint && <span className="truncate text-[11px] text-muted">{hint}</span>}
    </div>
  )
}

function GroupChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-pill px-2.5 py-1 text-[12px] ${
        active ? 'bg-brand text-white' : 'bg-surface-muted text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  )
}

function TopicRow({ topic }: { topic: trends.NicheTopicStat }) {
  const dir = DIRECTION[topic.direction]
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-ink">{topic.keyword}</span>
        <span className="block truncate text-[11px] text-muted">{topic.group}</span>
      </span>
      <span className="tabular w-10 shrink-0 text-right text-[12px] text-muted" title="Текущий уровень 0–100">
        {topic.current ?? '—'}
      </span>
      <span className={`inline-flex w-20 shrink-0 items-center justify-end gap-1 text-[12px] ${dir.cls}`}>
        <dir.Icon size={13} />
        {topic.growth_pct != null ? `${topic.growth_pct > 0 ? '+' : ''}${topic.growth_pct}%` : dir.label}
      </span>
    </li>
  )
}

function RegionBars({ regions }: { regions: trends.NicheRegion[] }) {
  const rows = regions.filter((r) => (r.value ?? 0) > 0).slice(0, 10)
  if (!rows.length) return <p className="text-[13px] text-muted">Недостаточно данных по регионам.</p>
  const max = Math.max(...rows.map((r) => r.value ?? 0), 1)
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={(r.geo_code ?? '') + (r.geo_name ?? '')} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-[12px] text-ink" title={r.geo_name ?? undefined}>
            {r.geo_name ?? '—'}
          </span>
          <span className="relative h-4 flex-1 overflow-hidden rounded-sm bg-surface-muted">
            <span
              className="absolute inset-y-0 left-0 rounded-sm bg-brand"
              style={{ width: `${((r.value ?? 0) / max) * 100}%` }}
            />
          </span>
          <span className="tabular w-8 shrink-0 text-right text-[12px] text-muted">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

function RisingList({ rising }: { rising: trends.NicheRising | null }) {
  if (!rising) return <p className="text-[13px] text-muted">Google не отдал данные, попробуйте позже.</p>
  if (!rising.rising.length) {
    return (
      <p className="text-[13px] text-muted">
        {rising.unavailable.length
          ? 'Google ограничил частоту запросов — темы подтянутся позже.'
          : 'Нет заметных изменений за период.'}
      </p>
    )
  }
  return (
    <ul className="space-y-1.5">
      {rising.rising.slice(0, 12).map((e, i) => (
        <li key={`${e.query}-${i}`} className="flex items-center justify-between gap-2 text-[13px]">
          <span className="min-w-0 truncate text-ink" title={`по запросу «${e.seed}»`}>
            {e.query}
          </span>
          {e.value != null && <span className="tabular shrink-0 text-[12px] text-[#2b6950]">+{e.value}%</span>}
        </li>
      ))}
    </ul>
  )
}

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Search, TrendingUp } from 'lucide-react'
import { ApiError } from '@/shared/lib/httpClient'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Input, Select } from '@/shared/ui/Field'
import * as trends from '../trends'
import { TrendChart } from './TrendChart'

const TIMEFRAMES: [string, string][] = [
  ['now 1-d', 'Последний день'],
  ['now 7-d', 'Последние 7 дней'],
  ['today 1-m', 'Последний месяц'],
  ['today 3-m', 'Последние 3 месяца'],
  ['today 12-m', 'Последний год'],
  ['today 5-y', 'Последние 5 лет'],
  ['all', 'Всё время'],
]

const GEOS: [string, string][] = [
  ['', 'Весь мир'],
  ['RU', 'Россия'],
  ['US', 'США'],
  ['GB', 'Великобритания'],
  ['DE', 'Германия'],
  ['FR', 'Франция'],
  ['KZ', 'Казахстан'],
  ['UA', 'Украина'],
  ['BY', 'Беларусь'],
  ['TR', 'Турция'],
  ['IN', 'Индия'],
  ['JP', 'Япония'],
  ['BR', 'Бразилия'],
]

interface Result {
  overTime: trends.InterestOverTime
  byRegion: trends.InterestByRegion | null
  queries: trends.Related | null
  topics: trends.Related | null
}

function errorText(reason: unknown): string {
  if (reason instanceof ApiError) return reason.message
  return 'Google Trends сейчас недоступен — сервис ограничивает частоту запросов. Попробуйте позже.'
}

export function TrendExplorer() {
  const [text, setText] = useState('')
  const [timeframe, setTimeframe] = useState('today 12-m')
  const [geo, setGeo] = useState('')
  const [applied, setApplied] = useState<{ q: string; timeframe: string; geo: string } | null>(null)

  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trending, setTrending] = useState<trends.TrendingNow | null>(null)

  useEffect(() => {
    let alive = true
    trends.trendingNow({ geo: geo || 'US', limit: 14 }).then(
      (r) => alive && setTrending(r),
      () => alive && setTrending(null),
    )
    return () => {
      alive = false
    }
  }, [geo])

  useEffect(() => {
    if (!applied) return
    let alive = true
    setLoading(true)
    setError(null)
    const base = { q: applied.q, timeframe: applied.timeframe, geo: applied.geo }
    Promise.allSettled([
      trends.interestOverTime(base),
      trends.interestByRegion(base),
      trends.relatedQueries(base),
      trends.relatedTopics(base),
    ]).then(([ot, br, rq, rt]) => {
      if (!alive) return
      setLoading(false)
      if (ot.status === 'rejected') {
        setError(errorText(ot.reason))
        setResult(null)
        return
      }
      setResult({
        overTime: ot.value,
        byRegion: br.status === 'fulfilled' ? br.value : null,
        queries: rq.status === 'fulfilled' ? rq.value : null,
        topics: rt.status === 'fulfilled' ? rt.value : null,
      })
    })
    return () => {
      alive = false
    }
  }, [applied])

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5)
      .join(', ')
    if (!q) return
    setApplied({ q, timeframe, geo })
  }

  const keywords = useMemo(() => (applied ? applied.q.split(',').map((s) => s.trim()) : []), [applied])

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="mb-1.5 block text-[13px] font-medium text-ink">Запросы</span>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Например: модульные дома, каркасный дом"
          />
          <span className="mt-1 block text-[12px] text-muted">До 5 запросов через запятую — для сравнения.</span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink">Период</span>
          <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-full sm:w-48">
            {TIMEFRAMES.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink">Регион</span>
          <Select value={geo} onChange={(e) => setGeo(e.target.value)} className="w-full sm:w-44">
            {GEOS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" disabled={loading}>
          <Search size={16} />
          Показать
        </Button>
      </form>

      {loading && <LoadingState label="Запрашиваем данные Google Trends…" />}

      {!loading && error && (
        <EmptyState icon={<TrendingUp size={28} />} title="Не удалось получить данные" description={error} />
      )}

      {!loading && !error && !result && (
        <EmptyState
          icon={<TrendingUp size={28} />}
          title="Динамика популярности запросов"
          description="Введите запрос и период — построим график, как в Google Trends, покажем регионы и похожие запросы."
        />
      )}

      {!loading && !error && result && (
        <>
          <section className="rounded-md border border-border bg-surface p-4 sm:p-5">
            <h3 className="text-[14px] font-medium text-ink">Динамика популярности</h3>
            <p className="mt-0.5 text-[12px] text-muted">
              Значения от 0 до 100 относительно пика за выбранный период.
            </p>
            <div className="mt-4">
              {result.overTime.series.length ? (
                <TrendChart series={result.overTime.series} keywords={keywords} />
              ) : (
                <p className="py-8 text-center text-[13px] text-muted">Нет данных за выбранный период.</p>
              )}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            {result.byRegion && (
              <section className="rounded-md border border-border bg-surface p-4 sm:p-5">
                <h3 className="text-[14px] font-medium text-ink">По регионам</h3>
                <p className="mt-0.5 text-[12px] text-muted">«{result.byRegion.keyword}» · где запрос популярнее</p>
                <div className="mt-4">
                  <RegionBars data={result.byRegion} />
                </div>
              </section>
            )}

            {result.queries && (
              <section className="rounded-md border border-border bg-surface p-4 sm:p-5">
                <h3 className="text-[14px] font-medium text-ink">Похожие запросы</h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <RelatedColumn title="Популярные" entries={result.queries.top} />
                  <RelatedColumn title="Набирающие" entries={result.queries.rising} rising />
                </div>
              </section>
            )}

            {result.topics && (result.topics.top.length > 0 || result.topics.rising.length > 0) && (
              <section className="rounded-md border border-border bg-surface p-4 sm:p-5">
                <h3 className="text-[14px] font-medium text-ink">Похожие темы</h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <RelatedColumn title="Популярные" entries={result.topics.top} />
                  <RelatedColumn title="Набирающие" entries={result.topics.rising} rising />
                </div>
              </section>
            )}
          </div>
        </>
      )}

      {trending && trending.items.length > 0 && (
        <section className="rounded-md border border-border bg-surface p-4 sm:p-5">
          <h3 className="text-[14px] font-medium text-ink">В тренде сейчас · {trending.geo}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {trending.items.map((t) => (
              <span
                key={t.keyword}
                className="inline-flex items-center gap-1.5 rounded-pill bg-surface-muted px-2.5 py-1 text-[12px] text-ink"
              >
                {t.keyword}
                {t.volume != null && <span className="text-muted">{formatVolume(t.volume)}</span>}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function RegionBars({ data }: { data: trends.InterestByRegion }) {
  const rows = data.regions.filter((r) => (r.value ?? 0) > 0).slice(0, 10)
  if (!rows.length) return <p className="text-[13px] text-muted">Недостаточно данных по регионам.</p>
  const max = Math.max(...rows.map((r) => r.value ?? 0), 1)
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={(r.geo_code ?? '') + (r.geo_name ?? '')} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-[12px] text-ink" title={r.geo_name ?? undefined}>
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

function RelatedColumn({
  title,
  entries,
  rising = false,
}: {
  title: string
  entries: trends.RelatedEntry[]
  rising?: boolean
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">{title}</div>
      {entries.length ? (
        <ul className="space-y-1.5">
          {entries.slice(0, 10).map((e, i) => (
            <li key={`${e.query}-${i}`} className="flex items-center justify-between gap-2 text-[13px]">
              <span className="min-w-0 truncate text-ink">{e.query ?? '—'}</span>
              {e.value != null && (
                <span className="tabular shrink-0 text-[12px] text-muted">
                  {rising ? `+${e.value}%` : e.value}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted">—</p>
      )}
    </div>
  )
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`
  if (v >= 1_000) return `${Math.round(v / 1_000)}K+`
  return `${v}+`
}

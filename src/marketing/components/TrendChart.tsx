import { useEffect, useMemo, useRef, useState } from 'react'
import type { InterestPoint } from '../trends'

/** Палитра линий сравнения (до 5 запросов) — в тон системе, но контрастная. */
export const SERIES_COLORS = ['#2b6950', '#b8544f', '#b98a53', '#3a5c8a', '#7a5aa6']

const HEIGHT = 300
const PAD = { top: 12, right: 14, bottom: 28, left: 32 }

const DAY = 86_400_000

/**
 * Формат подписи даты зависит от охвата ряда: у «за всё время» точки идут
 * годами — показываем год, иначе месяц+год или день+месяц.
 */
function tickOptions(spanDays: number): Intl.DateTimeFormatOptions {
  if (spanDays > 3 * 365) return { year: 'numeric' }
  if (spanDays > 180) return { month: 'short', year: '2-digit' }
  return { day: '2-digit', month: 'short' }
}

function formatDate(iso: string | null, options: Intl.DateTimeFormatOptions): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ru-RU', options)
}

/**
 * Линейный график динамики популярности — как в Google Trends: ось Y 0…100
 * (нормированные значения приходят с бэка), несколько линий для сравнения,
 * наведение показывает вертикальную линию и значения на дату.
 */
export function TrendChart({ series, keywords }: { series: InterestPoint[]; keywords: string[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(760)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = series.length
  const plotW = Math.max(width - PAD.left - PAD.right, 10)
  const plotH = HEIGHT - PAD.top - PAD.bottom

  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const y = (v: number) => PAD.top + plotH - (Math.max(0, Math.min(100, v)) / 100) * plotH

  const paths = useMemo(() => {
    return keywords.map((kw) => {
      const parts: string[] = []
      let pen = false
      series.forEach((p, i) => {
        const v = p.values[kw]
        if (v == null) {
          pen = false
          return
        }
        parts.push(`${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
        pen = true
      })
      return parts.join(' ')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, keywords, width])

  if (!n) return null

  const times = series.map((p) => (p.date ? new Date(p.date).getTime() : NaN)).filter((t) => !Number.isNaN(t))
  const spanDays = times.length > 1 ? (Math.max(...times) - Math.min(...times)) / DAY : 0
  const axisOpts = tickOptions(spanDays)
  const fullOpts: Intl.DateTimeFormatOptions =
    spanDays > 180 ? { day: '2-digit', month: 'short', year: 'numeric' } : axisOpts

  const ticks = [0, 25, 50, 75, 100]
  const labelIdxs =
    n <= 6 ? series.map((_, i) => i) : [1, 2, 3, 4].map((k) => Math.round((k / 5) * (n - 1))).concat(0)
  const active = hover != null ? series[hover] : null

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg width={width} height={HEIGHT} role="img" aria-label="График динамики популярности" className="overflow-visible">
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="rgb(var(--border))"
              strokeWidth={1}
            />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px]">
              {t}
            </text>
          </g>
        ))}

        {labelIdxs.map((i) => (
          <text key={i} x={x(i)} y={HEIGHT - 8} textAnchor="middle" className="fill-muted text-[10px]">
            {formatDate(series[i]?.date ?? null, axisOpts)}
          </text>
        ))}

        {paths.map((d, si) => (
          <path
            key={keywords[si]}
            d={d}
            fill="none"
            stroke={SERIES_COLORS[si % SERIES_COLORS.length]}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {hover != null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.top}
            y2={PAD.top + plotH}
            stroke="rgb(var(--ink))"
            strokeOpacity={0.25}
            strokeWidth={1}
          />
        )}
        {hover != null &&
          keywords.map((kw, si) => {
            const v = series[hover].values[kw]
            if (v == null) return null
            return (
              <circle
                key={kw}
                cx={x(hover)}
                cy={y(v)}
                r={3.5}
                fill={SERIES_COLORS[si % SERIES_COLORS.length]}
                stroke="white"
                strokeWidth={1.5}
              />
            )
          })}

        <rect
          x={PAD.left}
          y={PAD.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const rel = e.clientX - rect.left
            const i = n <= 1 ? 0 : Math.round((rel / plotW) * (n - 1))
            setHover(Math.max(0, Math.min(n - 1, i)))
          }}
        />
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute z-10 min-w-[150px] rounded-md border border-border bg-surface px-3 py-2 text-[12px] shadow-panel"
          style={{ left: Math.min(Math.max(x(hover!) + 10, 0), Math.max(width - 170, 0)), top: PAD.top }}
        >
          <div className="mb-1 font-medium text-ink">
            {formatDate(active.date, fullOpts)}
            {active.is_partial && <span className="text-muted"> · неполные данные</span>}
          </div>
          {keywords.map((kw, si) => (
            <div key={kw} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ background: SERIES_COLORS[si % SERIES_COLORS.length] }}
              />
              <span className="flex-1 truncate text-muted">{kw}</span>
              <span className="tabular font-medium text-ink">{active.values[kw] ?? '—'}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {keywords.map((kw, si) => (
          <span key={kw} className="inline-flex items-center gap-1.5 text-[12px] text-muted">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: SERIES_COLORS[si % SERIES_COLORS.length] }}
            />
            {kw}
          </span>
        ))}
      </div>
    </div>
  )
}

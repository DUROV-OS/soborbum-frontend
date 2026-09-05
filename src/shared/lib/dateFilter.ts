export type DateFilter =
  | 'today'
  | 'last24h'
  | 'week'
  | 'last7d'
  | 'month'
  | 'last30d'
  | 'year'
  | 'last365d'
  | 'all'

export const DATE_FILTER_LABEL: Record<DateFilter, string> = {
  today: 'Этот день',
  last24h: 'Последние сутки',
  week: 'Эта неделя',
  last7d: 'Последние 7 дней',
  month: 'Этот месяц',
  last30d: 'Последние 30 дней',
  year: 'Этот год',
  last365d: 'Последние 365 дней',
  all: 'Всё время',
}

export const DATE_FILTER_OPTIONS = Object.entries(DATE_FILTER_LABEL) as [DateFilter, string][]

export const DEFAULT_DATE_FILTER: DateFilter = 'month'

const DAY_MS = 24 * 60 * 60 * 1000

/** Границы диапазона [начало, конец) — null для "всё время" (фильтр не применяется). */
export function dateFilterRange(filter: DateFilter): [Date, Date] | null {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  switch (filter) {
    case 'today':
      return [new Date(y, m, d), new Date(y, m, d + 1)]
    case 'last24h':
      return [new Date(now.getTime() - DAY_MS), now]
    case 'week': {
      const weekday = (now.getDay() + 6) % 7 // понедельник = 0
      return [new Date(y, m, d - weekday), new Date(y, m, d - weekday + 7)]
    }
    case 'last7d':
      return [new Date(now.getTime() - 7 * DAY_MS), now]
    case 'month':
      return [new Date(y, m, 1), new Date(y, m + 1, 1)]
    case 'last30d':
      return [new Date(now.getTime() - 30 * DAY_MS), now]
    case 'year':
      return [new Date(y, 0, 1), new Date(y + 1, 0, 1)]
    case 'last365d':
      return [new Date(now.getTime() - 365 * DAY_MS), now]
    case 'all':
      return null
  }
}

/** Проверяет, попадает ли ISO-дата в диапазон. Пустая дата не проходит фильтр, если диапазон задан. */
export function matchesDateFilter(dateValue: string | null | undefined, range: [Date, Date] | null): boolean {
  if (!range) return true
  if (!dateValue) return false
  const value = new Date(dateValue)
  return value >= range[0] && value < range[1]
}

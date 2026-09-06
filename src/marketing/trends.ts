import { apiRequest } from '@/shared/lib/httpClient'

/**
 * Раздел «Маркетинг → Тренд»: графики популярности запросов как в Google Trends.
 * Бэкенд (app/marketing/router.py) отдаёт данные через библиотеку trendspy —
 * всё read-only. Типы повторяют app/marketing/trends_schemas.py.
 */

const SECTION = 'marketing'

export interface InterestPoint {
  date: string | null
  /** значение 0…100 по каждому запросу; null — точки нет */
  values: Record<string, number | null>
  is_partial: boolean
}

export interface InterestOverTime {
  keywords: string[]
  timeframe: string
  geo: string
  category: string
  series: InterestPoint[]
}

export interface RegionInterest {
  geo_name: string | null
  geo_code: string | null
  value: number | null
}

export interface InterestByRegion {
  keyword: string
  geo: string
  resolution: string
  regions: RegionInterest[]
}

export interface RelatedEntry {
  query: string | null
  type: string | null
  value: number | null
  link: string | null
}

export interface Related {
  keyword: string
  top: RelatedEntry[]
  rising: RelatedEntry[]
}

export interface TrendNews {
  title: string | null
  url: string | null
  source: string | null
  picture: string | null
  time: string | null
}

export interface TrendingItem {
  keyword: string
  volume: number | null
  volume_growth_pct: number | null
  geo: string | null
  started_at: string | null
  ended_at: string | null
  trend_keywords: string[]
  topics: string[]
  news: TrendNews[]
}

export interface TrendingNow {
  geo: string
  with_news: boolean
  items: TrendingItem[]
}

export interface LookupEntry {
  name: string | null
  id: string | null
}

/** `type`, а не `interface` — нужен неявный индекс для передачи в query. */
type OverTimeParams = { q: string; timeframe?: string; geo?: string; cat?: string }
type RegionParams = { q: string; timeframe?: string; geo?: string; resolution?: string }
type RelatedParams = { q: string; timeframe?: string; geo?: string }
type TrendingParams = { geo?: string; limit?: number; with_news?: boolean }

/** GET /api/marketing/trends/interest-over-time — данные линейного графика. */
export function interestOverTime(params: OverTimeParams): Promise<InterestOverTime> {
  return apiRequest<InterestOverTime>({ section: SECTION, path: '/trends/interest-over-time', query: params })
}

/** GET /api/marketing/trends/interest-by-region — распределение по регионам. */
export function interestByRegion(params: RegionParams): Promise<InterestByRegion> {
  return apiRequest<InterestByRegion>({ section: SECTION, path: '/trends/interest-by-region', query: params })
}

/** GET /api/marketing/trends/related-queries — похожие запросы (top / rising). */
export function relatedQueries(params: RelatedParams): Promise<Related> {
  return apiRequest<Related>({ section: SECTION, path: '/trends/related-queries', query: params })
}

/** GET /api/marketing/trends/related-topics — похожие темы (top / rising). */
export function relatedTopics(params: RelatedParams): Promise<Related> {
  return apiRequest<Related>({ section: SECTION, path: '/trends/related-topics', query: params })
}

/** GET /api/marketing/trends/trending-now — что в тренде прямо сейчас. */
export function trendingNow(params: TrendingParams = {}): Promise<TrendingNow> {
  return apiRequest<TrendingNow>({ section: SECTION, path: '/trends/trending-now', query: params })
}

/** GET /api/marketing/trends/geo — справочник регионов. */
export function geoLookup(find?: string): Promise<LookupEntry[]> {
  return apiRequest<LookupEntry[]>({ section: SECTION, path: '/trends/geo', query: { find } })
}

/** GET /api/marketing/trends/categories — справочник категорий. */
export function categoriesLookup(find?: string): Promise<LookupEntry[]> {
  return apiRequest<LookupEntry[]>({ section: SECTION, path: '/trends/categories', query: { find } })
}

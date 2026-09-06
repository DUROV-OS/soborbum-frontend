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

export interface LookupEntry {
  name: string | null
  id: string | null
}

// --- «Тренды ниши»: срез по бизнесу «модульные дома» -------------------------

export interface KeywordGroup {
  group: string
  keywords: string[]
}

export interface NicheKeywords {
  geo: string
  groups: KeywordGroup[]
}

export type NicheDirection = 'rising' | 'flat' | 'falling' | 'n/a'

export interface NicheTopicStat {
  keyword: string
  group: string
  /** значение 0…100 на последнюю точку периода */
  current: number | null
  average: number | null
  peak: number | null
  peak_date: string | null
  /** прирост «конец периода vs начало», % */
  growth_pct: number | null
  direction: NicheDirection
}

export interface NicheOverview {
  timeframe: string
  geo: string
  /** сколько запросов реально отдал Google */
  resolved: number
  /** запросы, по которым Google в этот момент дал лимит */
  unavailable: string[]
  topics: NicheTopicStat[]
}

export interface NicheRegion {
  geo_name: string | null
  geo_code: string | null
  /** 0…100, усреднено по ключевым запросам ниши */
  value: number | null
}

export interface NicheRegions {
  keywords: string[]
  timeframe: string
  geo: string
  resolution: string
  regions: NicheRegion[]
}

export interface NicheRisingEntry {
  query: string
  value: number | null
  /** какой запрос ниши вывел эту тему */
  seed: string
}

export interface NicheRising {
  timeframe: string
  geo: string
  seeds_used: string[]
  unavailable: string[]
  rising: NicheRisingEntry[]
}

/** `type`, а не `interface` — нужен неявный индекс для передачи в query. */
type OverTimeParams = { q: string; timeframe?: string; geo?: string; cat?: string }
type RegionParams = { q: string; timeframe?: string; geo?: string; resolution?: string }
type RelatedParams = { q: string; timeframe?: string; geo?: string }
type NicheOverviewParams = { timeframe?: string; geo?: string; groups?: string }
type NicheRegionsParams = { q?: string; timeframe?: string; geo?: string; resolution?: string }
type NicheRisingParams = { timeframe?: string; geo?: string; limit?: number; groups?: string }

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

/** GET /api/marketing/trends/niche/keywords — группы запросов ниши для фильтров. */
export function nicheKeywords(geo?: string): Promise<NicheKeywords> {
  return apiRequest<NicheKeywords>({ section: SECTION, path: '/trends/niche/keywords', query: { geo } })
}

/** GET /api/marketing/trends/niche/overview — спрос по нише: рост / направление по запросам. */
export function nicheOverview(params: NicheOverviewParams = {}): Promise<NicheOverview> {
  return apiRequest<NicheOverview>({ section: SECTION, path: '/trends/niche/overview', query: params })
}

/** GET /api/marketing/trends/niche/regions — регионы РФ по интересу к нише. */
export function nicheRegions(params: NicheRegionsParams = {}): Promise<NicheRegions> {
  return apiRequest<NicheRegions>({ section: SECTION, path: '/trends/niche/regions', query: params })
}

/** GET /api/marketing/trends/niche/rising — набирающие темы вокруг ниши. */
export function nicheRising(params: NicheRisingParams = {}): Promise<NicheRising> {
  return apiRequest<NicheRising>({ section: SECTION, path: '/trends/niche/rising', query: params })
}

/** GET /api/marketing/trends/geo — справочник регионов. */
export function geoLookup(find?: string): Promise<LookupEntry[]> {
  return apiRequest<LookupEntry[]>({ section: SECTION, path: '/trends/geo', query: { find } })
}

/** GET /api/marketing/trends/categories — справочник категорий. */
export function categoriesLookup(find?: string): Promise<LookupEntry[]> {
  return apiRequest<LookupEntry[]>({ section: SECTION, path: '/trends/categories', query: { find } })
}

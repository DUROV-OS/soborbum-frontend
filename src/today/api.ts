import { apiRequest } from '@/shared/lib/httpClient'
import { AktualnoeResponse, SectionSignal, TodayDashboard } from './types'

/** GET /api/dashboard/today */
export function getToday(reload = false): Promise<TodayDashboard> {
  return apiRequest<TodayDashboard>({ section: 'dashboard', path: '/today', query: { reload } })
}

/** GET /api/dashboard/today/section/:section — один раздел, кэш на 6 часов на бэке. */
export function getSectionSignal(section: string, reload = false): Promise<SectionSignal> {
  return apiRequest<SectionSignal>({
    section: 'dashboard',
    path: `/today/section/${section}`,
    query: { reload },
  })
}

/** GET /api/dashboard/aktualnoe — блок «Актуальное», кеш на 12 часов */
export function getAktualnoe(reload = false): Promise<AktualnoeResponse> {
  return apiRequest<AktualnoeResponse>({ section: 'dashboard', path: '/aktualnoe', query: { reload } })
}

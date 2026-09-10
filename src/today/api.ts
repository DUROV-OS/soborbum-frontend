import { apiRequest } from '@/shared/lib/httpClient'
import { AktualnoeResponse, TodayDashboard } from './types'

/** GET /api/dashboard/today */
export function getToday(reload = false): Promise<TodayDashboard> {
  return apiRequest<TodayDashboard>({ section: 'dashboard', path: '/today', query: { reload } })
}

/** GET /api/dashboard/aktualnoe — блок «Актуальное», кеш на 12 часов */
export function getAktualnoe(reload = false): Promise<AktualnoeResponse> {
  return apiRequest<AktualnoeResponse>({ section: 'dashboard', path: '/aktualnoe', query: { reload } })
}

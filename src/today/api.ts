import { apiRequest } from '@/shared/lib/httpClient'
import { TodayDashboard } from './types'

/** GET /api/dashboard/today */
export function getToday(): Promise<TodayDashboard> {
  return apiRequest<TodayDashboard>({ section: 'dashboard', path: '/today' })
}

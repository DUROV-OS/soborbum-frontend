import { apiRequest } from '@/shared/lib/httpClient'
import { Cycle } from './types'

const SECTION = 'cycles'

/** GET /api/cycles/ */
export function listCycles(): Promise<Cycle[]> {
  return apiRequest<Cycle[]>({ section: SECTION, path: '/' })
}

/** GET /api/cycles/:id */
export function getCycle(id: number): Promise<Cycle> {
  return apiRequest<Cycle>({ section: SECTION, path: `/${id}` })
}

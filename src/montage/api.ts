import { apiRequest } from '@/shared/lib/httpClient'
import { CycleForMontage, Installation } from './types'

const SECTION = 'installation'

/** GET /api/cycles/ (используется только для перечисления монтажей) */
export function listCyclesForMontage(): Promise<CycleForMontage[]> {
  return apiRequest<CycleForMontage[]>({ section: 'cycles', path: '/' })
}

/** POST /api/installation/start/:cycleId */
export function startInstallation(cycleId: number): Promise<Installation> {
  return apiRequest<Installation>({ section: SECTION, path: `/start/${cycleId}`, method: 'POST' })
}

/** GET /api/installation/:id */
export function getInstallation(id: number): Promise<Installation> {
  return apiRequest<Installation>({ section: SECTION, path: `/${id}` })
}

export interface InstallationUpdateInput {
  address?: string
  scheduled_date?: string
  notes?: string
}

/** PATCH /api/installation/:id */
export function updateInstallation(id: number, patch: InstallationUpdateInput): Promise<Installation> {
  return apiRequest<Installation>({ section: SECTION, path: `/${id}`, method: 'PATCH', body: patch })
}

/** POST /api/installation/:id/transition */
export function advanceStage(id: number): Promise<Installation> {
  return apiRequest<Installation>({ section: SECTION, path: `/${id}/transition`, method: 'POST' })
}

/** POST /api/installation/:id/complete */
export function complete(id: number): Promise<Installation> {
  return apiRequest<Installation>({ section: SECTION, path: `/${id}/complete`, method: 'POST' })
}

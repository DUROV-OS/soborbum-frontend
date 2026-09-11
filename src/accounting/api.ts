import { apiRequest } from '@/shared/lib/httpClient'
import {
  EmployeeSalaryOverview,
  MoneyAssessment,
  MoneyDirection,
  MoneyMovement,
  MoneyMovementEnums,
  MoneyMovementStatus,
  MoneySourceKind,
  MoneySubkind,
} from './types'

const SECTION = 'accounting'

export interface MoneyMovementFilters {
  direction?: MoneyDirection
  subkind?: MoneySubkind
  status?: MoneyMovementStatus
  source_kind?: MoneySourceKind
  client_id?: number
  employee_id?: number
  supply_id?: number
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

/** GET /api/accounting/money-movements */
export function listMovements(filters: MoneyMovementFilters = {}): Promise<MoneyMovement[]> {
  return apiRequest<MoneyMovement[]>({ section: SECTION, path: '/money-movements', query: { ...filters } })
}

/** GET /api/accounting/money-movements/enums */
export function getEnums(): Promise<MoneyMovementEnums> {
  return apiRequest<MoneyMovementEnums>({ section: SECTION, path: '/money-movements/enums' })
}

/** GET /api/accounting/money-movements/:id */
export function getMovement(id: number): Promise<MoneyMovement> {
  return apiRequest<MoneyMovement>({ section: SECTION, path: `/money-movements/${id}` })
}

export interface MoneyMovementCreateInput {
  subkind: MoneySubkind
  amount: number
  tax?: number
  currency?: string
  assessment?: MoneyAssessment
  affects_profit?: boolean
  client_id?: number
  employee_id?: number
  payment_purpose?: string
  comment?: string
  external_number?: string
}

/** POST /api/accounting/money-movements — всегда создаётся в статусе draft */
export function createMovement(input: MoneyMovementCreateInput): Promise<MoneyMovement> {
  return apiRequest<MoneyMovement>({ section: SECTION, path: '/money-movements', method: 'POST', body: input })
}

/** POST /api/accounting/money-movements/:id/status */
export function changeStatus(
  id: number,
  to: Exclude<MoneyMovementStatus, 'draft'>,
  reason?: string,
): Promise<MoneyMovement> {
  return apiRequest<MoneyMovement>({
    section: SECTION,
    path: `/money-movements/${id}/status`,
    method: 'POST',
    body: { to, reason },
  })
}

/** DELETE /api/accounting/money-movements/:id — только для draft */
export function deleteMovement(id: number): Promise<void> {
  return apiRequest<void>({ section: SECTION, path: `/money-movements/${id}`, method: 'DELETE' })
}

/** GET /api/accounting/salary-overview */
export function getSalaryOverview(): Promise<EmployeeSalaryOverview[]> {
  return apiRequest<EmployeeSalaryOverview[]>({ section: SECTION, path: '/salary-overview' })
}

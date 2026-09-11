import { apiRequest, downloadFile } from '@/shared/lib/httpClient'
import {
  MoneyAssessment,
  MoneyDirection,
  MoneyMovement,
  MoneyMovementEnums,
  MoneyMovementStatus,
  MoneySourceKind,
  MoneySubkind,
  PaymentImportResult,
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

// --- Импорт платежей таблицей (задача 0011-k) ---

/** POST /api/accounting/money-movements/import (multipart) */
export function importPayments(file: File): Promise<PaymentImportResult> {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<PaymentImportResult>({
    section: SECTION,
    path: '/money-movements/import',
    method: 'POST',
    form,
  })
}

/** POST /api/accounting/money-movements/import/ai-fill-subkind */
export function aiFillSubkind(movement_ids: number[]): Promise<{ updated: number; skipped: number }> {
  return apiRequest({
    section: SECTION,
    path: '/money-movements/import/ai-fill-subkind',
    method: 'POST',
    body: { movement_ids },
  })
}

/** POST /api/accounting/money-movements/import/backfill-task */
export function createImportBackfillTask(
  movement_ids: number[],
  missing_fields: string[],
): Promise<{ task_id: number }> {
  return apiRequest({
    section: SECTION,
    path: '/money-movements/import/backfill-task',
    method: 'POST',
    body: { movement_ids, missing_fields },
  })
}

/** GET /api/accounting/money-movements/import/template */
export function downloadImportTemplate(): Promise<void> {
  return downloadFile(SECTION, '/money-movements/import/template', 'shablon_platezhey.xlsx')
}

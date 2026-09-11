// Зеркалит app/accounting/schemas.py::MoneyMovementOut на бэке (задача 0011-c).
// Терминология и модель повторяют МойСклад — см.
// backend/docs/moysklad-accounting-research.md (разведка 0011-b).

export type MoneyDirection = 'income' | 'expense'

export type MoneySubkind =
  | 'sale_income'
  | 'salary_payout'
  | 'supply_payment'
  | 'tax'
  | 'rent'
  | 'other_income'
  | 'other_expense'

export type MoneyAssessment = 'planned' | 'actual'

export type MoneyMovementStatus = 'draft' | 'approved' | 'posted' | 'cancelled'

export type MoneySourceKind = 'none' | 'client' | 'employee' | 'supply'

export interface MoneyMovement {
  id: number
  direction: MoneyDirection
  subkind: MoneySubkind
  amount: number
  currency: string
  tax: number
  assessment: MoneyAssessment
  affects_profit: boolean
  initiator_id: number
  initiator_name: string | null
  status: MoneyMovementStatus
  posted_at: string | null
  cancel_reason: string | null
  payment_purpose: string | null
  comment: string | null
  external_number: string | null
  source_kind: MoneySourceKind
  client_id: number | null
  employee_id: number | null
  supply_id: number | null
  source_label: string | null
  created_at: string
  updated_at: string
}

/** GET /api/accounting/money-movements/enums */
export interface MoneyMovementEnums {
  direction: MoneyDirection[]
  subkind: MoneySubkind[]
  status: MoneyMovementStatus[]
  source_kind: MoneySourceKind[]
}

export const DIRECTION_LABEL: Record<MoneyDirection, string> = {
  income: 'Приход',
  expense: 'Расход',
}

export const SUBKIND_LABEL: Record<MoneySubkind, string> = {
  sale_income: 'Доход от продажи',
  salary_payout: 'Выплата зарплаты',
  supply_payment: 'Оплата поставки',
  tax: 'Налоги и сборы',
  rent: 'Аренда',
  other_income: 'Прочий доход',
  other_expense: 'Прочий расход',
}

export const STATUS_LABEL: Record<MoneyMovementStatus, string> = {
  draft: 'Черновик',
  approved: 'Согласовано',
  posted: 'Проведено',
  cancelled: 'Отменено',
}

export const ASSESSMENT_LABEL: Record<MoneyAssessment, string> = {
  planned: 'Плановая',
  actual: 'Фактическая',
}

export const SOURCE_KIND_LABEL: Record<MoneySourceKind, string> = {
  none: 'Без источника',
  client: 'Клиент',
  employee: 'Сотрудник',
  supply: 'Поставка',
}

/** Виды, которые в 0011-e можно заводить руками. salary_payout и supply_payment
 * заводятся из своих разделов в 0011-f, поэтому в форме создания их нет. */
export const CREATABLE_SUBKINDS: MoneySubkind[] = [
  'sale_income',
  'other_income',
  'other_expense',
  'tax',
  'rent',
]

/** Подвиды, требующие привязку к клиенту (единственный источник, доступный в 0011-e). */
export const CLIENT_SOURCE_SUBKINDS: MoneySubkind[] = ['sale_income']

export const STATUS_TONE: Record<MoneyMovementStatus, 'neutral' | 'info' | 'success' | 'danger'> = {
  draft: 'neutral',
  approved: 'info',
  posted: 'success',
  cancelled: 'danger',
}

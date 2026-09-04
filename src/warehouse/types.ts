export interface RequestBreakdownItem {
  module_id: number
  module_name: string
  production_id: number
  quantity_requested: number
}

export interface Material {
  id: number
  material_type: string
  size: string | null
  title: string
  supplier_name: string | null
  supplier_contact: string | null
  supplier_phone: string | null
  unit: string
  quantity_in_stock: number
  threshold: number
  total_requested: number
  needs_supply: boolean
  request_breakdown: RequestBreakdownItem[]
  created_at: string
}

export type MovementReason =
  | 'supply'
  | 'issued'
  | 'required_adjusted_up'
  | 'request_rejected_return'
  | 'manual_adjust'

export interface StockMovement {
  id: number
  warehouse_material_id: number
  delta: number
  reason: MovementReason
  reference_id: number | null
  created_by_id: number
  created_at: string
}

export interface SupplyLine {
  id: number
  warehouse_material_id: number
  quantity: number
}

export interface Supply {
  id: number
  supplier_name: string | null
  created_by_id: number
  created_at: string
  lines: SupplyLine[]
}

export const MOVEMENT_REASON_LABEL: Record<MovementReason, string> = {
  supply: 'Поставка',
  issued: 'Выдано на модуль',
  required_adjusted_up: 'Увеличена потребность',
  request_rejected_return: 'Возврат по отклонённой заявке',
  manual_adjust: 'Ручная корректировка',
}

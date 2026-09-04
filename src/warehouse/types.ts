export interface Material {
  id: string
  inventoryNumber: string
  unit: string
  type: string
  size: string
  title: string
  supplierName: string
  supplierContact: string
  inStock: number
  threshold: number
}

/**
 * Одна строка «материал × модуль». Три количества всегда двигаются друг
 * относительно друга (запрос переносит из needed в requested, одобрение —
 * из requested в provided, отклонение — обратно из requested в needed),
 * поэтому needed+requested+provided не меняется при одобрении/отклонении.
 */
export interface MaterialRequestLine {
  id: string
  materialId: string
  moduleId: string
  moduleLabel: string
  neededQty: number
  requestedQty: number
  providedQty: number
  createdAt: string
}

export type MovementKind = 'supply' | 'issue' | 'return'

export interface StockMovement {
  id: string
  materialId: string
  kind: MovementKind
  qty: number
  note: string
  createdAt: string
}

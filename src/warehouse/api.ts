import { apiRequest, downloadFile } from '@/shared/lib/httpClient'
import { Material, MovementReason, StockMovement, Supply } from './types'

const SECTION = 'warehouse'

/** GET /api/warehouse/materials */
export function listMaterials(needsSupply?: boolean): Promise<Material[]> {
  return apiRequest<Material[]>({ section: SECTION, path: '/materials', query: { needs_supply: needsSupply } })
}

/** GET /api/warehouse/materials/:id */
export function getMaterial(id: number): Promise<Material> {
  return apiRequest<Material>({ section: SECTION, path: `/materials/${id}` })
}

export interface MaterialCreateInput {
  material_type: string
  size?: string
  title: string
  supplier_name?: string
  supplier_contact?: string
  supplier_phone?: string
  unit: string
  quantity_in_stock?: number
  threshold?: number
}

/** POST /api/warehouse/materials */
export function createMaterial(input: MaterialCreateInput): Promise<Material> {
  return apiRequest<Material>({ section: SECTION, path: '/materials', method: 'POST', body: input })
}

export interface MaterialUpdateInput {
  material_type?: string
  size?: string
  title?: string
  supplier_name?: string
  supplier_contact?: string
  supplier_phone?: string
  threshold?: number
}

/** PATCH /api/warehouse/materials/:id */
export function updateMaterial(id: number, patch: MaterialUpdateInput): Promise<Material> {
  return apiRequest<Material>({ section: SECTION, path: `/materials/${id}`, method: 'PATCH', body: patch })
}

/** GET /api/warehouse/materials/:id/history */
export function materialHistory(id: number): Promise<StockMovement[]> {
  return apiRequest<StockMovement[]>({ section: SECTION, path: `/materials/${id}/history` })
}

/** GET /api/warehouse/history */
export function history(filters: { material_id?: number; reason?: MovementReason } = {}): Promise<StockMovement[]> {
  return apiRequest<StockMovement[]>({ section: SECTION, path: '/history', query: filters })
}

/** GET /api/warehouse/supplies/template */
export function downloadSupplyTemplate(): Promise<void> {
  return downloadFile(SECTION, '/supplies/template', 'soborbum_shablon_postavki.xlsx')
}

export interface SupplyLineInput {
  warehouse_material_id: number
  quantity: number
}

/** POST /api/warehouse/supplies */
export function createSupply(supplier_name: string | undefined, lines: SupplyLineInput[]): Promise<Supply> {
  return apiRequest<Supply>({ section: SECTION, path: '/supplies', method: 'POST', body: { supplier_name, lines } })
}

/** POST /api/warehouse/supplies/import */
export function importSupply(file: File): Promise<Supply> {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<Supply>({ section: SECTION, path: '/supplies/import', method: 'POST', form })
}

/** GET /api/warehouse/supplies/:id */
export function getSupply(id: number): Promise<Supply> {
  return apiRequest<Supply>({ section: SECTION, path: `/supplies/${id}` })
}

/** POST /api/warehouse/requests/:id/approve */
export function approveRequest(requestId: number): Promise<unknown> {
  return apiRequest({ section: SECTION, path: `/requests/${requestId}/approve`, method: 'POST' })
}

/** POST /api/warehouse/requests/:id/reject */
export function rejectRequest(requestId: number): Promise<unknown> {
  return apiRequest({ section: SECTION, path: `/requests/${requestId}/reject`, method: 'POST' })
}

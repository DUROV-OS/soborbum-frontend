import { apiRequest } from '@/shared/lib/httpClient'
import { PriceTier, Supplier } from './types'

// Раздел «Поставщики» смонтирован на бэке под /api/warehouse.
const SECTION = 'warehouse'

export interface SupplierContactInput {
  kind: string
  value: string
  person?: string | null
}

export interface SupplierCreateInput {
  name: string
  categories?: string[]
  status?: string
  contacts?: SupplierContactInput[]
}

export type SupplierUpdateInput = Partial<SupplierCreateInput>

export interface PriceItemInput {
  material: string
  category?: string | null
  tiers: PriceTier[]
  lead_time?: string | null
  round?: number | null
}

/** GET /api/warehouse/suppliers */
export function listSuppliers(): Promise<Supplier[]> {
  return apiRequest<Supplier[]>({ section: SECTION, path: '/suppliers' })
}

/** POST /api/warehouse/suppliers */
export function createSupplier(input: SupplierCreateInput): Promise<Supplier> {
  return apiRequest<Supplier>({ section: SECTION, path: '/suppliers', method: 'POST', body: input })
}

/** PATCH /api/warehouse/suppliers/:id */
export function updateSupplier(id: number, patch: SupplierUpdateInput): Promise<Supplier> {
  return apiRequest<Supplier>({ section: SECTION, path: `/suppliers/${id}`, method: 'PATCH', body: patch })
}

/** DELETE /api/warehouse/suppliers/:id */
export function deleteSupplier(id: number): Promise<void> {
  return apiRequest<void>({ section: SECTION, path: `/suppliers/${id}`, method: 'DELETE' })
}

/** POST /api/warehouse/suppliers/:id/price-items — возвращает поставщика целиком */
export function addPriceItem(id: number, input: PriceItemInput): Promise<Supplier> {
  return apiRequest<Supplier>({
    section: SECTION,
    path: `/suppliers/${id}/price-items`,
    method: 'POST',
    body: input,
  })
}

/** PATCH /api/warehouse/suppliers/:id/price-items/:itemId */
export function updatePriceItem(
  id: number,
  itemId: number,
  patch: Partial<PriceItemInput>,
): Promise<Supplier> {
  return apiRequest<Supplier>({
    section: SECTION,
    path: `/suppliers/${id}/price-items/${itemId}`,
    method: 'PATCH',
    body: patch,
  })
}

/** DELETE /api/warehouse/suppliers/:id/price-items/:itemId */
export function deletePriceItem(id: number, itemId: number): Promise<void> {
  return apiRequest<void>({
    section: SECTION,
    path: `/suppliers/${id}/price-items/${itemId}`,
    method: 'DELETE',
  })
}

/** POST /api/warehouse/suppliers/:id/link-max-chat */
export function linkMaxChat(id: number, chatId: number): Promise<Supplier> {
  return apiRequest<Supplier>({
    section: SECTION,
    path: `/suppliers/${id}/link-max-chat`,
    method: 'POST',
    body: { chat_id: chatId },
  })
}

/** DELETE /api/warehouse/suppliers/:id/link-max-chat */
export function unlinkMaxChat(id: number): Promise<Supplier> {
  return apiRequest<Supplier>({
    section: SECTION,
    path: `/suppliers/${id}/link-max-chat`,
    method: 'DELETE',
  })
}

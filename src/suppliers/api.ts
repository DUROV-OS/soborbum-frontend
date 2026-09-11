import { apiRequest } from '@/shared/lib/httpClient'
import {
  AiFillCategoryResult,
  LeadTimeQuestionDraft,
  PriceListImportResult,
  PriceTier,
  Supplier,
} from './types'

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

/** POST /api/warehouse/suppliers/:id/price-items/import — таблица xlsx/csv */
export function importPriceList(id: number, file: File): Promise<PriceListImportResult> {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<PriceListImportResult>({
    section: SECTION,
    path: `/suppliers/${id}/price-items/import`,
    method: 'POST',
    form,
  })
}

/** POST /api/warehouse/suppliers/:id/notes */
export function addNote(id: number, text: string): Promise<Supplier> {
  return apiRequest<Supplier>({ section: SECTION, path: `/suppliers/${id}/notes`, method: 'POST', body: { text } })
}

/** DELETE /api/warehouse/suppliers/:id/notes/:noteId */
export function deleteNote(id: number, noteId: number): Promise<Supplier> {
  return apiRequest<Supplier>({
    section: SECTION,
    path: `/suppliers/${id}/notes/${noteId}`,
    method: 'DELETE',
  })
}

/** POST /api/warehouse/suppliers/:id/price-items/ai-fill-category */
export function aiFillCategory(id: number): Promise<AiFillCategoryResult> {
  return apiRequest<AiFillCategoryResult>({
    section: SECTION,
    path: `/suppliers/${id}/price-items/ai-fill-category`,
    method: 'POST',
  })
}

/** POST /api/warehouse/suppliers/:id/price-items/lead-time-question/draft */
export function draftLeadTimeQuestion(id: number): Promise<LeadTimeQuestionDraft> {
  return apiRequest<LeadTimeQuestionDraft>({
    section: SECTION,
    path: `/suppliers/${id}/price-items/lead-time-question/draft`,
    method: 'POST',
  })
}

/** POST /api/warehouse/suppliers/:id/price-items/lead-time-question/send */
export function sendLeadTimeQuestion(id: number, message: string): Promise<{ sent: boolean; chat_id: number }> {
  return apiRequest<{ sent: boolean; chat_id: number }>({
    section: SECTION,
    path: `/suppliers/${id}/price-items/lead-time-question/send`,
    method: 'POST',
    body: { message },
  })
}

/** POST /api/warehouse/suppliers/:id/price-items/backfill-task */
export function createBackfillTask(id: number, missingFields: string[]): Promise<{ task_id: number; supplier: Supplier }> {
  return apiRequest<{ task_id: number; supplier: Supplier }>({
    section: SECTION,
    path: `/suppliers/${id}/price-items/backfill-task`,
    method: 'POST',
    body: { missing_fields: missingFields },
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

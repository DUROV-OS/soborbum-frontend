import { generateId, nowIso, withLatency } from '@/shared/lib/mockApi'
import { loadState, saveState } from '@/shared/lib/storage'
import {
  registerSyncResolver,
  requestCloseSyncedTask,
  requestSyncTask,
} from '@/shared/lib/taskSync'
import { SEED_MATERIALS, SEED_MOVEMENTS, SEED_REQUEST_LINES } from './mock'
import { needsSupply } from './rules'
import { Material, MaterialRequestLine, MovementKind, StockMovement } from './types'

const MATERIALS_KEY = 'soborbum.warehouse.materials'
const LINES_KEY = 'soborbum.warehouse.requestLines'
const MOVEMENTS_KEY = 'soborbum.warehouse.movements'
const ALERTS_KEY = 'soborbum.warehouse.openAlerts'

let materials: Material[] = loadState(MATERIALS_KEY, SEED_MATERIALS)
let lines: MaterialRequestLine[] = loadState(LINES_KEY, SEED_REQUEST_LINES)
let movements: StockMovement[] = loadState(MOVEMENTS_KEY, SEED_MOVEMENTS)
const openAlerts = new Set<string>(loadState<string[]>(ALERTS_KEY, []))

function persist() {
  saveState(MATERIALS_KEY, materials)
  saveState(LINES_KEY, lines)
  saveState(MOVEMENTS_KEY, movements)
  saveState(ALERTS_KEY, [...openAlerts])
}

/** Заявка «заказать дефицитный материал» открывается/закрывается по факту дефицита. */
function syncSupplyAlert(material: Material) {
  const deficit = needsSupply(material, lines)
  const wasOpen = openAlerts.has(material.id)
  if (deficit && !wasOpen) {
    openAlerts.add(material.id)
    requestSyncTask({
      source: 'warehouse',
      sourceRefId: `reorder:${material.id}`,
      title: `Дефицит материала: ${material.title}`,
      description: 'Остаток на складе с учётом открытых заявок ниже порога — нужно заказать поставку.',
      assigneeAccessSection: 'warehouse',
    })
  } else if (!deficit && wasOpen) {
    openAlerts.delete(material.id)
    requestCloseSyncedTask('warehouse', `reorder:${material.id}`)
  }
}

function findMaterial(id: string): Material {
  const material = materials.find((m) => m.id === id)
  if (!material) throw new Error('Материал не найден')
  return material
}

function findLine(id: string): MaterialRequestLine {
  const line = lines.find((l) => l.id === id)
  if (!line) throw new Error('Заявка не найдена')
  return line
}

function record(materialId: string, kind: MovementKind, qty: number, note: string) {
  movements = [
    { id: generateId('mv'), materialId, kind, qty, note, createdAt: nowIso() },
    ...movements,
  ]
}

/** GET /api/warehouse/materials */
export function listMaterials(): Promise<Material[]> {
  return withLatency([...materials])
}

/** GET /api/warehouse/request-lines */
export function listRequestLines(): Promise<MaterialRequestLine[]> {
  return withLatency([...lines])
}

/** GET /api/warehouse/request-lines?moduleId=:id */
export function listRequestLinesByModule(moduleId: string): MaterialRequestLine[] {
  return lines.filter((l) => l.moduleId === moduleId)
}

/** GET /api/warehouse/movements */
export function listMovements(materialId?: string): Promise<StockMovement[]> {
  const data = materialId ? movements.filter((m) => m.materialId === materialId) : movements
  return withLatency([...data])
}

/** POST /api/warehouse/materials */
export function createMaterial(input: Omit<Material, 'id'>): Promise<Material> {
  const material: Material = { ...input, id: generateId('mat') }
  materials = [...materials, material]
  persist()
  return withLatency(material)
}

/** PATCH /api/warehouse/materials/:id/threshold */
export function updateThreshold(materialId: string, threshold: number): Promise<Material> {
  const material = findMaterial(materialId)
  material.threshold = threshold
  syncSupplyAlert(material)
  persist()
  return withLatency(material)
}

/** POST /api/warehouse/request-lines (создаётся производством при заведении модуля) */
export function declareModuleNeed(
  moduleId: string,
  moduleLabel: string,
  materialId: string,
  qty: number,
): MaterialRequestLine {
  let line = lines.find((l) => l.moduleId === moduleId && l.materialId === materialId)
  if (!line) {
    line = {
      id: generateId('req'),
      materialId,
      moduleId,
      moduleLabel,
      neededQty: 0,
      requestedQty: 0,
      providedQty: 0,
      createdAt: nowIso(),
    }
    lines = [...lines, line]
  }
  line.neededQty += qty
  persist()
  return line
}

/** PATCH /api/warehouse/request-lines/:id/needed */
export function updateNeeded(lineId: string, neededQty: number): MaterialRequestLine {
  const line = findLine(lineId)
  line.neededQty = neededQty
  persist()
  return line
}

/** POST /api/warehouse/request-lines/:id/request (производство запрашивает со склада) */
export function requestFromLine(lineId: string, qty: number): { ok: boolean; reason?: string } {
  const line = findLine(lineId)
  if (qty <= 0 || qty > line.neededQty) return { ok: false, reason: 'Некорректное количество' }
  const wasPending = line.requestedQty > 0
  line.neededQty -= qty
  line.requestedQty += qty
  const material = findMaterial(line.materialId)
  syncSupplyAlert(material)
  if (!wasPending) {
    requestSyncTask({
      source: 'warehouse',
      sourceRefId: `review:${line.id}`,
      title: `Проверить заявку: ${material.title} — ${line.moduleLabel}`,
      description: 'Одобрить или отклонить запрошенное количество материала.',
      assigneeAccessSection: 'warehouse',
    })
  }
  persist()
  return { ok: true }
}

/** POST /api/warehouse/request-lines/:id/approve */
export function approveRequest(lineId: string, qty: number): { ok: boolean; reason?: string } {
  const line = findLine(lineId)
  const material = findMaterial(line.materialId)
  if (qty <= 0 || qty > line.requestedQty) return { ok: false, reason: 'Некорректное количество' }
  if (qty > material.inStock) return { ok: false, reason: 'На складе недостаточно материала' }
  line.requestedQty -= qty
  line.providedQty += qty
  material.inStock -= qty
  record(material.id, 'issue', -qty, `Выдано на ${line.moduleLabel}`)
  syncSupplyAlert(material)
  if (line.requestedQty === 0) requestCloseSyncedTask('warehouse', `review:${line.id}`)
  persist()
  return { ok: true }
}

/** POST /api/warehouse/request-lines/:id/reject */
export function rejectRequest(lineId: string, qty: number): { ok: boolean; reason?: string } {
  const line = findLine(lineId)
  if (qty <= 0 || qty > line.requestedQty) return { ok: false, reason: 'Некорректное количество' }
  line.requestedQty -= qty
  line.neededQty += qty
  if (line.requestedQty === 0) requestCloseSyncedTask('warehouse', `review:${line.id}`)
  persist()
  return { ok: true }
}

/** POST /api/warehouse/materials/:id/supply */
export function addSupply(materialId: string, qty: number, note: string): Material {
  const material = findMaterial(materialId)
  material.inStock += qty
  record(materialId, 'supply', qty, note || 'Ручное добавление поставки')
  syncSupplyAlert(material)
  persist()
  return material
}

export interface BulkSupplyRow {
  inventoryNumber: string
  title: string
  qty: number
}

export interface BulkSupplyResult {
  applied: { material: Material; qty: number }[]
  unmatched: BulkSupplyRow[]
}

/** POST /api/warehouse/supplies/import (excel) */
export function applyBulkSupply(rows: BulkSupplyRow[], note: string): BulkSupplyResult {
  const applied: BulkSupplyResult['applied'] = []
  const unmatched: BulkSupplyRow[] = []

  for (const row of rows) {
    const material = materials.find((m) => m.inventoryNumber === row.inventoryNumber)
    if (!material) {
      unmatched.push(row)
      continue
    }
    material.inStock += row.qty
    record(material.id, 'supply', row.qty, note || 'Поставка из Excel-файла')
    syncSupplyAlert(material)
    applied.push({ material, qty: row.qty })
  }
  persist()
  return { applied, unmatched }
}

registerSyncResolver('warehouse', (sourceRefId) => {
  if (sourceRefId.startsWith('review:')) {
    const line = lines.find((l) => l.id === sourceRefId.slice('review:'.length))
    if (!line) return { ok: true }
    return line.requestedQty === 0
      ? { ok: true }
      : { ok: false, reason: 'Заявка ещё не одобрена/отклонена на складе' }
  }
  if (sourceRefId.startsWith('reorder:')) {
    const material = materials.find((m) => m.id === sourceRefId.slice('reorder:'.length))
    if (!material) return { ok: true }
    return !needsSupply(material, lines)
      ? { ok: true }
      : { ok: false, reason: 'Остаток по материалу всё ещё ниже порога' }
  }
  return { ok: true }
})

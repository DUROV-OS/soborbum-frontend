export type MaterialRequestStatus = 'pending' | 'approved' | 'rejected'

export interface MaterialRequest {
  id: number
  module_material_id: number
  warehouse_material_id: number
  quantity: number
  status: MaterialRequestStatus
  requested_by_id: number
  decided_by_id: number | null
  created_at: string
  decided_at: string | null
}

export interface ModuleMaterial {
  id: number
  module_id: number
  warehouse_material_id: number
  inventory_number: string
  unit: string
  quantity_required: number
  quantity_requested: number
  quantity_provided: number
  requests: MaterialRequest[]
}

export interface Module {
  id: number
  production_id: number
  name: string
  description: string | null
  materials: ModuleMaterial[]
}

export interface Production {
  id: number
  cycle_id: number
  /** Порядковый номер дома в цикле (1 для одиночного заказа). */
  house_index: number
  /** Название проекта дома, напр. «Дом 1». */
  name: string
  created_at: string
  modules: Module[]
}

/** Строка списка /api/production/ — по одной на каждый дом (множественный
 * заказ даёт несколько строк на цикл). Данные клиента не отдаются: списку
 * достаточно права production. */
export interface ProductionListItem {
  id: number
  cycle_id: number
  /** Порядковый номер дома в цикле (1 для одиночного заказа). */
  house_index: number
  /** Название проекта дома, напр. «Дом 1». */
  name: string
  cycle_status: 'client' | 'production' | 'installation' | 'completed'
  created_at: string
  module_count: number
}

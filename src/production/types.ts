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
  created_at: string
  modules: Module[]
}

/** Минимальная форма /api/cycles/ — единственный способ узнать, какие
 * производства вообще существуют (в production/ нет своего списочного
 * эндпоинта). */
export interface CycleWithProduction {
  id: number
  client: { full_name: string } | null
  production: Production | null
}

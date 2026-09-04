import { apiRequest } from '@/shared/lib/httpClient'
import { CycleWithProduction, MaterialRequest, Module, ModuleMaterial, Production } from './types'

const SECTION = 'production'

/** GET /api/cycles/ (используется только для перечисления производств) */
export function listCyclesWithProduction(): Promise<CycleWithProduction[]> {
  return apiRequest<CycleWithProduction[]>({ section: 'cycles', path: '/' })
}

/** GET /api/production/:id */
export function getProduction(id: number): Promise<Production> {
  return apiRequest<Production>({ section: SECTION, path: `/${id}` })
}

/** POST /api/production/:id/modules */
export function createModule(productionId: number, name: string, description?: string): Promise<Module> {
  return apiRequest<Module>({
    section: SECTION,
    path: `/${productionId}/modules`,
    method: 'POST',
    body: { name, description },
  })
}

/** GET /api/production/modules/:id */
export function getModule(id: number): Promise<Module> {
  return apiRequest<Module>({ section: SECTION, path: `/modules/${id}` })
}

/** PATCH /api/production/modules/:id */
export function updateModule(id: number, patch: { name?: string; description?: string }): Promise<Module> {
  return apiRequest<Module>({ section: SECTION, path: `/modules/${id}`, method: 'PATCH', body: patch })
}

export interface AddModuleMaterialInput {
  warehouse_material_id: number
  inventory_number: string
  unit: string
  quantity_required: number
}

/** POST /api/production/modules/:id/materials */
export function addModuleMaterial(moduleId: number, input: AddModuleMaterialInput): Promise<ModuleMaterial> {
  return apiRequest<ModuleMaterial>({
    section: SECTION,
    path: `/modules/${moduleId}/materials`,
    method: 'POST',
    body: input,
  })
}

/** PATCH /api/production/module-materials/:id */
export function updateModuleMaterial(id: number, quantityRequired: number): Promise<ModuleMaterial> {
  return apiRequest<ModuleMaterial>({
    section: SECTION,
    path: `/module-materials/${id}`,
    method: 'PATCH',
    body: { quantity_required: quantityRequired },
  })
}

/** POST /api/production/module-materials/:id/request */
export function requestMaterial(moduleMaterialId: number, quantity: number): Promise<MaterialRequest> {
  return apiRequest<MaterialRequest>({
    section: SECTION,
    path: `/module-materials/${moduleMaterialId}/request`,
    method: 'POST',
    body: { quantity },
  })
}

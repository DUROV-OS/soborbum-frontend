import { Material, MaterialRequestLine } from './types'

export function totalRequestedFor(material: Material, lines: MaterialRequestLine[]): number {
  return lines
    .filter((line) => line.materialId === material.id)
    .reduce((sum, line) => sum + line.requestedQty, 0)
}

export function needsSupply(material: Material, lines: MaterialRequestLine[]): boolean {
  return material.inStock - totalRequestedFor(material, lines) < material.threshold
}

export function requestBreakdown(material: Material, lines: MaterialRequestLine[]) {
  return lines
    .filter((line) => line.materialId === material.id && line.requestedQty > 0)
    .map((line) => ({ moduleLabel: line.moduleLabel, qty: line.requestedQty }))
}

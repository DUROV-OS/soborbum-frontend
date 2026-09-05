import { BoardNode } from '../types'

export interface BoardIndexes {
  byId: Map<number, BoardNode>
  parentOf: Map<number, number | null>
}

export function findNode(root: BoardNode, id: number): BoardNode | null {
  if (root.id === id) return root
  for (const child of root.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export function flattenTree(root: BoardNode): BoardNode[] {
  const nodes = [root]
  for (const child of root.children) nodes.push(...flattenTree(child))
  return nodes
}

export function buildIndexes(root: BoardNode): BoardIndexes {
  const byId = new Map<number, BoardNode>()
  const parentOf = new Map<number, number | null>()
  for (const node of flattenTree(root)) {
    byId.set(node.id, node)
    for (const child of node.children) parentOf.set(child.id, node.id)
  }
  parentOf.set(root.id, null)
  return { byId, parentOf }
}

/** Стабильный ключ ребра родитель-потомок, не зависящий от порядка аргументов. */
export function edgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

/** Делит направления 1-го уровня пополам — первая половина рисуется над durov.house, вторая под ним. */
export function splitDirections<T>(directions: T[]): { upper: T[]; lower: T[] } {
  const mid = Math.ceil(directions.length / 2)
  return { upper: directions.slice(0, mid), lower: directions.slice(mid) }
}

export type TourStep = { edges: string[] } | { nodes: number[] }

/**
 * Порядок «экскурсии» по дереву при применении решения совета:
 * 1. исходная нода;
 * 2. её потомки вниз, уровень за уровнем (сначала рёбра до уровня, потом сами ноды);
 * 3. путь вверх от исходной ноды до корня (рёбра и ноды по очереди);
 * 4. все рёбра и ноды 1-го уровня;
 * 5. все рёбра и ноды 2-го уровня.
 * Одна и та же нода/ребро может подсветиться повторно в разных фазах — это
 * финальный «обзорный» проход, а не карта того, что реально изменилось
 * (за это отвечают всплывающие подсказки после экскурсии).
 */
export function buildTourSteps(indexes: BoardIndexes, originId: number, rootId: number): TourStep[] {
  const steps: TourStep[] = []
  const origin = indexes.byId.get(originId)
  if (!origin) return steps

  steps.push({ nodes: [originId] })

  let level = [origin]
  while (level.some((n) => n.children.length > 0)) {
    const edges: string[] = []
    const nextLevel: BoardNode[] = []
    for (const node of level) {
      for (const child of node.children) {
        edges.push(edgeKey(node.id, child.id))
        nextLevel.push(child)
      }
    }
    if (edges.length === 0) break
    steps.push({ edges })
    steps.push({ nodes: nextLevel.map((n) => n.id) })
    level = nextLevel
  }

  if (originId !== rootId) {
    let currentId = originId
    let parentId = indexes.parentOf.get(currentId) ?? null
    while (parentId !== null) {
      steps.push({ edges: [edgeKey(currentId, parentId)] })
      steps.push({ nodes: [parentId] })
      currentId = parentId
      parentId = indexes.parentOf.get(currentId) ?? null
    }
  }

  const root = indexes.byId.get(rootId)
  if (root) {
    const level1Edges = root.children.map((d) => edgeKey(root.id, d.id))
    if (level1Edges.length) steps.push({ edges: level1Edges })
    const level1Ids = root.children.map((d) => d.id)
    if (level1Ids.length) steps.push({ nodes: level1Ids })

    const level2Edges: string[] = []
    const level2Ids: number[] = []
    for (const direction of root.children) {
      for (const child of direction.children) {
        level2Edges.push(edgeKey(direction.id, child.id))
        level2Ids.push(child.id)
      }
    }
    if (level2Edges.length) steps.push({ edges: level2Edges })
    if (level2Ids.length) steps.push({ nodes: level2Ids })
  }

  return steps
}

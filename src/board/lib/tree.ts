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

function ancestorsChain(indexes: BoardIndexes, id: number): number[] {
  const chain: number[] = []
  let cur: number | null | undefined = id
  while (cur !== null && cur !== undefined) {
    chain.push(cur)
    cur = indexes.parentOf.get(cur) ?? null
  }
  return chain
}

/**
 * Путь между двумя нодами через их общего предка (для анимации «перехода»
 * ячейка-ячейка): [from, ...вверх до LCA..., ...вниз до to]. null, если
 * одна из нод не найдена в индексах (например, только что удалена).
 */
export function pathBetween(indexes: BoardIndexes, fromId: number, toId: number): number[] | null {
  if (!indexes.byId.has(fromId) || !indexes.byId.has(toId)) return null
  const fromChain = ancestorsChain(indexes, fromId)
  const toChain = ancestorsChain(indexes, toId)
  const toSet = new Set(toChain)
  const lcaIndex = fromChain.findIndex((id) => toSet.has(id))
  if (lcaIndex === -1) return null
  const lca = fromChain[lcaIndex]
  const upPart = fromChain.slice(0, lcaIndex + 1)
  const downPart = toChain.slice(0, toChain.indexOf(lca)).reverse()
  return [...upPart, ...downPart]
}

export function edgeKeysAlongPath(path: number[]): string[] {
  const keys: string[] = []
  for (let i = 0; i < path.length - 1; i++) keys.push(edgeKey(path[i], path[i + 1]))
  return keys
}

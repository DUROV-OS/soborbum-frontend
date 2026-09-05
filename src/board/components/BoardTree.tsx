import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { edgeKey, splitInHalf } from '../lib/tree'
import { useBoardStore } from '../store'
import { BoardNode } from '../types'
import { BoardNodeCard } from './BoardNodeCard'

const NODE_WIDTH = 208
const CORNER_RADIUS = 14
/** Промежуток между левой и правой колонкой поднаправлений — в нём проходит общий «ствол» от направления. */
const TRUNK_GAP = 44
/** Ширина ряда из двух колонок поднаправлений — она же ширина группы «направление + колонки»,
 * по которой группы направлений равномерно распределяются в общем ряду. */
const CHILDREN_ROW_WIDTH = NODE_WIDTH * 2 + TRUNK_GAP

interface Point {
  x: number
  y: number
}

function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y }
}

function magnitude(p: Point): number {
  return Math.hypot(p.x, p.y) || 1
}

function normalize(p: Point): Point {
  const m = magnitude(p)
  return { x: p.x / m, y: p.y / m }
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y }
}

function scale(p: Point, s: number): Point {
  return { x: p.x * s, y: p.y * s }
}

/** Строит путь-«ломаную» со скруглёнными углами через заданные точки. */
function roundedPath(points: Point[], radius: number): string {
  if (points.length < 2) return ''
  const d: string[] = [`M ${points[0].x} ${points[0].y}`]
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]
    const r = Math.min(radius, magnitude(sub(prev, curr)) / 2, magnitude(sub(next, curr)) / 2)
    const start = add(curr, scale(normalize(sub(prev, curr)), r))
    const end = add(curr, scale(normalize(sub(next, curr)), r))
    d.push(`L ${start.x} ${start.y}`, `Q ${curr.x} ${curr.y} ${end.x} ${end.y}`)
  }
  const last = points[points.length - 1]
  d.push(`L ${last.x} ${last.y}`)
  return d.join(' ')
}

interface NodeCardListProps {
  nodes: BoardNode[]
  activeNodeIds: Set<number>
  popoverNodeId: number | null
  setNodeRef: (id: number) => (el: HTMLButtonElement | null) => void
  openPopover: (id: number) => void
}

function NodeColumn({ nodes, activeNodeIds, popoverNodeId, setNodeRef, openPopover }: NodeCardListProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2" style={{ width: NODE_WIDTH }}>
      {nodes.map((node) => (
        <BoardNodeCard
          key={node.id}
          ref={setNodeRef(node.id)}
          node={node}
          active={activeNodeIds.has(node.id)}
          selected={popoverNodeId === node.id}
          onClick={() => openPopover(node.id)}
        />
      ))}
    </div>
  )
}

/** Группа «направление + две колонки поднаправлений слева и справа от него» — рендерится и над,
 * и под корнем; порядок блоков внутри группы (и то, с какой стороны идёт всё) зависит от стороны. */
function DirectionGroup({
  direction,
  side,
  activeNodeIds,
  popoverNodeId,
  setNodeRef,
  openPopover,
}: {
  direction: BoardNode
  side: 'upper' | 'lower'
  activeNodeIds: Set<number>
  popoverNodeId: number | null
  setNodeRef: (id: number) => (el: HTMLButtonElement | null) => void
  openPopover: (id: number) => void
}) {
  const directionCard = (
    <div style={{ width: NODE_WIDTH }}>
      <BoardNodeCard
        ref={setNodeRef(direction.id)}
        node={direction}
        active={activeNodeIds.has(direction.id)}
        selected={popoverNodeId === direction.id}
        onClick={() => openPopover(direction.id)}
      />
    </div>
  )

  const { first: left, second: right } = splitInHalf(direction.children)
  const columns = direction.children.length > 0 && (
    <div
      className={`flex justify-between ${side === 'lower' ? 'mt-6' : 'mb-6'}`}
      style={{ width: CHILDREN_ROW_WIDTH }}
    >
      <NodeColumn
        nodes={left}
        activeNodeIds={activeNodeIds}
        popoverNodeId={popoverNodeId}
        setNodeRef={setNodeRef}
        openPopover={openPopover}
      />
      <NodeColumn
        nodes={right}
        activeNodeIds={activeNodeIds}
        popoverNodeId={popoverNodeId}
        setNodeRef={setNodeRef}
        openPopover={openPopover}
      />
    </div>
  )

  return (
    <div
      className={`relative flex flex-col items-center ${side === 'upper' ? 'justify-end' : 'justify-start'}`}
      style={{ width: CHILDREN_ROW_WIDTH }}
    >
      {side === 'lower' ? (
        <>
          {directionCard}
          {columns}
        </>
      ) : (
        <>
          {columns}
          {directionCard}
        </>
      )}
    </div>
  )
}

export function BoardTree() {
  const tree = useBoardStore((s) => s.tree)
  const loading = useBoardStore((s) => s.loading)
  const error = useBoardStore((s) => s.error)
  const loadTree = useBoardStore((s) => s.loadTree)
  const activeNodeIds = useBoardStore((s) => s.activeNodeIds)
  const noteNodeId = useBoardStore((s) => s.noteNodeId)
  const activeNote = useBoardStore((s) => s.activeNote)
  const activeEdgeKeys = useBoardStore((s) => s.activeEdgeKeys)
  const popoverNodeId = useBoardStore((s) => s.popoverNodeId)
  const openPopover = useBoardStore((s) => s.openPopover)

  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef(new Map<number, HTMLButtonElement>())
  const [paths, setPaths] = useState<Map<string, string>>(new Map())
  const [nodeRects, setNodeRects] = useState<Map<number, { bottom: number; centerX: number }>>(new Map())
  const [contentWidth, setContentWidth] = useState(0)

  useEffect(() => {
    loadTree()
  }, [loadTree])

  const setNodeRef = useCallback(
    (id: number) => (el: HTMLButtonElement | null) => {
      if (el) nodeRefs.current.set(id, el)
      else nodeRefs.current.delete(id)
    },
    [],
  )

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container || !tree) return
    const containerRect = container.getBoundingClientRect()

    const rectOf = (id: number) => {
      const el = nodeRefs.current.get(id)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        left: r.left - containerRect.left,
        right: r.right - containerRect.left,
        top: r.top - containerRect.top,
        bottom: r.bottom - containerRect.top,
        centerX: r.left - containerRect.left + r.width / 2,
        centerY: r.top - containerRect.top + r.height / 2,
      }
    }

    const next = new Map<string, string>()
    const rects = new Map<number, { bottom: number; centerX: number }>()
    const rootRect = rectOf(tree.id)

    const processDirection = (direction: BoardNode, side: 'upper' | 'lower') => {
      if (!rootRect) return
      const dirRect = rectOf(direction.id)
      if (!dirRect) return
      rects.set(direction.id, { bottom: dirRect.bottom, centerX: dirRect.centerX })

      const rootAnchorY = side === 'lower' ? rootRect.bottom : rootRect.top
      const dirNearRootY = side === 'lower' ? dirRect.top : dirRect.bottom
      const dirNearChildrenY = side === 'lower' ? dirRect.bottom : dirRect.top
      const midY =
        side === 'lower'
          ? rootRect.bottom + (dirRect.top - rootRect.bottom) / 2
          : dirRect.bottom + (rootRect.top - dirRect.bottom) / 2

      next.set(
        edgeKey(tree.id, direction.id),
        roundedPath(
          [
            { x: rootRect.centerX, y: rootAnchorY },
            { x: rootRect.centerX, y: midY },
            { x: dirRect.centerX, y: midY },
            { x: dirRect.centerX, y: dirNearRootY },
          ],
          CORNER_RADIUS,
        ),
      )

      const { first: left, second: right } = splitInHalf(direction.children)
      for (const child of left) {
        const childRect = rectOf(child.id)
        if (!childRect) continue
        rects.set(child.id, { bottom: childRect.bottom, centerX: childRect.centerX })
        next.set(
          edgeKey(direction.id, child.id),
          roundedPath(
            [
              { x: dirRect.centerX, y: dirNearChildrenY },
              { x: dirRect.centerX, y: childRect.centerY },
              { x: childRect.right, y: childRect.centerY },
            ],
            CORNER_RADIUS,
          ),
        )
      }
      for (const child of right) {
        const childRect = rectOf(child.id)
        if (!childRect) continue
        rects.set(child.id, { bottom: childRect.bottom, centerX: childRect.centerX })
        next.set(
          edgeKey(direction.id, child.id),
          roundedPath(
            [
              { x: dirRect.centerX, y: dirNearChildrenY },
              { x: dirRect.centerX, y: childRect.centerY },
              { x: childRect.left, y: childRect.centerY },
            ],
            CORNER_RADIUS,
          ),
        )
      }
    }

    if (rootRect) {
      rects.set(tree.id, { bottom: rootRect.bottom, centerX: rootRect.centerX })
      const { first: upper, second: lower } = splitInHalf(tree.children)
      lower.forEach((direction) => processDirection(direction, 'lower'))
      upper.forEach((direction) => processDirection(direction, 'upper'))
    }

    setPaths(next)
    setNodeRects(rects)
    setContentWidth(container.scrollWidth)
  }, [tree])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => measure())
    observer.observe(container)
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure).catch(() => {})
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  if (loading && !tree) return <LoadingState label="Загружаем дерево стратегических направлений…" />
  if (error) return <EmptyState title="Не удалось загрузить дерево" description={error} />
  if (!tree) return null

  const { first: upper, second: lower } = splitInHalf(tree.children)
  const noteRect = noteNodeId !== null ? nodeRects.get(noteNodeId) : undefined
  const noteHalfWidth = 130
  const noteLeft = noteRect
    ? Math.min(Math.max(noteRect.centerX, noteHalfWidth), Math.max(contentWidth - noteHalfWidth, noteHalfWidth))
    : 0

  return (
    <div ref={containerRef} className="relative overflow-x-auto pb-8">
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {Array.from(paths.entries()).map(([key, d]) => (
          <path
            key={key}
            d={d}
            fill="none"
            stroke={activeEdgeKeys.has(key) ? 'rgb(var(--brand))' : 'rgb(var(--border))'}
            strokeWidth={activeEdgeKeys.has(key) ? 2.5 : 1.5}
            strokeLinecap="round"
            className="transition-[stroke,stroke-width] duration-200"
          />
        ))}
      </svg>

      <div className="relative flex min-w-max flex-col items-center gap-10 px-6 py-6">
        {upper.length > 0 && (
          <div className="flex w-full justify-center gap-x-10">
            {upper.map((direction) => (
              <DirectionGroup
                key={direction.id}
                direction={direction}
                side="upper"
                activeNodeIds={activeNodeIds}
                popoverNodeId={popoverNodeId}
                setNodeRef={setNodeRef}
                openPopover={openPopover}
              />
            ))}
          </div>
        )}

        <div style={{ width: NODE_WIDTH }}>
          <BoardNodeCard
            ref={setNodeRef(tree.id)}
            node={tree}
            active={activeNodeIds.has(tree.id)}
            selected={popoverNodeId === tree.id}
            onClick={() => openPopover(tree.id)}
          />
        </div>

        <div className="flex w-full justify-center gap-x-10">
          {lower.map((direction) => (
            <DirectionGroup
              key={direction.id}
              direction={direction}
              side="lower"
              activeNodeIds={activeNodeIds}
              popoverNodeId={popoverNodeId}
              setNodeRef={setNodeRef}
              openPopover={openPopover}
            />
          ))}
        </div>
      </div>

      {noteRect && activeNote && (
        <div
          data-testid="board-node-note"
          className="absolute z-20 w-[260px] -translate-x-1/2 rounded-md border border-brand/40 bg-surface px-3 py-2 text-[12px] leading-snug text-ink shadow-lg"
          style={{ top: noteRect.bottom + 10, left: noteLeft }}
        >
          {activeNote}
        </div>
      )}
    </div>
  )
}

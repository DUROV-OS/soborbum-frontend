import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { edgeKey } from '../lib/tree'
import { useBoardStore } from '../store'
import { BoardNodeCard } from './BoardNodeCard'

const NODE_WIDTH = 208
const CORNER_RADIUS = 14
const STUB_GAP = 22
/** Группа «направление + его столбец поднаправлений» шире самой карточки направления,
 * чтобы столбец (сдвинутый влево так, чтобы его правый край входил в центр направления)
 * не вылезал за пределы своей flex-ячейки и не наезжал на соседние направления. */
const GROUP_WIDTH = NODE_WIDTH * 2 + STUB_GAP

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

export function BoardTree() {
  const tree = useBoardStore((s) => s.tree)
  const loading = useBoardStore((s) => s.loading)
  const error = useBoardStore((s) => s.error)
  const loadTree = useBoardStore((s) => s.loadTree)
  const activeNodeId = useBoardStore((s) => s.activeNodeId)
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
    if (rootRect) {
      rects.set(tree.id, { bottom: rootRect.bottom, centerX: rootRect.centerX })
      for (const direction of tree.children) {
        const dirRect = rectOf(direction.id)
        if (!dirRect) continue
        rects.set(direction.id, { bottom: dirRect.bottom, centerX: dirRect.centerX })
        const midY = rootRect.bottom + (dirRect.top - rootRect.bottom) / 2
        next.set(
          edgeKey(tree.id, direction.id),
          roundedPath(
            [
              { x: rootRect.centerX, y: rootRect.bottom },
              { x: rootRect.centerX, y: midY },
              { x: dirRect.centerX, y: midY },
              { x: dirRect.centerX, y: dirRect.top },
            ],
            CORNER_RADIUS,
          ),
        )

        for (const child of direction.children) {
          const childRect = rectOf(child.id)
          if (!childRect) continue
          rects.set(child.id, { bottom: childRect.bottom, centerX: childRect.centerX })
          next.set(
            edgeKey(direction.id, child.id),
            roundedPath(
              [
                { x: dirRect.centerX, y: dirRect.bottom },
                { x: dirRect.centerX, y: childRect.centerY },
                { x: childRect.right, y: childRect.centerY },
              ],
              CORNER_RADIUS,
            ),
          )
        }
      }
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

  const activeRect = activeNodeId !== null ? nodeRects.get(activeNodeId) : undefined
  const noteHalfWidth = 130
  const noteLeft = activeRect
    ? Math.min(Math.max(activeRect.centerX, noteHalfWidth), Math.max(contentWidth - noteHalfWidth, noteHalfWidth))
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

      <div className="relative flex min-w-max flex-col items-center gap-14 px-6 py-4">
        <div style={{ width: NODE_WIDTH }}>
          <BoardNodeCard
            ref={setNodeRef(tree.id)}
            node={tree}
            active={activeNodeId === tree.id}
            selected={popoverNodeId === tree.id}
            onClick={() => openPopover(tree.id)}
          />
        </div>

        <div className="flex w-full justify-center gap-x-10">
          {tree.children.map((direction) => (
            <div key={direction.id} className="relative flex flex-col items-end" style={{ width: GROUP_WIDTH }}>
              <div style={{ width: NODE_WIDTH }}>
                <BoardNodeCard
                  ref={setNodeRef(direction.id)}
                  node={direction}
                  active={activeNodeId === direction.id}
                  selected={popoverNodeId === direction.id}
                  onClick={() => openPopover(direction.id)}
                />
              </div>
              {direction.children.length > 0 && (
                <div
                  className="mt-10 flex flex-col gap-3"
                  style={{ width: NODE_WIDTH, marginRight: NODE_WIDTH / 2 + STUB_GAP }}
                >
                  {direction.children.map((child) => (
                    <BoardNodeCard
                      key={child.id}
                      ref={setNodeRef(child.id)}
                      node={child}
                      active={activeNodeId === child.id}
                      selected={popoverNodeId === child.id}
                      onClick={() => openPopover(child.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {activeRect && activeNote && (
        <div
          data-testid="board-node-note"
          className="absolute z-20 w-[260px] -translate-x-1/2 rounded-md border border-brand/40 bg-surface px-3 py-2 text-[12px] leading-snug text-ink shadow-lg"
          style={{ top: activeRect.bottom + 10, left: noteLeft }}
        >
          {activeNote}
        </div>
      )}
    </div>
  )
}

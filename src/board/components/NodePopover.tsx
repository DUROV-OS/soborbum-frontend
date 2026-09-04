import { useEffect } from 'react'
import { Chip, ChipTone } from '@/shared/ui/Chip'
import { Button } from '@/shared/ui/Button'
import { findNode } from '../lib/tree'
import { useBoardStore } from '../store'
import { BoardNodeColor } from '../types'

export const STATUS_LABEL: Record<BoardNodeColor, string> = {
  green: 'В порядке',
  yellow: 'Требует внимания',
  red: 'Критично',
}

const STATUS_TONE: Record<BoardNodeColor, ChipTone> = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
}

const POPOVER_WIDTH = 300

export function NodePopover() {
  const nodeId = useBoardStore((s) => s.popoverNodeId)
  const anchorRect = useBoardStore((s) => s.popoverAnchorRect)
  const tree = useBoardStore((s) => s.tree)
  const closePopover = useBoardStore((s) => s.closePopover)
  const openProposal = useBoardStore((s) => s.openProposal)

  useEffect(() => {
    if (nodeId === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closePopover()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nodeId, closePopover])

  if (nodeId === null || !anchorRect || !tree) return null
  const node = findNode(tree, nodeId)
  if (!node) return null

  const top = Math.min(anchorRect.bottom + 8, window.innerHeight - 220)
  const left = Math.min(Math.max(anchorRect.left, 12), window.innerWidth - POPOVER_WIDTH - 12)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={closePopover} aria-hidden />
      <div
        role="dialog"
        aria-label={node.title}
        className="fixed z-50 rounded-md border border-border bg-surface p-4 shadow-xl"
        style={{ top, left, width: POPOVER_WIDTH }}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[14px] font-medium text-ink">{node.title}</h3>
          <Chip tone={STATUS_TONE[node.color]}>{STATUS_LABEL[node.color]}</Chip>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          {node.description || 'Описание пока не заполнено.'}
        </p>
        <Button size="sm" className="mt-3 w-full" onClick={() => openProposal(node.id)}>
          Внести изменения
        </Button>
      </div>
    </>
  )
}

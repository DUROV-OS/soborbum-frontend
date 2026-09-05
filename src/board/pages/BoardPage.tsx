import { RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/auth/store'
import { Button } from '@/shared/ui/Button'
import { BoardTree } from '../components/BoardTree'
import { MobileWarningModal } from '../components/MobileWarningModal'
import { NodePopover } from '../components/NodePopover'
import { ProposalPanel } from '../components/ProposalPanel'
import { useBoardStore } from '../store'

export function BoardPage() {
  const current = useAuthStore((s) => s.current)
  const actualizing = useBoardStore((s) => s.actualizing)
  const animating = useBoardStore((s) => s.animating)
  const runActualize = useBoardStore((s) => s.runActualize)

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Совет директоров</h1>
          <p className="mt-1 text-[13px] text-muted">
            Стратегические направления компании: текущее положение дел и обсуждение изменений с ИИ-советом.
          </p>
        </div>
        {current?.role === 'admin' && (
          <Button
            variant="secondary"
            className="self-start"
            disabled={actualizing || animating}
            onClick={() => runActualize()}
          >
            <RefreshCw size={16} className={actualizing ? 'animate-spin' : ''} />
            Актуализировать по данным
          </Button>
        )}
      </div>

      <BoardTree />
      <NodePopover />
      <ProposalPanel />
      <MobileWarningModal />
    </div>
  )
}

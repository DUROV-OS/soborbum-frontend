import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Mic } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { useMeetingStore } from '../store'

function useElapsedSeconds(startedAt: number | null, running: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running || startedAt === null) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [running, startedAt])
  if (startedAt === null) return 0
  return Math.max(0, Math.floor((now - startedAt) / 1000))
}

function formatClock(total: number): string {
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, '0')
  const ss = (total % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

export function MeetingPanel() {
  const phase = useMeetingStore((s) => s.phase)
  const panelOpen = useMeetingStore((s) => s.panelOpen)
  const startedAt = useMeetingStore((s) => s.startedAt)
  const savedMeetingId = useMeetingStore((s) => s.savedMeetingId)
  const error = useMeetingStore((s) => s.error)
  const finish = useMeetingStore((s) => s.finish)
  const closePanel = useMeetingStore((s) => s.closePanel)
  const reset = useMeetingStore((s) => s.reset)

  const recording = phase === 'recording' || phase === 'finishing'
  const elapsed = useElapsedSeconds(startedAt, recording)

  if (!panelOpen) return null

  return (
    <Drawer
      open={panelOpen}
      onClose={closePanel}
      title="Совещание"
      subtitle="Марина слушает и записывает разговор"
      width="max-w-md"
      bodyClassName="flex-1 overflow-y-auto px-6 py-5 space-y-5"
    >
      {phase === 'starting' && (
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <Loader2 size={16} className="animate-spin" />
          Запрашиваем доступ к микрофону…
        </div>
      )}

      {recording && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 animate-pulse rounded-pill bg-red-500" />
            <span className="text-[14px] font-medium text-ink">Идёт запись</span>
            <span className="ml-auto tabular-nums text-[15px] text-muted">{formatClock(elapsed)}</span>
          </div>
          <p className="text-[13px] text-muted">
            Запись продолжается, даже если открыть другой раздел. Живой транскрипт и заметки
            Марины появятся в следующих шагах фичи.
          </p>
          <Button variant="danger" onClick={() => void finish()} disabled={phase === 'finishing'}>
            {phase === 'finishing' ? 'Сохраняем…' : 'Завершить'}
          </Button>
        </div>
      )}

      {phase === 'saved' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[14px] font-medium text-ink">
            <CheckCircle2 size={18} className="text-success" />
            Совещание сохранено
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              to={savedMeetingId ? `/meetings/${savedMeetingId}` : '/meetings'}
              onClick={reset}
              className="text-[13px] font-medium text-brand-dark hover:underline"
            >
              Открыть совещание
            </Link>
            <Link to="/meetings" onClick={reset} className="text-[13px] text-muted hover:underline">
              Прошлые совещания
            </Link>
          </div>
          <Button variant="ghost" onClick={reset}>
            Закрыть
          </Button>
        </div>
      )}

      {phase === 'idle' && !error && (
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <Mic size={16} />
          Режим совещания не запущен.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2.5 text-[13px] text-danger">
          {error}
        </div>
      )}
    </Drawer>
  )
}

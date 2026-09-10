import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Mic } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { TranscriptLine, useMeetingStore } from '../store'

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

const SPEAKER_CHOICES = ['Спикер 1', 'Спикер 2', 'Спикер 3', 'Спикер 4']

function speakerOptions(lines: TranscriptLine[]): string[] {
  const set = new Set<string>(SPEAKER_CHOICES)
  lines.forEach((line) => set.add(line.speaker))
  return [...set]
}

function LiveTranscript() {
  const transcript = useMeetingStore((s) => s.transcript)
  const interim = useMeetingStore((s) => s.interim)
  const speechNotice = useMeetingStore((s) => s.speechNotice)
  const setLineSpeaker = useMeetingStore((s) => s.setLineSpeaker)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [transcript.length, interim])

  if (speechNotice) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning-bg px-3 py-2.5 text-[13px] text-warning">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <span>{speechNotice}</span>
      </div>
    )
  }

  const options = speakerOptions(transcript)

  return (
    <div>
      <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted">Транскрипт</div>
      <div
        ref={scrollRef}
        className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-border bg-surface-muted/40 p-3"
      >
        {transcript.length === 0 && !interim && (
          <p className="text-[13px] text-muted">Начните говорить — реплики появятся здесь.</p>
        )}

        {transcript.map((line) => (
          <div key={line.localId} className="text-[13px]">
            <div className="flex items-center gap-1.5">
              <select
                value={line.speaker}
                onChange={(e) => setLineSpeaker(line.localId, e.target.value)}
                aria-label="Спикер реплики"
                className="rounded-sm border border-border bg-surface px-1 py-0.5 text-[11px] text-muted"
              >
                {options.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <span className="tabular-nums text-[11px] text-muted">
                {formatClock(Math.floor(line.atMs / 1000))}
              </span>
            </div>
            <p className="mt-0.5 text-ink">{line.text}</p>
          </div>
        ))}

        {interim && <p className="text-[13px] italic text-muted">{interim}</p>}
      </div>
    </div>
  )
}

export function MeetingPanel() {
  const phase = useMeetingStore((s) => s.phase)
  const panelOpen = useMeetingStore((s) => s.panelOpen)
  const startedAt = useMeetingStore((s) => s.startedAt)
  const savedMeetingId = useMeetingStore((s) => s.savedMeetingId)
  const error = useMeetingStore((s) => s.error)
  const start = useMeetingStore((s) => s.start)
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
          <div className="flex items-center gap-2.5" role="status" aria-live="polite">
            <span className="h-2.5 w-2.5 animate-pulse rounded-pill bg-red-500" />
            <span className="text-[14px] font-medium text-ink">Идёт запись</span>
            <span className="ml-auto tabular-nums text-[15px] text-muted">{formatClock(elapsed)}</span>
          </div>
          <p className="text-[13px] text-muted">
            Запись продолжается, даже если открыть другой раздел. Заметки Марины появятся в
            следующем шаге фичи.
          </p>

          <LiveTranscript />

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
        <div className="space-y-3">
          <div
            className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2.5 text-[13px] text-danger"
            role="alert"
          >
            {error}
          </div>
          {phase === 'idle' && (
            <Button variant="secondary" onClick={() => void start()}>
              Попробовать снова
            </Button>
          )}
        </div>
      )}
    </Drawer>
  )
}

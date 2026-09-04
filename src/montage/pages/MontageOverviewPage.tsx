import { useEffect, useState } from 'react'
import { Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SectionAnalyticsCard } from '@/ai/components/SectionAnalyticsCard'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useMontageStore } from '../store'
import { INSTALLATION_STAGES } from '../types'

export function MontageOverviewPage() {
  const cycles = useMontageStore((s) => s.cycles)
  const loadCycles = useMontageStore((s) => s.loadCycles)
  const start = useMontageStore((s) => s.start)
  const navigate = useNavigate()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCycles()
  }, [loadCycles])

  const ready = cycles.filter((c) => c.production)

  async function handleStart(cycleId: number) {
    setBusyId(cycleId)
    const result = await start(cycleId)
    setBusyId(null)
    setError(result.ok ? null : result.reason ?? 'Не удалось начать монтаж')
  }

  return (
    <div>
      <SectionAnalyticsCard section="installation" />

      <div className="mb-5">
        <h1 className="text-[20px] font-medium text-ink">Монтаж</h1>
        <p className="mt-1 text-[13px] text-muted">Доставка, установка и проработка на объекте клиента</p>
      </div>

      {error && <p className="mb-4 text-[13px] text-danger">{error}</p>}

      {ready.length === 0 ? (
        <EmptyState icon={<Truck size={28} />} title="Пока нет производств для монтажа" />
      ) : (
        <div className="flex flex-col gap-3">
          {ready.map((cycle) => (
            <div key={cycle.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-4">
              <div>
                <div className="text-[14px] font-medium text-ink">{cycle.client?.full_name ?? `Цикл №${cycle.id}`}</div>
                {cycle.installation && (
                  <Chip tone="brand">{INSTALLATION_STAGES.find((s) => s.key === cycle.installation!.stage)?.label}</Chip>
                )}
              </div>
              {cycle.installation ? (
                <Button size="sm" variant="secondary" onClick={() => navigate(`/montage/${cycle.installation!.id}`)}>
                  Открыть
                </Button>
              ) : (
                <Button size="sm" disabled={busyId === cycle.id} onClick={() => handleStart(cycle.id)}>
                  {busyId === cycle.id ? 'Запуск…' : 'Начать монтаж'}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

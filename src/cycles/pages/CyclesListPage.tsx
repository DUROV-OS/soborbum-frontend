import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SectionAnalyticsCard } from '@/ai/components/SectionAnalyticsCard'
import { DataTable } from '@/shared/ui/DataTable'
import { Chip, ChipTone } from '@/shared/ui/Chip'
import { useCyclesStore } from '../store'
import { CYCLE_STAGES, CycleStatus } from '../types'

const STATUS_TONE: Record<CycleStatus, ChipTone> = {
  client: 'brand',
  production: 'info',
  installation: 'warning',
  completed: 'success',
}

export function CyclesListPage() {
  const cycles = useCyclesStore((s) => s.cycles)
  const loading = useCyclesStore((s) => s.loading)
  const load = useCyclesStore((s) => s.load)
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <SectionAnalyticsCard section="cycle" />

      <div className="mb-5">
        <h1 className="text-[20px] font-medium text-ink">Цикл клиента</h1>
        <p className="mt-1 text-[13px] text-muted">Клиент, производство и монтаж — всё сделанное по циклу в одном месте</p>
      </div>

      <DataTable
        columns={[
          { header: 'Клиент', accessor: (c) => c.client?.full_name ?? `Цикл №${c.id}` },
          {
            header: 'Статус',
            accessor: (c) => <Chip tone={STATUS_TONE[c.status]}>{CYCLE_STAGES.find((s) => s.key === c.status)?.label}</Chip>,
          },
        ]}
        rows={cycles}
        keyOf={(c) => String(c.id)}
        onRowClick={(c) => navigate(`/cycles/${c.id}`)}
        loading={loading}
      />
    </div>
  )
}

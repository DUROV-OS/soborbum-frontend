import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SectionAnalyticsCard } from '@/ai/components/SectionAnalyticsCard'
import { DataTable } from '@/shared/ui/DataTable'
import { Chip, ChipTone } from '@/shared/ui/Chip'
import { HelpButton } from '@/shared/ui/HelpButton'
import { OnboardingDialog, OnboardingPage } from '@/shared/ui/OnboardingDialog'
import { useSectionOnboarding } from '@/shared/lib/useSectionOnboarding'
import { useCyclesStore } from '../store'
import { CYCLE_STAGES, CycleStatus } from '../types'

const STATUS_TONE: Record<CycleStatus, ChipTone> = {
  client: 'brand',
  production: 'info',
  installation: 'warning',
  completed: 'success',
}

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    title: 'Сквозной список циклов',
    body: (
      <p>
        «Цикл клиента» объединяет путь клиента, производство и монтаж в одну строку — по одному циклу на клиента,
        от первого контакта до сдачи объекта.
      </p>
    ),
  },
  {
    title: 'ИИ-резюме сверху',
    body: (
      <p>
        Цветная карточка над таблицей — ИИ-обзор всего раздела с меткой статуса («Всё в порядке», «Нужно
        внимание» или «Критично»). Значок со стрелками в углу карточки пересобирает резюме заново.
      </p>
    ),
  },
  {
    title: 'Открыть детали цикла',
    body: (
      <p>
        Кликните по строке в таблице, чтобы открыть карточку цикла — там видна вся история клиента, производства
        и монтажа.
      </p>
    ),
  },
]

export function CyclesListPage() {
  const cycles = useCyclesStore((s) => s.cycles)
  const loading = useCyclesStore((s) => s.loading)
  const load = useCyclesStore((s) => s.load)
  const navigate = useNavigate()
  const onboarding = useSectionOnboarding('cycle')

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <SectionAnalyticsCard section="cycle" />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Цикл клиента</h1>
          <p className="mt-1 text-[13px] text-muted">Клиент, производство и монтаж — всё сделанное по циклу в одном месте</p>
        </div>
        <HelpButton onClick={onboarding.show} />
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

      <OnboardingDialog
        open={onboarding.open}
        onClose={onboarding.close}
        title="Раздел «Цикл клиента»"
        pages={ONBOARDING_PAGES}
      />
    </div>
  )
}

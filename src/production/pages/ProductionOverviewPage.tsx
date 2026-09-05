import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SectionAnalyticsCard } from '@/ai/components/SectionAnalyticsCard'
import { EmptyState } from '@/shared/ui/EmptyState'
import { HelpButton } from '@/shared/ui/HelpButton'
import { LoadingState } from '@/shared/ui/LoadingState'
import { OnboardingDialog, OnboardingPage } from '@/shared/ui/OnboardingDialog'
import { useSectionOnboarding } from '@/shared/lib/useSectionOnboarding'
import { Factory } from 'lucide-react'
import { useProductionStore } from '../store'

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    title: 'Активные производства',
    body: (
      <p>
        Здесь собраны все запущенные производства — карточки появляются автоматически, как только клиент
        доходит до стадии «постоплата» в разделе «Клиенты».
      </p>
    ),
  },
  {
    title: 'Модули производства',
    body: (
      <p>
        Кликните по карточке, чтобы открыть производство: внутри — список модулей, их статусы и материалы,
        нужные для сборки каждого модуля.
      </p>
    ),
  },
]

export function ProductionOverviewPage() {
  const cycles = useProductionStore((s) => s.cycles)
  const loading = useProductionStore((s) => s.loading)
  const loadCycles = useProductionStore((s) => s.loadCycles)
  const navigate = useNavigate()
  const onboarding = useSectionOnboarding('production')

  useEffect(() => {
    loadCycles()
  }, [loadCycles])

  const active = cycles.filter((c) => c.production)

  return (
    <div>
      <SectionAnalyticsCard section="production" />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Производство</h1>
          <p className="mt-1 text-[13px] text-muted">Модули и материалы по каждому запущенному производству</p>
        </div>
        <HelpButton onClick={onboarding.show} />
      </div>

      {loading && cycles.length === 0 ? (
        <LoadingState label="Загружаем производства…" />
      ) : active.length === 0 ? (
        <EmptyState
          icon={<Factory size={28} />}
          title="Производств пока нет"
          description="Они появляются автоматически, когда клиент доходит до стадии «постоплата»."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map(({ id, client, production }) => (
            <button
              key={id}
              type="button"
              onClick={() => navigate(`/production/${production!.id}`)}
              className="rounded-md border border-border bg-surface p-4 text-left transition-colors hover:border-brand/40"
            >
              <div className="text-[13px] font-medium text-ink">{client?.full_name ?? `Цикл №${id}`}</div>
              <div className="mt-1 text-[12px] text-muted">
                {production!.modules.length} модул{production!.modules.length === 1 ? 'ь' : 'я'}
              </div>
            </button>
          ))}
        </div>
      )}

      <OnboardingDialog
        open={onboarding.open}
        onClose={onboarding.close}
        title="Раздел «Производство»"
        pages={ONBOARDING_PAGES}
      />
    </div>
  )
}

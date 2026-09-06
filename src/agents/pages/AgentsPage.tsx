import { useMemo, useState } from 'react'
import { useAuthStore } from '@/auth/store'
import { HelpButton } from '@/shared/ui/HelpButton'
import { OnboardingDialog, OnboardingPage } from '@/shared/ui/OnboardingDialog'
import { Tabs } from '@/shared/ui/Tabs'
import { useSectionOnboarding } from '@/shared/lib/useSectionOnboarding'
import { AdminAgentsPanel } from '../components/AdminAgentsPanel'
import { AgentConstellation } from '../components/AgentConstellation'
import { AgentPassportCard } from '../components/AgentPassportCard'
import { PlanLists } from '../components/PlanLists'
import { AGENTS } from '../data'
import { AgentId } from '../types'

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    title: 'Не совет директоров',
    body: (
      <p>
        Совет директоров — дерево направлений бизнеса. Здесь — операционная команда из восьми агентов. Это разные
        контуры, поэтому вкладка отдельная.
      </p>
    ),
  },
  {
    title: 'Карта команды',
    body: (
      <p>
        Координатор в центре. Нажмите на роль, чтобы увидеть зону и запреты. Юрист сверху — фильтр: ворованные
        данные конкурентов он блокирует до любого черновика.
      </p>
    ),
  },
  {
    title: 'Панель администратора',
    body: (
      <p>
        Администратору доступна вкладка «Панель»: разметка, блоки, следы. Цифры честные — со стартового gold, не
        «агент уже обучен».
      </p>
    ),
  },
]

type TabKey = 'team' | 'panel'

export function AgentsPage() {
  const current = useAuthStore((s) => s.current)
  const isAdmin = current?.role === 'admin'
  const [tab, setTab] = useState<TabKey>('team')
  const [selectedId, setSelectedId] = useState<AgentId>('coordinator')
  const onboarding = useSectionOnboarding('agents')
  const selected = useMemo(() => AGENTS.find((agent) => agent.id === selectedId) ?? AGENTS[0], [selectedId])

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Операционная команда</p>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[34px]">
            Агенты<span className="text-brand">.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] text-muted">
            Восемь ролей MVP, общий контекст компании и юрист как ворота. Совет директоров эту схему не заменяет.
          </p>
        </div>
        <HelpButton onClick={onboarding.show} />
      </div>

      {isAdmin && (
        <Tabs
          tabs={[
            { key: 'team', label: 'Команда' },
            { key: 'panel', label: 'Панель' },
          ]}
          activeKey={tab}
          onChange={setTab}
        />
      )}

      {tab === 'team' && (
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
            <AgentConstellation selectedId={selectedId} onSelect={setSelectedId} />
            <AgentPassportCard agent={selected} />
          </div>
          <section className="rounded-2xl border border-border bg-surface px-5 py-4 sm:px-6">
            <p className="text-[13px] text-ink">
              Юрист не голосует «за идею». Если фильтр дал block — координатор не будит коммерческих специалистов.
              Пример: ворованную или слитую базу конкурента использовать нельзя.
            </p>
          </section>
          <PlanLists />
        </div>
      )}

      {tab === 'panel' && isAdmin && <AdminAgentsPanel />}

      <OnboardingDialog
        open={onboarding.open}
        onClose={onboarding.close}
        title="Раздел «Агенты»"
        pages={ONBOARDING_PAGES}
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { AskAiButton } from '@/ai/components/AskAiButton'
import { SectionAnalyticsCard } from '@/ai/components/SectionAnalyticsCard'
import { Button } from '@/shared/ui/Button'
import { HelpButton } from '@/shared/ui/HelpButton'
import { KanbanBoard } from '@/shared/ui/KanbanBoard'
import { OnboardingDialog, OnboardingPage } from '@/shared/ui/OnboardingDialog'
import { Tabs } from '@/shared/ui/Tabs'
import { useSectionOnboarding } from '@/shared/lib/useSectionOnboarding'
import { useMarketingStore } from '../store'
import { CONTENT_STAGES, ContentItem } from '../types'
import { CalendarView } from '../components/CalendarView'
import { CreateContentModal } from '../components/CreateContentModal'
import { ContentDetailDrawer } from '../components/ContentDetailDrawer'

type View = 'calendar' | 'stages'

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    title: 'Календарь контента',
    body: (
      <p>
        По умолчанию раздел показывает календарь выпуска контента с датами публикаций. Переключитесь на вкладку
        «По стадиям», чтобы увидеть контент в виде доски по этапам подготовки.
      </p>
    ),
  },
  {
    title: 'Новый контент',
    body: (
      <p>
        Кнопка «Новый контент» в правом верхнем углу открывает форму создания карточки: название, дата выхода и
        описание.
      </p>
    ),
  },
  {
    title: 'Детали и вопрос ИИ',
    body: (
      <p>
        Клик по карточке в календаре или на доске открывает подробности контента. Кнопка «Спросить ИИ» откроет
        чат с контекстом раздела маркетинга.
      </p>
    ),
  },
]

export function MarketingPage() {
  const items = useMarketingStore((s) => s.items)
  const load = useMarketingStore((s) => s.load)
  const [view, setView] = useState<View>('calendar')
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<ContentItem | null>(null)
  const onboarding = useSectionOnboarding('marketing')

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <SectionAnalyticsCard section="marketing" />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Маркетинг</h1>
          <p className="mt-1 text-[13px] text-muted">Календарь выпуска контента</p>
        </div>
        <div className="flex gap-2 self-start">
          <AskAiButton domain="marketing" />
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} />
            Новый контент
          </Button>
          <HelpButton onClick={onboarding.show} />
        </div>
      </div>

      <div className="mb-4">
        <Tabs
          tabs={[
            { key: 'calendar', label: 'Календарь' },
            { key: 'stages', label: 'По стадиям' },
          ]}
          activeKey={view}
          onChange={setView}
        />
      </div>

      {view === 'calendar' ? (
        <CalendarView items={items} onSelect={setSelected} />
      ) : (
        <KanbanBoard
          columns={CONTENT_STAGES}
          items={items}
          keyOf={(i) => String(i.id)}
          columnOf={(i) => i.stage}
          onCardClick={setSelected}
          renderCard={(item) => (
            <div>
              <div className="text-[13px] font-medium text-ink">{item.title}</div>
              {item.planned_release_date && (
                <div className="mt-1 text-[12px] text-muted">
                  {new Date(item.planned_release_date).toLocaleDateString('ru-RU')}
                </div>
              )}
            </div>
          )}
        />
      )}

      <CreateContentModal open={creating} onClose={() => setCreating(false)} />
      <ContentDetailDrawer item={selected} onClose={() => setSelected(null)} />

      <OnboardingDialog
        open={onboarding.open}
        onClose={onboarding.close}
        title="Раздел «Маркетинг»"
        pages={ONBOARDING_PAGES}
      />
    </div>
  )
}

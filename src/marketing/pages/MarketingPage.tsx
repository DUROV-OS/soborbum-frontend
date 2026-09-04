import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { KanbanBoard } from '@/shared/ui/KanbanBoard'
import { Tabs } from '@/shared/ui/Tabs'
import { useMarketingStore } from '../store'
import { CONTENT_STAGES, ContentItem } from '../types'
import { CalendarView } from '../components/CalendarView'
import { CreateContentModal } from '../components/CreateContentModal'
import { ContentDetailDrawer } from '../components/ContentDetailDrawer'

type View = 'calendar' | 'stages'

export function MarketingPage() {
  const items = useMarketingStore((s) => s.items)
  const load = useMarketingStore((s) => s.load)
  const [view, setView] = useState<View>('calendar')
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<ContentItem | null>(null)

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Маркетинг</h1>
          <p className="mt-1 text-[13px] text-muted">Календарь выпуска контента</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} />
          Новый контент
        </Button>
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
    </div>
  )
}

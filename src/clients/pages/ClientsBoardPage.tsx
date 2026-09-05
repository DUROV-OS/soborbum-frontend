import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SectionAnalyticsCard } from '@/ai/components/SectionAnalyticsCard'
import { Button } from '@/shared/ui/Button'
import { HelpButton } from '@/shared/ui/HelpButton'
import { KanbanBoard } from '@/shared/ui/KanbanBoard'
import { OnboardingDialog, OnboardingPage } from '@/shared/ui/OnboardingDialog'
import { useSectionOnboarding } from '@/shared/lib/useSectionOnboarding'
import { useClientsStore } from '../store'
import { CLIENT_STAGES } from '../types'
import { CreateClientModal } from '../components/CreateClientModal'

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    title: 'Доска клиентов',
    body: (
      <p>
        Каждая колонка — стадия пути клиента, от первого обращения до старта производства. Карточка клиента
        находится в той колонке, которая соответствует его текущей стадии.
      </p>
    ),
  },
  {
    title: 'Новый клиент',
    body: (
      <p>
        Кнопка «Новый клиент» в правом верхнем углу открывает форму создания карточки — заполните имя, телефон и
        другие данные.
      </p>
    ),
  },
  {
    title: 'Карточка клиента',
    body: (
      <p>
        Кликните по карточке, чтобы открыть детали клиента: там же можно перевести его на следующую стадию,
        добавить заметки и файлы.
      </p>
    ),
  },
]

export function ClientsBoardPage() {
  const clients = useClientsStore((s) => s.clients)
  const loading = useClientsStore((s) => s.loading)
  const load = useClientsStore((s) => s.load)
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const onboarding = useSectionOnboarding('clients')

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <SectionAnalyticsCard section="clients" />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Клиенты</h1>
          <p className="mt-1 text-[13px] text-muted">Путь клиента до начала производства</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} />
            Новый клиент
          </Button>
          <HelpButton onClick={onboarding.show} />
        </div>
      </div>

      <KanbanBoard
        columns={CLIENT_STAGES}
        items={clients}
        keyOf={(c) => String(c.id)}
        columnOf={(c) => c.stage}
        onCardClick={(c) => navigate(`/clients/${c.id}`)}
        loading={loading}
        renderCard={(client) => (
          <div>
            <div className="text-[13px] font-medium text-ink">{client.full_name}</div>
            <div className="mt-0.5 text-[12px] text-muted">{client.phone}</div>
            {client.house_area && (
              <div className="mt-2 text-[12px] text-brand-dark">{client.house_area} м²</div>
            )}
          </div>
        )}
      />

      <CreateClientModal open={creating} onClose={() => setCreating(false)} />

      <OnboardingDialog
        open={onboarding.open}
        onClose={onboarding.close}
        title="Раздел «Клиенты»"
        pages={ONBOARDING_PAGES}
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { KanbanBoard } from '@/shared/ui/KanbanBoard'
import { useClientsStore } from '../store'
import { CLIENT_STAGES } from '../types'
import { CreateClientModal } from '../components/CreateClientModal'

export function ClientsBoardPage() {
  const clients = useClientsStore((s) => s.clients)
  const load = useClientsStore((s) => s.load)
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Клиенты</h1>
          <p className="mt-1 text-[13px] text-muted">Путь клиента до начала производства</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} />
          Новый клиент
        </Button>
      </div>

      <KanbanBoard
        columns={CLIENT_STAGES}
        items={clients}
        keyOf={(c) => c.id}
        columnOf={(c) => c.stage}
        onCardClick={(c) => navigate(`/clients/${c.id}`)}
        renderCard={(client) => (
          <div>
            <div className="text-[13px] font-medium text-ink">{client.basic.fullName}</div>
            <div className="mt-0.5 text-[12px] text-muted">{client.basic.phone}</div>
            {client.project.houseType && (
              <div className="mt-2 text-[12px] text-brand-dark">{client.project.houseType}</div>
            )}
          </div>
        )}
      />

      <CreateClientModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { Stepper } from '@/shared/ui/Stepper'
import { useClientsStore } from '../store'
import { CLIENT_STAGES } from '../types'
import { nextStageOf, stageLabel } from '../rules'
import { ReadRow, Section } from '../components/ProjectPanel'
import { DocumentPanel } from '../components/DocumentPanel'
import { PaymentPanel } from '../components/PaymentPanel'
import { NotesPanel } from '../components/NotesPanel'
import { ProjectPanel } from '../components/ProjectPanel'

export function ClientDetailPage() {
  const { id = '' } = useParams()
  const clientId = Number(id)
  const clients = useClientsStore((s) => s.clients)
  const load = useClientsStore((s) => s.load)
  const advance = useClientsStore((s) => s.advance)
  const [error, setError] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    if (clients.length === 0) load()
  }, [clients.length, load])

  const client = clients.find((c) => c.id === clientId)

  if (!client) {
    return <p className="text-[13px] text-muted">Загрузка…</p>
  }

  const next = nextStageOf(client.stage)

  async function handleAdvance() {
    setAdvancing(true)
    const result = await advance(clientId)
    setAdvancing(false)
    setError(result.ok ? null : result.reason ?? 'Не удалось перевести на следующую стадию')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/clients" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft size={14} />
        Все клиенты
      </Link>

      <div className="mb-6 rounded-md border border-border bg-surface p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-[18px] font-medium text-ink">{client.full_name}</h1>
            <p className="mt-1 text-[13px] text-muted">
              Клиент с {new Date(client.created_at).toLocaleDateString('ru-RU')}
            </p>
          </div>
          {next && (
            <div className="text-right">
              <Button size="sm" onClick={handleAdvance} disabled={advancing}>
                {advancing ? 'Переход…' : `Перевести на «${stageLabel(next)}»`}
              </Button>
            </div>
          )}
        </div>
        <Stepper steps={CLIENT_STAGES} currentKey={client.stage} />
        {error && <p className="mt-3 text-[12px] text-danger">{error}</p>}
      </div>

      <div className="flex flex-col gap-4">
        <Section title="Базовые данные">
          <ReadRow label="Телефон" value={client.phone} />
          <ReadRow label="Почта" value={client.email} />
          <ReadRow label="ИНН" value={client.inn} />
          <ReadRow label="Паспорт" value={client.passport_number} />
          <ReadRow label="Дата рождения" value={new Date(client.birth_date).toLocaleDateString('ru-RU')} />
        </Section>

        <ProjectPanel client={client} />
        <DocumentPanel client={client} />
        <PaymentPanel client={client} />
        <NotesPanel client={client} />
      </div>
    </div>
  )
}

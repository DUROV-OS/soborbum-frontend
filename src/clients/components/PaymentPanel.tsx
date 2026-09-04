import { useState } from 'react'
import { Chip } from '@/shared/ui/Chip'
import { useClientsStore } from '../store'
import { isGroupEditable, isGroupVisible } from '../rules'
import { Client } from '../types'
import { Section } from './ProjectPanel'

export function PaymentPanel({ client }: { client: Client }) {
  const updatePayment = useClientsStore((s) => s.updatePayment)
  const editable = isGroupEditable(client, 'payment')
  const [error, setError] = useState<string | null>(null)

  if (!isGroupVisible(client, 'payment')) return null

  async function set(value: boolean) {
    const result = await updatePayment(client.id, value)
    setError(result.ok ? null : result.reason ?? 'Не удалось сохранить')
  }

  if (!editable) {
    return (
      <Section title="Оплата">
        <Chip tone={client.is_paid ? 'success' : 'warning'}>
          {client.is_paid ? 'Оплата поступила' : 'Оплата не поступила'}
        </Chip>
      </Section>
    )
  }

  return (
    <Section title="Оплата">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => set(true)}
          className={`rounded-pill px-4 py-2 text-[13px] font-medium transition-colors ${
            client.is_paid === true ? 'bg-success text-white' : 'border border-border text-ink hover:border-success'
          }`}
        >
          Оплата поступила
        </button>
        <button
          type="button"
          onClick={() => set(false)}
          className={`rounded-pill px-4 py-2 text-[13px] font-medium transition-colors ${
            client.is_paid === false ? 'bg-warning text-white' : 'border border-border text-ink hover:border-warning'
          }`}
        >
          Оплата не поступила
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
    </Section>
  )
}

import { Chip } from '@/shared/ui/Chip'
import { useClientsStore } from '../store'
import { isGroupEditable, isGroupVisible } from '../rules'
import { Client } from '../types'
import { Section } from './ProjectPanel'

export function PaymentPanel({ client }: { client: Client }) {
  const updatePayment = useClientsStore((s) => s.updatePayment)
  const editable = isGroupEditable(client, 'payment')

  if (!isGroupVisible(client, 'payment')) return null

  if (!editable) {
    return (
      <Section title="Оплата">
        <Chip tone={client.payment.received ? 'success' : 'warning'}>
          {client.payment.received ? 'Оплата поступила' : 'Оплата не поступила'}
        </Chip>
      </Section>
    )
  }

  return (
    <Section title="Оплата">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => updatePayment(client.id, { received: true })}
          className={`rounded-pill px-4 py-2 text-[13px] font-medium transition-colors ${
            client.payment.received === true
              ? 'bg-success text-white'
              : 'border border-border text-ink hover:border-success'
          }`}
        >
          Оплата поступила
        </button>
        <button
          type="button"
          onClick={() => updatePayment(client.id, { received: false })}
          className={`rounded-pill px-4 py-2 text-[13px] font-medium transition-colors ${
            client.payment.received === false
              ? 'bg-warning text-white'
              : 'border border-border text-ink hover:border-warning'
          }`}
        >
          Оплата не поступила
        </button>
      </div>
    </Section>
  )
}

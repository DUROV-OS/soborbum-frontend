import { AgentPassport } from '../types'

export function AgentPassportCard({ agent }: { agent: AgentPassport }) {
  return (
    <section className="rounded-2xl border border-border bg-surface" aria-labelledby="agent-passport-title">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Паспорт</p>
        <h2 id="agent-passport-title" className="mt-1 text-[18px] font-semibold tracking-tight text-ink">
          {agent.title}
        </h2>
        <p className="mt-1 text-[13px] text-muted">{agent.role}</p>
      </div>
      <dl className="space-y-4 px-5 py-5 sm:px-6">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">Зона</dt>
          <dd className="mt-1 text-[13px] leading-relaxed text-ink">{agent.owns}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">Не зона</dt>
          <dd className="mt-1 text-[13px] leading-relaxed text-ink">{agent.doesNotOwn}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">Вопрос дня</dt>
          <dd className="mt-1 text-[13px] leading-relaxed text-ink">{agent.dailyQuestion}</dd>
        </div>
      </dl>
    </section>
  )
}

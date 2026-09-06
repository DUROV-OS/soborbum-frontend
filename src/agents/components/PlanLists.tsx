import { CheckCheck, Circle } from 'lucide-react'
import { PLAN_DONE, PLAN_NEXT } from '../data'

export function PlanLists() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <PlanColumn title="Уже сделано" items={PLAN_DONE} done />
      <PlanColumn title="Надо сделать" items={PLAN_NEXT} done={false} />
    </div>
  )
}

function PlanColumn({
  title,
  items,
  done,
}: {
  title: string
  items: typeof PLAN_DONE
  done: boolean
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-[18px] font-semibold tracking-tight text-ink">{title}</h2>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 px-5 py-4 sm:px-6">
            {done ? (
              <CheckCheck size={17} className="mt-0.5 shrink-0 text-brand" />
            ) : (
              <Circle size={17} className="mt-0.5 shrink-0 text-muted" />
            )}
            <div>
              <p className="text-[14px] font-medium text-ink">{item.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

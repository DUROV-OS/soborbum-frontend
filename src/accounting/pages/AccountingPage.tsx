import { Calculator } from 'lucide-react'
import { EmptyState } from '@/shared/ui/EmptyState'

/** Мок-раздел «Бухгалтерия» — заглушка до отдельной задачи. */
export function AccountingPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-ink">Бухгалтерия</h1>
        <p className="mt-1 text-[13px] text-muted">Акты, счета, сверки и закрытие периода.</p>
      </div>
      <EmptyState
        icon={<Calculator size={24} />}
        title="Раздел в разработке"
        description="Здесь появятся проведённые документы, статус закрытия периода и задачи бухгалтерии. Пока раздел мок."
      />
    </div>
  )
}

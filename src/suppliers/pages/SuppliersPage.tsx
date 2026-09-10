import { Handshake } from 'lucide-react'
import { EmptyState } from '@/shared/ui/EmptyState'

/** Мок-раздел «Поставщики» — заглушка до задачи 0005. */
export function SuppliersPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-ink">Поставщики</h1>
        <p className="mt-1 text-[13px] text-muted">Контакты, прайс-листы по материалам и оплаты поставщикам.</p>
      </div>
      <EmptyState
        icon={<Handshake size={24} />}
        title="Раздел в разработке"
        description="Здесь появятся карточки поставщиков, чат в MAX и прайс-лист по материалам (задача 0005). Пока раздел мок."
      />
    </div>
  )
}

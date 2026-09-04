import { Hammer } from 'lucide-react'
import { EmptyState } from '@/shared/ui/EmptyState'

export function Placeholder({ title }: { title: string }) {
  return (
    <EmptyState
      icon={<Hammer size={28} />}
      title={`${title}: раздел в разработке`}
      description="Экран появится в одной из следующих веток."
    />
  )
}

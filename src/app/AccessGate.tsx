import { ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/auth/store'
import { SectionId, sectionById } from '@/shared/sections'
import { EmptyState } from '@/shared/ui/EmptyState'

export function AccessGate({ section, children }: { section: SectionId; children: React.ReactNode }) {
  const hasAccess = useAuthStore((s) => s.hasAccess)

  if (!hasAccess(section)) {
    return (
      <EmptyState
        icon={<ShieldAlert size={28} />}
        title="Доступ ограничен"
        description={`У вашей учётной записи нет доступа к разделу «${sectionById(section).label}». Обратитесь к администратору, чтобы его открыли.`}
      />
    )
  }

  return <>{children}</>
}

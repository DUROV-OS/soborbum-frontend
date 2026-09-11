import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { Drawer } from '@/shared/ui/Drawer'
import { AgentActivityOut } from '../types'

export function AgentActivityDrawer({
  item,
  onClose,
}: {
  item: AgentActivityOut | null
  onClose: () => void
}) {
  const navigate = useNavigate()
  if (!item) return null

  return (
    <Drawer
      open
      onClose={onClose}
      title={item.title}
      subtitle={formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ru })}
      width="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <Chip tone={item.autonomous ? 'success' : 'warning'}>
          {item.autonomous ? 'Сделано автономно' : 'Потребовалось согласование'}
        </Chip>
        <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink">{item.detail}</p>
        {item.related_path && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onClose()
              navigate(item.related_path as string)
            }}
          >
            {item.related_label ?? 'Перейти в раздел'}
            <ArrowUpRight size={14} />
          </Button>
        )}
      </div>
    </Drawer>
  )
}

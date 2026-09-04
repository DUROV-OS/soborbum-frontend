import { ChipTone } from '@/shared/ui/Chip'
import { TaskStatus } from '../types'

export function stateTone(state: TaskStatus): ChipTone {
  switch (state) {
    case 'not_ready':
      return 'neutral'
    case 'ready':
      return 'info'
    case 'in_progress':
      return 'brand'
    case 'in_review':
      return 'warning'
    case 'done':
      return 'success'
  }
}

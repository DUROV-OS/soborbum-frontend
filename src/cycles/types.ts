import { Client } from '@/clients/types'
import { Installation } from '@/montage/types'
import { Production } from '@/production/types'

export type CycleStatus = 'client' | 'production' | 'installation' | 'completed'

export const CYCLE_STAGES: { key: CycleStatus; label: string }[] = [
  { key: 'client', label: 'Клиент' },
  { key: 'production', label: 'Производство' },
  { key: 'installation', label: 'Монтаж' },
  { key: 'completed', label: 'Завершён' },
]

export interface Cycle {
  id: number
  status: CycleStatus
  client: Client | null
  production: Production | null
  installation: Installation | null
}

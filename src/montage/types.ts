export type InstallationStage = 'delivery' | 'installation' | 'followup'

export const INSTALLATION_STAGES: { key: InstallationStage; label: string }[] = [
  { key: 'delivery', label: 'Доставка' },
  { key: 'installation', label: 'Установка' },
  { key: 'followup', label: 'Проработка' },
]

export interface Installation {
  id: number
  cycle_id: number
  stage: InstallationStage
  address: string | null
  scheduled_date: string | null
  notes: string | null
  created_at: string
}

/** Минимальная форма /api/cycles/ — своего списочного эндпоинта у монтажа нет. */
export interface CycleForMontage {
  id: number
  client: { full_name: string } | null
  production: { modules: unknown[] } | null
  installation: Installation | null
}

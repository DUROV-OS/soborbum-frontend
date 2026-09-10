export type WidgetTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

export interface DashboardWidget {
  section: string
  title: string
  value: string
  hint?: string | null
  tone: WidgetTone
}

export interface TodayDashboard {
  generated_at: string
  summary: string
  widgets: DashboardWidget[]
  actions?: { id: string; section: string; title: string; description: string; href: string; count: number; tone: WidgetTone }[]
  source?: 'database'
  ai_configured?: boolean
}

export interface AktualnoeItem {
  cycle_id: number
  client_name: string
  /** короткое (2–3 слова) название текущей стадии клиента */
  stage: string
  /** 0–100: насколько выполнена текущая стадия (ставит ИИ) */
  percent: number
  /** фраза из 2–3 слов о том, что сейчас происходит */
  phrase: string
}

export interface AktualnoeResponse {
  generated_at: string
  items: AktualnoeItem[]
  ai_configured: boolean
  /** true — подборка собрана без ИИ (топ по свежести, проценты по стадии) */
  degraded: boolean
}

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
}

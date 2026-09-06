export type AgentId =
  | 'coordinator'
  | 'sales'
  | 'marketer'
  | 'production'
  | 'warehouse'
  | 'finance'
  | 'lawyer'
  | 'engineer'

export type AgentTone = 'brand' | 'danger' | 'timber' | 'info'

export interface AgentPassport {
  id: AgentId
  title: string
  role: string
  owns: string
  doesNotOwn: string
  dailyQuestion: string
  tone: AgentTone
}

export interface PlanItem {
  id: string
  title: string
  detail: string
  done: boolean
}

export interface DayPoint {
  date: string
  runs: number
  blocked: number
  escalated: number
  released: number
}

export interface RouteShare {
  id: AgentId
  title: string
  count: number
}

export interface GoldProgress {
  id: AgentId
  title: string
  gold: number
  target: number
}

export interface TraceRow {
  id: string
  text: string
  agents: string[]
  legal: 'allow' | 'block' | 'escalate_human'
  released: boolean
}

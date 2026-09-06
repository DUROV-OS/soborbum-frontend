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

export type LegalVerdict = 'allow' | 'allow_with_conditions' | 'block' | 'escalate_human'

export interface TraceRow {
  id: number | string
  trace_id?: string
  text: string
  agents: string[]
  legal: LegalVerdict
  released: boolean
  created_at?: string
}

export interface AgentRun {
  id: number
  trace_id: string
  text: string
  reply: string
  legal_verdict: LegalVerdict
  legal_rules: string[]
  legal_passport: string
  released: boolean
  specialists: string[]
  specialist_titles: string[]
  created_at: string
}

export interface LegalMix {
  allow: number
  allow_with_conditions: number
  escalate_human: number
  block: number
}

export interface AgentsTotals {
  runs: number
  blocked: number
  escalated: number
  released: number
}

export interface AgentsStats {
  week: DayPoint[]
  legal: LegalMix
  routing: RouteShare[]
  traces: TraceRow[]
  totals: AgentsTotals
}

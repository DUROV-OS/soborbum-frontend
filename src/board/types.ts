export type BoardNodeColor = 'green' | 'yellow' | 'red'

export interface BoardNode {
  id: number
  parent_id: number | null
  level: number
  sort_order: number
  title: string
  /** Полный фактический текст (500+ слов) — база для совета, не для показа сотруднику напрямую. */
  description: string
  /** 2-3 абзаца ИИ-выжимки из description — то, что показываем в интерфейсе. null, пока ИИ ни разу не редактировал ноду. */
  summary: string | null
  color: BoardNodeColor
  created_at: string
  updated_at: string
  children: BoardNode[]
}

export interface BoardNodeBrief {
  id: number
  title: string
  level: number
  color: BoardNodeColor
}

export interface BoardNodeDetail extends BoardNode {
  path: BoardNodeBrief[]
}

export type CouncilRole =
  | 'strategist'
  | 'finance'
  | 'operations'
  | 'technology'
  | 'marketing'
  | 'risk'
  | 'customer'

export type CouncilStance = 'support' | 'caution' | 'oppose'

export interface CouncilOpinion {
  role: CouncilRole
  role_label: string
  opinion: string
  stance: CouncilStance
}

export type ProposalRecommendation = 'change' | 'no_change'
export type ProposalRoundDecision = 'pending' | 'accepted' | 'rejected'

export interface ProposalRound {
  user_message: string
  summary: string
  recommendation: ProposalRecommendation
  proposed_title: string | null
  proposed_description: string | null
  proposed_color: BoardNodeColor | null
  decision: ProposalRoundDecision
  council: CouncilOpinion[]
}

export type BoardProposalStatus = 'pending' | 'applied' | 'cancelled'

export interface BoardProposal {
  id: number
  node_id: number
  requested_by_id: number
  status: BoardProposalStatus
  created_at: string
  applied_at: string | null
  rounds: ProposalRound[]
}

export type BoardChangeSource = 'council' | 'actualize' | 'manual'
export type BoardChangeType = 'created' | 'updated' | 'deleted'

export interface BoardNodeChange {
  id: number
  node_id: number
  proposal_id: number | null
  source: BoardChangeSource
  change_type: BoardChangeType
  title: string
  old_description: string | null
  new_description: string | null
  old_color: string | null
  new_color: string | null
  note: string | null
  created_at: string
}

export interface ApplyResult {
  proposal: BoardProposal
  changes: BoardNodeChange[]
}

export interface ActualizeResult {
  generated_at: string
  changes: BoardNodeChange[]
}

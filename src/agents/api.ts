import { apiRequest } from '@/shared/lib/httpClient'
import { AgentRun, AgentsStats } from './types'

export function createAgentRun(text: string): Promise<AgentRun> {
  return apiRequest<AgentRun>({ section: 'agents', path: '/runs', method: 'POST', body: { text } })
}

export function getAgentRuns(limit = 40): Promise<AgentRun[]> {
  return apiRequest<AgentRun[]>({ section: 'agents', path: '/runs', query: { limit } })
}

export function getAgentStats(): Promise<AgentsStats> {
  return apiRequest<AgentsStats>({ section: 'agents', path: '/stats' })
}

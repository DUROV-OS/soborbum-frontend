import { apiRequest } from '@/shared/lib/httpClient'
import { ActualizeResult, ApplyResult, BoardNode, BoardNodeColor, BoardNodeDetail, BoardProposal } from './types'

const SECTION = 'board'

/** GET /api/board/tree */
export function getTree(): Promise<BoardNode> {
  return apiRequest<BoardNode>({ section: SECTION, path: '/tree' })
}

/** GET /api/board/nodes/:id */
export function getNode(id: number): Promise<BoardNodeDetail> {
  return apiRequest<BoardNodeDetail>({ section: SECTION, path: `/nodes/${id}` })
}

/** PATCH /api/board/nodes/:id */
export function updateNode(
  id: number,
  patch: { title?: string; description?: string; color?: BoardNodeColor },
): Promise<BoardNodeDetail> {
  return apiRequest<BoardNodeDetail>({ section: SECTION, path: `/nodes/${id}`, method: 'PATCH', body: patch })
}

/** POST /api/board/nodes/:id/propose */
export function proposeChange(nodeId: number, message: string): Promise<BoardProposal> {
  return apiRequest<BoardProposal>({
    section: SECTION,
    path: `/nodes/${nodeId}/propose`,
    method: 'POST',
    body: { message },
    query: { include_transcript: true },
  })
}

/** POST /api/board/proposals/:id/respond */
export function respondToProposal(
  proposalId: number,
  decision: 'accept' | 'reject',
  comment?: string,
): Promise<ApplyResult> {
  return apiRequest<ApplyResult>({
    section: SECTION,
    path: `/proposals/${proposalId}/respond`,
    method: 'POST',
    body: { decision, comment },
    query: { include_transcript: true },
  })
}

/** DELETE /api/board/proposals/:id */
export function cancelProposal(proposalId: number): Promise<BoardProposal> {
  return apiRequest<BoardProposal>({ section: SECTION, path: `/proposals/${proposalId}`, method: 'DELETE' })
}

/** POST /api/board/actualize (только для админа) */
export function actualize(): Promise<ActualizeResult> {
  return apiRequest<ActualizeResult>({ section: SECTION, path: '/actualize', method: 'POST' })
}

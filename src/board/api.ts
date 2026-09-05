import { apiRequest } from '@/shared/lib/httpClient'
import {
  ActualizeResult,
  ApplyResult,
  BoardDiscussion,
  BoardDiscussionDetail,
  BoardDiscussionMessage,
  BoardNode,
  BoardNodeColor,
  BoardNodeDetail,
  BoardProposal,
} from './types'

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

/** GET /api/board/discussions — свободные обсуждения с советом (mine=true — только свои). */
export function listDiscussions(mine = true): Promise<BoardDiscussion[]> {
  return apiRequest<BoardDiscussion[]>({ section: SECTION, path: '/discussions', query: { mine } })
}

/** GET /api/board/discussions/:id */
export function getDiscussion(id: number): Promise<BoardDiscussionDetail> {
  return apiRequest<BoardDiscussionDetail>({ section: SECTION, path: `/discussions/${id}` })
}

/** POST /api/board/discussions — создаёт обсуждение по компании в целом с первой репликой. */
export function createDiscussion(message: string): Promise<BoardDiscussionDetail> {
  return apiRequest<BoardDiscussionDetail>({
    section: SECTION,
    path: '/discussions',
    method: 'POST',
    body: { message },
  })
}

/** POST /api/board/discussions/:id/messages — добавляет реплику и возвращает ответ совета. */
export function postDiscussionMessage(id: number, message: string): Promise<BoardDiscussionMessage> {
  return apiRequest<BoardDiscussionMessage>({
    section: SECTION,
    path: `/discussions/${id}/messages`,
    method: 'POST',
    body: { message },
  })
}

/** POST /api/board/actualize (только для админа) */
export function actualize(): Promise<ActualizeResult> {
  return apiRequest<ActualizeResult>({ section: SECTION, path: '/actualize', method: 'POST' })
}

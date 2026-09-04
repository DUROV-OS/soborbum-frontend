import { apiRequest } from '@/shared/lib/httpClient'
import { ContentItem } from './types'

const SECTION = 'marketing'

/** GET /api/marketing/calendar */
export function listContent(filters: { date_from?: string; date_to?: string } = {}): Promise<ContentItem[]> {
  return apiRequest<ContentItem[]>({ section: SECTION, path: '/calendar', query: filters })
}

/** GET /api/marketing/content/:id */
export function getContent(id: number): Promise<ContentItem> {
  return apiRequest<ContentItem>({ section: SECTION, path: `/content/${id}` })
}

export interface CreateContentInput {
  title: string
  description?: string
  planned_release_date?: string
  platforms?: string[]
  assignee_ids?: number[]
}

/** POST /api/marketing/content */
export function createContent(input: CreateContentInput): Promise<ContentItem> {
  return apiRequest<ContentItem>({ section: SECTION, path: '/content', method: 'POST', body: input })
}

export interface UpdateBasicInput {
  title?: string
  description?: string
  planned_release_date?: string
  platforms?: string[]
  assignee_ids?: number[]
}

/** PATCH /api/marketing/content/:id */
export function updateBasic(id: number, patch: UpdateBasicInput): Promise<ContentItem> {
  return apiRequest<ContentItem>({ section: SECTION, path: `/content/${id}`, method: 'PATCH', body: patch })
}

/** PATCH /api/marketing/content/:id/raw */
export function updateRaw(id: number, raw_texts?: string): Promise<ContentItem> {
  return apiRequest<ContentItem>({ section: SECTION, path: `/content/${id}/raw`, method: 'PATCH', body: { raw_texts } })
}

/** PATCH /api/marketing/content/:id/final */
export function updateFinal(id: number, final_texts?: string): Promise<ContentItem> {
  return apiRequest<ContentItem>({ section: SECTION, path: `/content/${id}/final`, method: 'PATCH', body: { final_texts } })
}

/** PUT /api/marketing/content/:id/post-links */
export function setPostLinks(id: number, links: { platform: string; url: string }[]): Promise<ContentItem> {
  return apiRequest<ContentItem>({ section: SECTION, path: `/content/${id}/post-links`, method: 'PUT', body: links })
}

/** PATCH /api/marketing/content/:id/analysis */
export function updateAnalysis(
  id: number,
  patch: { analysis_notes?: string; analysis_reach?: Record<string, number> },
): Promise<ContentItem> {
  return apiRequest<ContentItem>({ section: SECTION, path: `/content/${id}/analysis`, method: 'PATCH', body: patch })
}

/** POST /api/marketing/content/:id/transition */
export function advanceStage(id: number): Promise<ContentItem> {
  return apiRequest<ContentItem>({ section: SECTION, path: `/content/${id}/transition`, method: 'POST' })
}

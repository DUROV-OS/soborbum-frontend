import { Account } from '@/auth/types'
import { FileAsset } from '@/clients/types'

export type ContentStage = 'idea' | 'gathering' | 'editing' | 'release' | 'analysis'

export const CONTENT_STAGES: { key: ContentStage; label: string }[] = [
  { key: 'idea', label: 'Идея' },
  { key: 'gathering', label: 'Сбор материала' },
  { key: 'editing', label: 'Редактирование' },
  { key: 'release', label: 'Выпуск' },
  { key: 'analysis', label: 'Анализ' },
]

export interface PostLink {
  id: number
  platform: string
  url: string
}

export interface ContentItem {
  id: number
  title: string
  description: string | null
  planned_release_date: string | null
  platforms: string[]
  stage: ContentStage
  created_at: string
  assignees: Account[]
  raw_texts: string | null
  raw_files: FileAsset[]
  raw_locked_at: string | null
  final_texts: string | null
  final_files: FileAsset[]
  post_links: PostLink[]
  analysis_notes: string | null
  analysis_reach: Record<string, number> | null
}

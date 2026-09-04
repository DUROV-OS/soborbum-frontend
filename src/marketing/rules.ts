import { ContentItem, ContentStage, CONTENT_STAGES } from './types'

const STAGE_ORDER = CONTENT_STAGES.map((s) => s.key)

export function stageIndex(stage: ContentStage): number {
  return STAGE_ORDER.indexOf(stage)
}

export function stageLabel(stage: ContentStage): string {
  return CONTENT_STAGES.find((s) => s.key === stage)?.label ?? stage
}

export function nextStageOf(stage: ContentStage): ContentStage | null {
  const index = stageIndex(stage)
  return index < STAGE_ORDER.length - 1 ? STAGE_ORDER[index + 1] : null
}

export type ContentFieldGroup = 'raw' | 'final' | 'postLinks' | 'analysis'

const GROUP_APPEARS_AT: Record<ContentFieldGroup, ContentStage> = {
  raw: 'gathering',
  final: 'editing',
  postLinks: 'release',
  analysis: 'analysis',
}

export function isGroupVisible(item: ContentItem, group: ContentFieldGroup): boolean {
  return stageIndex(item.stage) >= stageIndex(GROUP_APPEARS_AT[group])
}

/** Только «сырой материал» запирается после перехода — остальные группы редактируемы всегда после появления. */
export function isGroupEditable(item: ContentItem, group: ContentFieldGroup): boolean {
  if (group === 'raw') return item.raw_locked_at === null
  return true
}

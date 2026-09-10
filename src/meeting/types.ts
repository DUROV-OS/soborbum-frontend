export type MeetingStatus = 'recording' | 'finished'

export interface MeetingOut {
  id: number
  title: string | null
  status: MeetingStatus
  started_at: string
  finished_at: string | null
  duration_sec: number | null
  has_audio: boolean
}

export interface MeetingDetailOut extends MeetingOut {
  audio_url: string | null
  /** Наполняется в 0004-b (реплики) и 0004-c (заметки); в 0004-a всегда пусто. */
  transcript: unknown[]
  notes: Record<string, unknown> | null
  ai_enabled: boolean
}

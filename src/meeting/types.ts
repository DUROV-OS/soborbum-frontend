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

export interface TranscriptLineOut {
  id: number
  speaker: string
  text: string
  at_ms: number
}

export interface MeetingDetailOut extends MeetingOut {
  audio_url: string | null
  transcript: TranscriptLineOut[]
  /** Заметки Марины — 0004-c. */
  notes: Record<string, unknown> | null
  ai_enabled: boolean
}

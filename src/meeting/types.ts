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
  is_assistant_query: boolean
}

export interface MeetingNotesOut {
  summary: string
  decisions: string[]
  tasks: string[]
  questions: string[]
  source_line_count: number
  updated_at: string
  /** true — последний вызов модели не удался, показана прошлая версия */
  stale: boolean
}

export interface MeetingDetailOut extends MeetingOut {
  audio_url: string | null
  transcript: TranscriptLineOut[]
  notes: MeetingNotesOut | null
  ai_enabled: boolean
}

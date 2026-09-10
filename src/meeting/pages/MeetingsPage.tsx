import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowLeft, Mic } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Chip } from '@/shared/ui/Chip'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { fetchMeetingAudioObjectUrl, getMeeting, listMeetings } from '../api'
import { MeetingDetailOut, MeetingOut } from '../types'

function meetingTitle(meeting: Pick<MeetingOut, 'title' | 'started_at'>): string {
  if (meeting.title) return meeting.title
  return `Совещание от ${format(new Date(meeting.started_at), 'd MMMM yyyy', { locale: ru })}`
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  const mm = Math.floor(seconds / 60)
  const ss = seconds % 60
  return mm > 0 ? `${mm} мин ${ss} с` : `${ss} с`
}

function formatClock(totalSeconds: number): string {
  const mm = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const ss = (totalSeconds % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

function StatusChip({ status }: { status: MeetingOut['status'] }) {
  return status === 'recording' ? (
    <Chip tone="warning">идёт запись</Chip>
  ) : (
    <Chip tone="neutral">завершено</Chip>
  )
}

function MeetingList() {
  const [meetings, setMeetings] = useState<MeetingOut[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listMeetings()
      .then(setMeetings)
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить совещания'))
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-[20px] font-medium text-ink">Совещания</h1>
        <p className="mt-1 text-[13px] text-muted">Записи, транскрипты и заметки прошлых совещаний.</p>
      </div>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2.5 text-[13px] text-danger">
          {error}
        </div>
      )}

      {!meetings && !error && <LoadingState label="Загружаем совещания…" />}

      {meetings && meetings.length === 0 && (
        <EmptyState
          icon={<Mic size={26} />}
          title="Пока нет совещаний"
          description="Запустите режим «Совещание» кнопкой с микрофоном в верхней панели."
        />
      )}

      {meetings && meetings.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border bg-surface">
          {meetings.map((meeting) => (
            <li key={meeting.id}>
              <Link
                to={`/meetings/${meeting.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-ink">{meetingTitle(meeting)}</div>
                  <div className="mt-0.5 text-[12px] text-muted">
                    {format(new Date(meeting.started_at), 'd MMM yyyy, HH:mm', { locale: ru })} ·{' '}
                    {formatDuration(meeting.duration_sec)}
                  </div>
                </div>
                <StatusChip status={meeting.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MeetingAudio({ meetingId, hasAudio }: { meetingId: number; hasAudio: boolean }) {
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasAudio) return
    let objectUrl: string | null = null
    let cancelled = false
    fetchMeetingAudioObjectUrl(meetingId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url) // размонтировались, пока грузилось — не течём
          return
        }
        objectUrl = url
        setSrc(url)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить запись')
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [meetingId, hasAudio])

  if (!hasAudio) return <p className="text-[13px] text-muted">Запись аудио не сохранена.</p>
  if (error) return <p className="text-[13px] text-danger">{error}</p>
  if (!src) return <p className="text-[13px] text-muted">Загружаем запись…</p>
  return <audio controls src={src} className="w-full" />
}

function MeetingDetail({ id }: { id: number }) {
  const [meeting, setMeeting] = useState<MeetingDetailOut | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMeeting(null)
    setError(null)
    getMeeting(id)
      .then(setMeeting)
      .catch((e) => setError(e instanceof Error ? e.message : 'Совещание не найдено'))
  }, [id])

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/meetings" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:underline">
        <ArrowLeft size={14} />К списку совещаний
      </Link>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2.5 text-[13px] text-danger">
          {error}
        </div>
      )}

      {!meeting && !error && <LoadingState label="Загружаем совещание…" />}

      {meeting && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[20px] font-medium text-ink">{meetingTitle(meeting)}</h1>
              <p className="mt-1 text-[13px] text-muted">
                {format(new Date(meeting.started_at), 'd MMMM yyyy, HH:mm', { locale: ru })} ·{' '}
                {formatDuration(meeting.duration_sec)}
              </p>
            </div>
            <StatusChip status={meeting.status} />
          </div>

          <section className="rounded-md border border-border bg-surface p-4">
            <h2 className="mb-3 text-[14px] font-medium text-ink">Запись</h2>
            <MeetingAudio meetingId={meeting.id} hasAudio={meeting.has_audio} />
          </section>

          <section className="rounded-md border border-border bg-surface p-4">
            <h2 className="mb-3 text-[14px] font-medium text-ink">Транскрипт</h2>
            {meeting.transcript.length === 0 ? (
              <p className="text-[13px] text-muted">Транскрипт не записан.</p>
            ) : (
              <div className="space-y-2.5">
                {meeting.transcript.map((line) => (
                  <div key={line.id} className="text-[13px]">
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <span className="font-medium">{line.speaker}</span>
                      <span className="tabular-nums">
                        {formatClock(Math.floor(line.at_ms / 1000))}
                      </span>
                    </div>
                    <p className="mt-0.5 text-ink">{line.text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-md border border-dashed border-border bg-surface p-4 text-[13px] text-muted">
            <h2 className="mb-1 text-[14px] font-medium text-ink">Заметки Марины</h2>
            Появятся в следующем шаге фичи (0004-c).
          </section>
        </>
      )}
    </div>
  )
}

export function MeetingsPage() {
  const { id } = useParams<{ id: string }>()
  const numericId = id ? Number(id) : null
  if (numericId !== null && !Number.isNaN(numericId)) return <MeetingDetail id={numericId} />
  return <MeetingList />
}

import { FormEvent, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowLeft, Mic, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '@/shared/lib/httpClient'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Markdown } from '@/shared/ui/Markdown'
import {
  askMeeting,
  downloadMeetingDocument,
  fetchMeetingAudioObjectUrl,
  getMeeting,
  listMeetings,
  refreshNotes,
} from '../api'
import { NotesView } from '../components/NotesView'
import { useMeetingStore } from '../store'
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

function StartMeetingCircle() {
  const phase = useMeetingStore((s) => s.phase)
  const start = useMeetingStore((s) => s.start)
  const openPanel = useMeetingStore((s) => s.openPanel)
  const busy = phase === 'starting' || phase === 'recording' || phase === 'finishing'

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <button
        type="button"
        onClick={() => (busy ? openPanel() : void start())}
        className={`flex h-36 w-36 flex-col items-center justify-center gap-2 rounded-full border-2 text-center transition-colors ${
          busy
            ? 'border-amber-400 bg-amber-50 text-amber-700'
            : 'border-amber-300 bg-amber-50/60 text-amber-700 hover:bg-amber-100'
        }`}
      >
        {busy ? (
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
        ) : (
          <Mic size={30} />
        )}
        <span className="px-2 text-[13px] font-medium leading-tight">
          {busy ? 'Идёт совещание' : 'Начать совещание'}
        </span>
      </button>
      {busy && (
        <button
          type="button"
          onClick={openPanel}
          className="text-[12px] text-muted hover:underline"
        >
          Открыть панель
        </button>
      )}
    </div>
  )
}

function MeetingList() {
  const [meetings, setMeetings] = useState<MeetingOut[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const phase = useMeetingStore((s) => s.phase)

  useEffect(() => {
    // перезагружаем список, когда совещание сохранилось
    listMeetings()
      .then(setMeetings)
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить совещания'))
  }, [phase])

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-[20px] font-medium text-ink">Совещания</h1>
        <p className="mt-1 text-[13px] text-muted">Записи, транскрипты и заметки прошлых совещаний.</p>
      </div>

      <StartMeetingCircle />

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
          description="Нажмите «Начать совещание» выше — Марина запишет разговор и составит транскрипт."
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

function AskMarina({ meetingId, aiEnabled }: { meetingId: number; aiEnabled: boolean }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const q = question.trim()
    if (!q || pending) return
    setPending(true)
    setError(null)
    setAnswer(null)
    try {
      const res = await askMeeting(meetingId, q)
      setAnswer(res.answer_markdown)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось получить ответ')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <h2 className="mb-1 flex items-center gap-1.5 text-[14px] font-medium text-ink">
        <Sparkles size={15} className="text-amber-600" />
        Спросить Марину
      </h2>
      <p className="mb-3 text-[12px] text-muted">
        Ответит по транскрипту этого совещания и, если нужно, сверится с базой знаний.
      </p>

      {!aiEnabled ? (
        <p className="text-[13px] text-muted">
          ИИ отключён: не задан ключ. Вопросы по совещанию недоступны.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            placeholder="Например: какие решения приняли и кто ответственный?"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-ink"
          />
          <Button type="submit" size="sm" disabled={pending || !question.trim()}>
            {pending ? 'Марина думает…' : 'Спросить'}
          </Button>
        </form>
      )}

      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
      {answer && (
        <div className="mt-3 rounded-md border border-border bg-surface-muted/40 p-3 text-[13px] text-ink">
          <Markdown text={answer} />
        </div>
      )}
    </section>
  )
}

function MeetingNotesSection({ meeting }: { meeting: MeetingDetailOut }) {
  const [notes, setNotes] = useState(meeting.notes)
  const [busy, setBusy] = useState<'notes' | 'doc' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRefresh() {
    setBusy('notes')
    setError(null)
    try {
      setNotes(await refreshNotes(meeting.id))
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 409
          ? 'ИИ-заметки отключены: не задан ключ.'
          : 'Не удалось обновить заметки.',
      )
    } finally {
      setBusy(null)
    }
  }

  async function handleDownload() {
    setBusy('doc')
    setError(null)
    try {
      const date = format(new Date(meeting.started_at), 'yyyy-MM-dd')
      await downloadMeetingDocument(meeting.id, `meeting-${meeting.id}-${date}.md`)
    } catch {
      setError('Не удалось скачать документ.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-medium text-ink">Заметки Марины</h2>
        <div className="flex items-center gap-3">
          {meeting.ai_enabled && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={busy !== null}
              className="text-[12px] text-brand-dark hover:underline disabled:opacity-50"
            >
              {busy === 'notes' ? 'Обновляем…' : 'Обновить'}
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={busy !== null}
            className="text-[12px] text-brand-dark hover:underline disabled:opacity-50"
          >
            {busy === 'doc' ? 'Готовим…' : 'Документ для базы знаний'}
          </button>
        </div>
      </div>

      {!meeting.ai_enabled && (
        <p className="mb-2 text-[13px] text-muted">
          ИИ-заметки отключены: не задан ключ. Документ для базы знаний соберётся с транскриптом и
          пустыми секциями заметок.
        </p>
      )}
      {meeting.ai_enabled && <NotesView notes={notes} />}
      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
    </section>
  )
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
                      {line.is_assistant_query && (
                        <span className="inline-flex items-center gap-0.5 text-amber-600">
                          <Sparkles size={11} />к Марине
                        </span>
                      )}
                    </div>
                    <p className={`mt-0.5 ${line.is_assistant_query ? 'text-amber-700' : 'text-ink'}`}>
                      {line.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <MeetingNotesSection meeting={meeting} />

          <AskMarina meetingId={meeting.id} aiEnabled={meeting.ai_enabled} />
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

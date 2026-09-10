import { MeetingNotesOut } from '../types'

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <div className="text-[12px] font-medium uppercase tracking-wide text-muted">{title}</div>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[13px] text-ink">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function NotesView({ notes }: { notes: MeetingNotesOut | null }) {
  if (!notes) {
    return <p className="text-[13px] text-muted">Заметки ещё не сформированы.</p>
  }
  const empty =
    !notes.summary &&
    notes.decisions.length === 0 &&
    notes.tasks.length === 0 &&
    notes.questions.length === 0

  return (
    <div className="space-y-3">
      {notes.stale && (
        <p className="text-[12px] text-warning">Не удалось обновить — показана прошлая версия.</p>
      )}
      {notes.summary && <p className="text-[13px] text-ink">{notes.summary}</p>}
      <Section title="Решения" items={notes.decisions} />
      <Section title="Задачи" items={notes.tasks} />
      <Section title="Вопросы" items={notes.questions} />
      {empty && <p className="text-[13px] text-muted">Пока нечего отметить — говорите дальше.</p>}
    </div>
  )
}

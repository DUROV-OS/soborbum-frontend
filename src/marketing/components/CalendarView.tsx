import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { ContentItem } from '../types'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

export function CalendarView({ items, onSelect }: { items: ContentItem[]; onSelect: (item: ContentItem) => void }) {
  const [month, setMonth] = useState(startOfMonth(new Date()))

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })

  const days: Date[] = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d)

  function itemsOn(day: Date) {
    return items.filter((item) => item.planned_release_date && isSameDay(new Date(item.planned_release_date), day))
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-medium capitalize text-ink">{format(month, 'LLLL yyyy', { locale: ru })}</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="rounded-pill p-1.5 text-muted hover:bg-surface-muted hover:text-ink"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="rounded-pill p-1.5 text-muted hover:bg-surface-muted hover:text-ink"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-border bg-border">
        {WEEKDAYS.map((day) => (
          <div key={day} className="bg-surface-muted px-2 py-1.5 text-[11px] font-medium text-muted">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayItems = itemsOn(day)
          return (
            <div
              key={day.toISOString()}
              className={`min-h-24 bg-surface p-1.5 ${isSameMonth(day, month) ? '' : 'opacity-40'}`}
            >
              <div className="mb-1 text-[11px] text-muted">{format(day, 'd')}</div>
              <div className="flex flex-col gap-1">
                {dayItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item)}
                    className="truncate rounded-sm bg-brand/10 px-1.5 py-0.5 text-left text-[11px] text-brand-dark hover:bg-brand/20"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

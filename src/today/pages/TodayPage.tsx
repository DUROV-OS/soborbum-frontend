import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CalendarDays, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { HelpButton } from '@/shared/ui/HelpButton'
import { Markdown } from '@/shared/ui/Markdown'
import { OnboardingDialog, OnboardingPage } from '@/shared/ui/OnboardingDialog'
import { StatWidget } from '@/shared/ui/StatWidget'
import { useSectionOnboarding } from '@/shared/lib/useSectionOnboarding'
import { useTodayStore } from '../store'

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    title: 'Сводка на день',
    body: (
      <p>
        «Сегодня» — стартовая страница системы. ИИ каждый раз собирает короткую сводку о состоянии всего
        предприятия сразу: клиенты, производство, монтаж, склад, маркетинг и задачи.
      </p>
    ),
  },
  {
    title: 'Показатели по разделам',
    body: (
      <p>
        Ниже текстовой сводки — карточки с цифрами: например, сколько клиентов на каждой стадии, каких
        материалов не хватает на складе, сколько задач просрочено. Карточки кликабельны — нажатие переносит в
        соответствующий раздел. Показываются только те карточки, к разделам которых у вас есть доступ.
      </p>
    ),
  },
  {
    title: 'Обновление данных',
    body: (
      <p>
        Кнопка «Обновить» в правом верхнем углу пересобирает сводку и цифры прямо сейчас, не дожидаясь
        автоматического обновления.
      </p>
    ),
  },
]

const SECTION_PATHS: Record<string, string> = {
  clients: '/clients',
  production: '/production',
  installation: '/montage',
  cycle: '/cycles',
  warehouse: '/warehouse',
  marketing: '/marketing',
  tasks: '/tasks',
  users: '/admin',
}

function sectionPath(section: string): string | undefined {
  return SECTION_PATHS[section]
}

export function TodayPage() {
  const data = useTodayStore((s) => s.data)
  const loading = useTodayStore((s) => s.loading)
  const error = useTodayStore((s) => s.error)
  const load = useTodayStore((s) => s.load)
  const onboarding = useSectionOnboarding('today')
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, [load])

  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  const widgets = data?.widgets ?? []

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Сегодня</h1>
          <p className="mt-1 text-[13px] text-muted capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button variant="secondary" size="sm" onClick={() => load(true)} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Обновить
          </Button>
          <HelpButton onClick={onboarding.show} />
        </div>
      </div>

      {loading && !data && (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border px-6 py-14 text-center text-[13px] text-muted">
          Собираем сводку по предприятию…
        </div>
      )}

      {error && (
        <EmptyState
          icon={<AlertCircle size={28} />}
          title="Не удалось загрузить сводку"
          description={error}
          action={
            <Button size="sm" onClick={() => load()}>
              Повторить
            </Button>
          }
        />
      )}

      {!loading && !error && data && (
        <div className="flex flex-col gap-6">
          <div className="rounded-md border border-border bg-surface p-4 text-[14px] text-ink">
            {data.summary ? <Markdown text={data.summary} /> : 'Сводка пуста.'}
          </div>

          {widgets.length === 0 && (
            <EmptyState
              icon={<CalendarDays size={28} />}
              title="Пока нечего показать"
              description="Нет ни одного раздела с данными для сводки."
            />
          )}

          {widgets.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {widgets.map((widget, index) => {
                const path = sectionPath(widget.section)
                return (
                  <StatWidget
                    key={`${widget.section}-${index}`}
                    label={widget.title}
                    value={widget.value}
                    hint={widget.hint ?? undefined}
                    tone={widget.tone}
                    onClick={path ? () => navigate(path) : undefined}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      <OnboardingDialog
        open={onboarding.open}
        onClose={onboarding.close}
        title="Раздел «Сегодня»"
        pages={ONBOARDING_PAGES}
      />
    </div>
  )
}

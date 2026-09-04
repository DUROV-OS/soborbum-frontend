import { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/auth/store'
import { Chip, ChipTone } from '@/shared/ui/Chip'
import { Markdown } from '@/shared/ui/Markdown'
import { getSectionAnalytics } from '../api'
import { AnalyticsSection, SectionAnalyticsOut, SectionAnalyticsStatus } from '../types'

/** Цвет обводки блока — свой на каждый раздел, чтобы резюме узнавалось с первого взгляда. */
const SECTION_BORDER: Record<AnalyticsSection, string> = {
  clients: 'border-sky-300',
  production: 'border-orange-300',
  installation: 'border-violet-300',
  cycle: 'border-teal-300',
  warehouse: 'border-stone-300',
  marketing: 'border-fuchsia-300',
  tasks: 'border-indigo-300',
}

const STATUS_TONE: Record<SectionAnalyticsStatus, ChipTone> = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
}

const STATUS_LABEL: Record<SectionAnalyticsStatus, string> = {
  green: 'Всё в порядке',
  yellow: 'Нужно внимание',
  red: 'Критично',
}

export function SectionAnalyticsCard({ section }: { section: AnalyticsSection }) {
  const hasAccess = useAuthStore((s) => s.hasAccess)
  const canShow = hasAccess('ai')

  const [data, setData] = useState<SectionAnalyticsOut | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setData(await getSectionAnalytics(section))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить ИИ-резюме')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canShow) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canShow, section])

  if (!canShow) return null

  return (
    <div className={`mb-5 rounded-md border ${SECTION_BORDER[section]} bg-surface p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
          <Sparkles size={15} className="text-brand-dark" />
          ИИ-резюме
        </div>
        <div className="flex items-center gap-2">
          {data && <Chip tone={STATUS_TONE[data.status]}>{STATUS_LABEL[data.status]}</Chip>}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Обновить ИИ-резюме"
            className="rounded-pill p-1 text-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="mt-2 text-[13px] leading-relaxed text-ink">
        {loading && !data && <span className="text-muted">Собираем аналитику…</span>}
        {!loading && error && (
          <span className="flex items-center gap-1.5 text-danger">
            <AlertCircle size={14} />
            {error}
          </span>
        )}
        {!loading && !error && data && <Markdown text={data.summary} />}
      </div>
    </div>
  )
}

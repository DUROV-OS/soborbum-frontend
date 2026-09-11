import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FileSpreadsheet, Sparkles, Upload } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { Modal } from '@/shared/ui/Modal'
import { useSuppliersStore } from '../store'
import { IMPORT_FIELD_LABEL, PriceListImportResult } from '../types'

export function PriceListImportModal({
  supplierId,
  open,
  onClose,
}: {
  supplierId: number
  open: boolean
  onClose: () => void
}) {
  const importPriceList = useSuppliersStore((s) => s.importPriceList)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PriceListImportResult | null>(null)

  function close() {
    setResult(null)
    setError(null)
    setBusy(false)
    onClose()
  }

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    setResult(null)
    const res = await importPriceList(supplierId, file)
    setBusy(false)
    if (res.ok && res.result) setResult(res.result)
    else setError(res.reason ?? 'Не удалось импортировать файл')
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Загрузить прайс-лист таблицей"
      width="max-w-xl"
      footer={
        result ? (
          <Button onClick={close}>Готово</Button>
        ) : (
          <Button variant="ghost" onClick={close}>
            Закрыть
          </Button>
        )
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) handleFile(file)
        }}
      />

      {!result && (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-muted">
            Файл <span className="text-ink">.xlsx</span> или <span className="text-ink">.csv</span>: первая строка —
            заголовки. ИИ сам определит, где материал, цена, категория и срок; чего не хватает — заполнит пустым и
            поставит задачу дозаполнить. Строки добавляются к текущему прайсу.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-md border border-dashed border-border px-4 py-8 text-[13px] text-muted hover:border-brand/40 hover:text-brand disabled:opacity-50"
          >
            <Upload size={20} />
            {busy ? 'Разбираем файл и размечаем колонки…' : 'Выбрать файл'}
          </button>
          {error && <p className="text-[12px] text-danger">{error}</p>}
        </div>
      )}

      {result && <ImportReport result={result} onOpenTask={() => navigate('/tasks')} />}
    </Modal>
  )
}

function ImportReport({
  result,
  onOpenTask,
}: {
  result: PriceListImportResult
  onOpenTask: () => void
}) {
  const map = result.column_mapping
  const rows: [string, string | null][] = [
    ['material', map.material],
    ['price', map.price],
    ['category', map.category],
    ['lead_time', map.lead_time],
  ]

  return (
    <div className="flex flex-col gap-4 text-[13px]">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className="text-success" />
        <span className="text-ink">
          Добавлено строк: <b>{result.imported}</b>
          {result.skipped > 0 && <span className="text-muted"> · пропущено: {result.skipped}</span>}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[12px] text-muted">
        {result.ai_used ? (
          <>
            <Sparkles size={13} className="text-ai-accent" /> колонки разметил ИИ
          </>
        ) : (
          <>
            <FileSpreadsheet size={13} /> {result.note || 'разметка без ИИ'}
          </>
        )}
      </div>

      <div>
        <div className="mb-1.5 font-medium text-ink">Колонки файла</div>
        <div className="flex flex-col gap-1">
          {rows.map(([field, header]) => (
            <div key={field} className="flex items-center justify-between gap-2">
              <span className="text-muted">{IMPORT_FIELD_LABEL[field]}</span>
              {header ? (
                <span className="text-ink">«{header}»</span>
              ) : (
                <span className="text-[12px] text-danger">не найдена</span>
              )}
            </div>
          ))}
          {map.qty_breaks.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted">Цена по партии</span>
              <span className="text-ink">{map.qty_breaks.map((h) => `«${h}»`).join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {result.missing_fields.length > 0 && (
        <div>
          <div className="mb-1.5 font-medium text-ink">Не хватает данных</div>
          <div className="flex flex-wrap gap-1.5">
            {result.missing_fields.map((f) => (
              <Chip key={f} tone="warning">
                {IMPORT_FIELD_LABEL[f] ?? f}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {result.task_id != null && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-muted/50 px-3 py-2">
          <span className="text-muted">Создана задача «дозаполнить прайс»</span>
          <Button size="sm" variant="secondary" onClick={onOpenTask}>
            Открыть задачи
          </Button>
        </div>
      )}
    </div>
  )
}

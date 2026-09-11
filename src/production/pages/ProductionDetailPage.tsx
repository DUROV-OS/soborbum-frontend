import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AskAiButton } from '@/ai/components/AskAiButton'
import { useAuthStore } from '@/auth/store'
import { Button } from '@/shared/ui/Button'
import { Field, Input, Textarea } from '@/shared/ui/Field'
import { Modal } from '@/shared/ui/Modal'
import { useProductionStore } from '../store'

export function ProductionDetailPage() {
  const { id = '' } = useParams()
  const productionId = Number(id)
  const production = useProductionStore((s) => s.production)
  const loadProduction = useProductionStore((s) => s.loadProduction)
  const deleteProduction = useProductionStore((s) => s.deleteProduction)
  const isAdmin = useAuthStore((s) => s.current?.role === 'admin')
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    loadProduction(productionId)
  }, [productionId, loadProduction])

  if (!production || production.id !== productionId) {
    return <p className="text-[13px] text-muted">Загрузка…</p>
  }

  async function handleDelete() {
    if (!production) return
    if (!window.confirm(`Удалить производство №${production.id}? Отменить нельзя.`)) return
    setDeleting(true)
    const result = await deleteProduction(production.id)
    if (result.ok) {
      navigate('/production', { replace: true })
      return
    }
    setDeleting(false)
    setDeleteError(result.reason ?? 'Не удалось удалить производство')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/production" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft size={14} />
        Все производства
      </Link>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[18px] font-medium text-ink">
          Производство №{production.id}
          {production.name && production.name !== 'Дом' && (
            <span className="ml-2 text-[13px] font-normal text-muted">· {production.name}</span>
          )}
        </h1>
        <div className="flex gap-2 self-start">
          <AskAiButton domain="production" contextLabel={`Производство №${production.id}`} contextNote={`[production_id=${production.id}] `} />
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={16} />
            Модуль
          </Button>
          {isAdmin && (
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
              <Trash2 size={14} />
              {deleting ? 'Удаление…' : 'Удалить производство'}
            </Button>
          )}
        </div>
      </div>
      {deleteError && <p className="mb-4 text-[12px] text-danger">{deleteError}</p>}

      <div className="flex flex-col gap-3">
        {production.modules.map((module) => (
          <button
            key={module.id}
            type="button"
            onClick={() => navigate(`/production/modules/${module.id}`)}
            className="rounded-md border border-border bg-surface p-4 text-left transition-colors hover:border-brand/40"
          >
            <div className="text-[14px] font-medium text-ink">{module.name}</div>
            {module.description && <div className="mt-1 text-[13px] text-muted">{module.description}</div>}
            <div className="mt-2 text-[12px] text-muted">{module.materials.length} материал(ов)</div>
          </button>
        ))}
        {production.modules.length === 0 && (
          <p className="text-[13px] text-muted">Модулей пока нет — добавьте первый.</p>
        )}
      </div>

      <CreateModuleModal productionId={production.id} open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}

function CreateModuleModal({
  productionId,
  open,
  onClose,
}: {
  productionId: number
  open: boolean
  onClose: () => void
}) {
  const createModule = useProductionStore((s) => s.createModule)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setName('')
    setDescription('')
    setError(null)
  }

  async function handleSubmit() {
    if (!name) return
    setSaving(true)
    const result = await createModule(productionId, name, description || undefined)
    setSaving(false)
    if (result.ok) {
      reset()
      onClose()
    } else {
      setError(result.reason ?? 'Не удалось создать модуль')
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Новый модуль"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!name || saving}>
            {saving ? 'Сохранение…' : 'Создать'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Название" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Модуль 1" />
        </Field>
        <Field label="Описание">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

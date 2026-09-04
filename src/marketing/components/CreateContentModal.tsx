import { useState } from 'react'
import { useAuthStore } from '@/auth/store'
import { Button } from '@/shared/ui/Button'
import { Field, Input, Textarea } from '@/shared/ui/Field'
import { Modal } from '@/shared/ui/Modal'
import { useMarketingStore } from '../store'

export function CreateContentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const accounts = useAuthStore((s) => s.accounts)
  const create = useMarketingStore((s) => s.create)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [releaseDate, setReleaseDate] = useState('')
  const [platforms, setPlatforms] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTitle('')
    setDescription('')
    setReleaseDate('')
    setPlatforms('')
    setAssigneeIds([])
    setError(null)
  }

  async function handleSubmit() {
    if (!title) return
    setSaving(true)
    const result = await create({
      title,
      description: description || undefined,
      planned_release_date: releaseDate || undefined,
      platforms: platforms ? platforms.split(',').map((p) => p.trim()).filter(Boolean) : undefined,
      assignee_ids: assigneeIds,
    })
    setSaving(false)
    if (result.ok) {
      reset()
      onClose()
    } else {
      setError(result.reason ?? 'Не удалось создать')
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Новая единица контента"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!title || saving}>
            {saving ? 'Сохранение…' : 'Создать'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Название" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Рилс про монтаж модуля" />
        </Field>
        <Field label="Описание">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Дата выпуска">
            <Input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
          </Field>
          <Field label="Платформы" hint="через запятую">
            <Input value={platforms} onChange={(e) => setPlatforms(e.target.value)} placeholder="Instagram, VK" />
          </Field>
        </div>
        {accounts.length > 0 && (
          <Field label="Исполнители">
            <div className="flex flex-col gap-1.5">
              {accounts.map((account) => (
                <label key={account.id} className="flex items-center gap-2 text-[13px] text-ink">
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(account.id)}
                    onChange={(e) =>
                      setAssigneeIds((prev) =>
                        e.target.checked ? [...prev, account.id] : prev.filter((id) => id !== account.id),
                      )
                    }
                    className="h-4 w-4 accent-[#395b4b]"
                  />
                  {account.full_name}
                </label>
              ))}
            </div>
          </Field>
        )}
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { ASSIGNABLE_SECTIONS, SectionId } from '@/shared/sections'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'
import { Modal } from '@/shared/ui/Modal'
import { useAuthStore } from '../store'

export function AccessMatrixPage() {
  const accounts = useAuthStore((s) => s.accounts)
  const loadAccounts = useAuthStore((s) => s.loadAccounts)
  const updateAccess = useAuthStore((s) => s.updateAccess)
  const addAccount = useAuthStore((s) => s.addAccount)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAccounts().catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить сотрудников'))
  }, [loadAccounts])

  const workers = accounts.filter((a) => a.role === 'worker')

  function toggle(accountId: number, section: SectionId, hasIt: boolean) {
    const account = accounts.find((a) => a.id === accountId)
    if (!account) return
    const next = hasIt
      ? account.module_access.filter((s) => s !== section)
      : [...account.module_access, section]
    updateAccess(accountId, next)
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-ink">Матрица доступа</h1>
          <p className="mt-1 text-[13px] text-muted">
            Доступ к разделу — либо есть, либо нет. Администраторы видят всё всегда.
          </p>
        </div>
        <Button className="self-start" onClick={() => setCreating(true)}>
          <Plus size={16} />
          Новый сотрудник
        </Button>
      </div>

      {error && <p className="mb-4 text-[13px] text-danger">{error}</p>}

      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              <th className="px-4 py-2.5 font-medium text-muted">Сотрудник</th>
              {ASSIGNABLE_SECTIONS.map((section) => (
                <th key={section.id} className="px-3 py-2.5 text-center font-medium text-muted">
                  {section.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workers.map((account) => (
              <tr key={account.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{account.full_name}</div>
                  <div className="text-[12px] text-muted">{account.email}</div>
                </td>
                {ASSIGNABLE_SECTIONS.map((section) => {
                  const hasIt = account.module_access.includes(section.id)
                  return (
                    <td key={section.id} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={hasIt}
                        onChange={() => toggle(account.id, section.id, hasIt)}
                        className="h-4 w-4 accent-[#395b4b]"
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateAccountModal open={creating} onClose={() => setCreating(false)} onCreate={addAccount} />
    </div>
  )
}

function CreateAccountModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (input: { email: string; password: string; full_name: string; module_access: SectionId[] }) => Promise<void>
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sections, setSections] = useState<SectionId[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setFullName('')
    setEmail('')
    setPassword('')
    setSections([])
    setError(null)
  }

  async function handleSubmit() {
    if (!fullName || !email || !password) return
    setSaving(true)
    try {
      await onCreate({ email, password, full_name: fullName, module_access: sections })
      reset()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать сотрудника')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Новый сотрудник"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!fullName || !email || !password || saving}>
            {saving ? 'Сохранение…' : 'Создать'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="ФИО" required>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван" />
        </Field>
        <Field label="Почта" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@example.com" />
        </Field>
        <Field label="Пароль" required>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Доступ к разделам">
          <div className="flex flex-col gap-2">
            {ASSIGNABLE_SECTIONS.map((section) => (
              <label key={section.id} className="flex items-center gap-2 text-[13px] text-ink">
                <input
                  type="checkbox"
                  checked={sections.includes(section.id)}
                  onChange={(e) =>
                    setSections((prev) =>
                      e.target.checked
                        ? [...prev, section.id]
                        : prev.filter((s) => s !== section.id),
                    )
                  }
                  className="h-4 w-4 accent-[#395b4b]"
                />
                {section.label}
              </label>
            ))}
          </div>
        </Field>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

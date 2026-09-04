import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'
import { Modal } from '@/shared/ui/Modal'
import { useClientsStore } from '../store'

export function CreateClientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useClientsStore((s) => s.create)
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [inn, setInn] = useState('')
  const [saving, setSaving] = useState(false)

  const valid = fullName && phone && email && inn

  function reset() {
    setFullName('')
    setPhone('')
    setEmail('')
    setInn('')
  }

  async function handleSubmit() {
    if (!valid) return
    setSaving(true)
    const client = await create({ fullName, phone, email, inn })
    setSaving(false)
    reset()
    onClose()
    navigate(`/clients/${client.id}`)
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Новый клиент"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || saving}>
            {saving ? 'Сохранение…' : 'Создать'}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-[13px] text-muted">
        Все поля обязательны. После создания базовые данные нельзя изменить.
      </p>
      <div className="flex flex-col gap-4">
        <Field label="ФИО" required>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
        </Field>
        <Field label="Телефон" required>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000-00-00" />
        </Field>
        <Field label="Почта" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@example.com" />
        </Field>
        <Field label="ИНН" required>
          <Input value={inn} onChange={(e) => setInn(e.target.value)} placeholder="770000000000" />
        </Field>
      </div>
    </Modal>
  )
}

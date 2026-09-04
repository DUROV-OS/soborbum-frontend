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
  const [passport, setPassport] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = fullName && phone && email && inn && passport && birthDate

  function reset() {
    setFullName('')
    setPhone('')
    setEmail('')
    setInn('')
    setPassport('')
    setBirthDate('')
    setError(null)
  }

  async function handleSubmit() {
    if (!valid) return
    setSaving(true)
    try {
      const client = await create({
        full_name: fullName,
        phone,
        email,
        inn,
        passport_number: passport,
        birth_date: birthDate,
      })
      reset()
      onClose()
      navigate(`/clients/${client.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать клиента')
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Телефон" required>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000-00-00" />
          </Field>
          <Field label="Почта" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@example.com" />
          </Field>
          <Field label="ИНН" required>
            <Input value={inn} onChange={(e) => setInn(e.target.value)} placeholder="770000000000" />
          </Field>
          <Field label="Паспорт" required>
            <Input value={passport} onChange={(e) => setPassport(e.target.value)} placeholder="0000 000000" />
          </Field>
        </div>
        <Field label="Дата рождения" required>
          <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </Field>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

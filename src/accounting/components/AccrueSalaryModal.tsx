import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'
import { Modal } from '@/shared/ui/Modal'
import { useAccountingStore } from '../store'

export function AccrueSalaryModal({
  employeeId,
  employeeName,
  onClose,
}: {
  employeeId: number | null
  employeeName: string | null
  onClose: () => void
}) {
  const accrueSalary = useAccountingStore((s) => s.accrueSalary)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = employeeId !== null

  function close() {
    setAmount('')
    setError(null)
    onClose()
  }

  async function submit() {
    if (employeeId === null) return
    const value = Number(amount)
    if (!amount || Number.isNaN(value) || value <= 0) {
      setError('Укажите положительную сумму')
      return
    }
    setBusy(true)
    setError(null)
    const result = await accrueSalary(employeeId, value)
    setBusy(false)
    if (result.ok) close()
    else setError(result.reason ?? 'Не удалось начислить зарплату')
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Начислить зарплату${employeeName ? ` — ${employeeName}` : ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? '…' : 'Начислить'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Сумма, ₽" required hint="Создаст проводку в статусе «Черновик».">
          <Input
            type="number"
            min="0"
            step="0.01"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

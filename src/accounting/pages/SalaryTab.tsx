import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { DataTable } from '@/shared/ui/DataTable'
import { EmptyState } from '@/shared/ui/EmptyState'
import { AccrueSalaryModal } from '../components/AccrueSalaryModal'
import { useAccountingStore } from '../store'
import { EmployeeSalaryOverview, STATUS_LABEL, STATUS_TONE } from '../types'

function money(amount: number): string {
  return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`
}

export function SalaryTab() {
  const overview = useAccountingStore((s) => s.salaryOverview)
  const loading = useAccountingStore((s) => s.salaryLoading)
  const load = useAccountingStore((s) => s.loadSalaryOverview)
  const advanceSalaryStatus = useAccountingStore((s) => s.advanceSalaryStatus)

  const [accruingFor, setAccruingFor] = useState<EmployeeSalaryOverview | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [load])

  async function advance(row: EmployeeSalaryOverview, to: 'approved' | 'posted') {
    if (!row.open_movement) return
    setError(null)
    setBusyId(row.employee_id)
    const result = await advanceSalaryStatus(row.open_movement.id, to)
    setBusyId(null)
    if (!result.ok) setError(result.reason ?? 'Не удалось выполнить действие')
  }

  if (!loading && overview.length === 0) {
    return (
      <EmptyState
        icon={<Users size={24} />}
        title="Сотрудников пока нет"
        description="Активные пользователи появятся здесь автоматически."
      />
    )
  }

  return (
    <div>
      {error && <p className="mb-3 text-[12px] text-danger">{error}</p>}
      <DataTable
        columns={[
          { header: 'Сотрудник', accessor: (row) => row.full_name },
          {
            header: 'Статус начисления',
            accessor: (row) =>
              row.open_movement ? (
                <Chip tone={STATUS_TONE[row.open_movement.status]}>
                  {STATUS_LABEL[row.open_movement.status]}
                </Chip>
              ) : (
                <span className="text-muted">Нет открытой проводки</span>
              ),
          },
          {
            header: 'Сумма',
            align: 'right',
            className: 'tabular',
            accessor: (row) => (row.open_movement ? money(row.open_movement.amount) : '—'),
          },
          {
            header: '',
            align: 'right',
            accessor: (row) => {
              const busy = busyId === row.employee_id
              if (!row.open_movement) {
                return (
                  <Button size="sm" disabled={busy} onClick={() => setAccruingFor(row)}>
                    Начислить
                  </Button>
                )
              }
              if (row.open_movement.status === 'draft') {
                return (
                  <Button size="sm" disabled={busy} onClick={() => advance(row, 'approved')}>
                    Утвердить
                  </Button>
                )
              }
              if (row.open_movement.status === 'approved') {
                return (
                  <Button size="sm" disabled={busy} onClick={() => advance(row, 'posted')}>
                    Выплатить
                  </Button>
                )
              }
              return null
            },
          },
        ]}
        rows={overview}
        keyOf={(row) => String(row.employee_id)}
        loading={loading}
        emptyLabel="Сотрудников пока нет"
      />

      <AccrueSalaryModal
        employeeId={accruingFor?.employee_id ?? null}
        employeeName={accruingFor?.full_name ?? null}
        onClose={() => setAccruingFor(null)}
      />
    </div>
  )
}

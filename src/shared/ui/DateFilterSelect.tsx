import { Select } from './Field'
import { DATE_FILTER_OPTIONS, DateFilter } from '../lib/dateFilter'

export function DateFilterSelect({
  value,
  onChange,
  className,
}: {
  value: DateFilter
  onChange: (value: DateFilter) => void
  className?: string
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value as DateFilter)} className={className ?? 'w-full sm:w-44'}>
      {DATE_FILTER_OPTIONS.map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </Select>
  )
}

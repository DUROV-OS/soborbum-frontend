import { Check } from 'lucide-react'

export interface StepperStep {
  key: string
  label: string
}

export function Stepper({
  steps,
  currentKey,
}: {
  steps: StepperStep[]
  currentKey: string
}) {
  const currentIndex = steps.findIndex((s) => s.key === currentKey)

  return (
    <ol className="flex items-stretch overflow-x-auto">
      {steps.map((step, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-pill text-[12px] font-medium ${
                  isDone
                    ? 'bg-brand text-white'
                    : isCurrent
                      ? 'bg-brand/10 text-brand-dark ring-1 ring-inset ring-brand'
                      : 'bg-surface-muted text-muted'
                }`}
              >
                {isDone ? <Check size={13} /> : index + 1}
              </span>
              <span
                className={`whitespace-nowrap text-[13px] ${
                  isCurrent ? 'font-medium text-ink' : isDone ? 'text-ink/70' : 'text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span
                className={`mx-3 h-px flex-1 ${isDone ? 'bg-brand' : 'bg-border'}`}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

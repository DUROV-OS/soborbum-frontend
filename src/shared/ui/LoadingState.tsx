export function LoadingState({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border px-6 py-14 text-center text-[13px] text-muted">
      {label}
    </div>
  )
}

export interface TabItem<K extends string> {
  key: K
  label: string
}

export function Tabs<K extends string>({
  tabs,
  activeKey,
  onChange,
}: {
  tabs: TabItem<K>[]
  activeKey: K
  onChange: (key: K) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`relative shrink-0 whitespace-nowrap px-4 py-2.5 text-[13px] font-medium transition-colors ${
              isActive ? 'text-brand-dark' : 'text-muted hover:text-ink'
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-brand" />
            )}
          </button>
        )
      })}
    </div>
  )
}

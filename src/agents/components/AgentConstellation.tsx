import { AgentPassport } from '../types'
import { AGENTS, SPECIALISTS } from '../data'

const WIDTH = 840
const HEIGHT = 520
const CX = WIDTH / 2
const CY = HEIGHT / 2 + 8
const RADIUS = 188

const TONE_STROKE: Record<AgentPassport['tone'], string> = {
  brand: 'rgb(43 105 80)',
  danger: 'rgb(181 72 63)',
  timber: 'rgb(138 98 54)',
  info: 'rgb(58 92 138)',
}

function specialistPoint(index: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / SPECIALISTS.length
  return { x: CX + Math.cos(angle) * RADIUS, y: CY + Math.sin(angle) * RADIUS }
}

export function AgentConstellation({
  selectedId,
  onSelect,
}: {
  selectedId: string
  onSelect: (id: AgentPassport['id']) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight text-ink">Команда из восьми</h2>
          <p className="mt-1 text-[12px] text-muted">Координатор в центре. Юрист сверху — ворота, не советчик.</p>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Схема восьми агентов: координатор в центре, специалисты по кругу"
        className="h-auto w-full"
      >
        <rect width={WIDTH} height={HEIGHT} fill="rgb(245 247 248)" />
        <g stroke="rgb(225 232 232)" strokeWidth="1">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`v${i}`} x1={70 * i} y1={0} x2={70 * i} y2={HEIGHT} />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={70 * i} x2={WIDTH} y2={70 * i} />
          ))}
        </g>
        <circle cx={CX} cy={CY} r={RADIUS + 36} fill="none" stroke="rgb(43 105 80 / 0.18)" strokeWidth="1" />
        {SPECIALISTS.map((agent, index) => {
          const point = specialistPoint(index)
          return (
            <line
              key={`edge-${agent.id}`}
              x1={CX}
              y1={CY}
              x2={point.x}
              y2={point.y}
              stroke={agent.id === 'lawyer' ? 'rgb(181 72 63 / 0.45)' : 'rgb(43 105 80 / 0.28)'}
              strokeWidth={agent.id === 'lawyer' ? 2 : 1.25}
            />
          )
        })}
        {SPECIALISTS.map((agent, index) => {
          const point = specialistPoint(index)
          return (
            <AgentNode
              key={agent.id}
              agent={agent}
              x={point.x}
              y={point.y}
              selected={selectedId === agent.id}
              onSelect={onSelect}
            />
          )
        })}
        <AgentNode
          agent={AGENTS[0]}
          x={CX}
          y={CY}
          selected={selectedId === 'coordinator'}
          onSelect={onSelect}
          hub
        />
      </svg>
      <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3 sm:px-6">
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelect(agent.id)}
            aria-pressed={selectedId === agent.id}
            className={`rounded-pill border px-3 py-1.5 text-[12px] font-medium ${
              selectedId === agent.id
                ? 'border-brand bg-brand/10 text-brand-dark'
                : 'border-border text-muted hover:text-ink'
            }`}
          >
            {agent.title}
          </button>
        ))}
      </div>
    </div>
  )
}

function AgentNode({
  agent,
  x,
  y,
  selected,
  onSelect,
  hub,
}: {
  agent: AgentPassport
  x: number
  y: number
  selected: boolean
  onSelect: (id: AgentPassport['id']) => void
  hub?: boolean
}) {
  const width = hub ? 168 : 148
  const height = hub ? 72 : 62
  const stroke = TONE_STROKE[agent.tone]
  return (
    <g transform={`translate(${x - width / 2} ${y - height / 2})`}>
      <rect
        width={width}
        height={height}
        rx={14}
        fill={selected ? 'rgb(255 255 255)' : 'rgb(255 255 255)'}
        stroke={selected ? 'rgb(43 105 80)' : stroke}
        strokeWidth={selected || agent.id === 'lawyer' ? 2.25 : 1.5}
      />
      <text
        x={width / 2}
        y={hub ? 28 : 24}
        textAnchor="middle"
        fill="rgb(28 43 43)"
        fontSize={hub ? 15 : 13}
        fontWeight={500}
        fontFamily="Rubik, Arial, sans-serif"
      >
        {agent.title}
      </text>
      <text
        x={width / 2}
        y={hub ? 48 : 42}
        textAnchor="middle"
        fill="rgb(100 115 117)"
        fontSize={11}
        fontFamily="Rubik, Arial, sans-serif"
      >
        {agent.role}
      </text>
      <rect
        width={width}
        height={height}
        rx={14}
        fill="transparent"
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`${agent.title}, ${agent.role}`}
        onClick={() => onSelect(agent.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect(agent.id)
          }
        }}
      />
    </g>
  )
}

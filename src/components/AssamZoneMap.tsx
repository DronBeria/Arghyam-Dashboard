import { ZONE_SCORES } from '../data/csatData'

// Simplified schematic zones of Assam (not geo-accurate, positionally representative)
const ZONE_SHAPES: Record<string, { path: string; labelX: number; labelY: number }> = {
  'BTAD': {
    path: 'M 20 120 L 110 120 L 110 180 L 20 180 Z',
    labelX: 65, labelY: 155,
  },
  'Lower Assam': {
    path: 'M 110 100 L 230 100 L 230 185 L 110 185 Z',
    labelX: 170, labelY: 148,
  },
  'KAAC': {
    path: 'M 230 130 L 310 130 L 310 210 L 230 210 Z',
    labelX: 270, labelY: 175,
  },
  'North Assam': {
    path: 'M 110 30 L 360 30 L 360 100 L 110 100 Z',
    labelX: 235, labelY: 68,
  },
  'DHAC': {
    path: 'M 310 130 L 370 130 L 370 210 L 310 210 Z',
    labelX: 340, labelY: 175,
  },
  'Upper Assam': {
    path: 'M 360 30 L 500 30 L 500 130 L 360 130 Z',
    labelX: 430, labelY: 82,
  },
  'Barak Valley': {
    path: 'M 200 210 L 380 210 L 380 280 L 200 280 Z',
    labelX: 290, labelY: 248,
  },
}

function bsiColor(bsi: number | null, status: string) {
  if (!bsi || status === 'No Data') return '#e2e8f0'
  if (status === 'Good')     return '#10b981'
  if (status === 'Critical') return '#ef4444'
  return '#f59e0b'
}

interface Props {
  onZoneClick?: (zone: string) => void
  selectedZone?: string
}

export function AssamZoneMap({ onZoneClick, selectedZone }: Props) {
  const zoneMap = Object.fromEntries(ZONE_SCORES.filter(z => z.zone !== 'Assam (State)').map(z => [z.zone, z]))

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="panel-title">Assam Zone Map</p>
          <p className="panel-sub mt-0.5">BSI by zone · click a zone to drill down</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          {[
            { color: '#10b981', label: 'Good ≥3.5' },
            { color: '#f59e0b', label: 'Moderate' },
            { color: '#ef4444', label: 'Critical' },
            { color: '#e2e8f0', label: 'No data' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 520 300" className="w-full rounded-xl" style={{ maxHeight: 280 }}>
        {/* Background */}
        <rect width="520" height="300" fill="#f8fafc" rx="10" />

        {Object.entries(ZONE_SHAPES).map(([zoneName, shape]) => {
          const z = zoneMap[zoneName]
          const fill = z ? bsiColor(z.bsi, z.status ?? 'No Data') : '#e2e8f0'
          const bsi5 = z?.bsi ? (z.bsi * 5).toFixed(2) : null
          const isSelected = selectedZone === zoneName

          return (
            <g key={zoneName} onClick={() => onZoneClick?.(zoneName)}
              style={{ cursor: onZoneClick ? 'pointer' : 'default' }}>
              <path
                d={shape.path}
                fill={fill}
                fillOpacity={isSelected ? 1 : 0.75}
                stroke={isSelected ? '#1e3a5f' : '#fff'}
                strokeWidth={isSelected ? 2.5 : 1.5}
                className="transition-all hover:fill-opacity-100"
              />
              {/* Zone label */}
              <text
                x={shape.labelX} y={shape.labelY - 8}
                textAnchor="middle"
                style={{ fontSize: 9, fontWeight: 700, fill: '#0f172a', pointerEvents: 'none' }}
              >
                {zoneName.replace(' Assam', '').replace('Barak Valley', 'Barak V.').replace('Lower', 'Lower')}
              </text>
              {bsi5 && (
                <text
                  x={shape.labelX} y={shape.labelY + 6}
                  textAnchor="middle"
                  style={{ fontSize: 11, fontWeight: 900, fill: '#0f172a', pointerEvents: 'none' }}
                >
                  {bsi5}
                </text>
              )}
              {!bsi5 && (
                <text x={shape.labelX} y={shape.labelY + 6} textAnchor="middle"
                  style={{ fontSize: 9, fill: '#94a3b8', pointerEvents: 'none' }}>—</text>
              )}
            </g>
          )
        })}

        {/* State label */}
        <text x="260" y="20" textAnchor="middle"
          style={{ fontSize: 10, fontWeight: 700, fill: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ASSAM
        </text>
      </svg>
    </div>
  )
}

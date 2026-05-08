import { useState, useEffect, useRef, useMemo } from 'react'
import { ZONE_SCORES, DISTRICT_SCORES, KPI_HEADLINE } from '../data/csatData'

// ── Event helpers ─────────────────────────────────────────────────────────────
export function goToPage(page: string) {
  window.dispatchEvent(new CustomEvent('navigate', { detail: page }))
}
export function goToScope(type: 'zone' | 'district', value: string) {
  window.dispatchEvent(new CustomEvent('navigate', { detail: 'overview' }))
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('setScope', { detail: { type, value } }))
  }, 50)
}

// ── Search index ──────────────────────────────────────────────────────────────
interface Item {
  id:       string
  title:    string
  sub:      string
  tag:      string
  tagColor: string
  hint?:    string
  action:   () => void
}

function statusBadge(s: string) {
  if (s === 'Good')     return 'bg-emerald-900/60 text-emerald-300'
  if (s === 'Critical') return 'bg-red-900/60     text-red-300'
  return                       'bg-amber-900/60   text-amber-300'
}

function buildIndex(): Item[] {
  const items: Item[] = []

  // Pages
  const pages: [string, string, string][] = [
    ['overview',     'Overview',         'KPIs, BSI score, scope filter'],
    ['calls',        'Call Analysis',    'Call summary, attempts, repeat callers, question funnel'],
    ['records',      'Call Records',     'Browse, filter and play 45,863 individual call recordings'],
    ['survey',       'Survey Results',   'Q1–Q5 KPIs, satisfaction breakdown, question funnel'],
    ['schemes',      'Scheme Coverage',  '2,373 IMIS schemes · valid / flagged / non-functional'],
    ['geographic',   'Zone & Districts', 'BSI by zone + 31 districts'],
    ['verification', 'Data Verification','Python script proofs, sanity checks, bot error analysis'],
  ]
  pages.forEach(([id, title, sub]) => items.push({
    id: `page:${id}`, title, sub, tag: 'Page', tagColor: 'bg-blue-900/60 text-blue-300',
    action: () => goToPage(id),
  }))

  // Zones
  ZONE_SCORES
    .filter(z => z.bsi !== null && z.zone !== 'Assam (State)')
    .forEach(z => {
      const bsi5 = ((z.bsi ?? 0) * 5).toFixed(2)
      items.push({
        id: `zone:${z.zone}`,
        title: z.zone,
        sub: `BSI ${bsi5}/5 · ${z.usableCalls?.toLocaleString()} usable calls · ${z.status}`,
        tag: 'Zone',
        tagColor: statusBadge(z.status ?? 'Moderate'),
        hint: bsi5,
        action: () => goToScope('zone', z.zone),
      })
    })

  // Districts
  DISTRICT_SCORES.forEach(d => {
    const bsi5 = (d.bsi * 5).toFixed(2)
    items.push({
      id: `district:${d.district}`,
      title: d.district,
      sub: `${d.zone} · BSI ${bsi5}/5 · ${d.usableCalls.toLocaleString()} calls · ${d.validSchemes} valid schemes`,
      tag: 'District',
      tagColor: statusBadge(d.status),
      hint: bsi5,
      action: () => goToScope('district', d.district),
    })
  })

  // Key metrics — quick facts
  const bsi5 = (KPI_HEADLINE.stateBSI * 5).toFixed(2)
  const metrics: [string, string, string][] = [
    ['State BSI',        `${bsi5}/5.0 — Moderate, target ≥3.50`,      'calls'],
    ['Q1 Daily Water',   '30.95% Yes — Critical, only 1 in 3 households', 'survey'],
    ['Q2 Water Quality', '72.33% Yes — Good, above 70% benchmark',        'survey'],
    ['Q3 Water Quantity','62.23% Yes — Moderate',                         'survey'],
    ['Q1A Consistent Timing', '57.2% Yes — Moderate · follow-up to Q1',  'survey'],
    ['Q5 Satisfaction',  '51.7% satisfied · 25.6% dissatisfied',          'survey'],
    ['Valid Schemes',    '615 of 2,373 — 17.6% functional',               'schemes'],
    ['Non-functional',   '507 of 615 valid schemes failing',               'schemes'],
    ['Consent Rate',     '27.4% — 12,583 of 45,863 calls consented',      'calls'],
    ['Repeat Callers',   '170 households · 44.7% consent vs 27.4% first', 'calls'],
    ['BTAD Zone',        'Critical — BSI 1.92/5 · 142 usable calls',      'geographic'],
    ['Barak Valley',     'Critical — BSI 1.89/5 · 339 usable calls',      'geographic'],
    ['Hailakandi',       'Worst district — BSI 1.39/5 · 12 usable calls', 'geographic'],
    ['Sivasagar',        'Best district — BSI 2.66/5 · 262 usable calls', 'geographic'],
  ]
  metrics.forEach(([title, sub, page]) => items.push({
    id: `metric:${title}`, title, sub, tag: 'Metric',
    tagColor: 'bg-violet-900/60 text-violet-300',
    action: () => goToPage(page),
  }))

  return items
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { onClose: () => void }

export function CommandPalette({ onClose }: Props) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)
  const ALL = useMemo(() => buildIndex(), [])

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = useMemo(() => {
    if (!query.trim()) {
      // Default: pages first, then top zones, then top districts by BSI
      return [
        ...ALL.filter(i => i.tag === 'Page'),
        ...ALL.filter(i => i.tag === 'Zone').slice(0, 4),
        ...ALL.filter(i => i.tag === 'District').slice(0, 4),
      ]
    }
    const q = query.toLowerCase()
    return ALL.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.sub.toLowerCase().includes(q) ||
      i.tag.toLowerCase().includes(q)
    ).slice(0, 12)
  }, [query, ALL])

  useEffect(() => { setCursor(0) }, [results])

  function select(item: Item) { item.action(); onClose() }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter')     { if (results[cursor]) select(results[cursor]) }
    if (e.key === 'Escape')    { onClose() }
  }

  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  // Group results for display
  const groups = useMemo(() => {
    const map = new Map<string, Item[]>()
    results.forEach(r => {
      const list = map.get(r.tag) ?? []
      list.push(r)
      map.set(r.tag, list)
    })
    return map
  }, [results])

  let idx = 0
  const rendered: JSX.Element[] = []
  groups.forEach((items, tag) => {
    rendered.push(
      <div key={tag} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
        {tag}s
      </div>
    )
    items.forEach(item => {
      const i = idx++
      const active = cursor === i
      rendered.push(
        <div key={item.id} ref={el => { if (el && listRef.current) listRef.current.children[i] }} />
      )
      rendered.push(
        <button
          key={`btn:${item.id}`}
          onClick={() => select(item)}
          onMouseEnter={() => setCursor(i)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
            active ? 'bg-white/8' : 'hover:bg-white/5'
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.tagColor}`}>{item.tag}</span>
              <span className={`text-[13px] font-semibold truncate ${active ? 'text-white' : 'text-slate-200'}`}>{item.title}</span>
              {item.hint && <span className={`text-xs font-black font-mono ml-auto flex-shrink-0 ${
                parseFloat(item.hint) >= 3.5 ? 'text-emerald-400' : parseFloat(item.hint) >= 2.0 ? 'text-amber-400' : 'text-red-400'
              }`}>{item.hint}/5</span>}
            </div>
            <p className={`text-[11px] mt-0.5 truncate ${active ? 'text-slate-300' : 'text-slate-500'}`}>{item.sub}</p>
          </div>
          {active && (
            <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          )}
        </button>
      )
    })
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-xl rounded-xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)]"
        style={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
          <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search districts, zones, metrics, pages…"
            className="flex-1 bg-transparent text-[14px] text-white placeholder:text-slate-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300 transition-colors text-xs">
              Clear
            </button>
          )}
          <kbd className="text-[10px] font-mono text-slate-600 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">No results for "{query}"</div>
          ) : rendered}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/5 text-[10px] text-slate-600">
          <span><kbd className="font-mono bg-white/5 border border-white/8 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-white/5 border border-white/8 px-1 rounded">↵</kbd> select</span>
          <span><kbd className="font-mono bg-white/5 border border-white/8 px-1 rounded">Esc</kbd> close</span>
          <span className="ml-auto">
            {query ? `${results.length} result${results.length !== 1 ? 's' : ''}` : `${ALL.length} items indexed`}
          </span>
        </div>
      </div>

      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  )
}

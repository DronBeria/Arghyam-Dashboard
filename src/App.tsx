import { useState, useEffect, useRef } from 'react'
import { Header }         from './components/Header'
import { KPICards }       from './components/KPICards'
import { CallSummary }    from './components/CallSummary'
import { KPIResults }     from './components/KPIResults'
import { SchemeCoverage } from './components/SchemeCoverage'
import { ZoneScores }     from './components/ZoneScores'
import { DistrictScores } from './components/DistrictScores'
import { RepeatCallers }  from './components/RepeatCallers'
import { CallAttempts }   from './components/CallAttempts'
import { QuestionFunnel } from './components/QuestionFunnel'

const NAV_ITEMS = [
  { id: 'kpi-cards',       label: 'Overview'          },
  { id: 'call-summary',    label: 'Call Summary'      },
  { id: 'kpi-results',     label: 'KPI Results'       },
  { id: 'scheme-coverage', label: 'Schemes'           },
  { id: 'zone-scores',     label: 'Zone Scores'       },
  { id: 'district-scores', label: 'Districts'         },
  { id: 'repeat-callers',  label: 'Repeat Callers'    },
  { id: 'call-attempts',   label: 'Call Attempts'     },
  { id: 'question-funnel', label: 'Question Funnel'   },
]

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    const offset = 120 // header + nav height
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState('kpi-cards')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    )
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current?.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky top block: header + nav */}
      <div className="sticky top-0 z-40 shadow-sm">
        <Header />

        {/* Sticky section nav */}
        <nav className="bg-white border-b border-gray-200 px-4 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`relative px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeSection === item.id
                    ? 'text-blue-700'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-t" />
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        <section id="kpi-cards">
          <KPICards />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section id="call-summary" className="card p-5">
            <CallSummary />
          </section>
          <section id="kpi-results" className="card p-5">
            <KPIResults />
          </section>
        </div>

        <section id="scheme-coverage" className="card p-5">
          <SchemeCoverage />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section id="zone-scores" className="card p-5">
            <ZoneScores />
          </section>
          <section id="district-scores" className="card p-5">
            <DistrictScores />
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section id="repeat-callers" className="card p-5">
            <RepeatCallers />
          </section>
          <section id="call-attempts" className="card p-5">
            <CallAttempts />
          </section>
        </div>

        <section id="question-funnel" className="card p-5">
          <QuestionFunnel />
        </section>

        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
          Source: CSAT AI Phase 1 · Assam Jal Jeevan Mission · 45,863 calls · April 2026 ·
          All figures verified from primary data · BSI scale 0–1.0 · Benchmark ≥ 0.70 = Good
        </footer>
      </main>
    </div>
  )
}

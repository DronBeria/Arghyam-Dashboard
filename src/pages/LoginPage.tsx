import { useState } from 'react'
import { supabase } from '../lib/supabase'

const STATS = [
  { val: '45,863', label: 'Calls Analysed', icon: '📞' },
  { val: '9,224', label: 'Surveys Completed', icon: '✅' },
  { val: '31', label: 'Districts Covered', icon: '🗺️' },
  { val: '2.20/5', label: 'State BSI Score', icon: '📊' },
]

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left branding panel (desktop only) ──────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 bg-slate-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <span className="text-white text-sm font-black">A</span>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none">Araghyam</p>
            <p className="text-slate-500 text-xs mt-0.5">CSAT AI Platform</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 w-fit mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-400 text-xs font-medium">Phase 1 · April 2026 · Live</span>
          </div>
          <h1 className="text-white text-4xl font-black leading-tight mb-4">
            Assam Jal Jeevan<br />Mission Survey
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            AI-powered citizen satisfaction analysis across 31 districts and 6 zones of Assam.
            Government-ready insights from field survey data.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-10 max-w-xs">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <p className="text-xl mb-1">{s.icon}</p>
                <p className="text-white font-bold text-base leading-none">{s.val}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-700 text-xs relative z-10">
          Araghyam · Confidential · Government of Assam · Jal Jeevan Mission
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 lg:max-w-[420px] flex flex-col items-center justify-center p-8">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10 self-start">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">A</span>
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Araghyam</p>
            <p className="text-gray-400 text-xs">CSAT AI · Assam JJM</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-black text-gray-900 mb-1">Sign in</h2>
          <p className="text-gray-400 text-sm mb-8">Access the JJM CSAT dashboard</p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@araghyam.org"
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3
                  placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3
                  placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-xs flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-semibold
                text-sm py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <><span className="animate-spin text-base">⟳</span> Signing in…</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-300">
              Restricted to authorised Araghyam personnel
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

import { useState } from 'react'
import { supabase } from '../lib/supabase'

const STATS = [
  { val: '125,588', label: 'Calls Analysed',   icon: '📞' },
  { val: '15,660',  label: 'Surveys Usable',   icon: '✅' },
  { val: '33',      label: 'Districts Covered', icon: '🗺️' },
  { val: '2.76/5',  label: 'State Citizen Satisfaction Survey Score', icon: '📊' },
]

type Mode = 'signin' | 'signup'
type Workspace = 'main' | 'tinsukia'

export function LoginPage() {
  const [mode, setMode]           = useState<Mode>('signin')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [fullName, setFullName]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [loadingWs, setLoadingWs] = useState<Workspace | null>(null)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  function switchMode(m: Mode) {
    setMode(m); setError('')
    setEmail(''); setPassword(''); setConfirm(''); setFullName('')
  }

  async function handleSignIn(ws: Workspace) {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true); setLoadingWs(ws); setError('')
    localStorage.setItem('jjm_workspace', ws)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      localStorage.removeItem('jjm_workspace')
      setError(error.message)
    }
    setLoading(false); setLoadingWs(null)
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() || email.split('@')[0] } },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    if (data.session) {
      // Email confirmation is OFF in Supabase — user is immediately signed in
      // Auth state change listener in App.tsx will handle the redirect automatically
      return
    }
    // Email confirmation is ON — email has been sent, show message and go to Sign In tab
    setSuccess(`Account created! A confirmation email has been sent to ${email}. Click the link in the email to activate your account, then sign in here.`)
    setMode('signin')
    setEmail(''); setPassword(''); setConfirm(''); setFullName('')
  }

  const isSignUp = mode === 'signup'

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left branding panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 bg-slate-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <span className="text-white text-sm font-black">A</span>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none">Arghyam</p>
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
          Arghyam · Confidential · Government of Assam · Jal Jeevan Mission
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
            <p className="font-bold text-gray-800 text-sm">Arghyam</p>
            <p className="text-gray-400 text-xs">CSAT AI · Assam JJM</p>
          </div>
        </div>

        <div className="w-full max-w-sm">

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
            {(['signin', 'signup'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1">
            {isSignUp ? 'Create account' : 'Sign in'}
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            {isSignUp ? 'Add a new authorised user' : 'Access the JJM CSAT dashboard'}
          </p>

          {success && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-xs flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">✓</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={isSignUp ? handleSignUp : (e) => e.preventDefault()} className="space-y-4">

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3
                    placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@araghyam.org"
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3
                  placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3
                  placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3
                    placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-xs flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {isSignUp ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-semibold
                  text-sm py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? <><span className="animate-spin text-base">⟳</span> Creating…</> : 'Create Account'}
              </button>
            ) : (
              <div className="space-y-2.5 mt-1">
                <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-semibold">Sign in to</p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSignIn('main')}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold
                    text-sm py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  {loadingWs === 'main'
                    ? <><span className="animate-spin text-base">⟳</span> Signing in…</>
                    : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /><circle cx="12" cy="12" r="9"/></svg> Main Dashboard — All Assam</>}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSignIn('tinsukia')}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-semibold
                    text-sm py-3 rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {loadingWs === 'tinsukia'
                    ? <><span className="animate-spin text-base">⟳</span> Signing in…</>
                    : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> Tinsukia District</>}
                </button>
              </div>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-300">
              Restricted to authorised Arghyam personnel
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

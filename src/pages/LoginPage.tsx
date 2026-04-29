import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'magic'

export function LoginPage() {
  const [mode, setMode]           = useState<Mode>('signin')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [magicSent, setMagicSent] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) setError(error.message)
    else setMagicSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">

      {/* Background grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-sm">

        {/* Logo + branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 mb-4">
            <span className="text-white text-2xl font-black">A</span>
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">Araghyam</h1>
          <p className="text-slate-400 text-sm mt-1">CSAT AI · Assam Jal Jeevan Mission</p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Phase 1 Dashboard · April 2026</span>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl">

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-slate-800 rounded-xl mb-6">
            {([['signin', 'Email & Password'], ['magic', 'Magic Link']] as [Mode, string][]).map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setMagicSent(false) }}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${
                  mode === m
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {magicSent ? (
            <div className="text-center py-6 space-y-3">
              <div className="text-4xl">📧</div>
              <p className="text-white font-semibold">Check your inbox</p>
              <p className="text-slate-400 text-sm">Magic link sent to <span className="text-blue-400">{email}</span></p>
              <button onClick={() => { setMagicSent(false); setEmail('') }}
                className="text-xs text-slate-500 hover:text-slate-300 mt-2">
                Try a different email
              </button>
            </div>
          ) : (
            <form onSubmit={mode === 'signin' ? handleSignIn : handleMagicLink} className="space-y-4">

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3
                    placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all"
                />
              </div>

              {mode === 'signin' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3
                      placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      transition-all"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold
                  text-sm py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="animate-spin text-base">⟳</span> Signing in…</>
                ) : mode === 'signin' ? (
                  '→ Sign In'
                ) : (
                  '→ Send Magic Link'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Araghyam · Confidential · Phase 1 Data · 45,863 calls
        </p>
      </div>
    </div>
  )
}

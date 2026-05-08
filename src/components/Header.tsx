import { useState } from 'react'
import { DownloadModal } from './DownloadModal'
import { supabase } from '../lib/supabase'

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) || 'http://localhost:8000'

interface HeaderProps {
  pageTitle: string
  phase?: 'phase1' | 'phase2'
  onNavigate: (page: string) => void
  userEmail?: string
}

const QUICK_LINKS = [
  {
    group: 'Pages',
    items: [
      { id: 'overview', label: 'Dashboard Overview', icon: '◈', desc: 'KPIs, BSI score, priorities' },
      { id: 'calls', label: 'Call Analysis', icon: '📞', desc: 'Funnel, attempts, repeat callers' },
      { id: 'records', label: 'Call Records', icon: '🎙️', desc: 'Browse calls + play recordings' },
      { id: 'survey', label: 'Survey Results', icon: '📋', desc: 'Q1–Q5 satisfaction breakdown' },
      { id: 'schemes', label: 'Scheme Coverage', icon: '🏗️', desc: 'Functional vs non-functional' },
      { id: 'geographic', label: 'Zone & Districts', icon: '🗺️', desc: 'BSI rankings by geography' },
    ],
  },
  {
    group: 'Quick filters',
    items: [
      { id: 'records', label: 'Dissatisfied calls with recordings', icon: '😞', desc: 'Call Records → Dissatisfied + Recording preset' },
      { id: 'geographic', label: 'Critical zones deep-dive', icon: '🔴', desc: 'BTAD & Barak Valley districts' },
      { id: 'schemes', label: 'Non-functional schemes', icon: '⚠️', desc: '507 schemes failing functionality test' },
    ],
  },
]

export function Header({ pageTitle, phase = 'phase1', onNavigate, userEmail }: HeaderProps) {
  const [open, setOpen]               = useState(false)
  const [showDownload, setShowDownload] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showInvite, setShowInvite]       = useState(false)
  const [inviteEmail, setInviteEmail]     = useState('')
  const [invitePhone, setInvitePhone]     = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function whatsappNumber(raw: string) {
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 10) return '91' + digits          // Indian mobile
    if (digits.startsWith('0') && digits.length === 11) return '91' + digits.slice(1)
    return digits
  }

  function openWhatsApp(phone: string, email?: string) {
    const num = whatsappNumber(phone)
    if (!num) return
    const msg = email
      ? `Hi! You have been invited to the Araghyam JJM CSAT Dashboard (Assam Jal Jeevan Mission). Please check your email (${email}) for the account setup link, or visit https://arghyam-dashboard.vercel.app — Araghyam Team`
      : `Hi! You have been invited to the Araghyam JJM CSAT Dashboard (Assam Jal Jeevan Mission). Visit https://arghyam-dashboard.vercel.app to sign in. Contact your admin for login credentials — Araghyam Team`
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true); setInviteMsg(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Invite failed')
      setInviteMsg({ type: 'ok', text: `Invite sent to ${inviteEmail}` })
      if (invitePhone.trim()) openWhatsApp(invitePhone, inviteEmail)
      setInviteEmail(''); setInvitePhone('')
    } catch (err: any) {
      setInviteMsg({ type: 'err', text: err.message })
    }
    setInviteLoading(false)
  }

  return (
    <>
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between h-14 flex-shrink-0 relative z-50 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {/* Branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('overview')}>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-slate-800 leading-none tracking-tight">{pageTitle}</h2>
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">

          {phase === 'phase1' ? (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Phase 1 · Apr 2026</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Phase 2 · Awaiting data</span>
            </div>
          )}

          {/* Download */}
          <button onClick={() => setShowDownload(true)}
            className="hidden sm:flex items-center gap-1.5 btn-primary">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export
          </button>

          {/* Quick Jump */}
          <div className="relative">
            <button onClick={() => { setOpen(v => !v); setUserMenuOpen(false) }}
              className={`flex items-center gap-1.5 btn-outline ${open ? '!border-blue-500 !text-blue-600 !bg-blue-50' : ''}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16"/></svg>
              <span className="hidden md:inline">Navigate</span>
              <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-40 bg-slate-900/5 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="panel-label">Navigation</p>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    {QUICK_LINKS.map(group => (
                      <div key={group.group} className="p-2">
                        <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {group.group}
                        </p>
                        {group.items.map(item => (
                          <button
                            key={item.label}
                            onClick={() => { onNavigate(item.id); setOpen(false) }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-left transition-colors"
                          >
                            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 text-xs">{item.icon}</div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-semibold text-slate-700">{item.label}</p>
                              <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
                    <p className="panel-label">Araghyam · JJM Phase 1 · April 2026</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User */}
          {userEmail && (
            <div className="relative">
              <button onClick={() => { setUserMenuOpen(v => !v); setOpen(false); setShowInvite(false) }}
                className="flex items-center gap-2 py-1 pl-1 pr-2.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white transition-colors">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <span className="text-[11px] font-semibold text-slate-600 max-w-[100px] truncate hidden sm:block">{userEmail.split('@')[0]}</span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => { setUserMenuOpen(false); setShowInvite(false); setInviteMsg(null) }} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.1)] z-50 overflow-hidden">

                    {/* Account header */}
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <p className="panel-label">Account</p>
                      <p className="text-[11px] text-slate-600 truncate font-medium mt-1">{userEmail}</p>
                    </div>

                    {/* Invite User */}
                    <div className="border-b border-slate-100">
                      <button
                        onClick={() => { setShowInvite(v => !v); setInviteMsg(null) }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                        </svg>
                        Invite User
                        <svg className={`w-3 h-3 ml-auto transition-transform ${showInvite ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
                      </button>

                      {showInvite && (
                        <div className="px-3 pb-3 space-y-2">
                          {/* Email field */}
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            placeholder="Email (required for invite)"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2
                              placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />

                          {/* Phone field */}
                          <input
                            type="tel"
                            value={invitePhone}
                            onChange={e => setInvitePhone(e.target.value)}
                            placeholder="WhatsApp number (optional)"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2
                              placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />

                          {inviteMsg && (
                            <p className={`text-[11px] font-medium ${inviteMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                              {inviteMsg.type === 'ok' ? '✓ ' : '⚠ '}{inviteMsg.text}
                            </p>
                          )}

                          {/* Email invite button */}
                          <button
                            onClick={e => { if (!inviteEmail) { setInviteMsg({type:'err',text:'Enter an email address'}); return } handleInvite(e as any) }}
                            disabled={inviteLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white text-[11px] font-semibold
                              py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                          >
                            {inviteLoading
                              ? <><span className="animate-spin">⟳</span> Sending…</>
                              : <>
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                  {invitePhone.trim() ? 'Invite via Email + WhatsApp' : 'Send Email Invite'}
                                </>}
                          </button>

                          {/* WhatsApp-only button */}
                          {invitePhone.trim() && (
                            <button
                              type="button"
                              onClick={() => openWhatsApp(invitePhone, inviteEmail || undefined)}
                              className="w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white text-[11px] font-semibold
                                py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              WhatsApp only
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sign out */}
                    <button onClick={() => { supabase.auth.signOut(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold text-red-600 hover:bg-red-50 transition-colors text-left">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Download modal */}
      {showDownload && (
        <DownloadModal onClose={() => setShowDownload(false)} userEmail={userEmail} />
      )}
    </>
  )
}

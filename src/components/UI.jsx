import { useApp } from '../context/AppContext'

// ── MoneyInput ──────────────────────────────────────────────────
// Shows thousand-separator dots while typing (e.g. 5000000 -> 5.000.000)
// Always reports the raw numeric value via onChange, never the formatted string.
export function MoneyInput({ value, onChange, className, placeholder, ...rest }) {
  const formatDisplay = (raw) => {
    const num = parseFloat((raw ?? '').toString().replace(/[^\d]/g, '')) || 0
    return num === 0 ? '' : num.toLocaleString('id-ID')
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      placeholder={placeholder}
      value={formatDisplay(value)}
      onChange={e => {
        const digitsOnly = e.target.value.replace(/[^\d]/g, '')
        onChange(digitsOnly === '' ? 0 : parseInt(digitsOnly, 10))
      }}
      {...rest}
    />
  )
}


// ── Topbar ──────────────────────────────────────────────────────
export function Topbar({ title, onBack, right, color }) {
  const bg = color || '#085041'
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
      style={{ background: bg }}>
      {onBack && (
        <button onClick={onBack} className="text-white/70 hover:text-white" aria-label="Back">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"
            viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
      )}
      <span className="flex-1 text-[15px] font-medium text-white">{title}</span>
      {right}
    </div>
  )
}

// ── BottomNav ───────────────────────────────────────────────────
export function BottomNav() {
  const { screen, navigate, profile } = useApp()
  const bc = (profile?.color === '#ffffff' || profile?.color === '#F8FAFC') ? '#085041' : profile?.color || '#085041'
  const tabs = [
    { id:'dashboard', icon: HomeIcon,     label:'Beranda'    },
    { id:'invoices',  icon: ListIcon,     label:'Faktur'     },
    { id:'new',       icon: PlusIcon,     label:'Baru',       fab: true },
    { id:'clients',   icon: UsersIcon,    label:'Pelanggan'  },
    { id:'settings',  icon: SettingsIcon, label:'Pengaturan' },
  ]
  return (
    <nav className="sticky bottom-0 z-20 bg-white border-t border-slate-200 grid grid-cols-5">
      {tabs.map(t => (
        <button key={t.id}
          onClick={() => navigate(t.id === 'new' ? 'invoice-form' : t.id)}
          className="flex flex-col items-center gap-1 py-2 px-1 text-[10px] font-medium border-none bg-none cursor-pointer"
          style={{ color: (screen === t.id || (t.id === 'new' && screen === 'invoice-form')) ? bc : '#94a3b8' }}>
          {t.fab
            ? <div className="w-11 h-11 rounded-full flex items-center justify-center -mt-4
                border-4 border-slate-100 shadow-md" style={{ background: bc }}>
                <t.icon size={22} color="#fff" />
              </div>
            : <t.icon size={20} />
          }
          {!t.fab && t.label}
        </button>
      ))}
    </nav>
  )
}

// ── Toast ───────────────────────────────────────────────────────
export function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50
      bg-slate-800 text-white text-xs px-5 py-2.5 rounded-full shadow-lg
      animate-[fadeUp_0.2s_ease-out] whitespace-nowrap pointer-events-none">
      {toast}
    </div>
  )
}

// ── TrialBanner ─────────────────────────────────────────────────
export function TrialBanner() {
  const { trialDays, navigate } = useApp()
  if (trialDays > 10) return null
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
      <svg width="14" height="14" fill="none" stroke="#854F0B" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
      <span className="flex-1 text-xs text-amber-800">
        <strong>{trialDays} days</strong> left on your free trial
      </span>
      <button onClick={() => navigate('paywall')}
        className="text-[10px] font-medium text-white bg-amber-700 px-3 py-1 rounded-full border-none cursor-pointer">
        Upgrade
      </button>
    </div>
  )
}

// ── Section (expandable) ────────────────────────────────────────
export function Section({ id, icon, title, open, onToggle, children }) {
  return (
    <div className="bg-white mt-2 border-t border-b border-slate-200">
      <button onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-none border-none cursor-pointer">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <span className="text-[#085041]">{icon}</span>{title}
        </span>
        <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && <div className="px-4 pb-3 border-t border-slate-100">{children}</div>}
    </div>
  )
}

// ── Field ───────────────────────────────────────────────────────
export function Field({ label, required, optional, hint, children }) {
  return (
    <div className="flex flex-col gap-1 mt-3">
      <label className="text-[11px] text-slate-500 flex items-center gap-1">
        {required && <span className="text-[#085041] font-medium">●</span>}
        {label}
        {optional && <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full border border-slate-200">optional</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 leading-relaxed">{hint}</p>}
    </div>
  )
}

// ── Input ───────────────────────────────────────────────────────
export function Input({ className = '', ...props }) {
  return (
    <input {...props}
      className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800
        bg-white focus:outline-none focus:border-[#085041] focus:ring-2 focus:ring-[#085041]/10 ${className}`}
    />
  )
}

// ── Pill (status) ───────────────────────────────────────────────
const STATUS_STYLES = {
  paid:    'bg-green-100 text-green-800',
  unpaid:  'bg-red-100 text-red-800',
  partial: 'bg-amber-100 text-amber-800',
  overdue: 'bg-red-200 text-red-900',
  draft:   'bg-slate-100 text-slate-500',
}
const STATUS_LABELS = { paid:'Paid', unpaid:'Unpaid', partial:'Partial', overdue:'Overdue', draft:'Draft' }

export function StatusPill({ status }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

// ── Balance block ────────────────────────────────────────────────
export function BalanceBlock({ balance, paid, total }) {
  const isFullyPaid  = balance <= 0 && paid > 0
  const isPartial    = paid > 0 && balance > 0
  const cls = isFullyPaid ? 'bg-green-50 border-green-300 text-green-800'
            : isPartial   ? 'bg-amber-50 border-amber-300 text-amber-800'
            :               'bg-red-50 border-red-300 text-red-800'
  const label = isFullyPaid && balance < 0 ? 'Overpaid'
              : isFullyPaid ? 'Fully paid'
              : isPartial   ? 'Partial — balance due'
              : 'Balance due'
  return (
    <div className={`mx-0 py-4 text-center border-y-2 ${cls}`}>
      <div className="text-[10px] uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-medium">
        IDR {Math.abs(balance).toLocaleString('id-ID')}
      </div>
    </div>
  )
}

// ── Stat card ────────────────────────────────────────────────────
export function StatCard({ label, value, sub, valueClass = '' }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-slate-200">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div className={`text-lg font-medium text-slate-800 ${valueClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Icons (inline SVG, no external dep) ─────────────────────────
const ico = (path, extra='') => ({ size=20, color='currentColor', ...rest }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...rest}
    dangerouslySetInnerHTML={{__html: path + extra}} />
)

export const HomeIcon    = ico('<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>')
export const ListIcon    = ico('<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>')
export const PlusIcon    = ico('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>')
export const ChartIcon   = ico('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>')
export const UsersIcon   = ico('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>')
export const SaveIcon    = ico('<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>')
export const SendIcon    = ico('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>')
export const PrintIcon   = ico('<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>')
export const EyeIcon     = ico('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>')
export const TrashIcon   = ico('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>')
export const DownloadIcon= ico('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>')
export const SettingsIcon= ico('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>')
export const UserIcon    = ico('<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>')
export const CrownIcon   = ico('<path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/>')
export const WhatsAppIcon= ({ size=20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.857L.057 23.804a.5.5 0 00.613.637l6.094-1.597A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 01-5.034-1.376l-.36-.214-3.733.979.996-3.645-.235-.374A9.859 9.859 0 012.118 12C2.118 6.54 6.54 2.118 12 2.118c5.46 0 9.882 4.422 9.882 9.882 0 5.46-4.422 9.882-9.882 9.882z"/>
  </svg>
)

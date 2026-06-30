import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { ProfileDB } from '../utils/db'

// ── 20 Named Theme Palettes ────────────────────────────────────
const THEMES = [
  // Greens
  { name:'Emerald',      hex:'#085041', cat:'Nature' },
  { name:'Forest',       hex:'#2D6A4F', cat:'Nature' },
  { name:'Sage',         hex:'#588157', cat:'Nature' },
  { name:'Olive',        hex:'#606C38', cat:'Nature' },
  // Blues
  { name:'Ocean',        hex:'#0077B6', cat:'Blue' },
  { name:'Navy',         hex:'#0F2744', cat:'Blue' },
  { name:'Royal',        hex:'#185FA5', cat:'Blue' },
  { name:'Steel',        hex:'#475569', cat:'Blue' },
  { name:'Sky',          hex:'#0284C7', cat:'Blue' },
  // Warm
  { name:'Sunset',       hex:'#C2410C', cat:'Warm' },
  { name:'Amber',        hex:'#854F0B', cat:'Warm' },
  { name:'Terracotta',   hex:'#9A3412', cat:'Warm' },
  { name:'Rose',         hex:'#9F1239', cat:'Warm' },
  // Dark & Elegant
  { name:'Charcoal',     hex:'#1E293B', cat:'Dark' },
  { name:'Midnight',     hex:'#1a1a2e', cat:'Dark' },
  { name:'Onyx',         hex:'#18181B', cat:'Dark' },
  { name:'Plum',         hex:'#4A1528', cat:'Dark' },
  { name:'Indigo',       hex:'#312E81', cat:'Dark' },
  // Light
  { name:'Clean White',  hex:'#ffffff', cat:'Light' },
  { name:'Pearl',        hex:'#F8FAFC', cat:'Light' },
]

const CATEGORIES = ['Nature','Blue','Warm','Dark','Light']

// Defined OUTSIDE Profile() so it's stable across re-renders —
// keeping it inside the component caused inputs to lose focus on every keystroke.
const Sec = ({ title, children }) => (
  <div className="mt-2 bg-white border-t border-b border-slate-200">
    <div className="text-[10px] uppercase tracking-wider text-slate-400 px-4 py-2">{title}</div>
    <div className="px-4 pb-4 flex flex-col gap-3">{children}</div>
  </div>
)

const isDark = h => {
  if (!h || h.length < 7) return true
  const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16)
  return 0.299*r+0.587*g+0.114*b<140
}

const lighten = (hex, pct) => {
  let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16)
  r=Math.min(255,Math.round(r+(255-r)*pct)); g=Math.min(255,Math.round(g+(255-g)*pct)); b=Math.min(255,Math.round(b+(255-b)*pct))
  return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('')
}

export default function Profile() {
  const { navigate, saveProfile, showToast } = useApp()
  const saved = ProfileDB.get()

  const [f, setF] = useState({
    bizName:  saved.bizName  || '',
    phone:    saved.phone    || '',
    email:    saved.email    || '',
    addr:     saved.addr     || '',
    city:     saved.city     || '',
    web:      saved.web      || '',
    npwp:     saved.npwp     || '',
    nib:      saved.nib      || '',
    taxrate:  saved.taxrate  || '11',
    terms:    saved.terms    || '30',
    defnote:  saved.defnote  || '',
    color:    saved.color    || '#085041',
    themeName:saved.themeName || 'Emerald',
    invPrefix:saved.invPrefix|| 'INV',
    invSep1:  saved.invSep1  || '-',
    invYear:  saved.invYear  || new Date().getFullYear().toString(),
    invSep2:  saved.invSep2  || '-',
    invSeq:   saved.invSeq   || '001',
    banks:    saved.banks    || [],
    logo:     saved.logo     || null,
    invoiceTemplate: saved.invoiceTemplate || 'classic',
  })

  const [showPicker, setShowPicker] = useState(false)
  const [hexInput, setHexInput] = useState(f.color)
  const colorRef = useRef(null)

  useEffect(() => { setHexInput(f.color) }, [f.color])

  const upd = (k,v) => setF(p => ({...p,[k]:v}))
  const setTheme = (theme) => { upd('color', theme.hex); upd('themeName', theme.name); setHexInput(theme.hex) }
  const setCustomColor = (hex) => { upd('color', hex); upd('themeName', 'Custom'); setHexInput(hex) }

  const invNum = [f.invPrefix, f.invYear, f.invSeq].filter(Boolean).reduce((acc,p,i)=>acc+(i>0?[f.invSep1,f.invSep2][i-1]:'')+p,'')
  const canSave = f.bizName && f.phone

  const doSave = () => {
    if (!canSave) { showToast('Nama usaha and phone are required'); return }
    saveProfile(f)
    navigate('settings')
  }

  const triggerLogo = () => {
    const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*'
    inp.onchange = e => {
      const file = e.target.files[0]; if (!file) return
      const r = new FileReader()
      r.onload = ev => upd('logo', ev.target.result)
      r.readAsDataURL(file)
    }
    inp.click()
  }

  // Bank account modal state
  const [showBankForm, setShowBankForm] = useState(false)
  const [bankForm, setBankForm] = useState({ bank:'BCA', account:'', name:'' })

  const addBank = () => {
    if (!bankForm.account || !bankForm.name) { showToast('Isi nomor rekening dan nama'); return }
    upd('banks', [...f.banks, { ...bankForm, primary: f.banks.length===0 }])
    setBankForm({ bank:'BCA', account:'', name:'' })
    setShowBankForm(false)
  }

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#085041] focus:ring-2 focus:ring-[#085041]/10"
  const labelCls = "text-[11px] text-slate-400 mb-1 block"

  const dark = isDark(f.color)
  const hText = dark ? '#ffffff' : '#111111'
  const hSub  = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'
  const brandColor = f.color==='#ffffff'||f.color==='#F8FAFC' ? '#085041' : f.color||'#085041'

  return (
    <div className="flex flex-col min-h-full">

      {/* topbar */}
      <div style={{ background: f.color||'#085041' }} className="px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('settings')} className="text-white/70 hover:text-white bg-tanpa border-tanpa cursor-pointer" style={{ color: hText }}>
          <svg width="22" height="22" fill="tanpa" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="flex-1 text-[15px] font-medium" style={{ color: hText }}>Profil bisnis</span>
        <button onClick={doSave}
          className="text-[13px] font-medium px-4 py-1.5 rounded-full border-tanpa cursor-pointer"
          style={{ background: dark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.08)', color: hText, opacity: canSave?1:0.5 }}>
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">

        {/* logo hero */}
        <div style={{ background: f.color||'#085041' }} className="px-4 pb-6 flex flex-col items-center gap-3">
          <div onClick={triggerLogo}
            className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden"
            style={{ background: dark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.06)', border: dark?'2px striped rgba(255,255,255,0.3)':'2px striped rgba(0,0,0,0.15)' }}>
            {f.logo
              ? <img src={f.logo} alt="logo" className="w-full h-full object-cover"/>
              : <div className="flex flex-col items-center justify-center h-full gap-1">
                  <span className="text-2xl">📷</span>
                  <span className="text-[9px]" style={{ color: hSub }}>ketuk untuk unggah</span>
                </div>}
          </div>
          <div className="font-medium text-[17px]" style={{ color: hText }}>{f.bizName||'Nama Usaha Anda'}</div>
          <div className="text-[12px]" style={{ color: hSub }}>{f.phone||'+62 ...'}</div>
          <div className="flex gap-2">
            <button onClick={triggerLogo} className="text-[11px] px-3 py-1.5 rounded-full border cursor-pointer"
              style={{ borderColor: dark?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.15)', background:'transparent', color: dark?'rgba(255,255,255,0.7)':'rgba(0,0,0,0.5)' }}>Unggah logo</button>
            {f.logo && <button onClick={()=>upd('logo',null)} className="text-[11px] px-3 py-1.5 rounded-full border cursor-pointer"
              style={{ borderColor: dark?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.15)', background:'transparent', color: dark?'rgba(255,255,255,0.7)':'rgba(0,0,0,0.5)' }}>Hapus</button>}
          </div>
        </div>

        {/* completion */}
        {(() => {
          const fields=[f.bizName,f.phone,f.email,f.addr,f.npwp,f.logo,f.banks?.length?'y':null]
          const pct=Math.round(fields.filter(Boolean).length/fields.length*100)
          return (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-200">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] text-slate-400">Kelengkapan profil</span>
                  <span className="text-[12px] font-medium" style={{ color: f.color==='#ffffff'?'#085041':f.color }}>{pct}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background: f.color==='#ffffff'?'#085041':f.color }}/>
                </div>
              </div>
            </div>
          )
        })()}

        <Sec title="Wajib diisi untuk memulai">
          <div>
            <label className={labelCls}><span style={{color:f.color==='#ffffff'?'#085041':f.color}}>●</span> Nama usaha</label>
            <input className={inputCls} value={f.bizName} placeholder="cth. Toko Maju Bersama" onChange={e=>upd('bizName',e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}><span style={{color:f.color==='#ffffff'?'#085041':f.color}}>●</span> Nomor WhatsApp / telepon</label>
            <input className={inputCls} value={f.phone} placeholder="+62 812-xxxx-xxxx" onChange={e=>upd('phone',e.target.value)}/>
            <p className="text-[10px] text-slate-400 mt-1">Digunakan untuk mengirim faktur via WhatsApp</p>
          </div>
        </Sec>

        <Sec title="Opsional — isi kapan saja">
          <div>
            <label className={labelCls}>Email <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-full">opsional</span></label>
            <input className={inputCls} type="email" value={f.email} placeholder="hello@usahaanda.com" onChange={e=>upd('email',e.target.value)}/>
            <p className="text-[10px] text-slate-400 mt-1">Memungkinkan kirim faktur via email</p>
          </div>
          <div>
            <label className={labelCls}>Alamat</label>
            <textarea className={inputCls} rows={2} value={f.addr} placeholder="Jl. ..." onChange={e=>upd('addr',e.target.value)}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Kota</label>
              <input className={inputCls} value={f.city} placeholder="Jakarta" onChange={e=>upd('city',e.target.value)}/>
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input className={inputCls} value={f.web} placeholder="www..." onChange={e=>upd('web',e.target.value)}/>
            </div>
          </div>
        </Sec>

        <Sec title="Tax & legal (opsional)">
          <div>
            <label className={labelCls}>NPWP</label>
            <input className={inputCls} value={f.npwp} placeholder="12.345.678.9-000.000" onChange={e=>upd('npwp',e.target.value)}/>
          </div>
          <div>
            <label className={labelCls}>NIB (dari OSS)</label>
            <input className={inputCls} value={f.nib} placeholder="oss.go.id" onChange={e=>upd('nib',e.target.value)}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tarif pajak default (%)</label>
              <input className={inputCls} type="number" value={f.taxrate} placeholder="11" onChange={e=>upd('taxrate',e.target.value)}/>
            </div>
            <div>
              <label className={labelCls}>Tempo pembayaran (hari)</label>
              <input className={inputCls} type="number" value={f.terms} placeholder="30" onChange={e=>upd('terms',e.target.value)}/>
            </div>
          </div>
        </Sec>

        {/* ═══════════ BRAND COLOR & THEME ═══════════ */}
        <div className="mt-2 bg-white border-t border-b border-slate-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Warna & tema brand</div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full" style={{ background: f.color, border: f.color==='#ffffff'?'1px solid #ccc':'tanpa' }}/>
              <span className="text-[11px] font-medium text-slate-600">{f.themeName || 'Custom'}</span>
            </div>
          </div>

          {/* category tabs */}
          {CATEGORIES.map(cat => {
            const themes = THEMES.filter(t => t.cat === cat)
            return (
              <div key={cat} className="mb-3">
                <div className="text-[10px] text-slate-400 mb-1.5">{cat}</div>
                <div className="flex gap-2 flex-wrap">
                  {themes.map(t => {
                    const sel = f.color === t.hex
                    const d = isDark(t.hex)
                    return (
                      <button key={t.hex} onClick={() => setTheme(t)}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-[11px] font-medium"
                        style={{
                          background: sel ? t.hex : 'transparent',
                          color: sel ? (d?'#fff':'#111') : '#64748b',
                          border: sel ? `2px solid ${d?lighten(t.hex,0.3):t.hex}` : '1.5px solid #e2e8f0',
                        }}>
                        <span className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ background: t.hex, border: t.hex==='#ffffff'||t.hex==='#F8FAFC'?'1px solid #ddd':'tanpa' }}/>
                        {t.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* custom color */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 mb-2">Warna kustom</div>
            <div className="flex items-center gap-2">
              <input ref={colorRef} type="color" value={f.color}
                onChange={e => setCustomColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 p-0.5 cursor-pointer"/>
              <div className="flex-1">
                <input value={hexInput}
                  onChange={e => {
                    setHexInput(e.target.value)
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setCustomColor(e.target.value)
                  }}
                  className="text-sm px-3 py-2 border border-slate-200 rounded-lg w-full font-mono"
                  maxLength={7} placeholder="#085041"/>
              </div>
              <button onClick={() => colorRef.current?.click()}
                className="text-[11px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-pointer whitespace-nowrap">
                Pilih warna
              </button>
            </div>
          </div>

          {/* live preview strip */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 mb-2">Pratinjau langsung</div>
            <div className="rounded-xl overflow-hidden border border-slate-200">
              {/* mini header */}
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: f.color }}>
                <div className="w-6 h-6 rounded flex items-center justify-center text-[10px]"
                  style={{ background: dark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.06)' }}>
                  {f.logo ? <img src={f.logo} className="w-full h-full object-cover rounded" alt=""/> : <span style={{color:hText}}>🏪</span>}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-medium" style={{ color: hText }}>{f.bizName || 'Nama Usaha Anda'}</div>
                  <div className="text-[8px]" style={{ color: hSub }}>FAKTUR</div>
                </div>
                <div className="text-[10px] font-medium" style={{ color: hText }}>IDR 5.000.000</div>
              </div>
              {/* gradient bar */}
              <div style={{ height:3, background: dark
                ? `linear-gradient(90deg, ${f.color} 0%, ${lighten(f.color,0.55)} 100%)`
                : f.color==='#ffffff'||f.color==='#F8FAFC'
                  ? 'linear-gradient(90deg, #085041 0%, #2D6A4F 100%)'
                  : `linear-gradient(90deg, ${f.color} 0%, ${lighten(f.color,0.45)} 100%)`
              }}/>
              {/* mini table */}
              <div className="px-3 py-2 bg-white">
                <div className="flex justify-between text-[9px] text-slate-400 pb-1 border-b border-slate-100">
                  <span>Barang</span><span>Jumlah</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-600 py-1">
                  <span>Jasa Desain</span><span>5.000.000</span>
                </div>
                <div className="flex justify-between text-[10px] font-medium text-slate-800 pt-1 border-t border-slate-200">
                  <span>Total</span><span>IDR 5.000.000</span>
                </div>
              </div>
              {/* mini balance */}
              <div className="flex items-center justify-between px-3 py-1.5" style={{ background: f.color }}>
                <span className="text-[8px] uppercase" style={{ color: hSub }}>Sisa tagihan</span>
                <span className="text-[10px] font-medium" style={{ color: hText }}>IDR 2.000.000</span>
              </div>
            </div>
          </div>
        </div>

        {/* invoice number */}
        <Sec title="Template faktur">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id:'classic', name:'Klasik',  desc:'Tata letak tradisional, garis aksen' },
              { id:'modern',  name:'Modern',   desc:'Sudut membulat, tampilan bersih' },
              { id:'minimal', name:'Minimal',  desc:'Header putih, garis tipis' },
              { id:'bold',    name:'Tebal',    desc:'Teks besar, aksen gelap' },
            ].map(tmpl => {
              const sel = (f.invoiceTemplate || 'classic') === tmpl.id
              return (
                <button key={tmpl.id} onClick={() => upd('invoiceTemplate', tmpl.id)}
                  className="text-left p-3 rounded-xl border-2 cursor-pointer bg-white"
                  style={{ borderColor: sel ? brandColor : '#e2e8f0' }}>
                  <div className="text-[13px] font-medium text-slate-800">{tmpl.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{tmpl.desc}</div>
                  {sel && <div className="mt-1.5 text-[10px] font-medium" style={{ color: brandColor }}>✓ Dipilih</div>}
                </button>
              )
            })}
          </div>
        </Sec>

        <Sec title="Format nomor faktur">
          <div className="flex items-center gap-2 flex-wrap">
            <input className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-16 text-center" value={f.invPrefix} onChange={e=>upd('invPrefix',e.target.value)} placeholder="INV"/>
            <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-16" value={f.invSep1} onChange={e=>upd('invSep1',e.target.value)}>
              <option value="-">strip</option><option value="/">garis miring</option><option value=".">titik</option><option value="">tanpa</option>
            </select>
            <input className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-16 text-center" value={f.invYear} onChange={e=>upd('invYear',e.target.value)} placeholder="2026"/>
            <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-16" value={f.invSep2} onChange={e=>upd('invSep2',e.target.value)}>
              <option value="-">strip</option><option value="/">garis miring</option><option value=".">titik</option><option value="">tanpa</option>
            </select>
            <input className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-14 text-center" value={f.invSeq} onChange={e=>upd('invSeq',e.target.value)} placeholder="001"/>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <span className="text-[11px] text-slate-400">Pratinjau:</span>
            <span className="text-[13px] font-medium text-slate-800">{invNum}</span>
          </div>
          <div>
            <label className={labelCls}>Catatan default faktur</label>
            <textarea className={inputCls} rows={2} value={f.defnote} placeholder="cth. Terima kasih atas kepercayaan Anda!" onChange={e=>upd('defnote',e.target.value)}/>
          </div>
        </Sec>

        {/* banks */}
        <Sec title="Rekening bank">
          {f.banks.map((b,i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 text-[11px] font-medium text-green-700">{b.bank.slice(0,3)}</div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-slate-700">{b.bank} {b.primary && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full ml-1">Utama</span>}</div>
                <div className="text-[11px] text-slate-400">{b.account} · a/n {b.name}</div>
              </div>
              <button onClick={() => upd('banks', f.banks.filter((_,j)=>j!==i))}
                className="text-slate-400 hover:text-red-500 bg-tanpa border-tanpa cursor-pointer p-1">✕</button>
            </div>
          ))}
          <button onClick={() => setShowBankForm(true)}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-striped border-slate-300 rounded-lg text-[12px] text-slate-500 bg-tanpa cursor-pointer hover:border-slate-400">
            + Tambah rekening bank
          </button>
        </Sec>

      </div>

      {/* save bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3">
        <button onClick={doSave}
          className="w-full py-3.5 rounded-2xl border-tanpa text-[15px] font-medium cursor-pointer transition-opacity"
          style={{ background: f.color==='#ffffff'?'#085041':f.color, color: isDark(f.color==='#ffffff'?'#085041':f.color)?'#fff':'#111', opacity: canSave?1:0.5 }}>
          Simpan profil
        </button>
        <p className="text-center text-[11px] text-slate-400 mt-2">
          {canSave ? '✓ Siap — ketuk Simpan untuk terapkan ke semua faktur' : 'Nama usaha and WhatsApp number required'}
        </p>
      </div>

      {/* bank form modal */}
      {showBankForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={e => e.target===e.currentTarget && setShowBankForm(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md pb-6">
            <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-2"/>
            <div className="px-4 pb-3 text-[15px] font-medium text-slate-800">Tambah rekening bank</div>
            <div className="px-4 flex flex-col gap-3">
              <div>
                <label className={labelCls}>Bank name</label>
                <select className={inputCls} value={bankForm.bank} onChange={e=>setBankForm(p=>({...p,bank:e.target.value}))}>
                  {['BCA','BNI','BRI','Mandiri','BSI','CIMB Niaga','Permata','Danamon','BTPN','Jago','Other'].map(b=><option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Nomor rekening</label>
                <input className={inputCls} value={bankForm.account} placeholder="cth. 1234567890"
                  onChange={e=>setBankForm(p=>({...p,account:e.target.value}))}/>
              </div>
              <div>
                <label className={labelCls}>Nama pemilik rekening</label>
                <input className={inputCls} value={bankForm.name} placeholder="a/n ..."
                  onChange={e=>setBankForm(p=>({...p,name:e.target.value}))}/>
              </div>
              <button onClick={addBank}
                className="w-full py-3 rounded-xl border-tanpa text-white font-medium cursor-pointer"
                style={{ background: f.color==='#ffffff'?'#085041':f.color }}>
                Tambah rekening
              </button>
              <button onClick={()=>setShowBankForm(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 text-[13px] cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

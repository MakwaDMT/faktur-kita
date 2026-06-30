// ─── Onboarding ──────────────────────────────────────────────────
import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { StatusPill } from '../components/UI'
import { InvoiceDB, ClientDB, ProductDB, fmtIDR, fmtShort, initials } from '../utils/db'
import { printInvoice, buildWhatsAppMsg, exportExcel } from '../utils/pdf'

export function OnboardingScreen() {
  const { completeOnboarding, navigate, profile } = useApp()
  const [slide, setSlide] = useState(0)
  const slides = [
    { title:'Buat faktur dalam hitungan menit', body:'Dibuat untuk UMKM Indonesia. Tidak perlu ilmu akuntansi — kalau bisa pakai WhatsApp, pasti bisa pakai aplikasi ini.', icon:'📄' },
    { title:'Brand Anda, warna Anda', body:'Unggah logo, pilih warna brand dari 20 tema. Setiap faktur tampil profesional dan sesuai gaya Anda.', icon:'🎨' },
    { title:'Dibayar lebih cepat', body:'Kirim via WhatsApp langsung. Terima QRIS, transfer bank, dan virtual account dengan Midtrans.', icon:'💳' },
  ]
  return (
    <div className="flex flex-col min-h-full" style={{ background:'#085041' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-12 pb-6 text-center">
        <div className="text-6xl mb-6">{slides[slide].icon}</div>
        <div className="text-white text-xl font-medium mb-3">{slides[slide].title}</div>
        <div className="text-white/60 text-sm leading-relaxed mb-8">{slides[slide].body}</div>
        <div className="flex gap-2 mb-8">
          {slides.map((_,i) => (
            <div key={i} className="h-1 rounded-full transition-all" style={{ width: i===slide?28:8, background: i===slide?'#fff':'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
      </div>
      <div className="px-6 pb-10 flex flex-col gap-3">
        {slide < slides.length - 1
          ? <button onClick={() => setSlide(s => s+1)}
              className="w-full py-4 rounded-2xl bg-white font-medium text-base cursor-pointer border-none"
              style={{ color:'#085041' }}>Lanjut →</button>
          : <button onClick={completeOnboarding}
              className="w-full py-4 rounded-2xl bg-white font-medium text-base cursor-pointer border-none"
              style={{ color:'#085041' }}>Mulai sekarang →</button>
        }
        <button onClick={completeOnboarding}
          className="text-white/50 text-sm bg-none border-none cursor-pointer py-2">
          Lewati
        </button>
      </div>
      <div className="pb-6 text-center text-white/30 text-[10px] px-4 leading-relaxed">
        © 2026 Faktur Kita · Hak cipta dilindungi<br/>
        Dengan melanjutkan Anda menyetujui Syarat Layanan & Kebijakan Privasi kami
      </div>
    </div>
  )
}

// ─── Faktur list ───────────────────────────────────────────────
export function InvoicesScreen() {
  const { navigate, invoices, profile } = useApp()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = InvoiceDB.search({ query, status: filter })

  return (
    <div className="flex flex-col min-h-full">
      <div style={{ background: profile?.color || '#085041' }} className="px-4 py-3">
        <div className="text-white font-medium text-[15px] mb-3">Faktur</div>
        <input value={query} onChange={e=>setQuery(e.target.value)}
          placeholder="Cari pelanggan atau no. faktur…"
          className="w-full px-3 py-2 rounded-lg text-sm bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:bg-white/20" />
      </div>
      <div className="flex gap-2 px-3 py-2 bg-white border-b border-slate-200 overflow-x-auto">
        {['all','unpaid','partial','paid','overdue','draft'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap border cursor-pointer transition-colors"
            style={filter===s
              ? { background: profile?.color||'#085041', color:'#fff', borderColor: profile?.color||'#085041' }
              : { background:'white', color:'#64748b', borderColor:'#e2e8f0' }}>
            {s === 'all' ? 'Semua' : ({date:'Tanggal',client:'Pelanggan',amount:'Nominal'})[s]}
          </button>
        ))}
      </div>
      <div className="bg-white border-b border-slate-200 flex-1">
        {filtered.length === 0
          ? <div className="py-12 text-center text-sm text-slate-400">Tidak ada faktur ditemukan</div>
          : filtered.map(inv => (
            <button key={inv.id} onClick={() => navigate('invoice-preview', inv)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-none cursor-pointer text-left hover:bg-slate-50">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-slate-800 truncate">{inv.clientName}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{inv.num} · {inv.date} · {(inv.items||[]).length} barang</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[13px] font-medium text-slate-800 mb-0.5">{fmtShort(inv.total)}</div>
                <StatusPill status={inv.status} />
              </div>
            </button>
          ))
        }
      </div>
    </div>
  )
}

// ─── Reports ─────────────────────────────────────────────────────
export function ReportsScreen() {
  const { navigate, profile, showToast } = useApp()
  const [sort, setSort] = useState('date')
  const all   = InvoiceDB.getAll()
  const stats = InvoiceDB.stats()

  const sorted = [...all].sort((a,b) => {
    if (sort==='client') return (a.clientName||'').localeCompare(b.clientName||'')
    if (sort==='amount') return (b.total||0)-(a.total||0)
    return (b.date||'').localeCompare(a.date||'')
  })

  const months = InvoiceDB.monthlyData()
  const maxV   = Math.max(...months.map(m => m.invoiced), 1)
  const brandColor = (profile?.color==='#ffffff'||profile?.color==='#F8FAFC')?'#085041':profile?.color||'#085041'

  const doExportCSV = () => {
    const csv  = InvoiceDB.exportCSV()
    const blob = new Blob([csv], { type:'text/csv' })
    const a    = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `invoices_${new Date().toISOString().slice(0,7)}.csv`
    a.click()
    showToast('CSV downloaded ✓')
  }

  const doExportExcel = () => {
    exportExcel(all, `invoices_${new Date().toISOString().slice(0,7)}.xlsx`)
    showToast('Excel downloaded ✓')
  }

  const doExportPDF = () => {
    // print a summary report
    const html = `<!DOCTYPE html><html><head><style>
      body{font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px}
      h1{font-size:18px;color:#111}h2{font-size:13px;color:#666;margin-top:20px}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}
      th{text-align:left;padding:6px 8px;border-bottom:2px solid #ddd;font-size:9px;text-transform:uppercase;color:#888}
      td{padding:6px 8px;border-bottom:1px solid #eee}
      .r{text-align:right} .b{font-weight:600}
      .stat{display:inline-block;background:#f7f7f7;padding:8px 16px;border-radius:8px;margin-right:8px;margin-bottom:8px}
      .stat-v{font-size:16px;font-weight:700;color:#111} .stat-l{font-size:9px;color:#888;text-transform:uppercase}
    </style></head><body>
    <h1>Invoice Report — ${new Date().toLocaleString('default',{month:'long',year:'numeric'})}</h1>
    <div style="margin:16px 0">
      <div class="stat"><div class="stat-v">IDR ${stats.totalInvoiced.toLocaleString('id-ID')}</div><div class="stat-l">Invoiced</div></div>
      <div class="stat"><div class="stat-v">IDR ${stats.totalTerkumpul.toLocaleString('id-ID')}</div><div class="stat-l">Terkumpul</div></div>
      <div class="stat"><div class="stat-v">IDR ${stats.outstanding.toLocaleString('id-ID')}</div><div class="stat-l">Belum dibayar</div></div>
      <div class="stat"><div class="stat-v">${stats.totalCount}</div><div class="stat-l">Total invoices</div></div>
    </div>
    <h2>All invoices</h2>
    <table><thead><tr><th>#</th><th>Client</th><th>Date</th><th class="r">Total</th><th class="r">Paid</th><th>Status</th></tr></thead>
    <tbody>${sorted.map((inv,i) => `<tr><td>${inv.num}</td><td class="b">${inv.clientName}</td><td>${inv.date}</td>
      <td class="r">IDR ${(inv.total||0).toLocaleString('id-ID')}</td><td class="r">IDR ${(inv.paid||0).toLocaleString('id-ID')}</td>
      <td>${inv.status}</td></tr>`).join('')}</tbody></table>
    </body></html>`
    const win = window.open('','_blank')
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  return (
    <div className="flex flex-col min-h-full">
      <div style={{ background: profile?.color||'#085041' }} className="px-4 py-4">
        <div className="text-white font-medium text-[15px]">Laporan</div>
        <div className="text-white/50 text-[12px] mt-0.5">{new Date().toLocaleString('default',{month:'long',year:'numeric'})}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Total difakturkan</div>
          <div className="text-base font-medium text-slate-800">{fmtIDR(stats.totalInvoiced)}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Terkumpul</div>
          <div className="text-base font-medium text-green-700">{fmtIDR(stats.totalTerkumpul)}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Belum dibayar</div>
          <div className="text-base font-medium text-red-700">{fmtIDR(stats.outstanding)}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Faktur</div>
          <div className="text-base font-medium text-slate-800">{stats.totalCount}</div>
        </div>
      </div>

      {/* bar chart */}
      <div className="bg-white border-t border-b border-slate-200 p-4 mb-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-3">Pendapatan bulanan</div>
        <div className="flex items-end gap-1.5 h-16">
          {months.map((m,i) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm"
                style={{ height: Math.max(4, Math.round((m.invoiced/maxV)*56)),
                  background: i===months.length-1 ? brandColor : '#e2e8f0' }} />
              <span className="text-[9px] text-slate-400">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* export */}
      <div className="flex gap-2 px-3 pb-2">
        <button onClick={doExportCSV}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-700 cursor-pointer hover:bg-slate-50">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="12" y2="18"/><line x1="15" y1="15" x2="12" y2="18"/></svg>
          CSV
        </button>
        <button onClick={doExportExcel}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-700 cursor-pointer hover:bg-slate-50">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Excel
        </button>
        <button onClick={doExportPDF}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-700 cursor-pointer hover:bg-slate-50">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          PDF
        </button>
      </div>

      {/* sort + list */}
      <div className="px-3 pb-1 flex items-center gap-2">
        <span className="text-[11px] text-slate-400">Sort:</span>
        {['date','client','amount'].map(s => (
          <button key={s} onClick={() => setSort(s)}
            className="text-[11px] px-2.5 py-1 rounded-full border cursor-pointer"
            style={sort===s ? {background:brandColor,color:'#fff',borderColor:brandColor} : {background:'white',color:'#64748b',borderColor:'#e2e8f0'}}>
            {({date:'Tanggal',client:'Pelanggan',amount:'Nominal'})[s]}
          </button>
        ))}
      </div>

      <div className="bg-white border-t border-b border-slate-200">
        {sorted.map(inv => (
          <button key={inv.id} onClick={() => navigate('invoice-preview', inv)}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-none cursor-pointer text-left hover:bg-slate-50">
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-slate-800 truncate">{inv.clientName}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{inv.num} · {inv.date}</div>
            </div>
            <StatusPill status={inv.status} />
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-[12px] font-medium text-slate-800">{fmtIDR(inv.total)}</div>
              <div className="text-[10px] text-slate-400">Dibayar: {fmtIDR(inv.paid||0)}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Clients ─────────────────────────────────────────────────────
export function ClientsScreen() {
  const { navigate, clients, refreshClients, profile, showToast } = useApp()
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [cf, setCf] = useState({ name:'', email:'', phone:'', addr:'', npwp:'' })
  const filtered = query ? clients.filter(c => c.name?.toLowerCase().includes(query.toLowerCase())) : clients
  const brandColor = (profile?.color==='#ffffff'||profile?.color==='#F8FAFC')?'#085041':profile?.color||'#085041'

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#085041] focus:ring-2 focus:ring-[#085041]/10"
  const labelCls = "text-[11px] text-slate-400 mb-1 block"

  const openAdd = () => { setCf({ name:'', email:'', phone:'', addr:'', npwp:'' }); setEditClient(null); setShowForm(true) }
  const openEdit = (c) => { setCf({ name:c.name||'', email:c.email||'', phone:c.phone||'', addr:c.addr||'', npwp:c.npwp||'' }); setEditClient(c); setShowForm(true) }

  const doSave = () => {
    if (!cf.name) { showToast('Nama pelanggan wajib diisi'); return }
    if (editClient) {
      ClientDB.save({ ...editClient, ...cf })
      showToast('Pelanggan diperbarui ✓')
    } else {
      ClientDB.save(cf)
      showToast('Pelanggan ditambahkan ✓')
    }
    refreshClients()
    setShowForm(false)
  }

  const doDelete = (c) => {
    if (window.confirm(`Delete ${c.name}?`)) {
      ClientDB.delete(c.id)
      refreshClients()
      showToast('Pelanggan dihapus')
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div style={{ background: profile?.color||'#085041' }} className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-medium text-[15px]">Pelanggan</div>
          <button onClick={openAdd}
            className="text-[12px] font-medium px-3 py-1.5 rounded-full border border-white/30 bg-white/10 text-white cursor-pointer">
            + Tambah
          </button>
        </div>
        <input value={query} onChange={e=>setQuery(e.target.value)}
          placeholder="Cari pelanggan…"
          className="w-full px-3 py-2 rounded-lg text-sm bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none" />
      </div>
      <div className="bg-white border-b border-slate-200 flex-1">
        {filtered.length === 0
          ? <div className="py-12 text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm text-slate-400 mb-3">Belum ada pelanggan</div>
              <button onClick={openAdd} className="text-[12px] px-4 py-2 rounded-lg border-none text-white cursor-pointer" style={{background:brandColor}}>
                + Tambah your first client
              </button>
            </div>
          : filtered.map((c, i) => (
            <div key={c.id || i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-medium"
                style={{ background: '#E1F5EE', color: brandColor }}>
                {initials(c.name)}
              </div>
              <button onClick={() => openEdit(c)} className="flex-1 min-w-0 bg-none border-none cursor-pointer text-left p-0">
                <div className="text-[13px] font-medium text-slate-800">{c.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{c.email || c.phone || 'Tidak ada kontak'}</div>
              </button>
              <div className="text-right flex-shrink-0">
                <div className="text-[11px] text-slate-400">{InvoiceDB.getAll().filter(inv=>inv.clientName===c.name).length} faktur</div>
                <div className="text-[12px] font-medium text-slate-700 mt-0.5">
                  {fmtShort(InvoiceDB.getAll().filter(inv=>inv.clientName===c.name).reduce((s,inv)=>s+(inv.total||0),0))}
                </div>
              </div>
              <button onClick={() => doDelete(c)} className="p-1 text-slate-300 hover:text-red-500 bg-none border-none cursor-pointer">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
              </button>
            </div>
          ))
        }
      </div>

      {/* add/edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={e=>e.target===e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md pb-6">
            <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-2"/>
            <div className="px-4 pb-3 text-[15px] font-medium text-slate-800">{editClient ? 'Ubah pelanggan' : 'Tambah pelanggan'}</div>
            <div className="px-4 flex flex-col gap-3">
              <div>
                <label className={labelCls}>Client name *</label>
                <input className={inputCls} value={cf.name} placeholder="PT. atau nama" onChange={e=>setCf(p=>({...p,name:e.target.value}))}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Email</label>
                  <input className={inputCls} type="email" value={cf.email} placeholder="email@..." onChange={e=>setCf(p=>({...p,email:e.target.value}))}/>
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} value={cf.phone} placeholder="+62..." onChange={e=>setCf(p=>({...p,phone:e.target.value}))}/>
                </div>
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <textarea className={inputCls} rows={2} value={cf.addr} placeholder="Jalan, kota..." onChange={e=>setCf(p=>({...p,addr:e.target.value}))}/>
              </div>
              <div>
                <label className={labelCls}>NPWP</label>
                <input className={inputCls} value={cf.npwp} placeholder="Opsional" onChange={e=>setCf(p=>({...p,npwp:e.target.value}))}/>
              </div>
              <button onClick={doSave}
                className="w-full py-3 rounded-xl border-none text-white font-medium cursor-pointer"
                style={{ background: brandColor }}>
                {editClient ? 'Perbarui pelanggan' : 'Tambah pelanggan'}
              </button>
              <button onClick={()=>setShowForm(false)}
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

// ─── Products catalog ────────────────────────────────────────────
export function ProductsScreen() {
  const { navigate, profile, showToast } = useApp()
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [pf, setPf] = useState({ name:'', rate:'', desc:'', type:'service', unit:'pcs', code:'' })
  const [products, setProducts] = useState(ProductDB.getAll())
  const filtered = query ? products.filter(p => p.name?.toLowerCase().includes(query.toLowerCase())) : products
  const brandColor = (profile?.color==='#ffffff'||profile?.color==='#F8FAFC')?'#085041':profile?.color||'#085041'

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#085041] focus:ring-2 focus:ring-[#085041]/10"
  const labelCls = "text-[11px] text-slate-400 mb-1 block"

  const refresh = () => setProducts(ProductDB.getAll())
  const openAdd = () => { setPf({ name:'', rate:'', desc:'', type:'service', unit:'pcs', code:'' }); setEditItem(null); setShowForm(true) }
  const openEdit = (p) => { setPf({ name:p.name||'', rate:p.rate||'', desc:p.desc||'', type:p.type||'service', unit:p.unit||'pcs', code:p.code||'' }); setEditItem(p); setShowForm(true) }

  const doSave = () => {
    if (!pf.name) { showToast('Nama produk wajib diisi'); return }
    if (editItem) {
      ProductDB.save({ ...editItem, ...pf, rate: parseFloat(pf.rate)||0 })
      showToast('Diperbarui ✓')
    } else {
      ProductDB.save({ ...pf, rate: parseFloat(pf.rate)||0 })
      showToast('Ditambahkan ✓')
    }
    refresh()
    setShowForm(false)
  }

  const doDelete = (p) => {
    if (window.confirm(`Delete ${p.name}?`)) {
      ProductDB.delete(p.id)
      refresh()
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div style={{ background: profile?.color||'#085041' }} className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('settings')} className="text-white/70 hover:text-white bg-none border-none cursor-pointer">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div className="text-white font-medium text-[15px]">Katalog barang & jasa</div>
          </div>
          <button onClick={openAdd}
            className="text-[12px] font-medium px-3 py-1.5 rounded-full border border-white/30 bg-white/10 text-white cursor-pointer">
            + Tambah
          </button>
        </div>
        <input value={query} onChange={e=>setQuery(e.target.value)}
          placeholder="Cari produk…"
          className="w-full px-3 py-2 rounded-lg text-sm bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none" />
      </div>
      <div className="p-3 text-[10px] text-slate-400">
        Produk otomatis tersimpan saat Anda membuat faktur. Anda juga bisa kelola di sini.
      </div>
      <div className="bg-white border-t border-b border-slate-200 flex-1">
        {filtered.length === 0
          ? <div className="py-12 text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-sm text-slate-400 mb-3">Belum ada produk</div>
              <button onClick={openAdd} className="text-[12px] px-4 py-2 rounded-lg border-none text-white cursor-pointer" style={{background:brandColor}}>
                + Tambah product / service
              </button>
            </div>
          : filtered.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-[13px]"
                style={{ background: p.type==='service'?'#E3F2FD':'#FFF3E0' }}>
                {p.type==='service'?'🔧':'📦'}
              </div>
              <button onClick={() => openEdit(p)} className="flex-1 min-w-0 bg-none border-none cursor-pointer text-left p-0">
                <div className="text-[13px] font-medium text-slate-800">{p.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {fmtIDR(p.rate)} {p.unit ? `/ ${p.unit}` : ''} · {p.type}
                  {p.code ? ` · ${p.code}` : ''}
                </div>
              </button>
              <button onClick={() => doDelete(p)} className="p-1 text-slate-300 hover:text-red-500 bg-none border-none cursor-pointer">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
              </button>
            </div>
          ))
        }
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={e=>e.target===e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md pb-6">
            <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-2"/>
            <div className="px-4 pb-3 text-[15px] font-medium text-slate-800">{editItem ? 'Ubah produk' : 'Tambah barang / jasa'}</div>
            <div className="px-4 flex flex-col gap-3">
              <div>
                <label className={labelCls}>Name *</label>
                <input className={inputCls} value={pf.name} placeholder="cth. Jasa Desain Logo" onChange={e=>setPf(p=>({...p,name:e.target.value}))}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Rate (IDR)</label>
                  <input className={inputCls} type="number" value={pf.rate} placeholder="0" onChange={e=>setPf(p=>({...p,rate:e.target.value}))}/>
                </div>
                <div>
                  <label className={labelCls}>Unit</label>
                  <select className={inputCls} value={pf.unit} onChange={e=>setPf(p=>({...p,unit:e.target.value}))}>
                    {['pcs','unit','jam','hari','bulan','paket','kg','meter','lot'].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select className={inputCls} value={pf.type} onChange={e=>setPf(p=>({...p,type:e.target.value}))}>
                    <option value="service">Jasa</option>
                    <option value="product">Barang</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Product code</label>
                  <input className={inputCls} value={pf.code} placeholder="Opsional" onChange={e=>setPf(p=>({...p,code:e.target.value}))}/>
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <input className={inputCls} value={pf.desc} placeholder="Opsional" onChange={e=>setPf(p=>({...p,desc:e.target.value}))}/>
              </div>
              <button onClick={doSave}
                className="w-full py-3 rounded-xl border-none text-white font-medium cursor-pointer"
                style={{ background: brandColor }}>
                {editItem ? 'Perbarui' : 'Tambah ke katalog'}
              </button>
              <button onClick={()=>setShowForm(false)}
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

// ─── Settings ────────────────────────────────────────────────────
export function SettingsScreen() {
  const { navigate, profile, showToast, trialDays, lang, setLang } = useApp()
  const fileRef = useRef(null)

  const doBackup = () => {
    const data = InvoiceDB.backup()
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob)
    a.download='simple_invoice_backup.json'; a.click()
    showToast('Cadangan diunduh ✓')
  }

  const doRestore = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader()
    r.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.invoices && !data.profile) { showToast('File cadangan tidak valid'); return }
        if (window.confirm(`Restore backup from ${data.exportedAt?.slice(0,10) || 'unknown date'}? Ini akan digabung dengan data yang ada.`)) {
          InvoiceDB.restore(data)
          showToast('Cadangan dipulihkan ✓ — muat ulang untuk melihat perubahan')
          setTimeout(() => window.location.reload(), 1500)
        }
      } catch { showToast('Tidak dapat membaca file cadangan') }
    }
    r.readAsText(file)
    e.target.value = ''
  }

  const Row = ({ icon, title, sub, subColor, onClick }) => (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-none cursor-pointer text-left hover:bg-slate-50 last:border-b-0">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background:'#E1F5EE' }}>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-medium text-slate-800">{title}</div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: subColor||'#94a3b8' }}>{sub}</div>}
      </div>
      <svg width="16" height="16" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
    </button>
  )

  return (
    <div className="flex flex-col min-h-full pb-8">
      <div style={{ background: profile?.color||'#085041' }} className="px-4 py-4">
        <div className="text-white font-medium text-[15px]">Pengaturan</div>
      </div>

      <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-400 px-4 py-2">Bisnis</div>
      <div className="bg-white border-t border-b border-slate-200">
        <Row icon="🏪" title="Profil bisnis" sub={profile?.bizName || 'Belum diatur'} onClick={() => navigate('profile')} />
        <Row icon="🎨" title="Warna & tema brand" sub={profile?.themeName || profile?.color || '#085041'} onClick={() => navigate('profile')} />
        <Row icon="📄" title="Pengaturan faktur" sub="Format nomor · Tarif pajak · Tempo" onClick={() => navigate('profile')} />
        <Row icon="📦" title="Katalog produk" sub={`${ProductDB.getAll().length} produk tersimpan`} onClick={() => navigate('products')} />
      </div>

      <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-400 px-4 py-2">Pembayaran</div>
      <div className="bg-white border-t border-b border-slate-200">
        <Row icon="💳" title="Gerbang pembayaran Midtrans" sub="Belum terhubung — ketuk untuk atur" onClick={() => showToast('Pengaturan Midtrans — segera hadir')} />
        <Row icon="🏦" title="Rekening bank" sub={(profile?.banks||[]).length > 0 ? `${profile.banks.length} rekening` : 'Belum ada rekening'} onClick={() => navigate('profile')} />
      </div>

      <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-400 px-4 py-2">Data</div>
      <div className="bg-white border-t border-b border-slate-200">
        <Row icon="💾" title="Ekspor cadangan" sub="Unduh semua data sebagai JSON" onClick={doBackup} />
        <Row icon="📥" title="Impor cadangan" sub="Pulihkan dari file JSON" onClick={() => fileRef.current?.click()} />
        <input ref={fileRef} type="file" accept=".json" onChange={doRestore} className="hidden" />
      </div>

      <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-400 px-4 py-2">Akun</div>
      <div className="bg-white border-t border-b border-slate-200">
        <Row icon="👑" title="Langganan" sub={`Uji coba gratis — ${trialDays} hari tersisa`} subColor="#854F0B" onClick={() => navigate('paywall')} />
        <Row icon="🌐" title="Language / Bahasa"
          sub={lang === 'id' ? 'Bahasa Indonesia' : 'English'}
          onClick={() => {
            const newLang = lang === 'id' ? 'en' : 'id'
            setLang(newLang)
            showToast(newLang === 'id' ? 'Bahasa Indonesia dipilih ✓' : 'English selected ✓')
            setTimeout(() => window.location.reload(), 800)
          }} />
        <Row icon="📋" title="Syarat & Kebijakan Privasi" sub="Hukum yang berlaku: Republik Indonesia" onClick={() => showToast('Membuka syarat & ketentuan…')} />
      </div>

      <div className="mt-6 text-center text-[10px] text-slate-400 leading-relaxed px-4">
        Faktur Kita v1.1.0<br/>
        © 2026 · Hak cipta dilindungi<br/>
        Dilindungi UU No. 28 Tahun 2014 tentang Hak Cipta
      </div>
    </div>
  )
}

// ─── Paywall ─────────────────────────────────────────────────────
export function PaywallScreen() {
  const { navigate, trialDays, showToast } = useApp()
  const [selected, setSelected] = useState('yearly')
  const plans = [
    { id:'monthly',   name:'Bulanan',   price:'Rp 59.000',  period:'/month',    equiv:'',                   badge:'' },
    { id:'quarterly', name:'3 Bulan',  price:'Rp 149.000', period:'/3 months', equiv:'≈ Rp 49.700/month',  badge:'Hemat 16%' },
    { id:'yearly',    name:'Tahunan',    price:'Rp 479.000', period:'/year',     equiv:'≈ Rp 39.900/month',  badge:'Paling hemat' },
  ]
  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-[#085041] px-4 pt-4 pb-6 flex flex-col items-center text-center">
        <button onClick={() => navigate('settings')} className="self-start text-white/60 bg-none border-none cursor-pointer mb-3 text-sm">← Kembali</button>
        <div className="text-4xl mb-3">👑</div>
        <div className="text-white text-xl font-medium mb-2">Buka Faktur Kita</div>
        <div className="text-white/60 text-sm leading-relaxed">Satu paket. Semua termasuk. Tanpa biaya tersembunyi.</div>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {plans.map(p => (
          <button key={p.id} onClick={() => setSelected(p.id)}
            className="w-full text-left p-4 rounded-xl border-2 cursor-pointer bg-white relative"
            style={{ borderColor: selected===p.id ? '#085041' : '#e2e8f0' }}>
            {p.badge && <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: p.badge==='Paling hemat'?'#085041':'#EAF3DE', color: p.badge==='Paling hemat'?'#fff':'#3B6D11' }}>{p.badge}</span>}
            <div className="text-[13px] font-medium text-slate-700 mb-1">{p.name}</div>
            <div className="text-xl font-medium text-slate-800">{p.price}<span className="text-sm font-normal text-slate-400">{p.period}</span></div>
            {p.equiv && <div className="text-[11px] text-slate-400 mt-0.5">{p.equiv}</div>}
            {selected===p.id && <div className="absolute top-3.5 left-3.5 w-4 h-4 rounded-full bg-[#085041] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white"/>
            </div>}
          </button>
        ))}
      </div>
      <div className="px-4 pb-6 flex flex-col gap-3">
        <button onClick={() => showToast('Mengarahkan ke pembayaran Midtrans…')}
          className="w-full py-4 rounded-2xl bg-[#085041] text-white font-medium text-[15px] border-none cursor-pointer">
          Berlangganan via Midtrans →
        </button>
        <button onClick={() => navigate('dashboard')}
          className="w-full py-3 rounded-2xl border border-slate-200 bg-white text-slate-500 text-sm cursor-pointer">
          Lanjut uji coba gratis ({trialDays} hari tersisa)
        </button>
        <div className="text-center text-[10px] text-slate-400 leading-relaxed">
          Didukung Midtrans · Berizin Bank Indonesia<br/>
          Batal kapan saja · Data Anda tidak akan dihapus
        </div>
      </div>
    </div>
  )
}

export default OnboardingScreen

import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { Section, Field, Input, BalanceBlock } from '../components/UI'
import { ProfileDB, ClientDB, ProductDB, calcInvoice, fmtIDR, today, daysFromNow } from '../utils/db'
import SignatureCanvas from 'react-signature-canvas'

const parse = v => parseFloat((v||'').toString().replace(/[^\d.-]/g,''))||0

export default function InvoiceForm() {
  const { navigate, saveInvoice, currentInvoice, setCurrentInvoice, showToast, profile, clients } = useApp()
  const prof = ProfileDB.get()
  const sigRef = useRef(null)

  const blank = {
    num:         ProfileDB.nextInvoiceNum(),
    date:        today(),
    due:         daysFromNow(parseInt(prof.terms||30)),
    clientName:  '', clientEmail:'', clientPhone:'', clientAddr:'', clientNpwp:'',
    items:       [{ id:1, name:'', qty:1, rate:0, desc:'', type:'service' }],
    discountVal: 0, discountType:'fixed',
    taxPct:      parseFloat(prof.taxrate||0),
    shipping:    0,
    payments:    [],
    notes:       prof.defnote ? [{ type:'footer', text:prof.defnote }] : [],
    sigName:     '', sigData: null,
  }

  const [form,    setForm]    = useState(currentInvoice || blank)
  const [open,    setOpen]    = useState(new Set(['client','items']))
  const [discType,setDiscType]= useState(form.discountType || 'fixed')
  const [showSig, setShowSig] = useState(false)

  // client autocomplete
  const [clientQuery, setClientQuery] = useState(form.clientName || '')
  const [showClients, setShowClients] = useState(false)
  const allClients = ClientDB.getAll()
  const filteredClients = clientQuery
    ? allClients.filter(c => c.name?.toLowerCase().includes(clientQuery.toLowerCase()))
    : allClients

  const calc = calcInvoice(form.items, form.discountVal, discType, form.taxPct, form.shipping, form.payments)

  const upd = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const selectClient = (client) => {
    setForm(f => ({
      ...f,
      clientName: client.name || '',
      clientEmail: client.email || f.clientEmail,
      clientPhone: client.phone || f.clientPhone,
      clientAddr: client.addr || f.clientAddr,
      clientNpwp: client.npwp || f.clientNpwp,
    }))
    setClientQuery(client.name || '')
    setShowClients(false)
  }

  // product catalog picker
  const allProducts = ProductDB.getAll()
  const [showProductPicker, setShowProductPicker] = useState(null)
  const [productQuery, setProductQuery] = useState('')
  const filteredProducts = productQuery
    ? allProducts.filter(p => p.name?.toLowerCase().includes(productQuery.toLowerCase()))
    : allProducts

  const pickProduct = (itemId, product) => {
    updItem(itemId, 'name', product.name)
    updItem(itemId, 'rate', product.rate || 0)
    updItem(itemId, 'desc', product.desc || '')
    updItem(itemId, 'type', product.type || 'service')
    setShowProductPicker(null)
    setProductQuery('')
  }

  const autoSaveProducts = () => {
    form.items.forEach(it => {
      if (it.name && it.rate > 0 && !allProducts.find(p => p.name === it.name)) {
        ProductDB.save({ name: it.name, rate: it.rate, desc: it.desc || '', type: it.type || 'service' })
      }
    })
  }

  // items
  const addItem = () => {
    const maxId = form.items.length ? Math.max(...form.items.map(i=>i.id)) : 0
    upd('items', [...form.items, { id:maxId+1, name:'', qty:1, rate:0, desc:'', type:'service' }])
  }
  const removeItem = id => { if(form.items.length > 1) upd('items', form.items.filter(i=>i.id!==id)) }
  const updItem = (id,f,v) => upd('items', form.items.map(i=>i.id===id?{...i,[f]:['qty','rate'].includes(f)?parse(v):v}:i))

  // payments
  const addPmt  = () => upd('payments', [...form.payments, { amount:'', date:today(), method:'Transfer bank', note:'' }])
  const rmvPmt  = i  => upd('payments', form.payments.filter((_,j)=>j!==i))
  const updPmt  = (i,f,v) => upd('payments', form.payments.map((p,j)=>j===i?{...p,[f]:v}:p))

  // notes
  const addNote = () => upd('notes', [...form.notes, { type:'footer', text:'' }])
  const rmvNote = i  => upd('notes', form.notes.filter((_,j)=>j!==i))
  const updNote = (i,f,v) => upd('notes', form.notes.map((n,j)=>j===i?{...n,[f]:v}:n))

  const toggleSec = id => setOpen(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n })

  // signature
  const saveSig = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      upd('sigData', sigRef.current.getTrimmedCanvas().toDataURL('image/png'))
    }
    setShowSig(false)
  }
  const clearSig = () => { sigRef.current?.clear(); upd('sigData', null) }

  useEffect(() => {
    if (showSig && form.sigData && sigRef.current) {
      sigRef.current.fromDataURL(form.sigData)
    }
  }, [showSig])

  const doSave = () => {
    if (!form.clientName) { showToast('Mohon isi nama pelanggan'); return }
    if (form.items.some(i=>!i.name)) { showToast('Mohon isi nama semua barang'); return }
    const inv = { ...form, discountType:discType, ...calc,
      status: calc.status, id: form.id || undefined }
    saveInvoice(inv)

    if (form.clientName && !allClients.find(c => c.name === form.clientName)) {
      ClientDB.save({ name: form.clientName, email: form.clientEmail, phone: form.clientPhone, addr: form.clientAddr, npwp: form.clientNpwp })
    }

    autoSaveProducts()

    setCurrentInvoice(inv)
    navigate('invoice-preview', inv)
  }

  const doPreview = () => {
    const inv = { ...form, discountType:discType, ...calc }
    setCurrentInvoice(inv)
    navigate('invoice-preview', inv)
  }

  const ic = (path) => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
      dangerouslySetInnerHTML={{__html:path}}/>
  )

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#085041] focus:ring-2 focus:ring-[#085041]/10"
  const labelCls = "text-[11px] text-slate-400 mb-1 block"
  const brandColor = prof.color==='#ffffff'?'#085041':prof.color||'#085041'

  return (
    <div className="flex flex-col min-h-full">

      {/* topbar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{ background: prof.color||'#085041' }}>
        <button onClick={() => navigate('dashboard')} className="text-white/70 hover:text-white bg-none border-none cursor-pointer" aria-label="Kembali">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="flex-1 text-[15px] font-medium text-white">
          {currentInvoice?.id ? 'Ubah faktur' : 'Faktur baru'}
        </span>
        <button onClick={doPreview} className="text-white/70 hover:text-white bg-none border-none cursor-pointer" aria-label="Pratinjau">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">

        {/* meta */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 grid grid-cols-2 gap-3">
          <div><label className={labelCls}>No. faktur</label>
            <input className={inputCls} value={form.num} onChange={e=>upd('num',e.target.value)}/></div>
          <div><label className={labelCls}>Tanggal</label>
            <input className={inputCls} type="date" value={form.date} onChange={e=>upd('date',e.target.value)}/></div>
          <div className="col-span-2"><label className={labelCls}>Jatuh tempo</label>
            <input className={inputCls} type="date" value={form.due} onChange={e=>upd('due',e.target.value)}/></div>
        </div>

        {/* CLIENT */}
        <Section id="client" open={open.has('client')} onToggle={toggleSec}
          icon={ic('<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>')}
          title="Pelanggan">
          <div className="flex flex-col gap-2 pt-2">
            <div className="relative">
              <label className={labelCls}>Nama pelanggan *</label>
              <input className={inputCls} value={clientQuery} placeholder="PT. atau nama — ketik untuk cari"
                onChange={e => { setClientQuery(e.target.value); upd('clientName', e.target.value); setShowClients(true) }}
                onFocus={() => setShowClients(true)}
                onBlur={() => setTimeout(() => setShowClients(false), 200)}/>
              {showClients && filteredClients.length > 0 && clientQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {filteredClients.slice(0, 5).map((c, i) => (
                    <button key={c.id || i} onMouseDown={(e) => { e.preventDefault(); selectClient(c) }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0 bg-transparent cursor-pointer">
                      <div className="font-medium text-[13px]">{c.name}</div>
                      {(c.email || c.phone) && <div className="text-[10px] text-slate-400">{c.email || c.phone}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Email <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-full">opsional</span></label>
                <input className={inputCls} type="email" value={form.clientEmail} placeholder="email@..."
                  onChange={e=>upd('clientEmail',e.target.value)}/></div>
              <div><label className={labelCls}>Telepon</label>
                <input className={inputCls} value={form.clientPhone} placeholder="+62..."
                  onChange={e=>upd('clientPhone',e.target.value)}/></div>
            </div>
            <div><label className={labelCls}>Alamat</label>
              <textarea className={inputCls} rows={2} value={form.clientAddr} placeholder="Jalan, kota..."
                onChange={e=>upd('clientAddr',e.target.value)}/></div>
            <div><label className={labelCls}>NPWP</label>
              <input className={inputCls} value={form.clientNpwp} placeholder="Opsional"
                onChange={e=>upd('clientNpwp',e.target.value)}/></div>
          </div>
        </Section>

        {/* ITEMS */}
        <Section id="items" open={open.has('items')} onToggle={toggleSec}
          icon={ic('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>')}
          title="Barang & jasa">
          <div className="flex flex-col gap-2 pt-2">
            {form.items.map(it => (
              <div key={it.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 relative">
                    <input className={inputCls} placeholder="Nama barang / jasa *"
                      value={it.name} onChange={e=>updItem(it.id,'name',e.target.value)}
                      onFocus={() => { if (allProducts.length > 0) setShowProductPicker(it.id) }}
                      onBlur={() => setTimeout(() => setShowProductPicker(null), 200)} />
                    {showProductPicker === it.id && filteredProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-20 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-36 overflow-y-auto">
                        <div className="px-2 py-1.5 text-[9px] uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">Katalog produk</div>
                        {filteredProducts.slice(0, 6).map(p => (
                          <button key={p.id} onMouseDown={e => { e.preventDefault(); pickProduct(it.id, p) }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0 bg-transparent cursor-pointer">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-[12px]">{p.name}</span>
                              <span className="text-[11px] text-slate-400">{fmtIDR(p.rate)}</span>
                            </div>
                            {p.desc && <div className="text-[10px] text-slate-400">{p.desc}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={()=>removeItem(it.id)} className="p-2 text-slate-400 hover:text-red-500 bg-none border-none cursor-pointer" aria-label="Hapus">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div><label className={labelCls}>Deskripsi</label>
                    <input className={inputCls} value={it.desc} placeholder="Opsional"
                      onChange={e=>updItem(it.id,'desc',e.target.value)}/></div>
                  <div><label className={labelCls}>Jml</label>
                    <input className={inputCls} type="number" min="0" value={it.qty}
                      onChange={e=>updItem(it.id,'qty',e.target.value)}/></div>
                  <div><label className={labelCls}>Harga (IDR)</label>
                    <input className={inputCls} type="number" min="0" value={it.rate||''}
                      placeholder="0" onChange={e=>updItem(it.id,'rate',e.target.value)}/></div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <select className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-500"
                    value={it.type} onChange={e=>updItem(it.id,'type',e.target.value)}>
                    <option value="service">Jasa</option>
                    <option value="product">Barang</option>
                  </select>
                  <span className="text-[12px] font-medium text-slate-700">= {fmtIDR(it.qty*it.rate)}</span>
                </div>
              </div>
            ))}
            <button onClick={addItem}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed rounded-lg text-[12px] bg-none cursor-pointer hover:bg-green-50"
              style={{ borderColor: brandColor, color: brandColor }}>
              + Tambah barang
            </button>
            <div className="flex justify-between text-[13px] font-medium text-slate-800 pt-1 border-t border-slate-200">
              <span>Subtotal</span><span>{fmtIDR(calc.subtotal)}</span>
            </div>
          </div>
        </Section>

        {/* DISCOUNT */}
        <Section id="disc" open={open.has('disc')} onToggle={toggleSec}
          icon={ic('<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>')}
          title="Diskon">
          <div className="flex gap-2 mt-3">
            {['fixed','pct'].map(t => (
              <button key={t} onClick={()=>setDiscType(t)}
                className="flex-1 py-2 rounded-lg text-[12px] border cursor-pointer"
                style={discType===t?{background:brandColor,color:'#fff',borderColor:brandColor}:{background:'white',color:'#64748b',borderColor:'#e2e8f0'}}>
                {t==='fixed' ? 'IDR tetap' : '% persen'}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className={labelCls}>{discType==='pct'?'Diskon (%)':'Jumlah diskon (IDR)'}</label>
            <input className={inputCls} type="number" min="0" value={form.discountVal||''}
              placeholder="0" onChange={e=>upd('discountVal',parse(e.target.value))}/>
          </div>
        </Section>

        {/* TAX */}
        <Section id="tax" open={open.has('tax')} onToggle={toggleSec}
          icon={ic('<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>')}
          title="Pajak (PPN)">
          <div className="mt-3">
            <label className={labelCls}>Tarif pajak (%)</label>
            <input className={inputCls} type="number" min="0" max="100" value={form.taxPct||''}
              placeholder="11" onChange={e=>upd('taxPct',parse(e.target.value))}/>
          </div>
        </Section>

        {/* SHIPPING */}
        <Section id="ship" open={open.has('ship')} onToggle={toggleSec}
          icon={ic('<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>')}
          title="Ongkos kirim">
          <div className="mt-3">
            <label className={labelCls}>Biaya pengiriman (IDR)</label>
            <input className={inputCls} type="number" min="0" value={form.shipping||''}
              placeholder="0" onChange={e=>upd('shipping',parse(e.target.value))}/>
          </div>
        </Section>

        {/* TOTALS */}
        <div className="bg-white mt-2 border-t border-b border-slate-200 px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-[13px] text-slate-500"><span>Subtotal</span><span>{fmtIDR(calc.subtotal)}</span></div>
          {calc.discount>0 && <div className="flex justify-between text-[13px] text-slate-500"><span>Diskon</span><span>−{fmtIDR(calc.discount)}</span></div>}
          {calc.tax>0      && <div className="flex justify-between text-[13px] text-slate-500"><span>Pajak ({form.taxPct}%)</span><span>{fmtIDR(calc.tax)}</span></div>}
          {form.shipping>0 && <div className="flex justify-between text-[13px] text-slate-500"><span>Ongkos kirim</span><span>{fmtIDR(form.shipping)}</span></div>}
          <div className="flex justify-between text-[16px] font-medium text-slate-800 pt-2 border-t border-slate-200"><span>Total</span><span>{fmtIDR(calc.total)}</span></div>
        </div>

        {/* PAYMENTS */}
        <Section id="pay" open={open.has('pay')} onToggle={toggleSec}
          icon={ic('<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>')}
          title="Pembayaran diterima">
          <div className="flex flex-col gap-2 pt-2">
            {form.payments.map((p,i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-slate-500">Pembayaran {i+1}</span>
                  <button onClick={()=>rmvPmt(i)} className="text-slate-400 hover:text-red-500 bg-none border-none cursor-pointer p-1" aria-label="Hapus">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>Jumlah (IDR)</label>
                    <input className={inputCls} type="number" min="0" value={p.amount||''}
                      placeholder="0" onChange={e=>updPmt(i,'amount',e.target.value)}/></div>
                  <div><label className={labelCls}>Tanggal</label>
                    <input className={inputCls} type="date" value={p.date}
                      onChange={e=>updPmt(i,'date',e.target.value)}/></div>
                  <div><label className={labelCls}>Metode</label>
                    <select className={inputCls} value={p.method} onChange={e=>updPmt(i,'method',e.target.value)}>
                      {['Tunai','Transfer bank','QRIS','Kartu kredit','Lainnya'].map(m=><option key={m}>{m}</option>)}
                    </select></div>
                  <div><label className={labelCls}>Catatan</label>
                    <input className={inputCls} value={p.note||''} placeholder="Opsional"
                      onChange={e=>updPmt(i,'note',e.target.value)}/></div>
                </div>
              </div>
            ))}
            <button onClick={addPmt}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed rounded-lg text-[12px] bg-none cursor-pointer hover:bg-green-50"
              style={{ borderColor: brandColor, color: brandColor }}>
              + Tambah pembayaran
            </button>
            {form.payments.length>0 &&
              <div className="flex justify-between text-[12px] text-slate-500">
                <span>Total dibayar</span>
                <span>{fmtIDR(form.payments.reduce((s,p)=>s+parse(p.amount),0))}</span>
              </div>}
          </div>
        </Section>

        {/* BALANCE */}
        <BalanceBlock balance={calc.balance} paid={calc.paid} total={calc.total} />

        {/* NOTES */}
        <Section id="notes" open={open.has('notes')} onToggle={toggleSec}
          icon={ic('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>')}
          title="Catatan">
          <div className="flex flex-col gap-2 pt-2">
            {form.notes.map((n,i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <select className="text-[11px] px-2 py-1 rounded border border-slate-200 bg-white text-slate-500"
                    value={n.type} onChange={e=>updNote(i,'type',e.target.value)}>
                    <option value="footer">Catatan bawah</option>
                    <option value="header">Catatan atas</option>
                  </select>
                  <button onClick={()=>rmvNote(i)} className="text-slate-400 hover:text-red-500 bg-none border-none cursor-pointer p-1" aria-label="Hapus">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <textarea className={inputCls} rows={2} value={n.text||''}
                  placeholder="Tulis catatan…" onChange={e=>updNote(i,'text',e.target.value)}/>
              </div>
            ))}
            <button onClick={addNote}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed rounded-lg text-[12px] bg-none cursor-pointer hover:bg-green-50"
              style={{ borderColor: brandColor, color: brandColor }}>
              + Tambah catatan
            </button>
            <div className="flex gap-2 flex-wrap">
              {['Terima kasih atas kepercayaan Anda!','Pembayaran jatuh tempo dalam 30 hari.','Bank BCA 123-456-7890'].map(t=>(
                <button key={t} onClick={()=>{ upd('notes',[...form.notes,{type:'footer',text:t}]); if(!open.has('notes')) toggleSec('notes') }}
                  className="text-[10px] px-2.5 py-1 border border-slate-200 rounded-full bg-white text-slate-500 cursor-pointer hover:bg-slate-50">{t.slice(0,24)}…</button>
              ))}
            </div>
          </div>
        </Section>

        {/* SIGNATURE */}
        <Section id="sig" open={open.has('sig')} onToggle={toggleSec}
          icon={ic('<path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>')}
          title="Tanda tangan">
          <div className="flex flex-col gap-3 pt-2">
            {form.sigData ? (
              <div className="flex flex-col items-center gap-2">
                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                  <img src={form.sigData} alt="Tanda tangan" className="max-h-16 max-w-[200px] object-contain"/>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { upd('sigData', null); setShowSig(true) }}
                    className="text-[11px] px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-500 cursor-pointer">
                    Tanda tangan ulang
                  </button>
                  <button onClick={() => upd('sigData', null)}
                    className="text-[11px] px-3 py-1.5 border border-red-200 rounded-lg bg-red-50 text-red-500 cursor-pointer">
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowSig(true)}
                className="flex items-center justify-center gap-1.5 w-full py-3 border border-dashed rounded-lg text-[12px] bg-none cursor-pointer hover:bg-green-50"
                style={{ borderColor: brandColor, color: brandColor }}>
                ✍️ Gambar tanda tangan
              </button>
            )}
            <div>
              <label className={labelCls}>Ditandatangani oleh</label>
              <input className={inputCls} value={form.sigName||''} placeholder="Nama penanda tangan"
                onChange={e=>upd('sigName',e.target.value)}/>
            </div>
          </div>
        </Section>

      </div>

      {/* action bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 grid grid-cols-4 gap-2 px-3 py-2.5 z-10">
        <button onClick={doSave}
          className="flex flex-col items-center gap-0.5 py-2 rounded-xl border-none text-white text-[11px] font-medium cursor-pointer"
          style={{ background: brandColor }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Simpan
        </button>
        {[
          { label:'Kirim',  icon:'<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',  action:() => { doSave(); } },
          { label:'Cetak', icon:'<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
            action:() => { const inv={...form,discountType:discType,...calc}; import('../utils/pdf').then(m=>m.printInvoice(inv,prof,prof.invoiceTemplate||'classic')) } },
          { label:'Lain',  icon:'<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>', action:() => showToast('Opsi lainnya segera hadir') },
        ].map(b => (
          <button key={b.label} onClick={b.action}
            className="flex flex-col items-center gap-0.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-[11px] font-medium cursor-pointer hover:bg-slate-50">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" dangerouslySetInnerHTML={{__html:b.icon}}/>
            {b.label}
          </button>
        ))}
      </div>

      {/* signature modal */}
      {showSig && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={e => e.target===e.currentTarget && setShowSig(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md pb-6">
            <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-2"/>
            <div className="px-4 pb-3 flex items-center justify-between">
              <span className="text-[15px] font-medium text-slate-800">Gambar tanda tangan Anda</span>
              <button onClick={() => sigRef.current?.clear()}
                className="text-[12px] text-slate-400 bg-none border-none cursor-pointer">Bersihkan</button>
            </div>
            <div className="mx-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden" style={{ touchAction:'none' }}>
              <SignatureCanvas ref={sigRef}
                canvasProps={{ width: 360, height: 160, className: 'w-full', style: { touchAction:'none' } }}
                penColor="#111" backgroundColor="rgba(0,0,0,0)" />
            </div>
            <div className="px-4 mt-3 text-center text-[10px] text-slate-400 mb-3">Gambar dengan jari atau mouse</div>
            <div className="px-4 flex gap-2">
              <button onClick={saveSig}
                className="flex-1 py-3 rounded-xl border-none text-white font-medium cursor-pointer"
                style={{ background: brandColor }}>
                Simpan tanda tangan
              </button>
              <button onClick={() => setShowSig(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-slate-500 cursor-pointer">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ProfileDB, InvoiceDB, today, daysFromNow } from '../utils/db'
import { buildInvoiceHTML, buildWhatsAppMsg, printInvoice } from '../utils/pdf'
import { t } from '../utils/i18n'

export default function InvoicePreview() {
  const { navigate, currentInvoice, setCurrentInvoice, showToast, deleteInvoice, saveInvoice } = useApp()
  const [showSend, setShowSend] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const inv  = currentInvoice || {}
  const prof = ProfileDB.get()
  const template = prof.invoiceTemplate || 'classic'
  const html = buildInvoiceHTML(inv, prof, template)
  const brandColor = (prof.color === '#ffffff' || prof.color === '#F8FAFC') ? '#085041' : prof.color || '#085041'

  const sendWA = () => {
    const msg = buildWhatsAppMsg(inv, prof)
    const num = (inv.clientPhone || prof.phone || '62').replace(/[^\d]/g,'')
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
    setShowSend(false)
    showToast('Membuka WhatsApp…')
  }

  const sendEmail = () => {
    const sub  = encodeURIComponent(`Invoice ${inv.num} — Rp ${(inv.total||0).toLocaleString('id-ID')}`)
    const body = encodeURIComponent(`Dear ${inv.clientName},\n\nPlease find invoice ${inv.num} attached.\n\nTotal: Rp ${(inv.total||0).toLocaleString('id-ID')}\nDue: ${inv.due}\n\nThank you.`)
    window.location.href = `mailto:${inv.clientEmail || ''}?subject=${sub}&body=${body}`
    setShowSend(false)
  }

  const doPrint = () => printInvoice(inv, prof, template)

  const doDelete = () => {
    if (window.confirm('Hapus faktur ini?')) {
      deleteInvoice(inv.id)
      navigate('invoices')
    }
  }

  // ── Clone / Duplikat invoice ──
  const doClone = () => {
    const cloned = {
      ...inv,
      id: undefined,
      num: ProfileDB.nextInvoiceNum(),
      date: today(),
      due: daysFromNow(parseInt(prof.terms || 30)),
      payments: [],
      paid: 0,
      balance: inv.total || 0,
      status: 'unpaid',
      sigData: null,
      sigName: '',
    }
    delete cloned.id
    delete cloned.createdAt
    delete cloned.updatedAt
    setCurrentInvoice(cloned)
    navigate('invoice-form', cloned)
    showToast(t('invoiceNo') + ' ' + cloned.num + ' — diduplikat ✓')
  }

  // ── Create quotation from invoice ──
  const doPenawaran = () => {
    const quot = {
      ...inv,
      id: undefined,
      num: 'QUO-' + (inv.num || '').replace(/^INV-?/, ''),
      docType: 'quotation',
      date: today(),
      due: daysFromNow(14),
      payments: [],
      paid: 0,
      balance: inv.total || 0,
      status: 'draft',
      sigData: null,
      sigName: '',
    }
    delete quot.id
    delete quot.createdAt
    setCurrentInvoice(quot)
    navigate('invoice-form', quot)
    showToast('Penawaran created ✓')
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-700">

      {/* topbar */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 bg-slate-800">
        <button onClick={() => navigate(inv.id ? 'invoices' : 'invoice-form')}
          className="text-white/70 hover:text-white bg-none border-none cursor-pointer" aria-label="Back">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span className="flex-1 text-[14px] font-medium text-white truncate">{inv.num} — {inv.clientName}</span>
        <button onClick={() => navigate('invoice-form', inv)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 bg-transparent text-white text-[12px] cursor-pointer">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          {'Ubah'}
        </button>
        <button onClick={() => setShowSend(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 bg-transparent text-white text-[12px] cursor-pointer">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          {'Kirim'}
        </button>
        <button onClick={doPrint}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-none text-white text-[12px] cursor-pointer"
          style={{ background: brandColor }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          {'Cetak'}
        </button>
      </div>

      {/* paper */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="bg-white rounded shadow-lg overflow-hidden">
          <iframe srcDoc={html} title="Invoice preview" className="w-full border-none"
            style={{ minHeight: 700 }}
            onLoad={e => { const h = e.target.contentDocument?.body?.scrollHeight; if (h) e.target.style.height = h + 'px' }}
          />
        </div>

        {/* action buttons */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <button onClick={doClone}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-[12px] cursor-pointer">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            Duplikat
          </button>
          <button onClick={doPenawaran}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-[12px] cursor-pointer">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Penawaran
          </button>
          <button onClick={doDelete}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 text-[12px] cursor-pointer">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            {'Hapus'}
          </button>
        </div>
      </div>

      {/* send modal */}
      {showSend && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={e => e.target===e.currentTarget && setShowSend(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md pb-6">
            <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-2"/>
            <div className="px-4 pb-3 text-[15px] font-medium text-slate-800">{'Kirim'} {inv.num}</div>
            {[
              { icon:'💬', bg:'#E8F5E9', label:'WhatsApp', sub:`Kirim ke ${inv.clientPhone || prof.phone || ''}`, action:sendWA },
              { icon:'✉️', bg:'#E3F2FD', label:'Email',    sub: inv.clientEmail ? `Kirim ke ${inv.clientEmail}` : 'Tambah email di pelanggan', action: inv.clientEmail ? sendEmail : () => showToast('Tidak ada email — tambahkan di profil pelanggan') },
              { icon:'💳', bg:'#E8F5E9', label:'Tautan pembayaran Midtrans', sub:'Tautan pembayaran QRIS + VA', action:()=>{ setShowSend(false); showToast('Midtrans — atur dulu di Pengaturan') } },
            ].map(opt => (
              <button key={opt.label} onClick={opt.action}
                className="w-full flex items-center gap-3 px-4 py-3 border-t border-slate-100 bg-none cursor-pointer text-left hover:bg-slate-50">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background:opt.bg }}>{opt.icon}</div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-slate-800">{opt.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{opt.sub}</div>
                </div>
                <svg width="16" height="16" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
            <div className="px-4 mt-3">
              <button onClick={()=>setShowSend(false)}
                className="w-full py-3 rounded-xl border border-slate-200 bg-white text-slate-500 text-[13px] cursor-pointer">
                {'Batal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

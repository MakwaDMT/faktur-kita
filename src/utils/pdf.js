import { fmtIDR } from './db'

const hexToRgb = (hex) => ({
  r: parseInt(hex.slice(1,3),16),
  g: parseInt(hex.slice(3,5),16),
  b: parseInt(hex.slice(5,7),16)
})

const isDark = (hex) => {
  if (!hex || hex.length < 7) return true
  const { r, g, b } = hexToRgb(hex)
  return 0.299*r + 0.587*g + 0.114*b < 160
}

const lightenHex = (hex, pct) => {
  let { r, g, b } = hexToRgb(hex)
  r = Math.min(255, Math.round(r + (255-r)*pct))
  g = Math.min(255, Math.round(g + (255-g)*pct))
  b = Math.min(255, Math.round(b + (255-b)*pct))
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('')
}

const darkenHex = (hex, pct) => {
  let { r, g, b } = hexToRgb(hex)
  r = Math.max(0, Math.round(r * (1-pct)))
  g = Math.max(0, Math.round(g * (1-pct)))
  b = Math.max(0, Math.round(b * (1-pct)))
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('')
}

const accentGradient = (hex) => {
  if (hex === '#ffffff' || hex === '#F8FAFC') {
    return 'linear-gradient(90deg, #085041 0%, #2D6A4F 50%, #588157 100%)'
  }
  if (isDark(hex)) {
    return `linear-gradient(90deg, ${hex} 0%, ${lightenHex(hex, 0.4)} 50%, ${lightenHex(hex, 0.65)} 100%)`
  } else {
    return `linear-gradient(90deg, ${darkenHex(hex, 0.15)} 0%, ${hex} 50%, ${lightenHex(hex, 0.4)} 100%)`
  }
}

export function buildInvoiceHTML(invoice, profile, template = 'classic') {
  const { num, date, due, clientName, clientEmail, clientPhone, clientAddr, clientNpwp,
    items = [], subtotal = 0, discount = 0, discountPct = 0, tax = 0, taxPct = 0,
    shipping = 0, total = 0, paid = 0, balance = 0, status,
    payments = [], notes = [], sigName, sigData } = invoice

  const rawBg    = profile?.color || '#085041'
  const isWhite  = rawBg === '#ffffff' || rawBg === '#F8FAFC'
  const bg       = isWhite ? '#085041' : rawBg
  const bizName  = profile?.bizName || 'My Business'
  const bizEmail = profile?.email || ''
  const bizPhone = profile?.phone || ''
  const bizAddr  = profile?.addr || ''
  const logo     = profile?.logo || null
  const banks    = profile?.banks || []

  const dark     = isDark(bg)
  const hText    = dark ? '#ffffff' : '#111111'
  const hSub     = dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'
  const footerBg = dark ? darkenHex(bg, 0.25) : lightenHex(bg, 0.85)
  const footerTxt= dark ? 'rgba(255,255,255,0.45)' : '#888'
  const footerThx= dark ? 'rgba(255,255,255,0.7)' : bg
  const tblHdrBg = dark ? bg : lightenHex(bg, 0.88)
  const tblHdrTxt= dark ? hSub : darkenHex(bg, 0.2)

  const headerNotes = notes.filter(n => n.type === 'header')
  const footerNotes = notes.filter(n => n.type === 'footer')

  const docTitle = (invoice.docType === 'quotation') ? 'Quotation' : 'Invoice'

  // template-specific style overrides
  const templateCSS = {
    classic: '',
    modern: `
      .hdr { border-radius: 0 0 24px 24px; }
      .accent-bar { display: none; }
      .bar-spacer { height: 8px; }
      table.items { border-radius: 8px; overflow: hidden; }
      table.items thead tr { background: ${bg}; }
      table.items thead th { color: ${hText}; }
      .bal-sec { border-radius: 12px; }
      .footer { border-radius: 12px; margin: 0 28px 16px; }
      .bottom-row { margin: 0 28px; border: 1px solid #eee; border-radius: 12px; }
      .bank-col { border-right: 1px solid #eee; }
    `,
    minimal: `
      .hdr { background: #fff !important; padding: 28px 28px 16px; border-bottom: 2px solid ${bg}; }
      .co-name { color: ${bg} !important; }
      .co-detail { color: #666 !important; }
      .inv-word { color: ${bg} !important; font-size: 22px; letter-spacing: .15em; }
      .inv-num { color: #999 !important; }
      .accent-bar { display: none; }
      .bar-spacer { height: 8px; }
      table.items thead tr { background: #fff !important; border-bottom: 2px solid #111; }
      table.items thead th { color: #111 !important; }
      .bal-sec .bal-inner { background: #f7f7f7 !important; }
      .bal-lbl { color: #666 !important; }
      .bal-amt { color: #111 !important; }
      .badge { background: ${bg} !important; color: ${hText} !important; }
      .footer { background: #fff !important; border-top: 2px solid ${bg}; }
      .footer-txt { color: #888 !important; }
      .footer-thx { color: ${bg} !important; }
      .logo-ph { background: ${bg} !important; }
      .logo-ph span { filter: brightness(10); }
    `,
    bold: `
      .hdr { padding: 32px 28px 28px; }
      .co-name { font-size: 22px; letter-spacing: -0.02em; }
      .inv-word { font-size: 36px; font-weight: 900; }
      .accent-bar { height: 8px; }
      table.items thead tr { background: #111; }
      table.items thead th { color: #fff; font-size: 10px; }
      .tl.grand { font-size: 18px; font-weight: 900; border-top: 3px solid #111; }
      .bal-sec .bal-inner { background: #111 !important; }
      .bal-lbl { color: rgba(255,255,255,0.5) !important; }
      .bal-amt { color: #fff !important; font-size: 24px; }
      .badge { background: rgba(255,255,255,0.15) !important; color: #fff !important; }
      .footer { background: #111; }
      .footer-txt { color: rgba(255,255,255,0.4) !important; }
      .footer-thx { color: #fff !important; }
    `,
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Invoice ${num}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #fff; max-width: 640px; margin: 0 auto; color: #333; }

  /* ── Header ── */
  .hdr { background: ${bg}; padding: 24px 28px 20px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .logo  { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
  .logo-ph { width: 56px; height: 56px; border-radius: 10px; background: rgba(255,255,255,0.12);
              display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  .co-name   { font-size: 17px; font-weight: 700; color: ${hText}; margin-bottom: 5px; letter-spacing: -0.01em; }
  .co-detail { font-size: 11px; color: ${hSub}; line-height: 1.7; }
  .inv-word  { font-size: 28px; font-weight: 800; color: ${hText}; letter-spacing: .08em; text-align: right; text-transform: uppercase; }
  .inv-num   { font-size: 12px; color: ${hSub}; text-align: right; margin-top: 4px; font-weight: 500; }

  /* ── Accent bar ── */
  .accent-bar { height: 5px; background: ${accentGradient(rawBg)}; }
  .bar-spacer { height: 16px; background: #fff; }

  /* ── Meta ── */
  .meta-row  { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #eee; }
  .meta-cell { padding: 14px 28px; }
  .meta-cell:first-child { border-right: 1px solid #eee; }
  .mk { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #999; margin-bottom: 4px; font-weight: 600; }
  .mv { font-size: 13px; font-weight: 700; color: #111; }
  .mv.due { color: #c0392b; }

  /* ── Bill section ── */
  .bill-row { display: grid; grid-template-columns: 1fr 1fr; padding: 16px 28px;
               border-bottom: 1px solid #eee; background: #fafafa; }
  .bc:first-child { border-right: 1px solid #eee; padding-right: 16px; }
  .bc:last-child  { padding-left: 16px; }
  .bk { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #999; margin-bottom: 5px; font-weight: 600; }
  .bn { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 3px; }
  .bd { font-size: 11px; color: #555; line-height: 1.7; }

  /* ── Sections ── */
  .sec  { padding: 18px 28px; }
  .sec-title { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #999; margin-bottom: 10px; font-weight: 600; }

  /* ── Items table ── */
  table.items { width: 100%; border-collapse: collapse; font-size: 12px; }
  table.items thead tr { background: ${tblHdrBg}; }
  table.items thead th { padding: 8px 8px; text-align: left; font-size: 9px; font-weight: 600;
                          text-transform: uppercase; letter-spacing: .06em; color: ${tblHdrTxt}; }
  table.items thead th.r { text-align: right; }
  table.items tbody tr:nth-child(even) { background: #f7f9fb; }
  table.items tbody td { padding: 9px 8px; color: #222; border-bottom: 1px solid #eee; vertical-align: top; }
  table.items tbody td.r { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
  table.items td.muted { font-size: 10px; color: #888; }

  /* ── Totals ── */
  .totals-wrap { display: flex; justify-content: flex-end; padding: 0 28px 18px; }
  .totals-box  { width: 210px; }
  .tl { display: flex; justify-content: space-between; font-size: 12px; color: #555;
         padding: 5px 0; border-bottom: 1px solid #f0f0f0; }
  .tl.grand { font-size: 15px; font-weight: 800; color: #111; border: none;
               border-top: 2px solid #111; padding-top: 8px; margin-top: 5px; }

  /* ── Balance ── */
  .bal-sec   { margin: 0 28px 18px; border-radius: 8px; overflow: hidden; }
  .bal-inner { background: ${bg}; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; }
  .bal-lbl   { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: ${hSub}; margin-bottom: 4px; font-weight: 600; }
  .bal-amt   { font-size: 20px; font-weight: 800; color: ${hText}; letter-spacing: -0.01em; }
  .badge     { font-size: 9px; padding: 3px 10px; border-radius: 20px; font-weight: 600;
               background: ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}; color: ${hText}; }

  /* ── Notes ── */
  .notes-sec { padding: 14px 28px; background: #fafafa; border-top: 1px solid #eee; }
  .note-text { font-size: 11px; color: #555; line-height: 1.8; }

  /* ── Bottom row ── */
  .bottom-row { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #eee; margin-top: 4px; }
  .bank-col   { padding: 16px 28px; border-right: 1px solid #eee; }
  .bank-title { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #999; margin-bottom: 10px; font-weight: 600; }
  .bank-row   { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .bank-badge { width: 34px; height: 20px; border-radius: 4px; display: flex; align-items: center;
                justify-content: center; font-size: 7px; font-weight: 700; color: #fff; flex-shrink: 0; background: ${bg}; letter-spacing: .03em; }
  .bank-acct  { font-size: 11px; font-weight: 600; color: #333; }
  .bank-name  { font-size: 9px; color: #888; }
  .sig-col    { padding: 16px 28px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
  .sig-line   { border-bottom: 1px solid #ccc; height: 44px; width: 140px;
                display: flex; align-items: flex-end; justify-content: center; margin-bottom: 6px; }
  .sig-name   { font-size: 12px; font-weight: 700; color: #333; text-align: center; }
  .sig-by     { font-size: 9px; color: #aaa; text-align: center; }
  .sig-title  { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #999; margin-bottom: 12px; text-align: center; font-weight: 600; }

  /* ── Footer ── */
  .footer     { background: ${footerBg}; padding: 12px 28px; display: flex; justify-content: space-between; align-items: center; }
  .footer-txt { font-size: 10px; color: ${footerTxt}; line-height: 1.6; }
  .footer-thx { font-size: 11px; font-weight: 700; color: ${footerThx}; }

  /* ── Payments table ── */
  .pay-tbl    { width: 100%; border-collapse: collapse; font-size: 11px; }
  .pay-tbl th { padding: 6px 7px; text-align: left; font-size: 9px; color: #999;
                border-bottom: 1px solid #ddd; letter-spacing: .04em; font-weight: 600; }
  .pay-tbl td { padding: 7px 7px; color: #333; border-bottom: 1px solid #f0f0f0; }
  .pay-tbl .r { text-align: right; }

  @media print {
    body { max-width: none; }
    @page { margin: 0; size: A4; }
  }
  ${templateCSS[template] || ''}
</style>
</head>
<body>

<div class="hdr">
  <div style="display:flex;align-items:flex-start;gap:14px;">
    ${logo ? `<img src="${logo}" class="logo" alt="logo"/>` : `<div class="logo-ph">🏪</div>`}
    <div>
      <div class="co-name">${bizName}</div>
      <div class="co-detail">
        ${bizAddr ? bizAddr + '<br>' : ''}
        ${bizPhone}${bizEmail ? ' · ' + bizEmail : ''}
      </div>
    </div>
  </div>
  <div>
    <div class="inv-word">${docTitle}</div>
    <div class="inv-num">${num}</div>
  </div>
</div>

<div class="accent-bar"></div>
<div class="bar-spacer"></div>

<div class="meta-row">
  <div class="meta-cell"><div class="mk">Invoice date</div><div class="mv">${date}</div></div>
  <div class="meta-cell"><div class="mk">Due date</div><div class="mv due">${due}</div></div>
</div>

<div class="bill-row">
  <div class="bc">
    <div class="bk">Bill to</div>
    <div class="bn">${clientName || '—'}</div>
    <div class="bd">
      ${clientAddr ? clientAddr.replace(/\n/g,'<br>') + '<br>' : ''}
      ${clientEmail || ''}
      ${clientPhone ? '<br>' + clientPhone : ''}
      ${clientNpwp  ? '<br>NPWP: ' + clientNpwp : ''}
    </div>
  </div>
  <div class="bc">
    <div class="bk">Invoice from</div>
    <div class="bn">${bizName}</div>
    <div class="bd">
      ${bizAddr ? bizAddr + '<br>' : ''}
      ${bizPhone}${bizEmail ? '<br>' + bizEmail : ''}
    </div>
  </div>
</div>

${headerNotes.length ? `
<div class="notes-sec">
  ${headerNotes.map(n => `<div class="note-text">${n.text}</div>`).join('')}
</div>` : ''}

<div class="sec">
  <div class="sec-title">Items &amp; services</div>
  <table class="items">
    <thead><tr>
      <th style="width:22px">#</th>
      <th>Item / Service</th>
      <th class="r" style="width:38px">Qty</th>
      <th class="r" style="width:88px">Rate (IDR)</th>
      <th class="r" style="width:96px">Amount (IDR)</th>
    </tr></thead>
    <tbody>
      ${(items || []).map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>
          <div style="font-weight:600">${it.name || '—'}</div>
          ${it.desc ? `<div class="muted">${it.desc}</div>` : ''}
        </td>
        <td class="r">${it.qty || 1}</td>
        <td class="r">${(it.rate || 0).toLocaleString('id-ID')}</td>
        <td class="r">${((it.qty || 0) * (it.rate || 0)).toLocaleString('id-ID')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<div class="totals-wrap">
  <div class="totals-box">
    <div class="tl"><span>Subtotal</span><span>${(subtotal||0).toLocaleString('id-ID')}</span></div>
    ${discount > 0 ? `<div class="tl"><span>Discount${discountPct ? ` (${discountPct}%)` : ''}</span><span>−${(discount||0).toLocaleString('id-ID')}</span></div>` : ''}
    ${tax > 0 ? `<div class="tl"><span>Tax (PPN ${taxPct}%)</span><span>${(tax||0).toLocaleString('id-ID')}</span></div>` : ''}
    ${shipping > 0 ? `<div class="tl"><span>Shipping</span><span>${(shipping||0).toLocaleString('id-ID')}</span></div>` : ''}
    <div class="tl grand"><span>Total</span><span>IDR ${(total||0).toLocaleString('id-ID')}</span></div>
  </div>
</div>

<div class="bal-sec">
  <div class="bal-inner">
    <div>
      <div class="bal-lbl">${status === 'paid' ? 'Fully paid' : 'Balance due'}</div>
      <div class="bal-amt">IDR ${Math.abs(balance||0).toLocaleString('id-ID')}</div>
    </div>
    <span class="badge">${status === 'paid' ? '✓ Paid' : status === 'partial' ? 'Partial' : 'Unpaid'}</span>
  </div>
</div>

${payments && payments.length ? `
<div class="sec" style="padding-top:0">
  <div class="sec-title">Payments received</div>
  <table class="pay-tbl">
    <thead><tr><th>Date</th><th>Method</th><th>Note</th><th class="r">Amount (IDR)</th></tr></thead>
    <tbody>
      ${payments.map(p => `<tr>
        <td>${p.date||''}</td><td>${p.method||''}</td><td>${p.note||''}</td>
        <td class="r">${parseFloat(p.amount||0).toLocaleString('id-ID')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

${footerNotes.length ? `
<div class="notes-sec">
  <div class="sec-title">Notes</div>
  ${footerNotes.map(n => `<div class="note-text">${n.text}</div>`).join('')}
</div>` : ''}

<div class="bottom-row">
  <div class="bank-col">
    <div class="bank-title">Payment via bank transfer</div>
    ${banks.length ? banks.map(b => `
      <div class="bank-row">
        <div class="bank-badge">${b.bank.slice(0,3).toUpperCase()}</div>
        <div>
          <div class="bank-acct">${b.account}</div>
          <div class="bank-name">a/n ${b.name} · ${b.bank}</div>
        </div>
      </div>`).join('') : `
      <div style="font-size:10px;color:#aaa;">Add bank accounts in Settings → Profile</div>`}
  </div>
  <div class="sig-col">
    <div class="sig-title">Authorized signature</div>
    <div class="sig-line">
      ${sigData ? `<img src="${sigData}" style="max-height:38px;max-width:130px;object-fit:contain"/>` : ''}
    </div>
    <div class="sig-name">${sigName || ''}</div>
    <div class="sig-by">${sigName ? date : 'Signed by'}</div>
  </div>
</div>

<div class="footer">
  <div class="footer-txt">${bizName}${bizEmail ? ' · ' + bizEmail : ''}${bizPhone ? '<br>' + bizPhone : ''}</div>
  <div class="footer-thx">Thank you! 🙏</div>
</div>

</body>
</html>`
}

export function printInvoice(invoice, profile, template = 'classic') {
  const html = buildInvoiceHTML(invoice, profile, template)
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 500)
}

export function buildWhatsAppMsg(invoice, profile) {
  const { num, due, total, balance, clientName, payments } = invoice
  const bizName = profile?.bizName || 'Kami'
  const bank    = (profile?.banks || [])[0]
  const paid    = (payments || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  return `Halo ${clientName},

Berikut invoice dari *${bizName}*:

📄 *Invoice: ${num}*
💰 Total: *IDR ${(total || 0).toLocaleString('id-ID')}*
${paid > 0 ? `✅ Sudah dibayar: IDR ${paid.toLocaleString('id-ID')}\n` : ''}💳 Sisa tagihan: *IDR ${Math.max(0, balance || 0).toLocaleString('id-ID')}*
📅 Jatuh tempo: ${due}

${bank ? `Pembayaran via:\n🏦 Bank ${bank.bank}: ${bank.account}\n   a/n ${bank.name}` : ''}

Terima kasih! 🙏
_${bizName}_`
}

// ── Excel export using xlsx library ──
export function exportExcel(invoices, filename) {
  import('xlsx').then(XLSX => {
    const data = invoices.map(i => ({
      'Invoice No': i.num || '',
      'Client': i.clientName || '',
      'Date': i.date || '',
      'Due Date': i.due || '',
      'Items': (i.items||[]).length,
      'Subtotal': i.subtotal || 0,
      'Discount': i.discount || 0,
      'Tax': i.tax || 0,
      'Shipping': i.shipping || 0,
      'Total': i.total || 0,
      'Paid': i.paid || 0,
      'Balance': (i.total||0) - (i.paid||0),
      'Status': i.status || '',
    }))

    // add summary row
    const totals = data.reduce((s, r) => ({
      Total: s.Total + r.Total,
      Paid: s.Paid + r.Paid,
      Balance: s.Balance + r.Balance,
    }), { Total:0, Paid:0, Balance:0 })

    data.push({
      'Invoice No': '',
      'Client': `TOTAL (${data.length} invoices)`,
      'Date': '', 'Due Date': '', 'Items': '',
      'Subtotal': '', 'Discount': '', 'Tax': '', 'Shipping': '',
      'Total': totals.Total,
      'Paid': totals.Paid,
      'Balance': totals.Balance,
      'Status': '',
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices')
    XLSX.writeFile(wb, filename || 'invoices.xlsx')
  })
}

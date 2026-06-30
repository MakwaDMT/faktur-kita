// ─── KEYS ───────────────────────────────────────────────────────
const KEYS = {
  invoices: 'fk_invoices',
  profile:  'fk_biz_profile',
  settings: 'fk_settings',
  trial:    'fk_trial',
  clients:  'fk_clients',
  products: 'fk_products',
}

// ─── HELPERS ────────────────────────────────────────────────────
const read  = k => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } }
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch(e) { console.warn('Storage write failed', e) } }
const nextId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// ─── PROFILE ────────────────────────────────────────────────────
export const ProfileDB = {
  get: () => read(KEYS.profile) || {
    bizName: '', phone: '', email: '', addr: '', city: '', web: '',
    npwp: '', nib: '', taxrate: '11', terms: '30',
    defnote: 'Thank you for your business!',
    color: '#085041', logo: null,
    banks: [],
    invPrefix: 'INV', invSep1: '-', invYear: new Date().getFullYear().toString(),
    invSep2: '-', invSeq: '001',
  },
  save: (p) => write(KEYS.profile, { ...ProfileDB.get(), ...p, updatedAt: new Date().toISOString() }),
  getColor: () => ProfileDB.get().color || '#085041',
  getBizName: () => ProfileDB.get().bizName || 'My Business',
  nextInvoiceNum: () => {
    const p = ProfileDB.get()
    const seq = String(parseInt(p.invSeq || '1')).padStart(3, '0')
    const parts = [p.invPrefix, p.invYear, seq].filter(Boolean)
    const seps  = [p.invSep1 || '-', p.invSep2 || '-']
    let r = parts[0] || ''
    for (let i = 1; i < parts.length; i++) r += seps[i - 1] + parts[i]
    return r
  },
  bumpSeq: () => {
    const p = ProfileDB.get()
    const next = (parseInt(p.invSeq || '1') + 1).toString().padStart(p.invSeq?.length || 3, '0')
    ProfileDB.save({ invSeq: next })
  },
}

// ─── INVOICES ───────────────────────────────────────────────────
export const InvoiceDB = {
  getAll: () => read(KEYS.invoices) || [],
  getById: (id) => InvoiceDB.getAll().find(i => i.id === id) || null,

  save: (inv) => {
    const all = InvoiceDB.getAll()
    const existing = all.findIndex(i => i.id === inv.id)
    if (existing >= 0) {
      all[existing] = { ...all[existing], ...inv, updatedAt: new Date().toISOString() }
    } else {
      const newInv = { ...inv, id: inv.id || nextId(), createdAt: new Date().toISOString() }
      all.unshift(newInv)
      ProfileDB.bumpSeq()
    }
    write(KEYS.invoices, all)
  },

  delete: (id) => {
    write(KEYS.invoices, InvoiceDB.getAll().filter(i => i.id !== id))
  },

  search: ({ query = '', status = 'all', sortBy = 'date', dateFrom, dateTo } = {}) => {
    let list = InvoiceDB.getAll()
    if (status !== 'all') list = list.filter(i => i.status === status)
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(i =>
        (i.clientName || '').toLowerCase().includes(q) ||
        (i.num || '').toLowerCase().includes(q)
      )
    }
    if (dateFrom) list = list.filter(i => i.date >= dateFrom)
    if (dateTo)   list = list.filter(i => i.date <= dateTo)
    if (sortBy === 'client')  list.sort((a, b) => (a.clientName || '').localeCompare(b.clientName || ''))
    else if (sortBy === 'amount') list.sort((a, b) => b.total - a.total)
    else list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    return list
  },

  // ── auto-detect overdue ──
  refreshOverdue: () => {
    const all = InvoiceDB.getAll()
    const todayStr = today()
    let changed = false
    all.forEach(inv => {
      if ((inv.status === 'unpaid' || inv.status === 'partial') && inv.due && inv.due < todayStr) {
        inv.status = 'overdue'
        changed = true
      }
    })
    if (changed) write(KEYS.invoices, all)
  },

  // ── reminders: invoices needing follow-up ──
  getReminders: () => {
    const all = InvoiceDB.getAll()
    const todayStr = today()
    const reminders = []
    all.forEach(inv => {
      if (inv.status === 'paid') return
      const bal = Math.max(0, (inv.total || 0) - (inv.paid || 0))
      if (bal <= 0) return
      const dueDate = new Date(inv.due)
      const todayDate = new Date(todayStr)
      const diffDays = Math.round((dueDate - todayDate) / 86400000)
      let urgency = 'normal'
      if (diffDays < 0) urgency = 'overdue'
      else if (diffDays === 0) urgency = 'today'
      else if (diffDays <= 3) urgency = 'soon'
      else return // not urgent yet
      reminders.push({ ...inv, balance: bal, diffDays, urgency })
    })
    reminders.sort((a,b) => a.diffDays - b.diffDays)
    return reminders
  },

  // ── mark as paid quick action ──
  markAsPaid: (id) => {
    const all = InvoiceDB.getAll()
    const inv = all.find(i => i.id === id)
    if (inv) {
      const bal = Math.max(0, (inv.total || 0) - (inv.paid || 0))
      inv.payments = [...(inv.payments || []), { amount: bal, date: today(), method: 'Other', note: 'Marked as paid' }]
      inv.paid = inv.total || 0
      inv.balance = 0
      inv.status = 'paid'
      inv.updatedAt = new Date().toISOString()
      write(KEYS.invoices, all)
    }
  },

  // ── stats ──
  stats: () => {
    const all = InvoiceDB.getAll()
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthInv  = all.filter(i => (i.date || '').startsWith(thisMonth))
    return {
      totalInvoiced:   monthInv.reduce((s, i) => s + (i.total || 0), 0),
      totalCollected:  monthInv.reduce((s, i) => s + (i.paid  || 0), 0),
      outstanding:     all.filter(i => i.status !== 'paid')
                          .reduce((s, i) => s + Math.max(0, (i.total || 0) - (i.paid || 0)), 0),
      overdueCount:    all.filter(i => i.status === 'overdue').length,
      totalCount:      all.length,
      monthCount:      monthInv.length,
      paidCount:       all.filter(i => i.status === 'paid').length,
    }
  },

  // ── real monthly chart data ──
  monthlyData: () => {
    const all = InvoiceDB.getAll()
    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      const label = d.toLocaleString('default', { month: 'short' })
      const invs = all.filter(inv => (inv.date||'').startsWith(key))
      months.push({
        label,
        invoiced: invs.reduce((s,inv) => s + (inv.total||0), 0),
        collected: invs.reduce((s,inv) => s + (inv.paid||0), 0),
      })
    }
    return months
  },

  // ── export ──
  exportCSV: () => {
    const all = InvoiceDB.getAll()
    const header = 'Invoice No,Client,Date,Due Date,Items,Subtotal,Discount,Tax,Shipping,Total,Paid,Balance,Status\n'
    const rows   = all.map(i =>
      `${i.num},"${i.clientName}",${i.date},${i.due},${(i.items||[]).length},` +
      `${i.subtotal||0},${i.discount||0},${i.tax||0},${i.shipping||0},` +
      `${i.total||0},${i.paid||0},${(i.total||0)-(i.paid||0)},${i.status}`
    ).join('\n')
    return header + rows
  },

  backup: () => ({
    app: 'Faktur Kita v1.2',
    exportedAt: new Date().toISOString(),
    invoices: InvoiceDB.getAll(),
    profile:  ProfileDB.get(),
    clients:  ClientDB.getAll(),
    products: ProductDB.getAll(),
  }),

  restore: (data) => {
    if (data.invoices) write(KEYS.invoices, data.invoices)
    if (data.profile)  write(KEYS.profile,  data.profile)
    if (data.clients)  write(KEYS.clients,  data.clients)
    if (data.products) write(KEYS.products, data.products)
  },
}

// ─── CLIENTS ────────────────────────────────────────────────────
export const ClientDB = {
  getAll: () => read(KEYS.clients) || [],
  getById: (id) => ClientDB.getAll().find(c => c.id === id) || null,
  save: (client) => {
    const all = ClientDB.getAll()
    const idx = all.findIndex(c => c.id === client.id)
    if (idx >= 0) all[idx] = { ...all[idx], ...client }
    else all.unshift({ ...client, id: client.id || nextId(), createdAt: new Date().toISOString() })
    write(KEYS.clients, all)
  },
  delete: (id) => write(KEYS.clients, ClientDB.getAll().filter(c => c.id !== id)),
  search: (q = '') => {
    const list = ClientDB.getAll()
    if (!q) return list
    const lq = q.toLowerCase()
    return list.filter(c =>
      (c.name || '').toLowerCase().includes(lq) ||
      (c.email || '').toLowerCase().includes(lq)
    )
  },
  getInvoiceCount: (clientName) =>
    InvoiceDB.getAll().filter(i => i.clientName === clientName).length,
  getTotalBilled: (clientName) =>
    InvoiceDB.getAll().filter(i => i.clientName === clientName)
      .reduce((s, i) => s + (i.total || 0), 0),
}

// ─── PRODUCTS / SERVICES CATALOG ────────────────────────────────
export const ProductDB = {
  getAll: () => read(KEYS.products) || [],
  save: (product) => {
    const all = ProductDB.getAll()
    const idx = all.findIndex(p => p.id === product.id)
    if (idx >= 0) all[idx] = { ...all[idx], ...product, updatedAt: new Date().toISOString() }
    else all.unshift({ ...product, id: product.id || nextId(), createdAt: new Date().toISOString() })
    write(KEYS.products, all)
  },
  delete: (id) => write(KEYS.products, ProductDB.getAll().filter(p => p.id !== id)),
  search: (q = '') => {
    const list = ProductDB.getAll()
    if (!q) return list
    const lq = q.toLowerCase()
    return list.filter(p =>
      (p.name || '').toLowerCase().includes(lq) ||
      (p.code || '').toLowerCase().includes(lq)
    )
  },
}

// ─── TRIAL ──────────────────────────────────────────────────────
export const TrialDB = {
  TRIAL_DAYS: 14,
  init: () => {
    if (!read(KEYS.trial)) {
      write(KEYS.trial, { startedAt: new Date().toISOString(), plan: 'trial' })
    }
  },
  get: () => read(KEYS.trial) || { startedAt: new Date().toISOString(), plan: 'trial' },
  daysLeft: () => {
    const t = TrialDB.get()
    if (t.plan === 'paid') return 9999
    const start = new Date(t.startedAt)
    const diff  = TrialDB.TRIAL_DAYS - Math.floor((Date.now() - start) / 86400000)
    return Math.max(0, diff)
  },
  isExpired: () => TrialDB.daysLeft() === 0 && TrialDB.get().plan !== 'paid',
  isPaid: () => TrialDB.get().plan === 'paid',
  activate: (plan) => write(KEYS.trial, { ...TrialDB.get(), plan, activatedAt: new Date().toISOString() }),
}

// ─── CALC ────────────────────────────────────────────────────────
export const calcInvoice = (items = [], discountVal = 0, discountType = 'fixed', taxPct = 0, shipping = 0, payments = []) => {
  const subtotal  = items.reduce((s, i) => s + ((i.qty || 0) * (i.rate || 0)), 0)
  const discount  = discountType === 'pct' ? subtotal * (discountVal / 100) : discountVal
  const taxBase   = subtotal - discount
  const tax       = taxBase * (taxPct / 100)
  const total     = Math.max(0, taxBase + tax + (shipping || 0))
  const paid      = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balance   = total - paid
  const status    = balance <= 0 && paid > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
  return { subtotal, discount, tax, taxBase, total, paid, balance, status }
}

// ─── FORMAT ─────────────────────────────────────────────────────
export const fmtIDR = (n) => 'IDR ' + Math.round(n || 0).toLocaleString('id-ID')
export const fmtShort = (n) => {
  n = Math.round(n || 0)
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'jt'
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'rb'
  return n.toLocaleString('id-ID')
}
export const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
export const today = () => new Date().toISOString().slice(0, 10)
export const daysFromNow = (days) => {
  const d = new Date(); d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// ─── SEED (demo data) ────────────────────────────────────────────
export const seedDemoData = () => {
  if (InvoiceDB.getAll().length > 0) return
  const demos = [
    { id:'d1', num:'INV-2026-005', clientName:'PT. Bintang Nusantara', date:'2026-06-08', due:'2026-07-08', total:6443550, paid:3000000, status:'partial', items:[{name:'Jasa Desain',qty:1,rate:5000000},{name:'Hosting',qty:1,rate:750000}] },
    { id:'d2', num:'INV-2026-004', clientName:'CV. Karya Mandiri',     date:'2026-06-05', due:'2026-07-05', total:3200000, paid:3200000, status:'paid',    items:[{name:'Konsultasi IT',qty:4,rate:800000}] },
    { id:'d3', num:'INV-2026-003', clientName:'PT. Sinar Mas Digital', date:'2026-05-28', due:'2026-06-28', total:8800000, paid:0,       status:'overdue', items:[{name:'Pengembangan App',qty:1,rate:8800000}] },
    { id:'d4', num:'INV-2026-002', clientName:'Ibu Rina Santoso',      date:'2026-05-20', due:'2026-06-20', total:1500000, paid:1500000, status:'paid',    items:[{name:'Foto Produk',qty:1,rate:1500000}] },
    { id:'d5', num:'INV-2026-001', clientName:'Toko Berkah Jaya',      date:'2026-05-01', due:'2026-06-01', total:2750000, paid:0,       status:'unpaid',  items:[{name:'Cetak Banner',qty:5,rate:550000}] },
  ]
  write(KEYS.invoices, demos)
}

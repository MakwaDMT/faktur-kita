// ─── Internationalization (EN + Bahasa Indonesia) ────────────────
const translations = {
  // ── Navigation & General ──
  dashboard:        { en:'Dashboard',         id:'Beranda' },
  invoices:         { en:'Invoices',          id:'Faktur' },
  clients:          { en:'Clients',           id:'Pelanggan' },
  reports:          { en:'Reports',           id:'Laporan' },
  settings:         { en:'Settings',          id:'Pengaturan' },
  profile:          { en:'Business profile',  id:'Profil bisnis' },
  save:             { en:'Save',              id:'Simpan' },
  cancel:           { en:'Cancel',            id:'Batal' },
  delete:           { en:'Delete',            id:'Hapus' },
  edit:             { en:'Edit',              id:'Ubah' },
  add:              { en:'Add',               id:'Tambah' },
  search:           { en:'Search',            id:'Cari' },
  back:             { en:'Back',              id:'Kembali' },
  close:            { en:'Close',             id:'Tutup' },
  done:             { en:'Done',              id:'Selesai' },
  loading:          { en:'Loading…',          id:'Memuat…' },
  noData:           { en:'No data yet',       id:'Belum ada data' },

  // ── Dashboard ──
  totalInvoices:    { en:'Total invoices',    id:'Total faktur' },
  revenue:          { en:'Revenue',           id:'Pendapatan' },
  outstanding:      { en:'Outstanding',       id:'Belum dibayar' },
  overdue:          { en:'Overdue',           id:'Jatuh tempo' },
  recentInvoices:   { en:'Recent invoices',   id:'Faktur terbaru' },
  newInvoice:       { en:'New invoice',       id:'Buat faktur' },
  quickActions:     { en:'Quick actions',     id:'Aksi cepat' },
  overdueAlert:     { en:'Overdue invoices need attention', id:'Faktur jatuh tempo perlu perhatian' },
  sendReminder:     { en:'Send reminder',     id:'Kirim pengingat' },
  markAsPaid:       { en:'Mark as paid',      id:'Tandai lunas' },
  viewAll:          { en:'View all',          id:'Lihat semua' },
  welcomeBack:      { en:'Welcome back',      id:'Selamat datang' },
  todaySummary:     { en:'Today\'s summary',  id:'Ringkasan hari ini' },

  // ── Invoice Form ──
  editInvoice:      { en:'Edit invoice',      id:'Ubah faktur' },
  invoiceNo:        { en:'Invoice no.',       id:'No. faktur' },
  invoiceDate:      { en:'Invoice date',      id:'Tanggal faktur' },
  dueDate:          { en:'Due date',          id:'Jatuh tempo' },
  client:           { en:'Client',            id:'Pelanggan' },
  clientName:       { en:'Client name',       id:'Nama pelanggan' },
  email:            { en:'Email',             id:'Email' },
  phone:            { en:'Phone',             id:'Telepon' },
  address:          { en:'Address',           id:'Alamat' },
  items:            { en:'Items & services',  id:'Barang & jasa' },
  itemName:         { en:'Item / service name', id:'Nama barang / jasa' },
  qty:              { en:'Qty',               id:'Jml' },
  rate:             { en:'Rate',              id:'Harga' },
  description:      { en:'Description',       id:'Deskripsi' },
  addItem:          { en:'+ Add item',        id:'+ Tambah item' },
  discount:         { en:'Discount',          id:'Diskon' },
  fixedAmount:      { en:'IDR fixed',         id:'IDR tetap' },
  percentage:       { en:'% percent',         id:'% persen' },
  tax:              { en:'Tax (PPN)',         id:'Pajak (PPN)' },
  taxRate:          { en:'Tax rate (%)',       id:'Tarif pajak (%)' },
  shipping:         { en:'Shipping',          id:'Ongkos kirim' },
  shippingCharge:   { en:'Shipping charge',   id:'Biaya pengiriman' },
  subtotal:         { en:'Subtotal',          id:'Subtotal' },
  total:            { en:'Total',             id:'Total' },
  payments:         { en:'Payments received', id:'Pembayaran diterima' },
  addPayment:       { en:'+ Add payment',    id:'+ Tambah pembayaran' },
  paymentAmount:    { en:'Amount',            id:'Jumlah' },
  paymentDate:      { en:'Date',              id:'Tanggal' },
  paymentMethod:    { en:'Method',            id:'Metode' },
  paymentNote:      { en:'Note',              id:'Catatan' },
  totalPaid:        { en:'Total paid',        id:'Total dibayar' },
  balanceDue:       { en:'Balance due',       id:'Sisa tagihan' },
  fullyPaid:        { en:'Fully paid',        id:'Lunas' },
  notes:            { en:'Notes',             id:'Catatan' },
  addNote:          { en:'+ Add note',        id:'+ Tambah catatan' },
  footerNote:       { en:'Footer note',       id:'Catatan bawah' },
  headerNote:       { en:'Header note',       id:'Catatan atas' },
  signature:        { en:'Signature',         id:'Tanda tangan' },
  drawSignature:    { en:'Draw signature',    id:'Gambar tanda tangan' },
  signedBy:         { en:'Signed by',         id:'Ditandatangani oleh' },
  saveSignature:    { en:'Save signature',    id:'Simpan tanda tangan' },
  send:             { en:'Send',              id:'Kirim' },
  print:            { en:'Print',             id:'Cetak' },
  more:             { en:'More',              id:'Lain' },
  preview:          { en:'Preview',           id:'Pratinjau' },

  // ── Invoice Status ──
  paid:             { en:'Paid',              id:'Lunas' },
  unpaid:           { en:'Unpaid',            id:'Belum bayar' },
  partial:          { en:'Partial',           id:'Sebagian' },
  draft:            { en:'Draft',             id:'Draf' },
  all:              { en:'All',               id:'Semua' },

  // ── Clients ──
  addClient:        { en:'Add client',        id:'Tambah pelanggan' },
  editClient:       { en:'Edit client',       id:'Ubah pelanggan' },
  noClients:        { en:'No clients yet',    id:'Belum ada pelanggan' },
  searchClients:    { en:'Search clients…',   id:'Cari pelanggan…' },
  firstClient:      { en:'Add your first client', id:'Tambah pelanggan pertama' },

  // ── Reports ──
  totalInvoiced:    { en:'Total invoiced',    id:'Total difakturkan' },
  collected:        { en:'Collected',         id:'Terkumpul' },
  monthlyRevenue:   { en:'Monthly revenue',   id:'Pendapatan bulanan' },
  exportCSV:        { en:'CSV',               id:'CSV' },
  exportExcel:      { en:'Excel',             id:'Excel' },
  exportPDF:        { en:'PDF',               id:'PDF' },
  sortBy:           { en:'Sort:',             id:'Urutkan:' },
  date:             { en:'Date',              id:'Tanggal' },
  amount:           { en:'Amount',            id:'Nominal' },

  // ── Settings ──
  brandColor:       { en:'Brand color & theme', id:'Warna & tema brand' },
  invoiceSettings:  { en:'Invoice settings',  id:'Pengaturan faktur' },
  paymentGateway:   { en:'Midtrans gateway',  id:'Midtrans gateway' },
  bankAccounts:     { en:'Bank accounts',     id:'Rekening bank' },
  exportBackup:     { en:'Export backup',     id:'Ekspor cadangan' },
  importBackup:     { en:'Import backup',     id:'Impor cadangan' },
  subscription:     { en:'Subscription',      id:'Langganan' },
  language:         { en:'Language',           id:'Bahasa' },
  terms:            { en:'Terms & Privacy',   id:'Syarat & Privasi' },
  comingSoon:       { en:'Coming in next update', id:'Segera hadir' },

  // ── Profile ──
  bizName:          { en:'Business name',     id:'Nama usaha' },
  whatsapp:         { en:'WhatsApp / phone',  id:'WhatsApp / telepon' },
  city:             { en:'City',              id:'Kota' },
  website:          { en:'Website',           id:'Website' },
  npwp:             { en:'NPWP',              id:'NPWP' },
  nib:              { en:'NIB (from OSS)',    id:'NIB (dari OSS)' },
  defaultTaxRate:   { en:'Default tax rate (%)', id:'Tarif pajak default (%)' },
  paymentTerms:     { en:'Payment terms (days)', id:'Tempo pembayaran (hari)' },
  invoiceNumFormat: { en:'Invoice number format', id:'Format nomor faktur' },
  defaultNote:      { en:'Default invoice note',  id:'Catatan faktur default' },
  addBank:          { en:'Add bank account',  id:'Tambah rekening bank' },
  bankName:         { en:'Bank name',         id:'Nama bank' },
  accountNo:        { en:'Account number',    id:'Nomor rekening' },
  accountHolder:    { en:'Account holder',    id:'Nama pemilik' },
  addAccount:       { en:'Add account',       id:'Tambah rekening' },
  saveProfile:      { en:'Save profile',      id:'Simpan profil' },
  required:         { en:'Required to get started', id:'Wajib diisi' },
  optional:         { en:'optional',          id:'opsional' },
  uploadLogo:       { en:'Upload logo',       id:'Unggah logo' },
  removeLogo:       { en:'Remove',            id:'Hapus' },
  profileComplete:  { en:'Profile completeness', id:'Kelengkapan profil' },
  readyToSave:      { en:'Ready — tap Save to apply', id:'Siap — ketuk Simpan' },
  needBizName:      { en:'Business name and WhatsApp required', id:'Nama usaha dan WhatsApp wajib diisi' },
  tapToUpload:      { en:'tap to upload',     id:'ketuk untuk unggah' },
  livePreview:      { en:'Live preview',      id:'Pratinjau langsung' },
  customColor:      { en:'Custom color',      id:'Warna kustom' },
  pickColor:        { en:'Pick color',        id:'Pilih warna' },

  // ── Invoice Preview / PDF ──
  invoice:          { en:'Invoice',           id:'Faktur' },
  billTo:           { en:'Bill to',           id:'Tagihan untuk' },
  invoiceFrom:      { en:'Invoice from',      id:'Faktur dari' },
  itemsAndServices: { en:'Items & services',  id:'Barang & jasa' },
  item:             { en:'Item / Service',    id:'Barang / Jasa' },
  paymentHistory:   { en:'Payments received', id:'Pembayaran diterima' },
  paymentViaBank:   { en:'Payment via bank transfer', id:'Pembayaran via transfer bank' },
  authorizedSig:    { en:'Authorized signature', id:'Tanda tangan' },
  thankYou:         { en:'Thank you!',        id:'Terima kasih!' },
  addBankInSettings:{ en:'Add bank accounts in Settings → Profile', id:'Tambah rekening di Pengaturan → Profil' },

  // ── Reminders ──
  reminderTitle:    { en:'Payment reminders', id:'Pengingat pembayaran' },
  reminderDesc:     { en:'These invoices need follow-up', id:'Faktur ini perlu ditindaklanjuti' },
  daysPastDue:      { en:'days past due',     id:'hari terlambat' },
  dueToday:         { en:'Due today',         id:'Jatuh tempo hari ini' },
  dueSoon:          { en:'Due soon',          id:'Segera jatuh tempo' },
  daysLeft:         { en:'days left',         id:'hari lagi' },

  // ── WhatsApp Reminder Templates ──
  reminderMsg:      {
    en: (name, num, bal, due) => `Hi ${name},\n\nFriendly reminder about invoice *${num}*.\n\n💳 Balance due: *IDR ${bal}*\n📅 Due date: ${due}\n\nPlease arrange payment at your earliest convenience.\n\nThank you! 🙏`,
    id: (name, num, bal, due) => `Halo ${name},\n\nIni pengingat untuk faktur *${num}*.\n\n💳 Sisa tagihan: *IDR ${bal}*\n📅 Jatuh tempo: ${due}\n\nMohon segera melakukan pembayaran.\n\nTerima kasih! 🙏`
  },

  // ── Invoice Templates ──
  templateClassic:  { en:'Classic',           id:'Klasik' },
  templateModern:   { en:'Modern',            id:'Modern' },
  templateMinimal:  { en:'Minimal',           id:'Minimal' },
  templateBold:     { en:'Bold',              id:'Tebal' },
  chooseTemplate:   { en:'Invoice template',  id:'Template faktur' },

  // ── Onboarding ──
  onb1Title:        { en:'Create invoices in minutes', id:'Buat faktur dalam hitungan menit' },
  onb1Body:         { en:'Built for small businesses in Indonesia. No accounting knowledge needed.', id:'Dibuat untuk UMKM Indonesia. Tidak perlu ilmu akuntansi.' },
  onb2Title:        { en:'Your brand, your colors', id:'Brand Anda, warna Anda' },
  onb2Body:         { en:'Upload your logo, pick your brand color. Every invoice looks professional.', id:'Unggah logo, pilih warna brand. Setiap faktur tampil profesional.' },
  onb3Title:        { en:'Get paid faster', id:'Dibayar lebih cepat' },
  onb3Body:         { en:'Send via WhatsApp instantly. Auto-reminders for overdue invoices.', id:'Kirim via WhatsApp langsung. Pengingat otomatis untuk faktur jatuh tempo.' },
  getStarted:       { en:'Get started →',    id:'Mulai sekarang →' },
  next:             { en:'Next →',            id:'Lanjut →' },
  skipIntro:        { en:'Skip intro',        id:'Lewati' },

  // ── Paywall ──
  unlockTitle:      { en:'Unlock Simple Invoice', id:'Buka Simple Invoice' },
  unlockDesc:       { en:'One plan. Everything included.', id:'Satu paket. Semua termasuk.' },
  subscribe:        { en:'Subscribe via Midtrans →', id:'Berlangganan via Midtrans →' },
  continueTrial:    { en:'Continue free trial', id:'Lanjut uji coba gratis' },
  daysLeft2:        { en:'days left',         id:'hari tersisa' },
}

// Current language state — Bahasa Indonesia is the default for UMKM market
let currentLang = (() => {
  try {
    const stored = localStorage.getItem('fk_lang')
    return stored === 'en' || stored === 'id' ? stored : 'id'
  } catch { return 'id' }
})()

export const setLang = (lang) => {
  currentLang = lang
  try { localStorage.setItem('fk_lang', lang) } catch {}
}

export const getLang = () => currentLang

export const t = (key) => {
  const entry = translations[key]
  if (!entry) return key
  return entry[currentLang] || entry.en || key
}

// For function-type translations (like reminder messages)
export const tf = (key, ...args) => {
  const entry = translations[key]
  if (!entry) return key
  const fn = entry[currentLang] || entry.en
  if (typeof fn === 'function') return fn(...args)
  return fn || key
}

export default translations

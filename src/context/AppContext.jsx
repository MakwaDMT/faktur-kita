import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ProfileDB, InvoiceDB, ClientDB, TrialDB, seedDemoData } from '../utils/db'
import { getLang, setLang as setLangUtil, t } from '../utils/i18n'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [screen, setScreen]       = useState('onboarding')
  const [profile, setProfile]     = useState(ProfileDB.get())
  const [invoices, setInvoices]   = useState([])
  const [clients, setClients]     = useState([])
  const [currentInvoice, setCurrentInvoice] = useState(null)
  const [toast, setToast]         = useState(null)
  const [modal, setModal]         = useState(null)
  const [trialDays, setTrialDays] = useState(14)
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const [lang, setLangState]      = useState(getLang())

  // ── language ──
  const setLang = useCallback((l) => {
    setLangUtil(l)
    setLangState(l)
  }, [])

  // ── init ──
  useEffect(() => {
    TrialDB.init()
    seedDemoData()
    InvoiceDB.refreshOverdue()  // auto-detect overdue on load
    refreshInvoices()
    refreshClients()
    setProfile(ProfileDB.get())
    setTrialDays(TrialDB.daysLeft())
    const onboarded = localStorage.getItem('fk_onboarded')
    if (onboarded) { setHasOnboarded(true); setScreen('dashboard') }
  }, [])

  const refreshInvoices = () => {
    InvoiceDB.refreshOverdue()
    setInvoices(InvoiceDB.getAll())
  }
  const refreshClients  = () => setClients(ClientDB.getAll())
  const refreshProfile  = () => setProfile(ProfileDB.get())

  // ── toast ──
  const showToast = useCallback((msg, duration = 2400) => {
    setToast(msg)
    setTimeout(() => setToast(null), duration)
  }, [])

  // ── navigation ──
  const navigate = useCallback((s, data = null) => {
    if (s === 'invoice-form' && data === null) {
      setCurrentInvoice(null)
    } else if (s === 'invoice-form' && data) {
      setCurrentInvoice(data)
    }
    setScreen(s)
    window.scrollTo(0, 0)
  }, [])

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('fk_onboarded', '1')
    setHasOnboarded(true)
    setScreen('dashboard')
  }, [])

  // ── invoice actions ──
  const saveInvoice = useCallback((inv) => {
    InvoiceDB.save(inv)
    refreshInvoices()
    showToast(t('save') + ' ✓')
  }, [showToast, lang])

  const deleteInvoice = useCallback((id) => {
    InvoiceDB.delete(id)
    refreshInvoices()
    showToast(t('delete') + ' ✓')
  }, [showToast, lang])

  const markAsPaid = useCallback((id) => {
    InvoiceDB.markAsPaid(id)
    refreshInvoices()
    showToast(t('paid') + ' ✓')
  }, [showToast, lang])

  // ── profile ──
  const saveProfile = useCallback((updates) => {
    ProfileDB.save(updates)
    refreshProfile()
    showToast(t('saveProfile') + ' ✓')
  }, [showToast, lang])

  return (
    <AppContext.Provider value={{
      screen, navigate,
      profile, saveProfile, refreshProfile,
      invoices, refreshInvoices, saveInvoice, deleteInvoice, markAsPaid,
      clients, refreshClients,
      currentInvoice, setCurrentInvoice,
      toast, showToast,
      modal, setModal,
      trialDays,
      hasOnboarded, completeOnboarding,
      lang, setLang,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

import { useApp } from './context/AppContext'
import { Toast, BottomNav, TrialBanner } from './components/UI'

// Screens
import OnboardingScreen  from './screens/Onboarding'
import DashboardScreen   from './screens/Dashboard'
import InvoicesScreen    from './screens/Invoices'
import InvoiceFormScreen from './screens/InvoiceForm'
import InvoicePreview    from './screens/InvoicePreview'
import ReportsScreen     from './screens/Reports'
import ClientsScreen     from './screens/Clients'
import SettingsScreen    from './screens/Settings'
import ProfileScreen     from './screens/Profile'
import PaywallScreen     from './screens/Paywall'
import { ProductsScreen } from './screens/Onboarding'

const SCREENS_WITH_NAV = ['dashboard','invoices','reports','clients','settings']

export default function App() {
  const { screen } = useApp()

  const renderScreen = () => {
    switch(screen) {
      case 'onboarding':      return <OnboardingScreen />
      case 'dashboard':       return <DashboardScreen />
      case 'invoices':        return <InvoicesScreen />
      case 'invoice-form':    return <InvoiceFormScreen />
      case 'invoice-preview': return <InvoicePreview />
      case 'reports':         return <ReportsScreen />
      case 'clients':         return <ClientsScreen />
      case 'settings':        return <SettingsScreen />
      case 'profile':         return <ProfileScreen />
      case 'paywall':         return <PaywallScreen />
      case 'products':        return <ProductsScreen />
      default:                return <DashboardScreen />
    }
  }

  const showNav = SCREENS_WITH_NAV.includes(screen)

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-slate-100 relative">
      {showNav && <TrialBanner />}
      <div className="flex-1 overflow-y-auto screen-enter" key={screen}>
        {renderScreen()}
      </div>
      {showNav && <BottomNav />}
      <Toast />
    </div>
  )
}

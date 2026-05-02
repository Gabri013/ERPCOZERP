import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ImpersonateBanner from './ImpersonateBanner'
import { useImpersonation } from '@/contexts/ImpersonationContext'

export default function ERPLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isImpersonating } = useImpersonation()
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const isMobile = () => window.innerWidth < 768

  const handleToggle = () => {
    if (isMobile()) {
      setMobileOpen((previous) => !previous)
      return
    }

    setCollapsed((previous) => !previous)
  }

  return (
    <div className={`flex h-screen overflow-hidden bg-background ${isImpersonating ? 'pt-10' : ''}`}>
      <ImpersonateBanner />

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <div className="hidden md:flex flex-col h-full shrink-0">
        <Sidebar collapsed={collapsed} onToggle={handleToggle} onNavigate={null} />
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-[100] flex flex-col md:hidden transition-transform duration-300 ease-out shadow-xl ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar
          mobileDrawer
          collapsed={false}
          onToggle={() => setMobileOpen(false)}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuToggle={handleToggle} />
        <main className="flex-1 overflow-auto min-h-0">
          <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
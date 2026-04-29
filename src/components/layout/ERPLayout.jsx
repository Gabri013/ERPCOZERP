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
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="hidden md:flex flex-col h-full shrink-0">
        <Sidebar collapsed={collapsed} onToggle={handleToggle} onNavigate={null} />
      </div>

      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col md:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          collapsed={false}
          onToggle={() => setMobileOpen(false)}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuToggle={handleToggle} />
        <main className="flex-1 overflow-auto p-3 md:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
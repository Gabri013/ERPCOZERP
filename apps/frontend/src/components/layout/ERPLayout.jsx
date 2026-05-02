import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ImpersonateBanner from './ImpersonateBanner'
import { useImpersonation } from '@/contexts/ImpersonationContext'

const DESKTOP_BREAKPOINT = 768

export default function ERPLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isImpersonating } = useImpersonation()
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)

  // Fecha o drawer mobile ao navegar — não afeta o estado desktop
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname
      setMobileOpen(false)
    }
  }, [location.pathname])

  const handleToggle = () => {
    if (window.innerWidth < DESKTOP_BREAKPOINT) {
      setMobileOpen((prev) => !prev)
    } else {
      setSidebarOpen((prev) => !prev)
    }
  }

  return (
    <div className={`flex h-screen overflow-hidden bg-background ${isImpersonating ? 'pt-24 sm:pt-[4.5rem]' : ''}`}>
      <ImpersonateBanner />

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar desktop — sempre renderizado, largura controlada por isOpen */}
      <aside className="hidden md:flex flex-col h-full shrink-0">
        <Sidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          onNavigate={null}
        />
      </aside>

      {/* Sidebar mobile — drawer deslizante */}
      <aside
        className={`fixed inset-y-0 left-0 z-[100] flex flex-col md:hidden transition-transform duration-300 ease-out shadow-xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          mobileDrawer
          isOpen={true}
          setIsOpen={(open) => {
            if (!open) setMobileOpen(false)
          }}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

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

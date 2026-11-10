import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import CreateTicketDrawer from '../features/create-ticket/CreateTicketDrawer'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
  }`

const CONFIRMATION = 'Ärendet har registrerats.'
const CONFIRMATION_MS = 5000 // AK-9

export default function Layout() {
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  useEffect(() => {
    if (!confirmation) return
    const timer = setTimeout(() => setConfirmation(''), CONFIRMATION_MS)
    return () => clearTimeout(timer)
  }, [confirmation])

  const openDrawer = () => {
    setConfirmation('')
    setDrawerOpen(true)
  }

  const handleDrawerClosed = () => {
    setDrawerOpen(false)
    openButtonRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link to="/tickets" className="text-lg font-semibold">
            Kundserviceportal
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink to="/tickets" end className={navClass}>
              Ärenden
            </NavLink>
            <button
              ref={openButtonRef}
              type="button"
              aria-haspopup="dialog"
              onClick={openDrawer}
              className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Registrera ärende
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>

      {drawerOpen && (
        <CreateTicketDrawer
          onClose={handleDrawerClosed}
          onSaved={() => setConfirmation(CONFIRMATION)}
        />
      )}

      {/* Always rendered so screen readers announce the text when it is set (AK-9). */}
      <p
        role="status"
        className={
          confirmation
            ? 'fixed right-6 bottom-6 rounded-md bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg'
            : 'sr-only'
        }
      >
        {confirmation}
      </p>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import CreateTicketDrawer from '../features/create-ticket/CreateTicketDrawer'

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
    <div className="min-h-screen bg-portal text-white">
      <header className="border-b border-line bg-portal">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link to="/tickets" className="text-lg font-semibold">
            Kundserviceportal
          </Link>
          <nav className="flex items-center gap-2">
            <button
              ref={openButtonRef}
              type="button"
              aria-haspopup="dialog"
              onClick={openDrawer}
              className="rounded bg-teal px-3 py-1.5 text-sm font-medium text-portal hover:bg-[#4CC5BA] focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 focus:ring-offset-portal"
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
            ? 'fixed right-6 bottom-6 rounded-md bg-panel px-4 py-3 text-sm font-medium text-white shadow-lg'
            : 'sr-only'
        }
      >
        {confirmation}
      </p>
    </div>
  )
}

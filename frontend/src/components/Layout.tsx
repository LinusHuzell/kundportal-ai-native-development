import { Link, NavLink, Outlet } from 'react-router-dom'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
  }`

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link to="/tickets" className="text-lg font-semibold">
            Kundserviceportal
          </Link>
          <nav className="flex gap-2">
            <NavLink to="/tickets" end className={navClass}>
              Ärenden
            </NavLink>
            <NavLink to="/tickets/new" className={navClass}>
              Nytt ärende
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

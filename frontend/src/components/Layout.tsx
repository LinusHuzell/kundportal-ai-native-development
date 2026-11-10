import { Link, NavLink, Outlet } from 'react-router-dom'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative flex h-full items-center px-3 text-[13px] transition-colors max-sm:px-2 max-sm:text-[11px] ${
    isActive
      ? "text-white after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-teal after:content-[''] max-sm:after:inset-x-2"
      : 'text-copy-muted hover:text-white'
  }`

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-portal via-[#101f32] to-[#12253a] font-sans text-white antialiased">
      <header className="h-[60px] border-b border-line bg-portal/95">
        <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between px-6 max-sm:px-3">
          <Link
            to="/tickets"
            className="truncate text-sm font-semibold text-white max-sm:max-w-[150px] max-sm:text-xs"
            aria-label="Customer Service Portal home"
          >
            Customer Service <span className="font-normal text-copy-muted">Portal</span>
          </Link>
          <nav className="flex h-full items-center gap-2 max-sm:gap-1" aria-label="Main navigation">
            <NavLink to="/tickets" end className={navClass}>
              Tickets
            </NavLink>
            <NavLink
              to="/tickets/new"
              className="flex min-h-[34px] items-center rounded border border-teal/55 bg-teal px-3 text-xs font-bold text-[#08201f] transition-colors hover:bg-[#48c5b9] max-sm:min-h-8 max-sm:px-2 max-sm:text-[10px]"
            >
              New ticket
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8 pb-14 max-sm:px-3 max-sm:pt-6">
        <Outlet />
      </main>
    </div>
  )
}

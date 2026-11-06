import { Link, NavLink, Outlet } from 'react-router-dom'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `topbar-link${isActive ? ' topbar-link--active' : ''}`

export default function Layout() {
  return (
    <div className="portal-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/tickets" className="brand" aria-label="Customer Service Portal home">
            <span className="brand-name">Customer Service <span>Portal</span></span>
          </Link>
          <nav className="topbar-nav" aria-label="Main navigation">
            <NavLink to="/tickets" end className={navClass}>
              Tickets
            </NavLink>
            <NavLink to="/tickets/new" className="create-button">
              New ticket
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="page-shell"><Outlet /></main>
    </div>
  )
}

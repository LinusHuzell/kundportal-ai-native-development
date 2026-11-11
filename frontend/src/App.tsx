import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import { parseTicketId } from './features/ticket-detail/parseTicketId'
import TicketListPage from './pages/TicketListPage'

function LegacyTicketRedirect() {
  const ticketId = parseTicketId(useParams().id)
  return (
    <Navigate
      to="/tickets"
      replace
      state={{ selectedTicketId: ticketId ?? null }}
    />
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/tickets" replace />} />
        <Route path="/tickets" element={<TicketListPage />} />
        <Route path="/tickets/:id" element={<LegacyTicketRedirect />} />
        <Route path="*" element={<p className="p-6">Sidan hittades inte.</p>} />
      </Route>
    </Routes>
  )
}

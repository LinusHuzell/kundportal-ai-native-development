import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import TicketCreatePage from './pages/TicketCreatePage'
import TicketDetailPage from './pages/TicketDetailPage'
import TicketListPage from './pages/TicketListPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/tickets" replace />} />
        <Route path="/tickets" element={<TicketListPage />} />
        <Route path="/tickets/new" element={<TicketCreatePage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="*" element={<p className="p-6">Sidan kunde inte hittas.</p>} />
      </Route>
    </Routes>
  )
}

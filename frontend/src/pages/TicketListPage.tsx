import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Ticket } from '../types/ticket'

type TicketListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; tickets: Ticket[] }

const createdDateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })

export default function TicketListPage() {
  const [state, setState] = useState<TicketListState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    void api
      .listTickets()
      .then((tickets) => {
        if (active) setState({ status: 'loaded', tickets })
      })
      .catch(() => {
        if (active) setState({ status: 'error' })
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <section>
      <h1 className="text-2xl font-semibold">Tickets</h1>
      {state.status === 'loading' && (
        <p className="mt-4 text-slate-600" role="status">
          Loading tickets...
        </p>
      )}
      {state.status === 'error' && (
        <p className="mt-4 text-red-700" role="alert">
          Tickets could not be loaded. Please try again.
        </p>
      )}
      {state.status === 'loaded' && state.tickets.length === 0 && (
        <p className="mt-4 text-slate-600">No tickets found.</p>
      )}
      {state.status === 'loaded' && state.tickets.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold" scope="col">Ticket Number</th>
                <th className="px-4 py-3 font-semibold" scope="col">Title</th>
                <th className="px-4 py-3 font-semibold" scope="col">Priority</th>
                <th className="px-4 py-3 font-semibold" scope="col">Status</th>
                <th className="px-4 py-3 font-semibold" scope="col">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {state.tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{ticket.ticketNumber}</td>
                  <td className="px-4 py-3">{ticket.title}</td>
                  <td className="whitespace-nowrap px-4 py-3">{ticket.priority}</td>
                  <td className="whitespace-nowrap px-4 py-3">{ticket.status}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {createdDateFormatter.format(new Date(ticket.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

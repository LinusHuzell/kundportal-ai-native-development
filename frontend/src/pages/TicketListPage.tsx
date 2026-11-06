import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Ticket, TicketStatus } from '../types/ticket'

type TicketListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; tickets: Ticket[] }

const createdDateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })
const statusClassNames: Record<TicketStatus, string> = {
  New: 'status-badge--new',
  InProgress: 'status-badge--progress',
  WaitingForCustomer: 'status-badge--waiting',
  Closed: 'status-badge--closed',
}

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
    <section className="ticket-list-panel" aria-labelledby="ticket-list-title">
      <h1 className="ticket-list-heading" id="ticket-list-title">Tickets</h1>

      {state.status === 'loading' && (
        <p className="state-message" role="status">Loading tickets...</p>
      )}
      {state.status === 'error' && (
        <p className="state-message state-message--error" role="alert">
          Tickets could not be loaded. Please try again.
        </p>
      )}
      {state.status === 'loaded' && state.tickets.length === 0 && (
        <p className="state-message">No tickets found.</p>
      )}
      {state.status === 'loaded' && state.tickets.length > 0 && (
        <div className="ticket-list" aria-label="Tickets">
          {state.tickets.map((ticket) => (
            <article className="ticket-card" key={ticket.id} aria-label={`${ticket.ticketNumber}: ${ticket.title}`}>
              <div className="ticket-card-topline">
                <span className="ticket-number">{ticket.ticketNumber}</span>
                <span className={`priority-badge priority-badge--${ticket.priority.toLowerCase()}`}>
                  {ticket.priority}
                </span>
              </div>
              <h2 className="ticket-title">{ticket.title}</h2>
              <div className="ticket-card-footer">
                <span className={`status-badge ${statusClassNames[ticket.status]}`}>
                  <span aria-hidden="true" />{ticket.status}
                </span>
                <time className="ticket-date" dateTime={ticket.createdAt}>
                  {createdDateFormatter.format(new Date(ticket.createdAt))}
                </time>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

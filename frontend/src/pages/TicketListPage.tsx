import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Ticket, TicketPriority, TicketStatus } from '../types/ticket'

type TicketListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; tickets: Ticket[] }

const createdDateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })
const statusClassNames: Record<TicketStatus, string> = {
  New: 'bg-blue-500/15 text-blue-300',
  InProgress: 'bg-amber-500/15 text-amber-300',
  WaitingForCustomer: 'bg-slate-500/20 text-slate-300',
  Closed: 'bg-green-500/15 text-green-300',
}
const priorityClassNames: Record<TicketPriority, string> = {
  Low: 'bg-slate-500/15 text-copy-muted',
  Medium: 'bg-amber-500/15 text-amber-300',
  High: 'bg-red-600/15 text-red-400',
}

export default function TicketListPage() {
  const [state, setState] = useState<TicketListState>({ status: 'loading' })
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    void api
      .listTickets()
      .then((tickets) => {
        if (active) {
          setState({ status: 'loaded', tickets })
          setSelectedTicketId(tickets[0]?.id ?? null)
        }
      })
      .catch(() => {
        if (active) setState({ status: 'error' })
      })

    return () => {
      active = false
    }
  }, [])

  const selectedTicket = state.status === 'loaded'
    ? state.tickets.find((ticket) => ticket.id === selectedTicketId) ?? null
    : null

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-white" id="ticket-list-title">Tickets</h1>
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section
          className="min-w-0 overflow-hidden rounded-[7px] border border-line bg-portal/80"
          aria-labelledby="ticket-queue-title"
        >
          <h2 className="border-b border-line px-5 py-[18px] text-base font-semibold text-white" id="ticket-queue-title">
            All tickets
          </h2>

          {state.status === 'loading' && (
            <p className="m-0 px-5 py-7 text-[13px] text-copy-muted" role="status">
              Loading tickets...
            </p>
          )}
          {state.status === 'error' && (
            <p className="m-0 px-5 py-7 text-[13px] text-red-300" role="alert">
              Tickets could not be loaded. Please try again.
            </p>
          )}
          {state.status === 'loaded' && state.tickets.length === 0 && (
            <p className="m-0 px-5 py-7 text-[13px] text-copy-muted">No tickets found.</p>
          )}
          {state.status === 'loaded' && state.tickets.length > 0 && (
            <div
              className="max-h-[72vh] space-y-2 overflow-y-auto p-2 [scrollbar-color:#40546a_transparent] [scrollbar-width:thin] max-md:max-h-[52vh]"
              aria-label="Tickets"
            >
              {state.tickets.map((ticket) => {
                const isSelected = ticket.id === selectedTicketId

                return (
                  <button
                    type="button"
                    className={`block w-full rounded-md border p-[14px] text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
                      isSelected
                        ? 'border-teal bg-[#1b3048] shadow-[inset_3px_0_0_#2fb1a5]'
                        : 'border-white/10 bg-gradient-to-r from-panel to-[#14253a] hover:border-white/25'
                    }`}
                    key={ticket.id}
                    aria-label={`${ticket.ticketNumber}: ${ticket.title}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <span className="flex items-center justify-between gap-2.5">
                      <span className="text-[10px] font-bold text-teal">{ticket.ticketNumber}</span>
                      <span
                        className={`inline-flex min-h-[22px] items-center whitespace-nowrap rounded px-2 text-[10px] font-semibold ${priorityClassNames[ticket.priority]}`}
                      >
                        {ticket.priority}
                      </span>
                    </span>
                    <span className="mt-2.5 block text-[13px] font-semibold leading-[1.45] text-white">
                      {ticket.title}
                    </span>
                    <span className="mt-3.5 flex items-center justify-between gap-2.5">
                      <span
                        className={`inline-flex min-h-[22px] items-center gap-1.5 whitespace-nowrap rounded px-2 text-[10px] font-semibold ${statusClassNames[ticket.status]}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                        {ticket.status}
                      </span>
                      <time className="whitespace-nowrap text-[10px] text-copy-dim" dateTime={ticket.createdAt}>
                        {createdDateFormatter.format(new Date(ticket.createdAt))}
                      </time>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <aside
          className="min-w-0 overflow-hidden rounded-[7px] border border-line bg-portal/80"
          aria-labelledby="ticket-details-title"
        >
          <div className="border-b border-line px-5 py-[18px]">
            <p className="mb-1 text-[10px] font-bold tracking-[0.12em] text-teal">SELECTED TICKET</p>
            <h2 className="text-base font-semibold text-white" id="ticket-details-title">Ticket details</h2>
          </div>

          {selectedTicket ? (
            <div className="divide-y divide-line">
              <section className="p-5" aria-label="Ticket description">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-copy-dim">
                  {selectedTicket.ticketNumber}
                </p>
                <h3 className="text-lg font-semibold leading-snug text-white">{selectedTicket.title}</h3>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-copy-muted">
                  {selectedTicket.description}
                </p>
              </section>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-5 p-5 text-sm">
                <div>
                  <dt className="text-xs text-copy-dim">Category</dt>
                  <dd className="mt-1 font-medium text-white">{selectedTicket.category}</dd>
                </div>
                <div>
                  <dt className="text-xs text-copy-dim">Priority</dt>
                  <dd className="mt-1 font-medium text-white">{selectedTicket.priority}</dd>
                </div>
                <div>
                  <dt className="text-xs text-copy-dim">Status</dt>
                  <dd className="mt-1 font-medium text-white">{selectedTicket.status}</dd>
                </div>
                <div>
                  <dt className="text-xs text-copy-dim">Created</dt>
                  <dd className="mt-1 font-medium text-white">
                    {createdDateFormatter.format(new Date(selectedTicket.createdAt))}
                  </dd>
                </div>
              </dl>

              <section className="p-5" aria-label="Customer information">
                <h3 className="mb-3 text-sm font-semibold text-white">Customer</h3>
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-copy-dim">Name</dt>
                    <dd className="mt-1 break-words text-copy-muted">
                      {selectedTicket.customerName || 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-copy-dim">Email</dt>
                    <dd className="mt-1 break-all text-copy-muted">
                      {selectedTicket.customerEmail || 'Not provided'}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          ) : (
            <p className="px-5 py-7 text-[13px] text-copy-muted" role="status">
              {state.status === 'loading'
                ? 'Loading ticket details...'
                : state.status === 'error'
                  ? 'Ticket details are unavailable.'
                  : 'No ticket selected.'}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

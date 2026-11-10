import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api/client'
import TicketDetailsPanel from '../components/TicketDetailsPanel'
import TicketHistory from '../features/ticket-detail/TicketHistory'
import StatusForm from '../features/ticket-detail/StatusForm'
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from '../types/ticket'

type TicketListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; tickets: Ticket[] }

type SelectedTicketResult = { id: number } & (
  { status: 'loaded'; ticket: Ticket } | { status: 'failed' }
)

const createdDateFormatter = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' })
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
  const location = useLocation()
  const requestedTicketId = (location.state as { selectedTicketId?: unknown } | null)
    ?.selectedTicketId
  const [state, setState] = useState<TicketListState>({ status: 'loading' })
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(() =>
    typeof requestedTicketId === 'number' && Number.isSafeInteger(requestedTicketId)
      ? requestedTicketId
      : null,
  )
  const [selectedTicketResult, setSelectedTicketResult] = useState<SelectedTicketResult>()

  useEffect(() => {
    let active = true

    void api
      .listTickets()
      .then((tickets) => {
        if (active) {
          setState({ status: 'loaded', tickets })
          setSelectedTicketId((current) =>
            current !== null && tickets.some((ticket) => ticket.id === current)
              ? current
              : (tickets[0]?.id ?? null),
          )
        }
      })
      .catch(() => {
        if (active) setState({ status: 'error' })
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (selectedTicketId === null) return
    let active = true

    api.getTicket(selectedTicketId).then(
      (ticket) => {
        if (active) setSelectedTicketResult({ id: selectedTicketId, status: 'loaded', ticket })
      },
      () => {
        if (active) setSelectedTicketResult({ id: selectedTicketId, status: 'failed' })
      },
    )

    return () => {
      active = false
    }
  }, [selectedTicketId])

  const currentTicketResult = selectedTicketResult?.id === selectedTicketId
    ? selectedTicketResult
    : selectedTicketId === null
      ? undefined
      : { id: selectedTicketId, status: 'loading' as const }
  const selectedTicket = currentTicketResult?.status === 'loaded' ? currentTicketResult.ticket : null

  const handleStatusSaved = (updatedTicket: Ticket) => {
    setSelectedTicketResult({ id: updatedTicket.id, status: 'loaded', ticket: updatedTicket })
    setState((current) =>
      current.status === 'loaded'
        ? {
            ...current,
            tickets: current.tickets.map((ticket) =>
              ticket.id === updatedTicket.id ? updatedTicket : ticket,
            ),
          }
        : current,
    )
  }

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-white" id="ticket-list-title">Ärenden</h1>
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section
          className="min-w-0 overflow-hidden rounded-[7px] border border-line bg-portal/80"
          aria-labelledby="ticket-queue-title"
        >
          <h2 className="border-b border-line px-5 py-[18px] text-base font-semibold text-white" id="ticket-queue-title">
            Alla ärenden
          </h2>

          {state.status === 'loading' && (
            <p className="m-0 px-5 py-7 text-[13px] text-copy-muted" role="status">
              Laddar ärenden…
            </p>
          )}
          {state.status === 'error' && (
            <p className="m-0 px-5 py-7 text-[13px] text-red-300" role="alert">
              Kunde inte hämta ärenden. Försök igen.
            </p>
          )}
          {state.status === 'loaded' && state.tickets.length === 0 && (
            <p className="m-0 px-5 py-7 text-[13px] text-copy-muted">Inga ärenden hittades.</p>
          )}
          {state.status === 'loaded' && state.tickets.length > 0 && (
            <div
              className="max-h-[72vh] space-y-2 overflow-y-auto p-2 [scrollbar-color:#40546a_transparent] [scrollbar-width:thin] max-md:max-h-[52vh]"
              aria-label="Ärenden"
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
                        {PRIORITY_LABELS[ticket.priority]}
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
                        {STATUS_LABELS[ticket.status]}
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
          <TicketDetailsPanel
            ticket={selectedTicket}
            emptyMessageRole={currentTicketResult?.status === 'failed' ? 'alert' : 'status'}
            emptyMessage={
              currentTicketResult?.status === 'loading' || state.status === 'loading'
                ? 'Laddar ärendedetaljer…'
                : currentTicketResult?.status === 'failed' || state.status === 'error'
                  ? 'Ärendedetaljerna är inte tillgängliga.'
                  : 'Inget ärende valt.'
            }
          >
            {selectedTicket && (
              <>
                <section aria-labelledby="ticket-status-title">
                  <h2 id="ticket-status-title" className="text-sm font-semibold text-white">
                    Ändra status
                  </h2>
                  <StatusForm
                    key={selectedTicket.id}
                    ticket={selectedTicket}
                    onSaved={handleStatusSaved}
                  />
                </section>
                <TicketHistory ticketId={selectedTicket.id} />
              </>
            )}
          </TicketDetailsPanel>
        </aside>
      </div>
    </div>
  )
}

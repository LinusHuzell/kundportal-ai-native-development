import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, api } from '../api/client'
import type { Ticket, TicketPriority, TicketStatus } from '../types/ticket'

const priorityStyles: Record<TicketPriority, string> = {
  Low: 'bg-slate-500/15 text-slate-300',
  Medium: 'bg-amber-500/15 text-amber-300',
  High: 'bg-red-500/15 text-red-300',
}

const statusStyles: Record<TicketStatus, string> = {
  New: 'bg-blue-500/15 text-blue-300',
  InProgress: 'bg-amber-500/15 text-amber-300',
  WaitingForCustomer: 'bg-slate-500/15 text-slate-300',
  Closed: 'bg-green-500/15 text-green-300',
}

const statusLabels: Record<TicketStatus, string> = {
  New: 'New',
  InProgress: 'In progress',
  WaitingForCustomer: 'Waiting for customer',
  Closed: 'Closed',
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))

export default function TicketListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const statistics = [
    { label: 'Total tickets', value: tickets.length },
    { label: 'New tickets', value: tickets.filter((ticket) => ticket.status === 'New').length },
    { label: 'High priority', value: tickets.filter((ticket) => ticket.priority === 'High').length },
  ]

  useEffect(() => {
    let active = true

    api.listTickets()
      .then((result) => {
        if (active) setTickets(result)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(cause instanceof ApiError ? cause.message : 'Unable to reach the ticket service.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  return (
    <section className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Contractor service
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Service tickets</h1>
        <p className="mt-2 text-sm text-slate-600">Contractor requests and site-service issues</p>
      </header>

      <section aria-label="Ticket statistics" className="grid gap-3 sm:grid-cols-3">
        {statistics.map((statistic) => (
          <div key={statistic.label} className="rounded-md border border-[#263c53] bg-[#16283D] px-4 py-3 text-white">
            <p className="text-xs font-medium text-[#AAB6C5]">{statistic.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#66D4C8]">
              {loading || error ? '—' : statistic.value}
            </p>
          </div>
        ))}
      </section>

      <div className="overflow-hidden rounded-md border border-[#263c53] bg-[#0F1C2E] text-white shadow-lg">
        <div className="hidden grid-cols-[minmax(0,1.8fr)_0.8fr_1.1fr_0.9fr] gap-4 border-b border-[#263c53] bg-[#16283D] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#AAB6C5] md:grid">
          <span>Ticket</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Created</span>
        </div>

        {loading ? (
          <p role="status" className="px-5 py-12 text-center text-sm text-[#AAB6C5]">
            Loading tickets...
          </p>
        ) : error ? (
          <div role="alert" className="px-5 py-12 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                setError(null)
                setReloadKey((key) => key + 1)
              }}
              className="mt-4 rounded-md border border-[#2FB1A5] px-4 py-2 text-sm font-medium text-[#66D4C8] hover:bg-[#2FB1A5]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2FB1A5]"
            >
              Try again
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[#AAB6C5]">
            No tickets to display.
          </p>
        ) : (
          <ol aria-label="Tickets" className="divide-y divide-[#263c53]">
            {tickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <li>
      <Link
        to={`/tickets/${ticket.id}`}
        className="grid gap-4 px-5 py-4 transition-colors hover:bg-[#16283D] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2FB1A5] md:grid-cols-[minmax(0,1.8fr)_0.8fr_1.1fr_0.9fr] md:items-center"
      >
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#2FB1A5]">Ticket #{ticket.id}</p>
          <h2 className="mt-1 break-words text-sm font-semibold text-white">{ticket.title}</h2>
        </div>
        <div className="flex items-center justify-between gap-3 md:block">
          <span className="text-xs text-[#7E8B9A] md:hidden">Priority</span>
          <span className={`rounded px-2.5 py-1 text-xs font-semibold ${priorityStyles[ticket.priority]}`}>
            {ticket.priority}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 md:block">
          <span className="text-xs text-[#7E8B9A] md:hidden">Status</span>
          <span className={`rounded px-2.5 py-1 text-xs font-semibold ${statusStyles[ticket.status]}`}>
            {statusLabels[ticket.status]}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 md:block">
          <span className="text-xs text-[#7E8B9A] md:hidden">Created</span>
          <time dateTime={ticket.createdAt} className="text-sm text-[#AAB6C5]">
            {formatDate(ticket.createdAt)}
          </time>
        </div>
      </Link>
    </li>
  )
}

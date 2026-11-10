import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, api } from '../api/client'
import StatusForm from '../features/ticket-detail/StatusForm'
import { formatCreatedAt } from '../features/ticket-detail/formatCreatedAt'
import { parseTicketId } from '../features/ticket-detail/parseTicketId'
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, type Ticket } from '../types/ticket'

const LOADING = 'Laddar ärende…'
const LOAD_FAILED = 'Ärendet kunde inte hämtas. Försök igen senare.'

type LoadResult = { id: number } & (
  { kind: 'loaded'; ticket: Ticket } | { kind: 'not-found' } | { kind: 'failed' }
)

// Labels and values from Visning in docs/specs/visa-ärende-och-ändra-status.md (AK-1).
const DETAILS: [string, (ticket: Ticket) => string][] = [
  ['Ärendenummer', (ticket) => String(ticket.id)],
  ['Status', (ticket) => STATUS_LABELS[ticket.status]],
  ['Prioritet', (ticket) => PRIORITY_LABELS[ticket.priority]],
  ['Kategori', (ticket) => CATEGORY_LABELS[ticket.category]],
  ['Skapad', (ticket) => formatCreatedAt(ticket.createdAt)],
  ['Namn', (ticket) => ticket.customerName],
  ['E-post', (ticket) => ticket.customerEmail],
  ['Beskrivning', (ticket) => ticket.description],
]

export default function TicketDetailPage() {
  const ticketId = parseTicketId(useParams().id)
  const [result, setResult] = useState<LoadResult>()

  useEffect(() => {
    if (ticketId === undefined) return // AK-3: no request for an id that cannot exist.
    let current = true
    api.getTicket(ticketId).then(
      (ticket) => {
        if (current) setResult({ id: ticketId, kind: 'loaded', ticket })
      },
      (error: unknown) => {
        if (!current) return
        const notFound = error instanceof ApiError && error.status === 404
        setResult({ id: ticketId, kind: notFound ? 'not-found' : 'failed' })
      },
    )
    return () => {
      current = false
    }
  }, [ticketId])

  // No result for the current id yet means it is loading (AK-4).
  const state =
    ticketId === undefined
      ? { kind: 'not-found' as const }
      : result?.id === ticketId
        ? result
        : { kind: 'loading' as const }

  return (
    <section>
      <Link
        to="/tickets"
        className="rounded text-sm font-medium text-slate-700 underline hover:text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
      >
        Tillbaka till ärendelistan
      </Link>

      {/* Always rendered, so the alert exists before its text is set (AK-5). */}
      <p role="status" className="mt-6 text-slate-600">
        {state.kind === 'loading' ? LOADING : ''}
      </p>
      <p
        role="alert"
        className={
          state.kind === 'failed' ? 'rounded-md bg-red-50 px-3 py-2 text-sm text-red-800' : ''
        }
      >
        {state.kind === 'failed' ? LOAD_FAILED : ''}
      </p>

      {state.kind === 'not-found' && (
        <h1 className="text-2xl font-semibold">Ärendet hittades inte</h1>
      )}

      {state.kind === 'loaded' && (
        <>
          <h1 className="text-2xl font-semibold">{state.ticket.title}</h1>
          <dl className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
            {DETAILS.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-sm font-medium text-slate-600">{label}</dt>
                <dd className="text-sm whitespace-pre-wrap">{value(state.ticket)}</dd>
              </div>
            ))}
          </dl>
          <StatusForm
            ticket={state.ticket}
            onSaved={(ticket) => setResult({ id: ticket.id, kind: 'loaded', ticket })}
          />
        </>
      )}
    </section>
  )
}

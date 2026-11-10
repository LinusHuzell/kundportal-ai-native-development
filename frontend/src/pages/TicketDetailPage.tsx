import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, api } from '../api/client'
import TicketHistory from '../features/ticket-detail/TicketHistory'
import StatusForm from '../features/ticket-detail/StatusForm'
import { formatCreatedAt } from '../features/ticket-detail/formatCreatedAt'
import { parseTicketId } from '../features/ticket-detail/parseTicketId'
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from '../types/ticket'

const LOADING = 'Laddar ärende…'
const LOAD_FAILED = 'Ärendet kunde inte hämtas. Försök igen senare.'

type LoadResult = { id: number } & (
  { kind: 'loaded'; ticket: Ticket } | { kind: 'not-found' } | { kind: 'failed' }
)

// Colors from docs/design-specifikation.md as a 20 % tint, with a lighter text in the same hue.
// The design colors themselves are below 4.5:1 as text on the dark cards.
const STATUS_BADGE: Record<TicketStatus, string> = {
  New: 'bg-[#2563EB]/20 text-[#93C5FD]',
  InProgress: 'bg-[#F59E0B]/20 text-[#FCD34D]',
  WaitingForCustomer: 'bg-[#64748B]/20 text-[#CBD5E1]',
  Closed: 'bg-[#16A34A]/20 text-[#86EFAC]',
}

const PRIORITY_BADGE: Record<TicketPriority, string> = {
  Low: 'bg-[#64748B]/20 text-[#CBD5E1]',
  Medium: 'bg-[#F59E0B]/20 text-[#FCD34D]',
  High: 'bg-[#DC2626]/20 text-[#FCA5A5]',
}

const cardClass = 'rounded-lg border border-white/10 bg-[#16283D] p-5'
const cardTitleClass = 'text-xs font-semibold tracking-wider text-[#AAB6C5] uppercase'

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-white/10 py-3 last:border-b-0">
      <dt className="w-24 shrink-0 text-sm text-[#AAB6C5]">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}

function TicketDetails({ ticket, onSaved }: { ticket: Ticket; onSaved: (ticket: Ticket) => void }) {
  const initials = ticket.customerName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      <header className="border-b border-white/10 px-6 pb-6 sm:px-8">
        <dl>
          <dt className="sr-only">Ärendenummer</dt>
          <dd className="text-xs font-semibold tracking-wider text-[#2FB1A5] uppercase before:content-['Ärende_']">
            {ticket.ticketNumber}
          </dd>
        </dl>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{ticket.title}</h1>
        <dl className="mt-3">
          <dt className="sr-only">Skapad</dt>
          <dd className="flex items-center gap-2 text-sm text-[#AAB6C5]">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm10 6H4v8h12V8Z" />
            </svg>
            {formatCreatedAt(ticket.createdAt)}
          </dd>
        </dl>
      </header>

      <div className="space-y-4 p-6 sm:p-8">
        <dl className={cardClass}>
          <dt className={cardTitleClass}>Beskrivning</dt>
          <dd className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</dd>
        </dl>

        <div className="grid gap-4 md:grid-cols-2">
          <section aria-labelledby="ticket-work-order" className={cardClass}>
            <h2 id="ticket-work-order" className={cardTitleClass}>
              Arbetsorder
            </h2>
            <dl className="mt-2">
              <Row label="Kategori">{CATEGORY_LABELS[ticket.category]}</Row>
              <Row label="Prioritet">
                <Badge className={PRIORITY_BADGE[ticket.priority]}>
                  {PRIORITY_LABELS[ticket.priority]}
                </Badge>
              </Row>
              <Row label="Status">
                <Badge className={STATUS_BADGE[ticket.status]}>
                  {STATUS_LABELS[ticket.status]}
                </Badge>
              </Row>
            </dl>
            <StatusForm ticket={ticket} onSaved={onSaved} />
          </section>

          <section aria-labelledby="ticket-customer" className={cardClass}>
            <h2 id="ticket-customer" className={cardTitleClass}>
              Kund
            </h2>
            <div className="mt-4 flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0F1C2E] text-sm font-semibold"
              >
                {initials}
              </span>
              <dl className="min-w-0 space-y-2 text-sm">
                <dt className="sr-only">Namn</dt>
                <dd className="font-semibold">{ticket.customerName}</dd>
                <dt className="sr-only">E-post</dt>
                <dd className="flex items-center gap-2 break-all text-[#AAB6C5]">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-4 shrink-0"
                  >
                    <path d="M3 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H3Zm0 2h14v.4l-7 4.2-7-4.2V6Zm0 2.7 6.5 3.9a1 1 0 0 0 1 0L17 8.7V14H3V8.7Z" />
                  </svg>
                  {ticket.customerEmail}
                </dd>
              </dl>
            </div>
          </section>
        </div>
        <TicketHistory ticketId={ticket.id} />
      </div>
    </>
  )
}

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
    // The panel sets its own background and text colors, so it reads the same on any page theme.
    <section className="overflow-hidden rounded-xl bg-[#0F1C2E] text-white shadow-xl">
      <div className="px-6 pt-6 sm:px-8">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-[#2FB1A5] underline-offset-4 hover:underline focus:ring-2 focus:ring-[#2FB1A5] focus:ring-offset-2 focus:ring-offset-[#0F1C2E] focus:outline-none"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4">
            <path d="M12.8 4.2a1 1 0 0 1 0 1.4L8.4 10l4.4 4.4a1 1 0 0 1-1.4 1.4l-5.1-5.1a1 1 0 0 1 0-1.4l5.1-5.1a1 1 0 0 1 1.4 0Z" />
          </svg>
          Tillbaka till ärendelistan
        </Link>

        {/* Always rendered, so the alert exists before its text is set (AK-5). */}
        {/* Not display: none when empty, which would take the regions out of the accessibility tree. */}
        <p role="status" className={state.kind === 'loading' ? 'mt-4 text-sm text-[#AAB6C5]' : ''}>
          {state.kind === 'loading' ? LOADING : ''}
        </p>
        <p
          role="alert"
          className={
            state.kind === 'failed'
              ? 'mt-4 rounded-md bg-[#DC2626]/20 px-3 py-2 text-sm text-[#FCA5A5]'
              : ''
          }
        >
          {state.kind === 'failed' ? LOAD_FAILED : ''}
        </p>
      </div>

      <div className="pt-6">
        {state.kind === 'not-found' && (
          <h1 className="px-6 pb-8 text-2xl font-bold sm:px-8">Ärendet hittades inte</h1>
        )}
        {state.kind === 'loaded' && (
          <TicketDetails
            ticket={state.ticket}
            onSaved={(ticket) => setResult({ id: ticket.id, kind: 'loaded', ticket })}
          />
        )}
      </div>
    </section>
  )
}

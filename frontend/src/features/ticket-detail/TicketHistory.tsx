import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import { formatCreatedAt } from './formatCreatedAt'
import { TICKET_HISTORY_EVENT_LABELS, type TicketHistoryEvent } from '../../types/ticket'

type HistoryResult = { id: number; refreshKey: number } & (
  | { kind: 'loaded'; events: TicketHistoryEvent[] }
  | { kind: 'failed' }
)

const LOAD_FAILED = 'Historiken kunde inte hämtas. Försök igen.'
const EMPTY_HISTORY = 'Det finns inga händelser för ärendet.'
const headingClass = 'text-xs font-semibold tracking-wider text-[#AAB6C5] uppercase'

function describeEvent(event: TicketHistoryEvent): string | undefined {
  if (event.type === 'StatusChanged') {
    return event.fromStatus && event.toStatus
      ? `Förändrad status: ${event.fromStatus} -> ${event.toStatus}`
      : undefined
  }
  return TICKET_HISTORY_EVENT_LABELS[event.type]
}

export default function TicketHistory({
  ticketId,
  refreshKey = 0,
}: {
  ticketId: number
  refreshKey?: number
}) {
  const [result, setResult] = useState<HistoryResult>()
  const requestRef = useRef<{
    id: number
    refreshKey: number
    promise: Promise<TicketHistoryEvent[]>
  } | null>(null)

  useEffect(() => {
    let current = true
    let request = requestRef.current
    if (request?.id !== ticketId || request.refreshKey !== refreshKey) {
      request = { id: ticketId, refreshKey, promise: api.getTicketHistory(ticketId) }
      requestRef.current = request
    }
    request.promise.then(
      (events) => {
        if (current) setResult({ id: ticketId, refreshKey, kind: 'loaded', events })
      },
      () => {
        if (current) setResult({ id: ticketId, refreshKey, kind: 'failed' })
      },
    )
    return () => {
      current = false
    }
  }, [ticketId, refreshKey])

  const state =
    result?.id === ticketId && result.refreshKey === refreshKey
      ? result
      : { kind: 'loading' as const }
  const events =
    state.kind === 'loaded'
      ? state.events.flatMap((event) => {
          const label = describeEvent(event)
          return label === undefined ? [] : [{ event, label }]
        })
      : []

  return (
    <section
      aria-labelledby="ticket-history-heading"
      className="rounded-lg border border-white/10 bg-[#16283D] p-5"
    >
      <h2 id="ticket-history-heading" className={headingClass}>
        Historik
      </h2>
      <p role="status" className={state.kind === 'loading' ? 'mt-4 text-sm text-[#AAB6C5]' : ''}>
        {state.kind === 'loading' ? 'Laddar historik…' : ''}
      </p>
      <p
        role="alert"
        className={state.kind === 'failed' ? 'mt-4 rounded-md bg-[#DC2626]/20 px-3 py-2 text-sm text-[#FCA5A5]' : ''}
      >
        {state.kind === 'failed' ? LOAD_FAILED : ''}
      </p>
      {state.kind === 'loaded' && events.length === 0 && (
        <p className="mt-4 text-sm text-[#AAB6C5]">{EMPTY_HISTORY}</p>
      )}
      {state.kind === 'loaded' && events.length > 0 && (
        <ul className="mt-4 divide-y divide-white/10 text-sm">
          {events.map(({ event, label }, index) => (
            <li
              key={`${event.type}-${event.occurredAt}-${index}`}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{label}</span>
              <time dateTime={new Date(event.occurredAt).toISOString()} className="text-[#AAB6C5]">
                {formatCreatedAt(event.occurredAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
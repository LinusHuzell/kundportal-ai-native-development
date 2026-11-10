import type { ReactNode } from 'react'
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Ticket,
} from '../types/ticket'

const createdDateFormatter = new Intl.DateTimeFormat('sv-SE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

interface Props {
  ticket: Ticket | null
  emptyMessage?: string
  emptyMessageRole?: 'status' | 'alert'
  children?: ReactNode
}

export default function TicketDetailsPanel({
  ticket,
  emptyMessage,
  emptyMessageRole = 'status',
  children,
}: Props) {
  return (
    <>
      <div className="border-b border-line px-5 py-[18px]">
        <p className="mb-1 text-[10px] font-bold tracking-[0.12em] text-teal">VALT ÄRENDE</p>
        <h2 className="text-base font-semibold text-white" id="ticket-details-title">
          Ärendedetaljer
        </h2>
      </div>

      {ticket ? (
        <div className="divide-y divide-line">
          <section className="p-5" aria-label="Ärendebeskrivning">
            <dl>
              <dt className="sr-only">Ärendenummer</dt>
              <dd className="mb-2 text-[10px] font-bold uppercase tracking-wider text-copy-dim">
                {ticket.ticketNumber}
              </dd>
            </dl>
            <h3 className="text-lg font-semibold leading-snug text-white">{ticket.title}</h3>
            <dl className="mt-4">
              <dt className="sr-only">Beskrivning</dt>
              <dd className="whitespace-pre-wrap text-sm leading-6 text-copy-muted">
                {ticket.description}
              </dd>
            </dl>
          </section>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 p-5 text-sm">
            <div>
              <dt className="text-xs text-copy-dim">Kategori</dt>
              <dd className="mt-1 font-medium text-white">{CATEGORY_LABELS[ticket.category]}</dd>
            </div>
            <div>
              <dt className="text-xs text-copy-dim">Prioritet</dt>
              <dd className="mt-1 font-medium text-white">{PRIORITY_LABELS[ticket.priority]}</dd>
            </div>
            <div>
              <dt className="text-xs text-copy-dim">Status</dt>
              <dd className="mt-1 font-medium text-white">{STATUS_LABELS[ticket.status]}</dd>
            </div>
            <div>
              <dt className="text-xs text-copy-dim">Skapad</dt>
              <dd className="mt-1 font-medium text-white">
                {createdDateFormatter.format(new Date(ticket.createdAt))}
              </dd>
            </div>
          </dl>

          <section className="p-5" aria-label="Kunduppgifter">
            <h3 className="mb-3 text-sm font-semibold text-white">Kund</h3>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs text-copy-dim">Namn</dt>
                <dd className="mt-1 break-words text-copy-muted">
                  {ticket.customerName || 'Uppgift saknas'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-copy-dim">E-post</dt>
                <dd className="mt-1 break-all text-copy-muted">
                  {ticket.customerEmail || 'Uppgift saknas'}
                </dd>
              </div>
            </dl>
          </section>

          {children && <div className="space-y-5 p-5">{children}</div>}
        </div>
      ) : (
        <p className="px-5 py-7 text-[13px] text-copy-muted" role={emptyMessageRole}>
          {emptyMessage}
        </p>
      )}
    </>
  )
}
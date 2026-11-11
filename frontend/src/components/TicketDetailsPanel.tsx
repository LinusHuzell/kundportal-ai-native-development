import type { ReactNode, Ref } from 'react'
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

type FieldIconName = 'category' | 'priority' | 'date' | 'name' | 'email'

function FieldLabel({ icon, children }: { icon: FieldIconName; children: ReactNode }) {
  return (
    <dt className="flex items-center gap-1.5 text-xs text-copy-dim">
      <svg
        aria-hidden="true"
        className="size-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
        viewBox="0 0 24 24"
      >
        {icon === 'category' && <path d="M20.6 13.4 11 3.8H4v7l9.6 9.6a2 2 0 0 0 2.8 0l4.2-4.2a2 2 0 0 0 0-2.8ZM7.5 7.5h.01" />}
        {icon === 'priority' && <path d="M5 21V4m0 1h14l-3 5 3 5H5" />}
        {icon === 'date' && <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>}
        {icon === 'name' && <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>}
        {icon === 'email' && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>}
      </svg>
      {children}
    </dt>
  )
}

interface Props {
  ticket: Ticket | null
  emptyMessage?: string
  emptyMessageRole?: 'status' | 'alert'
  children?: ReactNode
  onEdit?: () => void
  editButtonRef?: Ref<HTMLButtonElement>
  /** When set, replaces the read-only details. The ticket number stays. */
  editForm?: ReactNode
}

export default function TicketDetailsPanel({
  ticket,
  emptyMessage,
  emptyMessageRole = 'status',
  children,
  onEdit,
  editButtonRef,
  editForm,
}: Props) {
  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-[18px]">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-[0.12em] text-teal">VALT ÄRENDE</p>
          <h2 className="text-base font-semibold text-white" id="ticket-details-title">
            Ärendedetaljer
          </h2>
        </div>
        {ticket && onEdit && !editForm && (
          <button
            ref={editButtonRef}
            type="button"
            onClick={onEdit}
            className="rounded-md border border-[#7E8B9A] px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 focus:ring-offset-panel"
          >
            Redigera
          </button>
        )}
      </div>

      {ticket ? (
        <div className="divide-y divide-line">
          <section className="p-5" aria-label={editForm ? 'Redigera ärende' : 'Ärendebeskrivning'}>
            <dl>
              <dt className="sr-only">Ärendenummer</dt>
              <dd className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-copy-dim">
                <svg
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 9h16M4 15h16M10 3 8 21m8-18-2 18" />
                </svg>
                {ticket.ticketNumber}
              </dd>
            </dl>
            {editForm ?? (
            <>
            <h3 className="text-lg font-semibold leading-snug text-white">{ticket.title}</h3>
            <dl className="mt-4">
              <dt className="mb-1.5 flex items-center gap-1.5 text-xs text-copy-dim">
                <svg
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                  viewBox="0 0 24 24"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M8 13h8M8 17h8" />
                </svg>
                Beskrivning
              </dt>
              <dd className="whitespace-pre-wrap text-sm leading-6 text-copy-muted">
                {ticket.description}
              </dd>
            </dl>
            </>
            )}
          </section>

          {!editForm && (
          <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 p-5 text-sm">
            <div>
              <FieldLabel icon="category">Kategori</FieldLabel>
              <dd className="mt-1 font-medium text-white">{CATEGORY_LABELS[ticket.category]}</dd>
            </div>
            <div>
              <FieldLabel icon="priority">Prioritet</FieldLabel>
              <dd className="mt-1 font-medium text-white">{PRIORITY_LABELS[ticket.priority]}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-copy-dim">
                <svg
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 6h12M9 12h12M9 18h12" />
                  <circle cx="4" cy="6" r="1" />
                  <circle cx="4" cy="12" r="1" />
                  <circle cx="4" cy="18" r="1" />
                </svg>
                Status
              </dt>
              <dd className="mt-1 font-medium text-white">{STATUS_LABELS[ticket.status]}</dd>
            </div>
            <div>
              <FieldLabel icon="date">Skapad</FieldLabel>
              <dd className="mt-1 font-medium text-white">
                {createdDateFormatter.format(new Date(ticket.createdAt))}
              </dd>
            </div>
          </dl>

          <section className="p-5" aria-label="Kunduppgifter">
            <h3 className="mb-3 text-sm font-semibold text-white">Kund</h3>
            <dl className="grid gap-3 text-sm">
              <div>
                <FieldLabel icon="name">Namn</FieldLabel>
                <dd className="mt-1 break-words text-copy-muted">
                  {ticket.customerName || 'Uppgift saknas'}
                </dd>
              </div>
              <div>
                <FieldLabel icon="email">E-post</FieldLabel>
                <dd className="mt-1 break-all text-copy-muted">
                  {ticket.customerEmail || 'Uppgift saknas'}
                </dd>
              </div>
            </dl>
          </section>
          </>
          )}

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
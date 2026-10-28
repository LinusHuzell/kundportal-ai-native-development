import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, api } from '../api/client'
import type { Ticket, TicketStatus } from '../types/ticket'

const statuses: TicketStatus[] = ['New', 'InProgress', 'WaitingForCustomer', 'Closed']

const statusLabels: Record<TicketStatus, string> = {
  New: 'New',
  InProgress: 'In progress',
  WaitingForCustomer: 'Waiting for customer',
  Closed: 'Closed',
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value))

export default function TicketDetailPage() {
  const { id } = useParams()
  const ticketId = Number(id)

  if (!Number.isInteger(ticketId) || ticketId < 1) {
    return <TicketMessage message="Invalid ticket number." />
  }

  return <TicketDetails ticketId={ticketId} />
}

function TicketDetails({ ticketId }: { ticketId: number }) {
  const [loadResult, setLoadResult] = useState<
    { ticketId: number; ticket: Ticket } | { ticketId: number; error: string } | null
  >(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [statusChoice, setStatusChoice] = useState<{ ticketId: number; status: TicketStatus } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    api.getTicket(ticketId)
      .then((ticket) => {
        if (active) setLoadResult({ ticketId, ticket })
      })
      .catch((cause: unknown) => {
        if (!active) return
        const message = cause instanceof ApiError && cause.status === 404
          ? 'Ticket not found.'
          : cause instanceof ApiError
            ? cause.message
            : 'Unable to reach the ticket service.'
        setLoadResult({ ticketId, error: message })
      })

    return () => {
      active = false
    }
  }, [ticketId, reloadKey])

  const currentResult = loadResult?.ticketId === ticketId ? loadResult : null

  if (!currentResult) {
    return <TicketMessage message="Loading ticket..." role="status" />
  }

  if ('error' in currentResult) {
    return (
      <section className="space-y-5">
        <Link to="/tickets" className="text-sm font-medium text-teal-700 hover:underline">
          Back to tickets
        </Link>
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-5 py-6 text-red-800">
          <p>{currentResult.error}</p>
          <button
            type="button"
            onClick={() => {
              setLoadResult(null)
              setReloadKey((key) => key + 1)
            }}
            className="mt-4 rounded border border-red-300 px-3 py-2 text-sm font-medium hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      </section>
    )
  }

  const ticket = currentResult.ticket
  const selectedStatus = statusChoice?.ticketId === ticketId ? statusChoice.status : ticket.status

  const submitStatus = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaveMessage(null)

    try {
      const updatedTicket = await api.updateTicketStatus(ticketId, selectedStatus)
      setLoadResult({ ticketId, ticket: updatedTicket })
      setStatusChoice({ ticketId, status: updatedTicket.status })
      setSaveMessage('Status updated.')
    } catch (cause) {
      setSaveError(cause instanceof ApiError ? cause.message : 'Unable to update ticket status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <Link to="/tickets" className="inline-flex text-sm font-medium text-teal-700 hover:underline">
        Back to tickets
      </Link>

      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Ticket #{ticket.id}
        </p>
        <h1 className="mt-2 break-words text-3xl font-semibold text-slate-950">{ticket.title}</h1>
        <p className="mt-2 text-sm text-slate-600">Created {formatDate(ticket.createdAt)}</p>
      </header>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="rounded-md border border-[#263c53] bg-[#0F1C2E] p-5 text-white">
          <h2 className="text-sm font-semibold text-[#AAB6C5]">Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{ticket.description}</p>
        </article>

        <aside className="space-y-5 rounded-md border border-[#263c53] bg-[#16283D] p-5 text-white">
          <h2 className="text-sm font-semibold">Ticket information</h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs text-[#AAB6C5]">Category</dt>
              <dd className="mt-1">{ticket.category}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#AAB6C5]">Priority</dt>
              <dd className="mt-1">{ticket.priority}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#AAB6C5]">Customer</dt>
              <dd className="mt-1">{ticket.customerName}</dd>
              <dd>
                <a className="break-all text-[#66D4C8] hover:underline" href={`mailto:${ticket.customerEmail}`}>
                  {ticket.customerEmail}
                </a>
              </dd>
            </div>
          </dl>

          <form onSubmit={submitStatus} className="space-y-3 border-t border-[#263c53] pt-5">
            <label htmlFor="ticket-status" className="block text-xs font-medium text-[#AAB6C5]">
              Status
            </label>
            <select
              id="ticket-status"
              value={selectedStatus}
              onChange={(event) => {
                setStatusChoice({ ticketId, status: event.target.value as TicketStatus })
                setSaveError(null)
                setSaveMessage(null)
              }}
              className="w-full rounded border border-[#40566D] bg-[#0F1C2E] px-3 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2FB1A5]"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={saving || selectedStatus === ticket.status}
              className="w-full rounded bg-[#2FB1A5] px-4 py-2 text-sm font-semibold text-[#0F1C2E] hover:bg-[#66D4C8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save status'}
            </button>
            {saveError && <p role="alert" className="text-sm text-red-300">{saveError}</p>}
            {saveMessage && <p role="status" className="text-sm text-[#66D4C8]">{saveMessage}</p>}
          </form>
        </aside>
      </div>
    </section>
  )
}

function TicketMessage({ message, role = 'alert' }: { message: string; role?: 'alert' | 'status' }) {
  return (
    <section className="space-y-5">
      <Link to="/tickets" className="text-sm font-medium text-teal-700 hover:underline">
        Back to tickets
      </Link>
      <p role={role} className="rounded-md border border-slate-200 bg-white px-5 py-6 text-slate-700">
        {message}
      </p>
    </section>
  )
}

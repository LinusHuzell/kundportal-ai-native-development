import { useId, useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { api } from '../../api/client'
import { STATUS_LABELS, TICKET_STATUSES, type Ticket, type TicketStatus } from '../../types/ticket'

const CHOOSE_NEW_STATUS = 'Välj en ny status'
const SAVE_FAILED = 'Statusen kunde inte sparas. Försök igen.'

interface Props {
  ticket: Ticket
  /** Called with the ticket from the server after the status is saved. */
  onSaved: (ticket: Ticket) => void
}

/** The status list and "Spara status" (AK-7, AK-8, AK-10 to AK-12). */
export default function StatusForm({ ticket, onSaved }: Props) {
  const id = useId()
  const selectRef = useRef<HTMLSelectElement>(null)
  const savingRef = useRef(false)
  const [status, setStatus] = useState<TicketStatus>(ticket.status)
  const [saving, setSaving] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saveError, setSaveError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (savingRef.current) return // AK-11: ignore new attempts while a save is in progress.
    setFieldError('')
    setConfirmation('')
    setSaveError('')

    if (status === 'New') {
      // AK-10: render the error before moving focus, so the list is announced with it.
      flushSync(() => setFieldError(CHOOSE_NEW_STATUS))
      selectRef.current?.focus()
      return
    }

    savingRef.current = true
    setSaving(true)
    try {
      const updated = await api.updateTicketStatus(ticket.id, status)
      onSaved(updated)
      setConfirmation(`Status ändrad till ${STATUS_LABELS[updated.status]}`)
    } catch {
      setSaveError(SAVE_FAILED)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-3">
      <div>
        <label htmlFor={`${id}-status`} className="block text-sm font-medium text-slate-900">
          Status
        </label>
        <select
          ref={selectRef}
          id={`${id}-status`}
          value={status}
          onChange={(event) => setStatus(event.target.value as TicketStatus)}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? `${id}-status-error` : undefined}
          className="mt-1 block w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none aria-invalid:border-red-700 aria-invalid:ring-red-700"
        >
          {TICKET_STATUSES.map((value) => (
            <option key={value} value={value} disabled={value === 'New'}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        {fieldError && (
          <p id={`${id}-status-error`} className="mt-1 text-sm text-red-700">
            {fieldError}
          </p>
        )}
      </div>

      {/* aria-disabled instead of disabled, so the button keeps focus while saving (AK-8, AK-11). */}
      <button
        type="submit"
        aria-disabled={saving ? true : undefined}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none aria-disabled:cursor-not-allowed aria-disabled:bg-slate-500"
      >
        {saving ? 'Sparar…' : 'Spara status'}
      </button>

      {/* Always rendered so screen readers announce the text when it is set. */}
      <p role="status" className="text-sm text-slate-900">
        {confirmation}
      </p>
      <p
        role="alert"
        className={saveError ? 'rounded-md bg-red-50 px-3 py-2 text-sm text-red-800' : ''}
      >
        {saveError}
      </p>
    </form>
  )
}

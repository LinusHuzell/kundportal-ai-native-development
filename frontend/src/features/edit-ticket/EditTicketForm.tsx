import {
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type Ref,
} from 'react'
import { flushSync } from 'react-dom'
import { api } from '../../api/client'
import SaveIcon from '../../components/SaveIcon'
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type Ticket,
} from '../../types/ticket'
import type {
  CreateTicketFieldErrors,
  CreateTicketFormValues,
} from '../create-ticket/validateTicket'
import {
  firstFieldWithError,
  saveTicketEdit,
  toFormValues,
  type EditField,
  type SaveResult,
} from './editTicket'
import { hasChanges } from './hasChanges'
import { ignoreWhilePending } from './ignoreWhilePending'

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

const SAVE_FAILED = 'Ärendet kunde inte sparas. Försök igen.'

// Same tokens as CreateTicketDrawer and StatusForm (B2 decision 11).
const inputClass =
  'mt-1 block w-full rounded-md border border-[#7E8B9A] bg-portal px-3 py-2 text-sm text-white ' +
  'focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal ' +
  'aria-invalid:border-[#FCA5A5] aria-invalid:ring-[#FCA5A5]'

/** Lets the parent save from outside the form, e.g. from the unsaved-changes dialog (AK-10). */
export interface EditTicketFormHandle {
  /**
   * Runs the same save as "Spara ändringar", including errors on the fields and focus (AK-2,
   * AK-12). Resolves to undefined when ignored because a save is already pending (AK-13).
   */
  save: () => Promise<SaveResult | undefined>
}

interface Props {
  /** The saved ticket. Read on mount only, so render with key={ticket.id}. */
  ticket: Ticket
  /** Called with the ticket from the server after a successful save. */
  onSaved: (ticket: Ticket) => void
  /** Called on "Avbryt". Nothing is sent. */
  onCancel: () => void
  /** Called with whether any field differs from the saved ticket, and again when that changes. */
  onDirtyChange: (isDirty: boolean) => void
  ref?: Ref<EditTicketFormHandle>
}

/**
 * Edits the six fields of an existing ticket. The parent owns focus after save or cancel,
 * so this component only moves focus inside itself.
 */
export default function EditTicketForm({
  ticket,
  onSaved,
  onCancel,
  onDirtyChange,
  ref,
}: Props) {
  const fieldRefs = useRef<Partial<Record<EditField, FieldElement | null>>>({})
  const [values, setValues] = useState<CreateTicketFormValues>(() => toFormValues(ticket))
  const [errors, setErrors] = useState<CreateTicketFieldErrors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const id = useId()

  // Keep the latest callback without re-running the effect below when the parent re-renders.
  const onDirtyChangeRef = useRef(onDirtyChange)
  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange
  })

  const isDirty = hasChanges(ticket, values)
  useEffect(() => {
    onDirtyChangeRef.current(isDirty)
  }, [isDirty])

  useEffect(() => {
    fieldRefs.current.title?.focus()
  }, [])

  // AK-13: a new "Spara ändringar" while a save is pending is ignored.
  const save = useMemo(
    () =>
      ignoreWhilePending((formValues: CreateTicketFormValues) =>
        saveTicketEdit(ticket.id, formValues, api.updateTicket),
      ),
    [ticket.id],
  )

  const showFieldErrors = (fieldErrors: CreateTicketFieldErrors) => {
    // Render the errors before moving focus, so the field is announced with its error (AK-12).
    flushSync(() => setErrors(fieldErrors))
    const first = firstFieldWithError(fieldErrors)
    if (first) fieldRefs.current[first]?.focus()
  }

  const submit = async (): Promise<SaveResult | undefined> => {
    const pending = save(values)
    setSaving(true)
    const result = await pending
    if (!result) return undefined // AK-13: a save is already pending.
    setSaving(false)

    if (result.kind === 'saved') {
      setErrors({})
      setFormError('')
      onSaved(result.ticket)
    } else if (result.kind === 'invalid') {
      setFormError('')
      showFieldErrors(result.errors)
    } else {
      setErrors({})
      setFormError(SAVE_FAILED)
    }
    return result
  }

  useImperativeHandle(ref, () => ({ save: submit }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit()
  }

  const fieldProps = (field: EditField) => {
    const error = errors[field]
    return {
      id: `${id}-${field}`,
      name: field,
      value: values[field],
      required: true,
      ref: (element: FieldElement | null) => {
        fieldRefs.current[field] = element
      },
      onChange: (event: { target: { value: string } }) =>
        setValues((current) => ({ ...current, [field]: event.target.value })),
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${id}-${field}-error` : undefined,
      className: inputClass,
    }
  }

  const label = (field: EditField, text: string) => (
    <label htmlFor={`${id}-${field}`} className="block text-sm font-medium text-copy-muted">
      {text}
    </label>
  )

  const errorText = (field: EditField) =>
    errors[field] ? (
      <p id={`${id}-${field}-error`} className="mt-1 text-sm text-[#FCA5A5]">
        {errors[field]}
      </p>
    ) : null

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {/* Always rendered, so screen readers announce the message when it appears. */}
      <div
        role="alert"
        className={formError ? 'rounded-md bg-red-600/20 px-3 py-2 text-sm text-[#FCA5A5]' : ''}
      >
        {formError}
      </div>

      <div>
        {label('title', 'Rubrik')}
        <input type="text" {...fieldProps('title')} />
        {errorText('title')}
      </div>

      <div>
        {label('description', 'Beskrivning')}
        <textarea rows={5} {...fieldProps('description')} />
        {errorText('description')}
      </div>

      <div>
        {label('category', 'Kategori')}
        <select {...fieldProps('category')}>
          {TICKET_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
        {errorText('category')}
      </div>

      <div>
        {label('priority', 'Prioritet')}
        <select {...fieldProps('priority')}>
          {TICKET_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
        {errorText('priority')}
      </div>

      <div>
        {label('customerName', 'Namn')}
        <input type="text" autoComplete="off" {...fieldProps('customerName')} />
        {errorText('customerName')}
      </div>

      <div>
        {label('customerEmail', 'E-postadress')}
        <input type="email" autoComplete="off" {...fieldProps('customerEmail')} />
        {errorText('customerEmail')}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-portal hover:bg-[#4CC5BA] focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 focus:ring-offset-panel"
        >
          <SaveIcon className="size-4 shrink-0" />
          Spara ändringar
        </button>
        {/* B2 decision 8: "Avbryt" cannot be chosen while a save is pending. */}
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-md border border-[#7E8B9A] px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 focus:ring-offset-panel disabled:cursor-not-allowed disabled:opacity-50"
        >
          Avbryt
        </button>
      </div>
    </form>
  )
}

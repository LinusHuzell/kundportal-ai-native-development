import { useEffect, useId, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { flushSync } from 'react-dom'
import { ApiError, api } from '../../api/client'
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type CreateTicketInput,
} from '../../types/ticket'
import {
  validateTicket,
  type CreateTicketFieldErrors,
  type CreateTicketFormValues,
} from './validateTicket'

type Field = keyof CreateTicketFormValues
type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

// Form order, used to find the first field with an error (AK-11).
const FIELD_ORDER: Field[] = [
  'title',
  'description',
  'category',
  'priority',
  'customerName',
  'customerEmail',
]

const EMPTY_FORM: CreateTicketFormValues = {
  title: '',
  description: '',
  category: '',
  priority: 'Medium',
  customerName: '',
  customerEmail: '',
}

const SAVE_FAILED = 'Ärendet kunde inte sparas. Försök igen.'

const inputClass =
  'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ' +
  'focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 ' +
  'aria-invalid:border-red-700 aria-invalid:ring-red-700'

interface Props {
  /** Called when the drawer has closed, by Esc, "Stäng" or a successful save. */
  onClose: () => void
  /** Called after the server has saved the ticket, before the drawer closes. */
  onSaved: () => void
}

/**
 * The "Registrera ärende" form in a native modal <dialog> (AK-7). Mount it to open it and
 * unmount it after onClose; unmounting is what empties the form (AK-8, AK-9).
 */
export default function CreateTicketDrawer({ onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fieldRefs = useRef<Partial<Record<Field, FieldElement | null>>>({})
  const savingRef = useRef(false)
  const [values, setValues] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<CreateTicketFieldErrors>({})
  const [formError, setFormError] = useState('')
  const id = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const close = () => dialogRef.current?.close()

  // A click outside the drawer lands on the backdrop, which belongs to the <dialog> itself (AK-8).
  // Check the position as well, since a click on an empty part of the drawer has the same target.
  // Both press and release must be outside, so selecting text and releasing outside does not close.
  const isOnBackdrop = (event: PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current
    if (!dialog || event.target !== dialog) return false
    const box = dialog.getBoundingClientRect()
    return (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
  }
  const pressedOnBackdrop = useRef(false)

  const showFieldErrors = (fieldErrors: CreateTicketFieldErrors) => {
    // Render the errors before moving focus, so the field is announced with its error.
    flushSync(() => setErrors(fieldErrors))
    const first = FIELD_ORDER.find((field) => fieldErrors[field])
    if (first) fieldRefs.current[first]?.focus()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (savingRef.current) return // AK-12: ignore new attempts while a save is in progress.
    setFormError('')

    const validationErrors = validateTicket(values)
    if (Object.keys(validationErrors).length > 0) {
      showFieldErrors(validationErrors)
      return
    }

    savingRef.current = true
    try {
      // validateTicket has checked that category and priority are allowed values.
      await api.createTicket(values as CreateTicketInput)
      onSaved()
      close()
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        showFieldErrors(error.fieldErrors)
      } else {
        setErrors({})
        setFormError(SAVE_FAILED)
      }
    } finally {
      savingRef.current = false
    }
  }

  const fieldProps = (field: Field) => {
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

  const label = (field: Field, text: string) => (
    <label htmlFor={`${id}-${field}`} className="block text-sm font-medium text-slate-900">
      {text}
    </label>
  )

  const errorText = (field: Field) =>
    errors[field] ? (
      <p id={`${id}-${field}-error`} className="mt-1 text-sm text-red-700">
        {errors[field]}
      </p>
    ) : null

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-heading`}
      onClose={onClose}
      onPointerDown={(event) => {
        pressedOnBackdrop.current = isOnBackdrop(event)
      }}
      onPointerUp={(event) => {
        if (pressedOnBackdrop.current && isOnBackdrop(event)) close()
        pressedOnBackdrop.current = false
      }}
      className="my-0 mr-0 ml-auto h-full max-h-none w-full max-w-md overflow-y-auto bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 id={`${id}-heading`} className="text-lg font-semibold">
          Registrera ärende
        </h2>
        <button
          type="button"
          aria-label="Stäng"
          onClick={close}
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="size-5"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
        <div
          role="alert"
          className={formError ? 'rounded-md bg-red-50 px-3 py-2 text-sm text-red-800' : ''}
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
            <option value="" disabled>
              Välj kategori
            </option>
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
          <input type="text" autoComplete="name" {...fieldProps('customerName')} />
          {errorText('customerName')}
        </div>

        <div>
          {label('customerEmail', 'E-postadress')}
          <input type="email" autoComplete="email" {...fieldProps('customerEmail')} />
          {errorText('customerEmail')}
        </div>

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          Spara ärende
        </button>
      </form>
    </dialog>
  )
}

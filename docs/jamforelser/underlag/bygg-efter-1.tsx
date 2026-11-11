import { useId, useRef, useState, type FormEvent } from 'react'

export type NoteStatus = 'Ny' | 'Läst'

export type CustomerNote = {
  id: string
  text: string
  status: NoteStatus
}

type CustomerNotesProps = {
  initialNotes?: CustomerNote[]
}

const EMPTY_NOTE_ERROR = 'Anteckningen får inte vara tom'

const statusClass: Record<NoteStatus, string> = {
  Ny: 'border-blue-300 bg-blue-50 text-blue-900',
  Läst: 'border-slate-300 bg-slate-100 text-slate-700',
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

export default function CustomerNotes({ initialNotes = [] }: CustomerNotesProps) {
  const [notes, setNotes] = useState<CustomerNote[]>(initialNotes)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const baseId = useId()
  const headingId = `${baseId}-heading`
  const fieldId = `${baseId}-field`
  const errorId = `${baseId}-error`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (text === '') {
      setError(EMPTY_NOTE_ERROR)
      textareaRef.current?.focus()
      return
    }
    setNotes((current) => [...current, { id: crypto.randomUUID(), text, status: 'Ny' }])
    setDraft('')
    setError(null)
  }

  function handleDelete(id: string) {
    setNotes((current) => current.filter((note) => note.id !== id))
    // The focused button disappears with its note, so move focus somewhere predictable.
    textareaRef.current?.focus()
  }

  return (
    <section aria-labelledby={headingId} className="mt-8">
      <h2 id={headingId} className="text-lg font-semibold">
        Anteckningar
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-3 flex flex-col gap-2">
        <label htmlFor={fieldId} className="text-sm font-medium">
          Ny anteckning
        </label>
        <textarea
          ref={textareaRef}
          id={fieldId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`rounded border bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
            error ? 'border-red-700' : 'border-slate-300'
          }`}
        />
        <p id={errorId} role="alert" className="min-h-5 text-sm text-red-700">
          {error}
        </p>
        <div>
          <button
            type="submit"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Spara
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Inga anteckningar än.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-3 rounded border border-slate-200 bg-white p-3"
            >
              <div className="flex flex-col gap-1">
                <span
                  className={`w-fit rounded border px-2 py-0.5 text-xs font-medium ${statusClass[note.status]}`}
                >
                  {note.status}
                </span>
                <p className="whitespace-pre-wrap break-words">{note.text}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                aria-label={`Ta bort anteckning: ${note.text.length > 40 ? `${note.text.slice(0, 40)}…` : note.text}`}
                className="shrink-0 rounded p-2 text-slate-700 hover:bg-slate-100 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

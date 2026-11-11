import { useId, useRef, useState, type FormEvent } from 'react'

export type NoteStatus = 'Ny' | 'Läst'

export interface CustomerNote {
  id: string
  text: string
  status: NoteStatus
}

export const EMPTY_NOTE_ERROR = 'Anteckningen får inte vara tom'

const statusClass: Record<NoteStatus, string> = {
  Ny: 'bg-blue-100 text-blue-900 ring-blue-300',
  Läst: 'bg-slate-100 text-slate-800 ring-slate-300',
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
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function excerpt(text: string, max = 40) {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export default function CustomerNotes() {
  const [notes, setNotes] = useState<CustomerNote[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const headingId = useId()
  const fieldId = useId()
  const errorId = useId()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (text === '') {
      setError(EMPTY_NOTE_ERROR)
      setAnnouncement('')
      textareaRef.current?.focus()
      return
    }
    setNotes((current) => [...current, { id: crypto.randomUUID(), text, status: 'Ny' }])
    setDraft('')
    setError(null)
    setAnnouncement('Anteckningen sparades')
  }

  function handleDelete(note: CustomerNote) {
    setNotes((current) => current.filter((n) => n.id !== note.id))
    setAnnouncement('Anteckningen togs bort')
    // The focused button disappears; move focus somewhere predictable.
    textareaRef.current?.focus()
  }

  return (
    <section lang="sv" aria-labelledby={headingId} className="mt-8">
      <h2 id={headingId} className="text-lg font-semibold">
        Kundanteckningar
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-3 flex flex-col gap-2">
        <label htmlFor={fieldId} className="text-sm font-medium">
          Anteckning
        </label>
        <textarea
          ref={textareaRef}
          id={fieldId}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            if (error) setError(null)
          }}
          rows={3}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`rounded border bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
            error ? 'border-red-700' : 'border-slate-400'
          }`}
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div>
          <button
            type="submit"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Spara
          </button>
        </div>
      </form>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      {notes.length > 0 && (
        <ul aria-label="Sparade anteckningar" className="mt-4 flex flex-col gap-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start gap-3 rounded border border-slate-200 bg-white p-3"
            >
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ring-1 ${statusClass[note.status]}`}
              >
                {note.status}
              </span>
              <p className="flex-1 whitespace-pre-wrap break-words">{note.text}</p>
              <button
                type="button"
                onClick={() => handleDelete(note)}
                aria-label={`Ta bort anteckning: ${excerpt(note.text)}`}
                className="shrink-0 rounded p-1.5 text-slate-700 hover:bg-slate-100 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
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

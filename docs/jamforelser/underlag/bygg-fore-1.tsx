import { useId, useRef, useState, type FormEvent } from 'react'

type NoteStatus = 'Ny' | 'Läst'

type Note = {
  id: number
  text: string
  status: NoteStatus
}

const EMPTY_NOTE_ERROR = 'Anteckningen får inte vara tom'

const badgeClass: Record<NoteStatus, string> = {
  Ny: 'bg-blue-100 text-blue-800',
  Läst: 'bg-slate-200 text-slate-700',
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

export default function CustomerNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const nextId = useRef(1)

  const textareaId = useId()
  const errorId = useId()
  const headingId = useId()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (text === '') {
      setError(EMPTY_NOTE_ERROR)
      return
    }
    setNotes((current) => [...current, { id: nextId.current++, text, status: 'Ny' }])
    setDraft('')
    setError(null)
  }

  function handleDelete(id: number) {
    setNotes((current) => current.filter((note) => note.id !== id))
  }

  return (
    <section aria-labelledby={headingId} className="mt-8">
      <h2 id={headingId} className="text-lg font-semibold">
        Anteckningar
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-3 flex flex-col gap-2">
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-700">
          Ny anteckning
        </label>
        <textarea
          id={textareaId}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            if (error) setError(null)
          }}
          rows={3}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`rounded border bg-white px-3 py-2 text-sm ${
            error ? 'border-red-600' : 'border-slate-300'
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
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Spara
          </button>
        </div>
      </form>

      {notes.length > 0 && (
        <ul className="mt-6 flex flex-col gap-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start gap-3 rounded border border-slate-200 bg-white px-3 py-2"
            >
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass[note.status]}`}
              >
                {note.status}
              </span>
              <p className="flex-1 text-sm whitespace-pre-wrap break-words">{note.text}</p>
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                aria-label="Ta bort anteckning"
                title="Ta bort anteckning"
                className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-red-700"
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

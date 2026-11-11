import { useId, useState, type FormEvent } from 'react'

type NoteStatus = 'Ny' | 'Läst'

type Note = {
  id: string
  text: string
  status: NoteStatus
}

const EMPTY_NOTE_ERROR = 'Anteckningen får inte vara tom'

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
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function StatusBadge({ status }: { status: NoteStatus }) {
  const colors = status === 'Ny' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
  return (
    <span className={`self-start rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
      {status}
    </span>
  )
}

export default function CustomerNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const textareaId = useId()
  const errorId = useId()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (text === '') {
      setError(EMPTY_NOTE_ERROR)
      return
    }
    setNotes((current) => [...current, { id: crypto.randomUUID(), text, status: 'Ny' }])
    setDraft('')
    setError(null)
  }

  function handleDelete(id: string) {
    setNotes((current) => current.filter((note) => note.id !== id))
  }

  return (
    <section aria-labelledby={`${textareaId}-heading`} className="mt-8">
      <h2 id={`${textareaId}-heading`} className="text-lg font-semibold">
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
          className="rounded border border-slate-300 bg-white p-2 text-sm focus:outline-2 focus:outline-slate-900"
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div>
          <button
            type="submit"
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Spara
          </button>
        </div>
      </form>

      {notes.length > 0 && (
        <ul aria-label="Sparade anteckningar" className="mt-4 flex flex-col gap-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-3 rounded border border-slate-200 bg-white p-3"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <StatusBadge status={note.status} />
                <p className="text-sm break-words whitespace-pre-wrap">{note.text}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                aria-label="Ta bort anteckning"
                title="Ta bort anteckning"
                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-red-700"
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

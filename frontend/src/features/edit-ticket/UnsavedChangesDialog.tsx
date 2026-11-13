import { useEffect, useId, useRef } from 'react'

interface Props {
  /** "Spara": save the changes, then show the newly selected ticket. */
  onSave: () => void
  /** "Släng ändringar": show the newly selected ticket without saving. */
  onDiscard: () => void
  /** "Fortsätt redigera" or Esc: close the dialog and keep editing. */
  onContinue: () => void
}

const secondaryButtonClass =
  'rounded-md border border-[#7E8B9A] px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 ' +
  'focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 focus:ring-offset-panel'

/**
 * Asks what to do with unsaved changes when another ticket is selected (AK-10). A native modal
 * <dialog>: mount it to open it, and unmount it after a choice. Each choice closes the dialog
 * first, so the browser returns focus to where it was before the dialog opened.
 */
export default function UnsavedChangesDialog({ onSave, onDiscard, onContinue }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const saveRef = useRef<HTMLButtonElement>(null)
  const id = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    saveRef.current?.focus()
  }, [])

  const chosen = useRef(false)
  const choose = (handler: () => void) => () => {
    chosen.current = true
    dialogRef.current?.close()
    handler()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-text`}
      onClose={() => {
        // Closed without a choice, i.e. by Esc: that means "Fortsätt redigera".
        if (!chosen.current) onContinue()
      }}
      className="m-auto w-full max-w-md rounded-[7px] border border-line bg-panel p-6 text-white shadow-xl backdrop:bg-black/60"
    >
      <h2 id={`${id}-heading`} className="text-lg font-semibold">
        Osparade ändringar
      </h2>
      <p id={`${id}-text`} className="mt-2 text-sm text-copy-muted">
        Du har ändringar som inte är sparade.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          ref={saveRef}
          type="button"
          onClick={choose(onSave)}
          className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-portal hover:bg-[#4CC5BA] focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 focus:ring-offset-panel"
        >
          Spara
        </button>
        <button type="button" onClick={choose(onDiscard)} className={secondaryButtonClass}>
          Släng ändringar
        </button>
        <button type="button" onClick={choose(onContinue)} className={secondaryButtonClass}>
          Fortsätt redigera
        </button>
      </div>
    </dialog>
  )
}

import type { ReactNode } from 'react'
import type { TicketStatus } from '../types/ticket'

const statusIcons: Record<TicketStatus, ReactNode> = {
  New: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8m-4-4h8" /></>,
  InProgress: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  WaitingForCustomer: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-.9L3 21l1.9-5.5a8.5 8.5 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></>,
  Closed: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
}

interface Props {
  status: TicketStatus
  className?: string
}

export default function TicketStatusIcon({ status, className }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {statusIcons[status]}
    </svg>
  )
}
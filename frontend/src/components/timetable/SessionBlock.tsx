import type { CSSProperties } from "react"
import type { Session } from "@/lib/types"
import { BUILDINGS, LECTURERS, ROOMS } from "@/lib/mockData"
import { formatRange } from "@/lib/time"
import { cn } from "@/lib/utils"

// Colour = phase, so a glance at a day shows who has to cross the campus.
const phaseStyles = {
  phase1: "border-l-sky-500 bg-sky-50 text-sky-950 dark:bg-sky-950/40 dark:text-sky-100",
  phase2: "border-l-teal-500 bg-teal-50 text-teal-950 dark:bg-teal-950/40 dark:text-teal-100",
} as const

interface Props {
  session: Session
  style: CSSProperties
  compact: boolean
  onClick?: () => void
}

export default function SessionBlock({ session, style, compact, onClick }: Props) {
  const room = ROOMS.find((r) => r.id === session.roomId)
  const phaseId = BUILDINGS.find((b) => b.id === room?.buildingId)?.phaseId ?? "phase1"
  const lecturer = LECTURERS.find((l) => l.id === session.lecturerId)
  const range = formatRange(session.start, session.end)

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      title={`${session.course} · ${room?.name} · ${lecturer?.name} · ${range}`}
      className={cn(
        "absolute flex flex-col items-stretch justify-start overflow-hidden rounded-md border border-l-4 px-2 py-1 text-left text-xs leading-tight",
        phaseStyles[phaseId],
        onClick
          ? "cursor-pointer hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          : "cursor-default"
      )}
    >
      <div className="truncate font-medium">{session.course}</div>
      {!compact && (
        <>
          <div className="truncate opacity-80">
            {room?.name} · {lecturer?.name}
          </div>
          <div className="tabular-nums opacity-70">{range}</div>
        </>
      )}
    </button>
  )
}
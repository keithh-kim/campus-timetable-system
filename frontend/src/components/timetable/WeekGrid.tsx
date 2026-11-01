import type { Session } from "@/lib/types"
import { addDays, parseDate, toMinutes, today } from "@/lib/time"
import { cn } from "@/lib/utils"
import SessionBlock from "./SessionBlock"

const START_HOUR = 8
const END_HOUR = 18
const HOUR_PX = 64
const PX_PER_MIN = HOUR_PX / 60
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
const BODY_HEIGHT = (END_HOUR - START_HOUR) * HOUR_PX

interface Props {
  weekStart: string
  sessions: Session[]
  onSelect?: (session: Session) => void
}

// Sessions in different rooms can run at the same time, so overlapping
// blocks are placed side by side in "lanes" instead of stacking on top of each other.
function layoutDay(daySessions: Session[]) {
  const sorted = [...daySessions].sort(
    (a, b) => toMinutes(a.start) - toMinutes(b.start) || toMinutes(a.end) - toMinutes(b.end)
  )
  const placed: { session: Session; lane: number; lanes: number }[] = []

  let cluster: { session: Session; lane: number }[] = []
  let laneEnds: number[] = []
  let clusterEnd = 0

  const flush = () => {
    const lanes = laneEnds.length
    cluster.forEach((c) => placed.push({ ...c, lanes }))
    cluster = []
    laneEnds = []
    clusterEnd = 0
  }

  for (const session of sorted) {
    const start = toMinutes(session.start)
    const end = toMinutes(session.end)
    if (cluster.length > 0 && start >= clusterEnd) flush()

    let lane = laneEnds.findIndex((e) => e <= start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[lane] = end
    }
    cluster.push({ session, lane })
    clusterEnd = Math.max(clusterEnd, end)
  }
  flush()

  return placed
}

export default function WeekGrid({ weekStart, sessions, onSelect }: Props) {
  const todayDate = today()

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="min-w-[720px]">
        {/* Day headers */}
        <div className="grid grid-cols-[3.5rem_repeat(5,1fr)] border-b bg-muted/40 text-sm">
          <div />
          {DAYS.map((day, i) => {
            const date = addDays(weekStart, i)
            const isToday = date === todayDate
            return (
              <div key={day} className="flex items-baseline gap-1.5 border-l px-3 py-2">
                <span className={cn("text-muted-foreground", isToday && "font-medium text-foreground")}>
                  {day}
                </span>
                <span
                  className={cn(
                    "tabular-nums",
                    isToday
                      ? "rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground"
                      : "font-medium"
                  )}
                >
                  {parseDate(date).getDate()}
                </span>
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div className="relative grid grid-cols-[3.5rem_repeat(5,1fr)]">
          {/* Hour labels */}
          <div className="relative" style={{ height: BODY_HEIGHT }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-2 text-[11px] tabular-nums text-muted-foreground"
                style={{ top: (h - START_HOUR) * HOUR_PX + 4 }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((day, i) => {
            const date = addDays(weekStart, i)
            const daySessions = sessions.filter((s) => s.date === date)

            return (
              <div key={day} className="relative overflow-hidden border-l" style={{ height: BODY_HEIGHT }}>
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-border/60"
                    style={{ top: (h - START_HOUR) * HOUR_PX }}
                  />
                ))}

                {layoutDay(daySessions).map(({ session, lane, lanes }) => {
                  const top = Math.max(0, (toMinutes(session.start) - START_HOUR * 60) * PX_PER_MIN)
                  const height = Math.max(
                    24,
                    (toMinutes(session.end) - toMinutes(session.start)) * PX_PER_MIN - 2
                  )
                  return (
                    <SessionBlock
                      key={session.id}
                      session={session}
                      compact={height < 52}
                      onClick={onSelect ? () => onSelect(session) : undefined}
                      style={{
                        top,
                        height,
                        left: `calc(${(lane / lanes) * 100}% + 2px)`,
                        width: `calc(${100 / lanes}% - 4px)`,
                      }}
                    />
                  )
                })}
              </div>
            )
          })}

          {sessions.length === 0 && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="rounded-md bg-background/90 px-3 py-1.5 text-sm text-muted-foreground">
                No sessions match these filters this week.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
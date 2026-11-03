import { useMemo, useState } from "react"
import RoomCard from "@/components/rooms/RoomCard"
import RoomFilters, { type RoomFilterState } from "@/components/rooms/RoomFilters"
import { findFreeRooms } from "@/lib/clash"
import { demoWeekStart } from "@/lib/mockData"
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  nowTime,
  parseDate,
  toMinutes,
  today,
  weekdayIndex,
} from "@/lib/time"
import { useSlotwise } from "@/store/SlotwiseContext"

// Start on "right now" during teaching hours; otherwise pick a sensible default
// (the timetable has no classes at weekends or outside 08:00 to 18:00).
function defaultDate() {
  return weekdayIndex(today()) >= 5 ? demoWeekStart() : today()
}

function defaultTime() {
  const now = nowTime()
  const minutes = toMinutes(now)
  return minutes >= DAY_START_HOUR * 60 && minutes < DAY_END_HOUR * 60 ? now : "10:00"
}

export default function RoomFinder() {
  const { sessions, campus } = useSlotwise()

  const [filters, setFilters] = useState<RoomFilterState>(() => ({
    date: defaultDate(),
    time: defaultTime(),
    phase: "all",
    minCapacity: "0",
  }))

  const free = useMemo(() => {
    if (!filters.date || !filters.time) return []
    return findFreeRooms(sessions, filters.date, filters.time, campus, {
      phaseId: filters.phase === "all" ? undefined : filters.phase,
      minCapacity: Number(filters.minCapacity) || undefined,
    })
  }, [sessions, campus, filters])

  const dateLabel = filters.date
    ? parseDate(filters.date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "short",
      })
    : ""

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Find a free room</h2>
        <p className="text-sm text-muted-foreground">
          Handy for last-minute study spots, make-up classes and room swaps.
        </p>
      </div>

      <RoomFilters filters={filters} onChange={setFilters} />

      {filters.date && filters.time && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {free.length} of {campus.rooms.length} rooms
          </span>{" "}
          free at {filters.time} on {dateLabel}
        </p>
      )}

      {!filters.date || !filters.time ? (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          Pick a date and time to see which rooms are free.
        </div>
      ) : free.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center">
          <p className="text-sm font-medium">No rooms match</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another time, a different phase, or a smaller capacity.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {free.map(({ room, freeUntil }) => (
            <RoomCard key={room.id} room={room} freeUntil={freeUntil} />
          ))}
        </div>
      )}
    </div>
  )
}
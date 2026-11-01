import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import TimetableFilters, {
  type TimetableFilterState,
} from "@/components/timetable/TimetableFilters"
import WeekGrid from "@/components/timetable/WeekGrid"
import { BUILDINGS, ROOMS, demoWeekStart } from "@/lib/mockData"
import { addDays } from "@/lib/time"
import { useSlotwise } from "@/store/SlotwiseContext"

export default function Timetable() {
  const { sessions, role, resetDemo } = useSlotwise()
  const navigate = useNavigate()

  const [filters, setFilters] = useState<TimetableFilterState>({
    phase: "all",
    building: "all",
    lecturer: "all",
  })
  const [weekStart, setWeekStart] = useState(demoWeekStart)
  const weekEnd = addDays(weekStart, 4)
  const isOfficer = role === "officer"

  const visible = useMemo(
    () =>
      sessions.filter((s) => {
        // ISO date strings compare correctly as plain text
        if (s.date < weekStart || s.date > weekEnd) return false

        const room = ROOMS.find((r) => r.id === s.roomId)
        const building = BUILDINGS.find((b) => b.id === room?.buildingId)

        if (filters.phase !== "all" && building?.phaseId !== filters.phase) return false
        if (filters.building !== "all" && building?.id !== filters.building) return false
        if (filters.lecturer !== "all" && s.lecturerId !== filters.lecturer) return false
        return true
      }),
    [sessions, filters, weekStart, weekEnd]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TimetableFilters
          filters={filters}
          onFiltersChange={setFilters}
          weekStart={weekStart}
          onWeekChange={setWeekStart}
        />
        {isOfficer && (
          <Button asChild size="sm">
            <Link to="/schedule">
              <Plus className="size-4" />
              New Session
            </Link>
          </Button>
        )}
      </div>

      <WeekGrid
        weekStart={weekStart}
        sessions={visible}
        onSelect={isOfficer ? (s) => navigate(`/schedule/${s.id}`) : undefined}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-sky-500" /> Phase 1
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-teal-500" /> Phase 2
          </span>
          <span>
            {visible.length} session{visible.length === 1 ? "" : "s"} this week
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={resetDemo}>
          Reset demo data
        </Button>
      </div>
    </div>
  )
}
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PhaseId } from "@/lib/types"
import { BUILDINGS, COHORTS, LECTURERS, PHASES, demoWeekStart } from "@/lib/mockData"
import { addDays, parseDate } from "@/lib/time"

export type TimetableFilterState = {
  phase: "all" | PhaseId
  building: string
  lecturer: string
  cohort: string
}

interface Props {
  filters: TimetableFilterState
  onFiltersChange: (filters: TimetableFilterState) => void
  /** Students and lecturers see their own timetable, so these filters don't apply to them */
  showPeopleFilters: boolean
  weekStart: string
  onWeekChange: (weekStart: string) => void
}

const fmt = (date: string) =>
  parseDate(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })

export default function TimetableFilters({
  filters,
  onFiltersChange,
  showPeopleFilters,
  weekStart,
  onWeekChange,
}: Props) {
  // Only offer buildings that belong to the selected phase
  const buildings = BUILDINGS.filter(
    (b) => filters.phase === "all" || b.phaseId === filters.phase
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.phase}
        onValueChange={(v) =>
          onFiltersChange({ ...filters, phase: v as "all" | PhaseId, building: "all" })
        }
      >
        <SelectTrigger className="w-36" aria-label="Filter by phase">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All phases</SelectItem>
          {PHASES.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.building}
        onValueChange={(v) => onFiltersChange({ ...filters, building: v })}
      >
        <SelectTrigger className="w-44" aria-label="Filter by building">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All buildings</SelectItem>
          {buildings.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showPeopleFilters && (
        <>
          <Select
            value={filters.lecturer}
            onValueChange={(v) => onFiltersChange({ ...filters, lecturer: v })}
          >
            <SelectTrigger className="w-44" aria-label="Filter by lecturer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lecturers</SelectItem>
              {LECTURERS.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.cohort}
            onValueChange={(v) => onFiltersChange({ ...filters, cohort: v })}
          >
            <SelectTrigger className="w-44" aria-label="Filter by cohort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cohorts</SelectItem>
              {COHORTS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous week"
          onClick={() => onWeekChange(addDays(weekStart, -7))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-36 text-center text-sm tabular-nums">
          {fmt(weekStart)} – {fmt(addDays(weekStart, 4))}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next week"
          onClick={() => onWeekChange(addDays(weekStart, 7))}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onWeekChange(demoWeekStart())}>
          This week
        </Button>
      </div>
    </div>
  )
}
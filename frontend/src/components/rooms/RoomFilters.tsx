import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PhaseId } from "@/lib/types"
import { PHASES } from "@/lib/mockData"
import DatePicker from "@/components/schedule/DatePicker"

export type RoomFilterState = {
  date: string
  time: string
  phase: "all" | PhaseId
  minCapacity: string // "0" means any
}

interface Props {
  filters: RoomFilterState
  onChange: (filters: RoomFilterState) => void
}

const capacities = [
  { value: "0", label: "Any size" },
  { value: "30", label: "30+ seats" },
  { value: "50", label: "50+ seats" },
  { value: "80", label: "80+ seats" },
  { value: "100", label: "100+ seats" },
]

export default function RoomFilters({ filters, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="w-52 space-y-2">
        <Label htmlFor="rf-date">Date</Label>
        <DatePicker
          id="rf-date"
          value={filters.date}
          onChange={(date) => onChange({ ...filters, date })}
        />
      </div>

      <div className="w-32 space-y-2">
        <Label htmlFor="rf-time">Time</Label>
        <Input
          id="rf-time"
          type="time"
          step={300}
          value={filters.time}
          onChange={(e) => onChange({ ...filters, time: e.target.value })}
        />
      </div>

      <div className="w-36 space-y-2">
        <Label htmlFor="rf-phase">Phase</Label>
        <Select
          value={filters.phase}
          onValueChange={(v) => onChange({ ...filters, phase: v as "all" | PhaseId })}
        >
          <SelectTrigger id="rf-phase" className="w-full">
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
      </div>

      <div className="w-36 space-y-2">
        <Label htmlFor="rf-capacity">Capacity</Label>
        <Select
          value={filters.minCapacity}
          onValueChange={(v) => onChange({ ...filters, minCapacity: v })}
        >
          <SelectTrigger id="rf-capacity" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {capacities.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
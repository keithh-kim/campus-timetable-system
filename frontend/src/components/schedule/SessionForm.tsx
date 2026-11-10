import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SessionDraft } from "@/lib/types"
import { BUILDINGS, COHORTS, LECTURERS, PHASES } from "@/lib/mockData"
import { cn } from "@/lib/utils"
import { useSlotwise } from "@/store/SlotwiseContext"
import DatePicker from "./DatePicker"

interface Props {
  draft: SessionDraft
  onChange: (patch: Partial<SessionDraft>) => void
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

export default function SessionForm({ draft, onChange }: Props) {
  const { campus } = useSlotwise()

  const toggleCohort = (id: string) =>
    onChange({
      cohortIds: draft.cohortIds.includes(id)
        ? draft.cohortIds.filter((c) => c !== id)
        : [...draft.cohortIds, id],
    })

  const totalStudents = COHORTS.filter((c) => draft.cohortIds.includes(c.id)).reduce(
    (sum, c) => sum + c.size,
    0
  )

  return (
    <div className="space-y-5">
      <Field label="Course" htmlFor="course">
        <Input
          id="course"
          value={draft.course}
          onChange={(e) => onChange({ course: e.target.value })}
          placeholder="e.g. Software Engineering"
        />
      </Field>

      <Field label="Lecturer" htmlFor="lecturer">
        <Select value={draft.lecturerId} onValueChange={(v) => onChange({ lecturerId: v })}>
          <SelectTrigger id="lecturer" className="w-full">
            <SelectValue placeholder="Select lecturer" />
          </SelectTrigger>
          <SelectContent>
            {LECTURERS.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label id="cohorts-label">Cohorts</Label>
          <span className="text-xs text-muted-foreground">
            {draft.cohortIds.length > 1
              ? `Shared lecture · ${totalStudents} students`
              : "Pick more than one for a shared lecture"}
          </span>
        </div>
        <div role="group" aria-labelledby="cohorts-label" className="grid gap-2 sm:grid-cols-2">
          {COHORTS.map((c) => {
            const selected = draft.cohortIds.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleCohort(c.id)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted"
                )}
              >
                <span>{c.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{c.size} students</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Date" htmlFor="date">
          <DatePicker id="date" value={draft.date} onChange={(date) => onChange({ date })} />
        </Field>
        <Field label="Start" htmlFor="start">
          <Input
            id="start"
            type="time"
            step={300}
            value={draft.start}
            onChange={(e) => onChange({ start: e.target.value })}
          />
        </Field>
        <Field label="End" htmlFor="end">
          <Input
            id="end"
            type="time"
            step={300}
            value={draft.end}
            onChange={(e) => onChange({ end: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Room" htmlFor="room">
        <Select value={draft.roomId} onValueChange={(v) => onChange({ roomId: v })}>
          <SelectTrigger id="room" className="w-full">
            <SelectValue placeholder="Select room" />
          </SelectTrigger>
          <SelectContent>
            {BUILDINGS.map((b) => (
              <SelectGroup key={b.id}>
                <SelectLabel>
                  {b.name} · {PHASES.find((p) => p.id === b.phaseId)?.name}
                </SelectLabel>
                {campus.rooms.filter((r) => r.buildingId === b.id).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} · {r.capacity} seats
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}
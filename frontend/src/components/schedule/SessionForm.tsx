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
import { BUILDINGS, COHORTS, LECTURERS, PHASES, ROOMS } from "@/lib/mockData"
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

      <div className="grid gap-5 sm:grid-cols-2">
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

        <Field label="Cohort" htmlFor="cohort">
          <Select value={draft.cohortId} onValueChange={(v) => onChange({ cohortId: v })}>
            <SelectTrigger id="cohort" className="w-full">
              <SelectValue placeholder="Select cohort" />
            </SelectTrigger>
            <SelectContent>
              {COHORTS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} · {c.size} students
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
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
                {ROOMS.filter((r) => r.buildingId === b.id).map((r) => (
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
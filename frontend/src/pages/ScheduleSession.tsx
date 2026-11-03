import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Notice from "@/components/layout/Notice"
import CheckResults from "@/components/schedule/CheckResults"
import SessionForm from "@/components/schedule/SessionForm"
import { checkSessions } from "@/lib/clash"
import { makeDemoDrafts } from "@/lib/mockData"
import { describeChanges } from "@/lib/notifications"
import { applyFields, occurrenceDates, seriesTargets, type EditScope } from "@/lib/series"
import type { Session, SessionDraft, SessionFields } from "@/lib/types"
import { useSlotwise } from "@/store/SlotwiseContext"

const emptyDraft = (): SessionDraft => ({
  course: "",
  lecturerId: "",
  cohortIds: [],
  roomId: "",
  date: "",
  start: "",
  end: "",
})

const toFields = (draft: SessionDraft): SessionFields => ({
  course: draft.course.trim(),
  lecturerId: draft.lecturerId,
  cohortIds: draft.cohortIds,
  roomId: draft.roomId,
  date: draft.date,
  start: draft.start,
  end: draft.end,
})

const repeatOptions = [
  { value: "1", label: "Does not repeat" },
  { value: "4", label: "Weekly for 4 weeks" },
  { value: "8", label: "Weekly for 8 weeks" },
  { value: "12", label: "Weekly for 12 weeks" },
]

export default function ScheduleSession() {
  const { id } = useParams()
  const { role, sessions } = useSlotwise()

  if (role !== "officer") {
    return (
      <Notice
        title="Timetabling Officers only"
        text="Switch the role in the top bar to Timetabling Officer to create or edit sessions."
      />
    )
  }

  const existing = id ? sessions.find((s) => s.id === id) : undefined
  if (id && !existing) {
    return <Notice title="Session not found" text="It may have been cancelled or deleted." />
  }

  // key resets the form when moving between "new" and different sessions
  return <Editor key={id ?? "new"} existing={existing} />
}

function Editor({ existing }: { existing?: Session }) {
  const navigate = useNavigate()
  const { campus, sessions, addSessions, updateSessions, deleteSessions } = useSlotwise()

  const [draft, setDraft] = useState<SessionDraft>(() => (existing ? { ...existing } : emptyDraft()))
  const [repeatWeeks, setRepeatWeeks] = useState("1")
  const [scope, setScope] = useState<EditScope>("one")
  const patch = (p: Partial<SessionDraft>) => setDraft((d) => ({ ...d, ...p }))

  const loadDemo = (demo: SessionDraft) => {
    setDraft(demo)
    setRepeatWeeks("1")
  }

  const laterCount = existing ? seriesTargets(sessions, existing, "following").length - 1 : 0

  // Recomputed on every change; cheap with this much data
  const result = useMemo(() => {
    const fields = toFields(draft)
    const drafts: SessionDraft[] = existing
      ? seriesTargets(sessions, existing, scope).map((s) => applyFields(s, existing, fields))
      : occurrenceDates(fields.date, Number(repeatWeeks)).map((date) => ({ ...fields, date }))
    return checkSessions(drafts, sessions, campus)
  }, [draft, existing, scope, repeatWeeks, sessions, campus])

  const hasCourse = draft.course.trim().length > 0
  const canSave = hasCourse && result.complete && result.errors.length === 0

  const hint = !hasCourse || !result.complete
    ? "Fill in every field to enable saving."
    : result.errors.length > 0
      ? "Resolve the problems on the right to save."
      : result.warnings.length > 0
        ? "You can save, but check the warning first."
        : null

  const handleSave = () => {
    if (!canSave) return
    const fields = toFields(draft)
    if (existing) {
      const changed = describeChanges(existing, applyFields(existing, existing, fields), campus.rooms)
      updateSessions(existing.id, fields, scope)
      toast.success("Session updated", {
        description:
          changed.lines.length > 0
            ? "Affected users have been notified."
            : "Nothing changed, so nobody was notified.",
      })
    } else {
      const weeks = Number(repeatWeeks)
      addSessions(fields, weeks)
      toast.success("Session scheduled", {
        description: `${fields.course} · ${fields.date}${weeks > 1 ? ` · weekly for ${weeks} weeks` : ""}`,
      })
    }
    navigate("/timetable")
  }

  const handleDelete = () => {
    if (!existing) return
    deleteSessions(existing.id, scope)
    toast.success("Session cancelled", { description: "Affected users have been notified." })
    navigate("/timetable")
  }

  const demos = makeDemoDrafts()
  const cancellingLater = scope === "following" && laterCount > 0

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {existing ? "Edit session" : "New session"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Problems show up on the right as you fill the form in.
          </p>
        </div>

        {!existing && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Load demo:</span>
            <Button variant="outline" size="sm" onClick={() => loadDemo(demos.roomClash)}>
              Room clash
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadDemo(demos.travelWarning)}>
              Travel warning
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadDemo(demos.sharedLecture)}>
              Shared lecture
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadDemo(demos.allClear)}>
              All clear
            </Button>
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardContent className="space-y-6">
            <SessionForm draft={draft} onChange={patch} />

            {!existing && (
              <div className="space-y-2">
                <Label htmlFor="repeat">Repeat</Label>
                <Select value={repeatWeeks} onValueChange={setRepeatWeeks}>
                  <SelectTrigger id="repeat" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {repeatOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {laterCount > 0 && (
              <div className="space-y-2">
                <Label htmlFor="scope">This session repeats weekly</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as EditScope)}>
                  <SelectTrigger id="scope" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one">Change only this session</SelectItem>
                    <SelectItem value="following">
                      Change this and {laterCount} later session{laterCount === 1 ? "" : "s"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div>
                {existing && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="text-red-600 hover:text-red-600">
                        Delete session
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {cancellingLater ? "Cancel this and later sessions?" : "Cancel this session?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {existing.course}
                          {cancellingLater
                            ? ` and ${laterCount} later session${laterCount === 1 ? "" : "s"} in the series`
                            : ""}{" "}
                          will be removed from the timetable and affected users will be notified.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Cancel session</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <div className="flex items-center gap-3">
                {hint && <span className="hidden text-xs text-muted-foreground sm:inline">{hint}</span>}
                <Button variant="outline" onClick={() => navigate("/timetable")}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!canSave}>
                  {existing ? "Save changes" : "Save session"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <CheckResults result={result} onPickRoom={(roomId) => patch({ roomId })} />
      </div>
    </div>
  )
}

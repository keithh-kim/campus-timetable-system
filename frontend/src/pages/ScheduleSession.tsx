import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
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
import CheckResults from "@/components/schedule/CheckResults"
import SessionForm from "@/components/schedule/SessionForm"
import { checkSession } from "@/lib/clash"
import { makeDemoDrafts } from "@/lib/mockData"
import type { Session, SessionDraft } from "@/lib/types"
import { useSlotwise } from "@/store/SlotwiseContext"

const emptyDraft = (): SessionDraft => ({
  course: "",
  lecturerId: "",
  cohortId: "",
  roomId: "",
  date: "",
  start: "",
  end: "",
})

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-md space-y-3 pt-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button asChild variant="outline">
        <Link to="/timetable">Back to timetable</Link>
      </Button>
    </div>
  )
}

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
  const { sessions, addSession, updateSession, deleteSession } = useSlotwise()

  const [draft, setDraft] = useState<SessionDraft>(() => (existing ? { ...existing } : emptyDraft()))
  const patch = (p: Partial<SessionDraft>) => setDraft((d) => ({ ...d, ...p }))

  // Recomputed on every change; cheap with this much data
  const result = useMemo(() => checkSession(draft, sessions), [draft, sessions])

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
    const fields = {
      course: draft.course.trim(),
      lecturerId: draft.lecturerId,
      cohortId: draft.cohortId,
      roomId: draft.roomId,
      date: draft.date,
      start: draft.start,
      end: draft.end,
    }
    if (existing) {
      updateSession({ ...fields, id: existing.id })
      toast.success("Session updated", { description: "Affected users have been notified." })
    } else {
      addSession(fields)
      toast.success("Session scheduled", { description: `${fields.course} · ${fields.date}` })
    }
    navigate("/timetable")
  }

  const handleDelete = () => {
    if (!existing) return
    deleteSession(existing.id)
    toast.success("Session cancelled", { description: "Affected users have been notified." })
    navigate("/timetable")
  }

  const demos = makeDemoDrafts()

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
            <Button variant="outline" size="sm" onClick={() => setDraft(demos.roomClash)}>
              Room clash
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDraft(demos.travelWarning)}>
              Travel warning
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDraft(demos.allClear)}>
              All clear
            </Button>
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardContent className="space-y-6">
            <SessionForm draft={draft} onChange={patch} />

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
                        <AlertDialogTitle>Cancel this session?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {existing.course} will be removed from the timetable and affected
                          users will be notified.
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
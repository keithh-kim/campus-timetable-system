import type {
  AppNotification,
  NotificationKind,
  Room,
  Session,
  Viewer,
} from "./types"
import { COHORTS, LECTURERS } from "./mockData"
import { formatRange } from "./time"
import { newId } from "./utils"

// Simulated notification service: no email or SMS yet, but each notification
// records who it affects, so people only see the changes that concern them.

const unique = (ids: string[]) => [...new Set(ids)]

const roomName = (id: string, rooms: Room[]) => rooms.find((r) => r.id === id)?.name ?? id
const lecturerName = (id: string) => LECTURERS.find((l) => l.id === id)?.name ?? id
const cohortNames = (ids: string[]) =>
  ids.map((id) => COHORTS.find((c) => c.id === id)?.name ?? id).join(" + ")

const where = (s: Session, rooms: Room[]) =>
  `${roomName(s.roomId, rooms)}, ${s.date} ${formatRange(s.start, s.end)}`

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id) => b.includes(id))

const laterLine = (count: number, verb: string) =>
  count > 0 ? [`Also ${verb} ${count} later session${count === 1 ? "" : "s"} in this series.`] : []

function build(
  kind: NotificationKind,
  title: string,
  lines: string[],
  sessions: Session[]
): AppNotification {
  return {
    id: newId("n"),
    kind,
    title,
    lines,
    createdAt: new Date().toISOString(),
    sessionId: sessions[0].id,
    lecturerIds: unique(sessions.map((s) => s.lecturerId)),
    cohortIds: unique(sessions.flatMap((s) => s.cohortIds)),
    readBy: [],
  }
}

/** What an edit changed, as lines for a notification. No lines means nothing changed. */
export function describeChanges(
  old: Session,
  updated: Session,
  rooms: Room[]
): { moved: boolean; lines: string[] } {
  const moved =
    old.roomId !== updated.roomId ||
    old.date !== updated.date ||
    old.start !== updated.start ||
    old.end !== updated.end

  const lines: string[] = []
  if (moved) lines.push(`From: ${where(old, rooms)}`, `To: ${where(updated, rooms)}`)
  if (old.course !== updated.course) lines.push(`Course: ${old.course} → ${updated.course}`)
  if (old.lecturerId !== updated.lecturerId) {
    lines.push(`Lecturer: ${lecturerName(old.lecturerId)} → ${lecturerName(updated.lecturerId)}`)
  }
  if (!sameIds(old.cohortIds, updated.cohortIds)) {
    lines.push(`Cohorts: ${cohortNames(old.cohortIds)} → ${cohortNames(updated.cohortIds)}`)
  }
  return { moved, lines }
}

export function newSessionNotification(session: Session, weeks: number, rooms: Room[]): AppNotification {
  const repeat = weeks > 1 ? [`Repeats weekly for ${weeks} weeks.`] : []
  return build(
    "added",
    "New session scheduled",
    [`${session.course} · ${where(session, rooms)}`, ...repeat],
    [session]
  )
}

/** Tells the people on both sides of a change: a replaced lecturer needs to know too. */
export function updatedNotification(
  old: Session,
  updated: Session,
  laterCount: number,
  rooms: Room[]
): AppNotification | null {
  const { moved, lines } = describeChanges(old, updated, rooms)
  if (lines.length === 0) return null
  return build(
    moved ? "moved" : "changed",
    `${updated.course} ${moved ? "moved" : "updated"}`,
    [...lines, ...laterLine(laterCount, "affects")],
    [updated, old]
  )
}

export function cancelledNotification(session: Session, laterCount: number, rooms: Room[]): AppNotification {
  return build(
    "cancelled",
    "Session cancelled",
    [`${session.course} · ${where(session, rooms)}`, ...laterLine(laterCount, "cancels")],
    [session]
  )
}

// ---------- Who sees what ----------

/** Read state is per person, so one student reading a notification doesn't clear it for others. */
export function viewerKey(viewer: Viewer): string {
  if (viewer.role === "lecturer") return `lecturer:${viewer.lecturerId}`
  if (viewer.role === "student") return `student:${viewer.cohortId}`
  return "officer"
}

/** Officers see everything; lecturers and students only see what affects them. */
export function isForViewer(n: AppNotification, viewer: Viewer): boolean {
  if (viewer.role === "lecturer") return n.lecturerIds.includes(viewer.lecturerId)
  if (viewer.role === "student") return n.cohortIds.includes(viewer.cohortId)
  return true
}

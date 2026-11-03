import type {
  Building,
  CheckIssue,
  CheckResult,
  Cohort,
  PhaseId,
  Room,
  Session,
  SessionDraft,
} from "./types"
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  formatDate,
  formatRange,
  overlaps,
  toMinutes,
  toTime,
} from "./time"

/** Minimum gap needed between sessions in different phases. Validate with real walking times. */
export const TRAVEL_BUFFER_MIN = 15

export interface Campus {
  rooms: Room[]
  buildings: Building[]
  cohorts: Cohort[]
}

function phaseOf(roomId: string, campus: Campus): PhaseId | undefined {
  const room = campus.rooms.find((r) => r.id === roomId)
  return campus.buildings.find((b) => b.id === room?.buildingId)?.phaseId
}

const describe = (s: Session) => `${s.course} (${formatRange(s.start, s.end)})`

const sharedIds = (a: string[], b: string[]) => a.filter((id) => b.includes(id))

function cohortNames(ids: string[], campus: Campus): string {
  return ids.map((id) => campus.cohorts.find((c) => c.id === id)?.name ?? id).join(" + ")
}

function totalSize(ids: string[], campus: Campus): number {
  return ids.reduce((sum, id) => sum + (campus.cohorts.find((c) => c.id === id)?.size ?? 0), 0)
}

// Rooms big enough and free for every date (smallest room that fits first)
function alternativeRooms(drafts: SessionDraft[], sessions: Session[], campus: Campus): Room[] {
  const { roomId, cohortIds } = drafts[0]
  const size = totalSize(cohortIds, campus)
  return campus.rooms
    .filter(
      (r) =>
        r.id !== roomId &&
        r.capacity >= size &&
        drafts.every(
          (d) =>
            !sessions.some(
              (s) =>
                s.id !== d.id &&
                s.roomId === r.id &&
                s.date === d.date &&
                overlaps(d.start, d.end, s.start, s.end)
            )
        )
    )
    .sort((a, b) => a.capacity - b.capacity)
    .slice(0, 4)
}

/**
 * Check a draft session against existing sessions.
 * Pure function: no React, no storage. Easy to test and easy to explain.
 *
 * errors   → block saving (room / lecturer / cohort clash, capacity, bad times)
 * warnings → allow saving (tight cross-phase travel)
 */
export function checkSession(
  draft: SessionDraft,
  sessions: Session[],
  campus: Campus
): CheckResult {
  const result: CheckResult = {
    complete: false,
    errors: [],
    warnings: [],
    passed: [],
    suggestedRooms: [],
  }

  const { roomId, lecturerId, cohortIds, date, start, end } = draft
  if (!roomId || !lecturerId || cohortIds.length === 0 || !date || !start || !end) return result
  result.complete = true

  if (toMinutes(end) <= toMinutes(start)) {
    result.errors.push({ code: "TIME_ORDER", message: "End time must be after start time." })
    return result
  }

  const room = campus.rooms.find((r) => r.id === roomId)
  const allCohortsKnown = cohortIds.every((id) => campus.cohorts.some((c) => c.id === id))
  if (!room || !allCohortsKnown) {
    result.errors.push({ code: "INVALID_DATA", message: "Unknown room or cohort." })
    return result
  }

  if (toMinutes(start) < DAY_START_HOUR * 60 || toMinutes(end) > DAY_END_HOUR * 60) {
    result.errors.push({
      code: "OUT_OF_HOURS",
      message: `Sessions must run between ${toTime(DAY_START_HOUR * 60)} and ${toTime(DAY_END_HOUR * 60)}, the hours the timetable shows.`,
    })
  }

  // Same day, excluding the session being edited (so editing doesn't clash with itself)
  const others = sessions.filter((s) => s.id !== draft.id && s.date === date)
  const clashing = (s: Session) => overlaps(start, end, s.start, s.end)
  const shared = cohortIds.length > 1

  // 1. Room clash
  const roomClashes = others.filter((s) => s.roomId === roomId && clashing(s))
  for (const s of roomClashes) {
    result.errors.push({ code: "ROOM_CLASH", message: `${room.name} is already booked: ${describe(s)}.` })
  }
  if (roomClashes.length === 0) result.passed.push(`${room.name} is free`)

  // 2. Lecturer clash
  const lecturerClashes = others.filter((s) => s.lecturerId === lecturerId && clashing(s))
  for (const s of lecturerClashes) {
    result.errors.push({ code: "LECTURER_CLASH", message: `This lecturer is already teaching: ${describe(s)}.` })
  }
  if (lecturerClashes.length === 0) result.passed.push("Lecturer is available")

  // 3. Cohort clash (any one of the cohorts being busy is enough)
  const cohortClashes = others.filter((s) => sharedIds(cohortIds, s.cohortIds).length > 0 && clashing(s))
  for (const s of cohortClashes) {
    const busy = sharedIds(cohortIds, s.cohortIds)
    result.errors.push({
      code: "COHORT_CLASH",
      message: `${cohortNames(busy, campus)} already ${busy.length > 1 ? "have" : "has"}: ${describe(s)}.`,
    })
  }
  if (cohortClashes.length === 0) result.passed.push(shared ? "Cohorts have no clash" : "Cohort has no clash")

  // 4. Capacity (a shared lecture needs seats for every cohort together)
  const size = totalSize(cohortIds, campus)
  if (room.capacity < size) {
    const who = cohortNames(cohortIds, campus)
    result.errors.push({
      code: "CAPACITY",
      message: `${room.name} seats ${room.capacity} but ${who} ${shared ? `have ${size} students together` : `has ${size} students`}.`,
    })
  } else {
    result.passed.push(`Capacity OK (${size} of ${room.capacity} seats)`)
  }

  // 5. Cross-phase travel (checks BOTH directions: before and after the draft)
  const draftPhase = phaseOf(roomId, campus)
  let travelWarnings = 0
  for (const s of others) {
    const sameLecturer = s.lecturerId === lecturerId
    const sameCohort = sharedIds(cohortIds, s.cohortIds).length > 0
    if (!sameLecturer && !sameCohort) continue
    if (clashing(s)) continue // already reported as a clash

    const otherPhase = phaseOf(s.roomId, campus)
    if (!draftPhase || !otherPhase || draftPhase === otherPhase) continue

    // No overlap, so either the other session ends before we start, or starts after we end
    const gap =
      toMinutes(s.end) <= toMinutes(start)
        ? toMinutes(start) - toMinutes(s.end)
        : toMinutes(s.start) - toMinutes(end)

    if (gap < TRAVEL_BUFFER_MIN) {
      const who = [sameLecturer && "lecturer", sameCohort && "cohort"].filter(Boolean).join(" and ")
      result.warnings.push({
        code: "TRAVEL",
        message: `Only ${gap} min between ${describe(s)} and this session. The ${who} must change phase (about ${TRAVEL_BUFFER_MIN} min needed).`,
      })
      travelWarnings++
    }
  }
  if (travelWarnings === 0) result.passed.push("No tight cross-phase travel")

  // 6. Suggest alternatives when the room is taken or too small
  if (result.errors.some((e) => e.code === "ROOM_CLASH" || e.code === "CAPACITY")) {
    result.suggestedRooms = alternativeRooms([draft], sessions, campus)
  }

  return result
}

// An issue on every date is listed once; otherwise it names the dates it affects.
function mergeIssues(perDate: { date: string; issues: CheckIssue[] }[]): CheckIssue[] {
  const merged = new Map<string, { issue: CheckIssue; dates: string[] }>()
  for (const { date, issues } of perDate) {
    for (const issue of issues) {
      const entry = merged.get(issue.message) ?? { issue, dates: [] }
      entry.dates.push(date)
      merged.set(issue.message, entry)
    }
  }
  return [...merged.values()].map(({ issue, dates }) =>
    dates.length === perDate.length
      ? issue
      : { ...issue, message: `${dates.map(formatDate).join(", ")}: ${issue.message}` }
  )
}

/**
 * Check several drafts as one change, e.g. every week of a repeating session.
 * Sessions being edited are ignored so a series can't clash with its old self.
 */
export function checkSessions(
  drafts: SessionDraft[],
  sessions: Session[],
  campus: Campus
): CheckResult {
  const editing = new Set(drafts.map((d) => d.id))
  const remaining = sessions.filter((s) => !editing.has(s.id))
  const results = drafts.map((d) => checkSession(d, remaining, campus))
  if (results.length === 1) return results[0]

  const merged: CheckResult = {
    complete: results.every((r) => r.complete),
    errors: mergeIssues(results.map((r, i) => ({ date: drafts[i].date, issues: r.errors }))),
    warnings: mergeIssues(results.map((r, i) => ({ date: drafts[i].date, issues: r.warnings }))),
    passed: results[0].passed.filter((p) => results.every((r) => r.passed.includes(p))),
    suggestedRooms: [],
  }
  if (merged.errors.some((e) => e.code === "ROOM_CLASH" || e.code === "CAPACITY")) {
    merged.suggestedRooms = alternativeRooms(drafts, remaining, campus)
  }
  return merged
}

// ---------- Room Finder ----------

export interface FreeRoom {
  room: Room
  /** "HH:mm" of the next booking, or null if free for the rest of the day */
  freeUntil: string | null
}

export function findFreeRooms(
  sessions: Session[],
  date: string,
  time: string,
  campus: Campus,
  filters: { phaseId?: PhaseId; minCapacity?: number } = {}
): FreeRoom[] {
  const t = toMinutes(time)

  return campus.rooms
    .filter((room) => !filters.phaseId || phaseOf(room.id, campus) === filters.phaseId)
    .filter((room) => !filters.minCapacity || room.capacity >= filters.minCapacity)
    .flatMap((room) => {
      const today = sessions.filter((s) => s.roomId === room.id && s.date === date)

      // Busy if a session has started and not yet finished (end is exclusive)
      const busy = today.some((s) => toMinutes(s.start) <= t && t < toMinutes(s.end))
      if (busy) return []

      const next = today
        .filter((s) => toMinutes(s.start) > t)
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))[0]

      return [{ room, freeUntil: next ? next.start : null }]
    })
    .sort((a, b) => a.room.name.localeCompare(b.room.name))
}

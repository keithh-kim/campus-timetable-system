import type {
  Building,
  CheckResult,
  Cohort,
  PhaseId,
  Room,
  Session,
  SessionDraft,
} from "./types"
import { BUILDINGS, COHORTS, ROOMS } from "./mockData"
import { formatRange, overlaps, toMinutes } from "./time"

/** Minimum gap needed between sessions in different phases. Validate with real walking times. */
export const TRAVEL_BUFFER_MIN = 15

export interface Campus {
  rooms: Room[]
  buildings: Building[]
  cohorts: Cohort[]
}

const defaultCampus: Campus = { rooms: ROOMS, buildings: BUILDINGS, cohorts: COHORTS }

function phaseOf(roomId: string, campus: Campus): PhaseId | undefined {
  const room = campus.rooms.find((r) => r.id === roomId)
  return campus.buildings.find((b) => b.id === room?.buildingId)?.phaseId
}

const describe = (s: Session) => `${s.course} (${formatRange(s.start, s.end)})`

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
  campus: Campus = defaultCampus
): CheckResult {
  const result: CheckResult = {
    complete: false,
    errors: [],
    warnings: [],
    passed: [],
    suggestedRooms: [],
  }

  const { roomId, lecturerId, cohortId, date, start, end } = draft
  if (!roomId || !lecturerId || !cohortId || !date || !start || !end) return result
  result.complete = true

  if (toMinutes(end) <= toMinutes(start)) {
    result.errors.push({ code: "TIME_ORDER", message: "End time must be after start time." })
    return result
  }

  const room = campus.rooms.find((r) => r.id === roomId)
  const cohort = campus.cohorts.find((c) => c.id === cohortId)
  if (!room || !cohort) {
    result.errors.push({ code: "INVALID_DATA", message: "Unknown room or cohort." })
    return result
  }

  // Same day, excluding the session being edited (so editing doesn't clash with itself)
  const others = sessions.filter((s) => s.id !== draft.id && s.date === date)
  const clashing = (s: Session) => overlaps(start, end, s.start, s.end)

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

  // 3. Cohort clash
  const cohortClashes = others.filter((s) => s.cohortId === cohortId && clashing(s))
  for (const s of cohortClashes) {
    result.errors.push({ code: "COHORT_CLASH", message: `${cohort.name} already has: ${describe(s)}.` })
  }
  if (cohortClashes.length === 0) result.passed.push("Cohort has no clash")

  // 4. Capacity
  if (room.capacity < cohort.size) {
    result.errors.push({
      code: "CAPACITY",
      message: `${room.name} seats ${room.capacity} but ${cohort.name} has ${cohort.size} students.`,
    })
  } else {
    result.passed.push(`Capacity OK (${cohort.size} of ${room.capacity} seats)`)
  }

  // 5. Cross-phase travel (checks BOTH directions: before and after the draft)
  const draftPhase = phaseOf(roomId, campus)
  let travelWarnings = 0
  for (const s of others) {
    const sameLecturer = s.lecturerId === lecturerId
    const sameCohort = s.cohortId === cohortId
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
  const roomProblem = result.errors.some((e) => e.code === "ROOM_CLASH" || e.code === "CAPACITY")
  if (roomProblem) {
    result.suggestedRooms = campus.rooms
      .filter(
        (r) =>
          r.id !== roomId &&
          r.capacity >= cohort.size &&
          !others.some((s) => s.roomId === r.id && clashing(s))
      )
      .sort((a, b) => a.capacity - b.capacity) // smallest room that fits first
      .slice(0, 4)
  }

  return result
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
  filters: { phaseId?: PhaseId; minCapacity?: number } = {},
  campus: Campus = defaultCampus
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
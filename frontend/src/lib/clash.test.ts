import { describe, expect, it } from "vitest"
import { TRAVEL_BUFFER_MIN, checkSession, checkSessions, findFreeRooms, type Campus } from "./clash"
import { BUILDINGS, COHORTS, ROOMS } from "./mockData"
import type { Session, SessionDraft } from "./types"

const campus: Campus = { rooms: ROOMS, buildings: BUILDINGS, cohorts: COHORTS }
const MON = "2026-11-02"

const existing: Session = {
  id: "a",
  course: "Existing",
  lecturerId: "l-otieno",
  cohortIds: ["c-bbit3"],
  roomId: "central-101",
  date: MON,
  start: "08:00",
  end: "10:00",
}

const draft = (p: Partial<SessionDraft> = {}): SessionDraft => ({
  course: "Draft",
  lecturerId: "l-kamau",
  cohortIds: ["c-info3"],
  roomId: "central-204",
  date: MON,
  start: "10:00",
  end: "12:00",
  ...p,
})

const errors = (d: SessionDraft, sessions = [existing]) =>
  checkSession(d, sessions, campus).errors.map((e) => e.code)
const warnings = (d: SessionDraft, sessions = [existing]) =>
  checkSession(d, sessions, campus).warnings.map((e) => e.code)

describe("clashes", () => {
  it("allows back-to-back sessions in the same room", () => {
    expect(errors(draft({ roomId: "central-101" }))).toEqual([])
  })

  it("catches a one-minute overlap and a draft that contains another session", () => {
    expect(errors(draft({ roomId: "central-101", start: "09:59" }))).toEqual(["ROOM_CLASH"])
    expect(errors(draft({ roomId: "central-101", start: "08:00", end: "11:00" }))).toEqual(["ROOM_CLASH"])
  })

  it("catches lecturer and cohort clashes in other rooms", () => {
    expect(errors(draft({ lecturerId: "l-otieno", start: "09:00" }))).toEqual(["LECTURER_CLASH"])
    expect(errors(draft({ cohortIds: ["c-bbit3"], start: "09:00" }))).toEqual(["COHORT_CLASH"])
  })

  it("ignores other days, and a session being edited doesn't clash with itself", () => {
    expect(errors(draft({ roomId: "central-101", date: "2026-11-03", start: "09:00" }))).toEqual([])
    expect(errors(draft({ id: "a", roomId: "central-101", start: "09:00" }))).toEqual([])
  })

  it("requires the end to be after the start", () => {
    expect(errors(draft({ start: "12:00", end: "11:00" }))).toEqual(["TIME_ORDER"])
  })

  it("stays incomplete until every field is filled in", () => {
    expect(checkSession(draft({ cohortIds: [] }), [], campus).complete).toBe(false)
    expect(checkSession(draft({ date: "" }), [], campus).complete).toBe(false)
  })
})

describe("teaching hours", () => {
  it("accepts sessions that exactly fill the day", () => {
    expect(errors(draft({ start: "08:00", end: "18:00" }), [])).toEqual([])
  })

  it("rejects sessions the timetable grid couldn't show", () => {
    expect(errors(draft({ start: "07:00", end: "09:00" }), [])).toEqual(["OUT_OF_HOURS"])
    expect(errors(draft({ start: "17:00", end: "18:05" }), [])).toEqual(["OUT_OF_HOURS"])
    expect(errors(draft({ start: "19:00", end: "21:00" }), [])).toEqual(["OUT_OF_HOURS"])
  })
})

describe("capacity", () => {
  it("fits when seats equal students and fails one over", () => {
    // Informatics Year 3 has 38 students: Forge 2 seats 40, MSB Lab seats 30
    expect(errors(draft({ roomId: "forge-2" }), [])).toEqual([])
    expect(errors(draft({ roomId: "msb-lab" }), [])).toEqual(["CAPACITY"])
  })
})

describe("shared lectures", () => {
  const shared = draft({ cohortIds: ["c-bbit2", "c-info3"] }) // 55 + 38 = 93 students

  it("adds the cohorts together for capacity", () => {
    expect(errors({ ...shared, roomId: "oval-2" }, [])).toEqual([]) // 100 seats
    const result = checkSession({ ...shared, roomId: "stmb-301" }, [], campus) // 80 seats
    expect(result.errors.map((e) => e.code)).toEqual(["CAPACITY"])
    expect(result.errors[0].message).toContain("93 students together")
  })

  it("suggests only rooms big enough for everyone", () => {
    const result = checkSession({ ...shared, roomId: "stmb-301" }, [], campus)
    expect(result.suggestedRooms.map((r) => r.id)).toEqual(["oval-2", "central-101"])
  })

  it("clashes if any one of the cohorts is busy", () => {
    const session = { ...existing, cohortIds: ["c-info3"], start: "10:00", end: "11:00" }
    expect(errors({ ...shared, roomId: "oval-2" }, [session])).toEqual(["COHORT_CLASH"])
  })

  it("checks travel for every cohort", () => {
    const session = { ...existing, cohortIds: ["c-info3"] }
    expect(warnings({ ...shared, roomId: "oval-2" }, [session])).toEqual(["TRAVEL"])
  })
})

describe("cross-phase travel", () => {
  const crossPhase = draft({ lecturerId: "l-otieno", roomId: "msb-101" })

  it("warns right up to the buffer, not at it", () => {
    expect(warnings(crossPhase)).toEqual(["TRAVEL"])
    expect(warnings({ ...crossPhase, start: `10:${TRAVEL_BUFFER_MIN - 1}` })).toEqual(["TRAVEL"])
    expect(warnings({ ...crossPhase, start: `10:${TRAVEL_BUFFER_MIN}` })).toEqual([])
  })

  it("warns when the other session comes after the draft", () => {
    const later = { ...existing, start: "12:05", end: "13:00" }
    expect(warnings(crossPhase, [later])).toEqual(["TRAVEL"])
  })

  it("doesn't warn within a phase or for unrelated people", () => {
    expect(warnings(draft({ lecturerId: "l-otieno" }))).toEqual([])
    expect(warnings(draft({ roomId: "msb-101" }))).toEqual([])
  })
})

describe("checking a whole series", () => {
  const weeks = (p: Partial<SessionDraft> = {}) =>
    ["2026-11-02", "2026-11-09", "2026-11-16"].map((date) => draft({ ...p, date }))
  const onSecondWeek = { ...existing, date: "2026-11-09", roomId: "central-204", start: "10:00", end: "12:00" }

  it("names the date when only some weeks have a problem", () => {
    const result = checkSessions(weeks(), [onSecondWeek], campus)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].code).toBe("ROOM_CLASH")
    expect(result.errors[0].message).toMatch(/^Mon,? 9 Nov: /)
  })

  it("lists a problem on every week once, without dates", () => {
    const result = checkSessions(weeks({ roomId: "msb-lab" }), [], campus)
    expect(result.errors.map((e) => e.code)).toEqual(["CAPACITY"])
    expect(result.errors[0].message).toMatch(/^MSB Lab/)
  })

  it("only ticks a check that passed every week", () => {
    const result = checkSessions(weeks(), [onSecondWeek], campus)
    expect(result.passed).not.toContain("Central 204 is free")
    expect(result.passed).toContain("Lecturer is available")
  })

  it("suggests only rooms free in every week", () => {
    const secondWeekOnly = { ...onSecondWeek, id: "b", roomId: "stmb-204", lecturerId: "l-achieng", cohortIds: ["c-bbit2"] }
    const result = checkSessions(weeks(), [onSecondWeek, secondWeekOnly], campus)
    const ids = result.suggestedRooms.map((r) => r.id)
    expect(ids).not.toContain("stmb-204")
    expect(ids.length).toBeGreaterThan(0)
  })

  it("doesn't clash with the sessions being edited", () => {
    const old = weeks().map((d, i) => ({ ...d, id: `s${i}` }))
    expect(checkSessions(old, old, campus).errors).toEqual([])
  })
})

describe("room finder", () => {
  const free = (time: string) => findFreeRooms([existing], MON, time, campus).map((r) => r.room.id)

  it("treats the end of a session as free and the start as busy", () => {
    expect(free("08:00")).not.toContain("central-101")
    expect(free("09:59")).not.toContain("central-101")
    expect(free("10:00")).toContain("central-101")
  })

  it("reports when a free room is next booked", () => {
    const room = findFreeRooms([existing], MON, "07:00", campus).find((r) => r.room.id === "central-101")
    expect(room?.freeUntil).toBe("08:00")
  })

  it("applies phase and capacity filters", () => {
    const phase1 = findFreeRooms([], MON, "10:00", campus, { phaseId: "phase1" })
    expect(phase1.map((r) => r.room.id)).toEqual(["central-101", "central-204"])
    const big = findFreeRooms([], MON, "10:00", campus, { minCapacity: 100 })
    expect(big.map((r) => r.room.id)).toEqual(["central-101", "oval-2"])
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { checkSession, type Campus } from "./clash"
import { BUILDINGS, COHORTS, ROOMS, demoWeekStart, makeDemoDrafts, makeSeedSessions, rollSessions } from "./mockData"
import { weekdayIndex } from "./time"

const campus: Campus = { rooms: ROOMS, buildings: BUILDINGS, cohorts: COHORTS }

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 3, 10)) // Tuesday 3 Nov 2026
})
afterEach(() => {
  vi.useRealTimers()
})

function expectDemosToWork(sessions = makeSeedSessions()) {
  const demos = makeDemoDrafts()
  const codes = (d: Parameters<typeof checkSession>[0]) => {
    const r = checkSession(d, sessions, campus)
    return [...r.errors, ...r.warnings].map((i) => i.code)
  }
  expect(codes(demos.roomClash)).toEqual(["ROOM_CLASH"])
  expect(codes(demos.travelWarning)).toEqual(["TRAVEL"])
  expect(codes(demos.sharedLecture)).toEqual([])
  expect(codes(demos.allClear)).toEqual([])
}

describe("demo data", () => {
  it("has no clashes of its own", () => {
    const sessions = makeSeedSessions()
    for (const s of sessions) {
      expect(checkSession(s, sessions, campus).errors, s.id).toEqual([])
    }
  })

  it("repeats weekly, so later weeks aren't empty", () => {
    const sessions = makeSeedSessions()
    const networks = sessions.filter((s) => s.seriesId === "s-005")
    expect(networks).toHaveLength(12)
    expect(new Set(sessions.map((s) => s.id)).size).toBe(sessions.length)
  })

  it("demo buttons show what their labels promise", () => {
    expectDemosToWork()
  })

  it("demo buttons also work at the weekend, when the demo jumps to next week", () => {
    vi.setSystemTime(new Date(2026, 10, 7, 10)) // Saturday
    expect(weekdayIndex(demoWeekStart())).toBe(0)
    expectDemosToWork()
  })
})

describe("rollSessions", () => {
  it("keeps saved demo data working weeks after it was saved", () => {
    const savedWeek = demoWeekStart()
    const saved = makeSeedSessions()

    vi.setSystemTime(new Date(2026, 10, 24, 10)) // three weeks later
    const rolled = rollSessions(saved, savedWeek, demoWeekStart())

    expect(rolled.filter((s) => s.date >= demoWeekStart() && s.seriesId === "s-001")).toHaveLength(12)
    expectDemosToWork(rolled)
  })

  it("keeps sessions on the same weekday", () => {
    const saved = makeSeedSessions()
    const rolled = rollSessions(saved, "2026-11-02", "2026-11-23")
    rolled.forEach((s, i) => expect(weekdayIndex(s.date)).toBe(weekdayIndex(saved[i].date)))
  })

  it("changes nothing in the same week", () => {
    const saved = makeSeedSessions()
    expect(rollSessions(saved, "2026-11-02", "2026-11-02")).toBe(saved)
  })
})

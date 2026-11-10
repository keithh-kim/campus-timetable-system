import { describe, expect, it } from "vitest"
import { applyFields, occurrenceDates, seriesTargets } from "./series"
import type { Session } from "./types"

const week = (n: number, date: string): Session => ({
  id: `w${n}`,
  course: "Networks",
  lecturerId: "l1",
  cohortIds: ["c1"],
  roomId: "r1",
  date,
  start: "08:00",
  end: "10:00",
  seriesId: "series",
})

const series = [
  week(1, "2026-11-02"),
  week(2, "2026-11-09"),
  week(3, "2026-11-16"),
  { ...week(4, "2026-11-02"), seriesId: "other" },
]

describe("occurrenceDates", () => {
  it("steps one week at a time, across month ends", () => {
    expect(occurrenceDates("2026-11-23", 3)).toEqual(["2026-11-23", "2026-11-30", "2026-12-07"])
  })

  it("leaves an empty date alone so the form can stay incomplete", () => {
    expect(occurrenceDates("", 4)).toEqual([""])
  })
})

describe("seriesTargets", () => {
  it("returns only the session for a single edit", () => {
    expect(seriesTargets(series, series[1], "one").map((s) => s.id)).toEqual(["w2"])
  })

  it("returns this and later sessions from the same series", () => {
    expect(seriesTargets(series, series[1], "following").map((s) => s.id)).toEqual(["w2", "w3"])
  })

  it("treats a session outside any series as a single session", () => {
    const single = { ...series[0], seriesId: undefined }
    expect(seriesTargets([single], single, "following")).toEqual([single])
  })
})

describe("applyFields", () => {
  const fields = {
    course: "Networks II",
    lecturerId: "l2",
    cohortIds: ["c1", "c2"],
    roomId: "r2",
    date: "2026-11-10", // the edited week moves from Monday to Tuesday
    start: "11:00",
    end: "12:00",
  }

  it("moves every week by the same number of days and keeps its identity", () => {
    const moved = applyFields(series[2], series[1], fields)
    expect(moved).toMatchObject({ ...fields, id: "w3", seriesId: "series", date: "2026-11-17" })
  })

  it("leaves dates in place when the date didn't change", () => {
    const moved = applyFields(series[2], series[1], { ...fields, date: "2026-11-09" })
    expect(moved.date).toBe("2026-11-16")
  })
})

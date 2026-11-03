import { describe, expect, it } from "vitest"
import { COHORTS, ROOMS } from "./mockData"
import type { RoomDraft, Session } from "./types"
import { checkRoom, sessionsInRoom } from "./venues"

const draft = (p: Partial<RoomDraft> = {}): RoomDraft => ({
  name: "MSB 103",
  buildingId: "msb",
  capacity: 40,
  type: "seminar",
  equipment: [],
  ...p,
})

// BBIT Year 3 (42) + Informatics Year 1 (70) = 112 students
const booked: Session = {
  id: "a",
  course: "Statistics",
  lecturerId: "l-kamau",
  cohortIds: ["c-bbit3", "c-info1"],
  roomId: "central-101",
  date: "2026-11-02",
  start: "10:00",
  end: "12:00",
}

const check = (d: RoomDraft) => checkRoom(d, ROOMS, [booked], COHORTS)

describe("checkRoom", () => {
  it("accepts a valid new room", () => {
    expect(check(draft())).toEqual([])
  })

  it("requires a name, building and sensible capacity", () => {
    expect(check(draft({ name: "  " }))).toEqual(["Enter a room name."])
    expect(check(draft({ buildingId: "" }))).toEqual(["Choose a building."])
    expect(check(draft({ capacity: 0 }))).toHaveLength(1)
    expect(check(draft({ capacity: 1.5 }))).toHaveLength(1)
  })

  it("rejects duplicate names, except a room keeping its own", () => {
    expect(check(draft({ name: "msb 101" }))).toHaveLength(1)
    expect(check(draft({ id: "msb-101", name: "MSB 101" }))).toEqual([])
  })

  it("won't shrink a room below the largest class booked in it", () => {
    const room = { id: "central-101", name: "Central 101", buildingId: "central" }
    expect(check(draft({ ...room, capacity: 112 }))).toEqual([])
    expect(check(draft({ ...room, capacity: 111 }))[0]).toContain("112 students")
  })
})

describe("sessionsInRoom", () => {
  it("counts bookings so a room in use can't be deleted", () => {
    expect(sessionsInRoom([booked], "central-101")).toBe(1)
    expect(sessionsInRoom([booked], "msb-101")).toBe(0)
  })
})

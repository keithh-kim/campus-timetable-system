import { describe, expect, it } from "vitest"
import { ROOMS } from "./mockData"
import {
  cancelledNotification,
  describeChanges,
  isForViewer,
  newSessionNotification,
  updatedNotification,
  viewerKey,
} from "./notifications"
import type { Session, Viewer } from "./types"

const session: Session = {
  id: "a",
  course: "Networks",
  lecturerId: "l-otieno",
  cohortIds: ["c-bbit2"],
  roomId: "central-101",
  date: "2026-11-02",
  start: "08:00",
  end: "10:00",
}

const viewer = (p: Partial<Viewer>): Viewer => ({
  role: "officer",
  lecturerId: "l-otieno",
  cohortId: "c-bbit2",
  ...p,
})

const update = (p: Partial<Session>, later = 0) =>
  updatedNotification(session, { ...session, ...p }, later, ROOMS)

describe("what counts as a change", () => {
  it("doesn't notify anyone when nothing changed", () => {
    expect(update({})).toBeNull()
    expect(describeChanges(session, { ...session }, ROOMS).lines).toEqual([])
  })

  it("reports a move with where it was and where it is now", () => {
    const n = update({ roomId: "msb-101", start: "09:00" })
    expect(n?.kind).toBe("moved")
    expect(n?.title).toBe("Networks moved")
    expect(n?.lines).toEqual([
      "From: Central 101, 2026-11-02 08:00–10:00",
      "To: MSB 101, 2026-11-02 09:00–10:00",
    ])
  })

  it("reports lecturer, cohort and course changes, which aren't moves", () => {
    expect(update({ lecturerId: "l-kamau" })?.lines).toEqual(["Lecturer: Dr. Otieno → Prof. Kamau"])
    expect(update({ cohortIds: ["c-bbit3"] })?.lines).toEqual(["Cohorts: BBIT Year 2 → BBIT Year 3"])
    const renamed = update({ course: "Networks II" })
    expect(renamed?.kind).toBe("changed")
    expect(renamed?.lines).toEqual(["Course: Networks → Networks II"])
  })

  it("ignores the order cohorts were picked in", () => {
    const pair = { ...session, cohortIds: ["c-bbit2", "c-bbit3"] }
    const swapped = { ...session, cohortIds: ["c-bbit3", "c-bbit2"] }
    expect(updatedNotification(pair, swapped, 0, ROOMS)).toBeNull()
  })

  it("mentions the rest of a series once", () => {
    expect(update({ start: "09:00" }, 3)?.lines.at(-1)).toBe("Also affects 3 later sessions in this series.")
    expect(cancelledNotification(session, 1, ROOMS).lines.at(-1)).toBe("Also cancels 1 later session in this series.")
    expect(newSessionNotification(session, 4, ROOMS).lines.at(-1)).toBe("Repeats weekly for 4 weeks.")
  })
})

describe("who is affected", () => {
  it("tells both the old and the new lecturer and cohorts", () => {
    const n = update({ lecturerId: "l-kamau", cohortIds: ["c-bbit3"] })
    expect(n?.lecturerIds.sort()).toEqual(["l-kamau", "l-otieno"])
    expect(n?.cohortIds.sort()).toEqual(["c-bbit2", "c-bbit3"])
  })

  it("shows students and lecturers only what affects them, and officers everything", () => {
    const n = cancelledNotification(session, 0, ROOMS)
    expect(isForViewer(n, viewer({ role: "officer", lecturerId: "other", cohortId: "other" }))).toBe(true)
    expect(isForViewer(n, viewer({ role: "lecturer" }))).toBe(true)
    expect(isForViewer(n, viewer({ role: "lecturer", lecturerId: "l-kamau" }))).toBe(false)
    expect(isForViewer(n, viewer({ role: "student" }))).toBe(true)
    expect(isForViewer(n, viewer({ role: "student", cohortId: "c-bbit3" }))).toBe(false)
  })

  it("reaches every cohort of a shared lecture", () => {
    const n = cancelledNotification({ ...session, cohortIds: ["c-bbit2", "c-info1"] }, 0, ROOMS)
    expect(isForViewer(n, viewer({ role: "student", cohortId: "c-info1" }))).toBe(true)
  })

  it("tracks read state per person", () => {
    const a = viewerKey(viewer({ role: "student", cohortId: "c-bbit2" }))
    const b = viewerKey(viewer({ role: "student", cohortId: "c-bbit3" }))
    const c = viewerKey(viewer({ role: "lecturer" }))
    expect(new Set([a, b, c, viewerKey(viewer({ role: "officer" }))]).size).toBe(4)
  })
})

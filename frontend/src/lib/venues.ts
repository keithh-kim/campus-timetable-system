import type { Cohort, Room, RoomDraft, Session } from "./types"

/** Problems that stop a room being saved. Empty means it's fine. */
export function checkRoom(
  draft: RoomDraft,
  rooms: Room[],
  sessions: Session[],
  cohorts: Cohort[]
): string[] {
  const errors: string[] = []
  const name = draft.name.trim().toLowerCase()

  if (!name) errors.push("Enter a room name.")
  if (rooms.some((r) => r.id !== draft.id && r.name.trim().toLowerCase() === name)) {
    errors.push(`There is already a room called ${draft.name.trim()}.`)
  }
  if (!draft.buildingId) errors.push("Choose a building.")

  if (!Number.isInteger(draft.capacity) || draft.capacity < 1) {
    errors.push("Capacity must be a whole number of at least 1.")
  } else if (draft.id) {
    // Shrinking a room must not leave booked classes without seats
    const sizes = sessions
      .filter((s) => s.roomId === draft.id)
      .map((s) =>
        s.cohortIds.reduce((sum, id) => sum + (cohorts.find((c) => c.id === id)?.size ?? 0), 0)
      )
    const largest = Math.max(0, ...sizes)
    if (largest > draft.capacity) {
      errors.push(`A session booked in this room has ${largest} students. Move it before shrinking the room.`)
    }
  }

  return errors
}

export function sessionsInRoom(sessions: Session[], roomId: string): number {
  return sessions.filter((s) => s.roomId === roomId).length
}

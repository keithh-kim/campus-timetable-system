// ---------- Campus structure: Phase → Building → Room ----------

export type Role = "student" | "lecturer" | "officer"
export type PhaseId = "phase1" | "phase2"
export type RoomType = "lecture" | "lab" | "seminar"

export interface Phase {
  id: PhaseId
  name: string
}

export interface Building {
  id: string
  name: string
  phaseId: PhaseId
}

export interface Room {
  id: string
  name: string
  buildingId: string
  capacity: number
  type: RoomType
  equipment: string[]
}

// ---------- People ----------

export interface Lecturer {
  id: string
  name: string
}

export interface Cohort {
  id: string
  name: string
  size: number
}

// ---------- Sessions ----------
// Dates are "YYYY-MM-DD" strings, times are "HH:mm" strings.

export interface Session {
  id: string
  course: string
  lecturerId: string
  cohortId: string
  roomId: string
  date: string
  start: string
  end: string
}

// A session being edited in the form: fields can be empty, id is optional.
export type SessionDraft = Omit<Session, "id"> & { id?: string }

// Named AppNotification so it doesn't clash with the browser's built-in Notification type.
export interface AppNotification {
  id: string
  message: string
  createdAt: string // ISO timestamp
  read: boolean
  sessionId: string
}

// ---------- Result of checking a draft session ----------

export type IssueCode =
  | "TIME_ORDER"
  | "ROOM_CLASH"
  | "LECTURER_CLASH"
  | "COHORT_CLASH"
  | "CAPACITY"
  | "TRAVEL"
  | "INVALID_DATA"

export interface CheckIssue {
  code: IssueCode
  message: string
}

export interface CheckResult {
  /** false until every required field is filled in (so the UI can show a neutral state) */
  complete: boolean
  /** blocking problems: Save should be disabled */
  errors: CheckIssue[]
  /** non-blocking problems: the user can still save */
  warnings: CheckIssue[]
  /** things that passed, for the green ticks */
  passed: string[]
  /** alternative rooms when the chosen room is taken or too small */
  suggestedRooms: Room[]
}
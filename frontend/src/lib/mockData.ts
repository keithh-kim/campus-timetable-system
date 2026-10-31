import type {
  Building,
  Cohort,
  Lecturer,
  Phase,
  Room,
  Session,
  SessionDraft,
} from "./types"
import { addDays, startOfWeek, today, weekdayIndex } from "./time"

// ⚠️ PLACEHOLDERS: the buildings are real, but room names, capacities,
// lecturers and cohorts are made up. Replace them with the real data
// from the timetabling office when you have it.

export const PHASES: Phase[] = [
  { id: "phase1", name: "Phase 1" },
  { id: "phase2", name: "Phase 2" },
]

export const BUILDINGS: Building[] = [
  { id: "central", name: "Central Building", phaseId: "phase1" },
  { id: "msb", name: "MSB", phaseId: "phase2" },
  { id: "stmb", name: "STMB", phaseId: "phase2" },
  { id: "oval", name: "Oval", phaseId: "phase2" },
  { id: "forge", name: "Forge", phaseId: "phase2" },
]

export const ROOMS: Room[] = [
  { id: "central-101", name: "Central 101", buildingId: "central", capacity: 120, type: "lecture", equipment: ["Projector"] },
  { id: "central-204", name: "Central 204", buildingId: "central", capacity: 60, type: "lecture", equipment: ["Projector"] },
  { id: "msb-101", name: "MSB 101", buildingId: "msb", capacity: 60, type: "lecture", equipment: ["Projector"] },
  { id: "msb-102", name: "MSB 102", buildingId: "msb", capacity: 40, type: "seminar", equipment: [] },
  { id: "msb-lab", name: "MSB Lab", buildingId: "msb", capacity: 30, type: "lab", equipment: ["PCs", "Projector"] },
  { id: "stmb-204", name: "STMB 204", buildingId: "stmb", capacity: 60, type: "lecture", equipment: ["Projector"] },
  { id: "stmb-301", name: "STMB 301", buildingId: "stmb", capacity: 80, type: "lecture", equipment: ["Projector"] },
  { id: "oval-1", name: "Oval 1", buildingId: "oval", capacity: 50, type: "seminar", equipment: [] },
  { id: "oval-2", name: "Oval 2", buildingId: "oval", capacity: 100, type: "lecture", equipment: ["Projector"] },
  { id: "forge-1", name: "Forge 1", buildingId: "forge", capacity: 80, type: "lecture", equipment: ["Projector"] },
  { id: "forge-2", name: "Forge 2", buildingId: "forge", capacity: 40, type: "lab", equipment: ["PCs"] },
]

export const LECTURERS: Lecturer[] = [
  { id: "l-otieno", name: "Dr. Otieno" },
  { id: "l-wanjiru", name: "Dr. Wanjiru" },
  { id: "l-kamau", name: "Prof. Kamau" },
  { id: "l-achieng", name: "Ms. Achieng" },
]

export const COHORTS: Cohort[] = [
  { id: "c-bbit2", name: "BBIT Year 2", size: 55 },
  { id: "c-bbit3", name: "BBIT Year 3", size: 42 },
  { id: "c-info1", name: "Informatics Year 1", size: 70 },
  { id: "c-info3", name: "Informatics Year 3", size: 38 },
]

// ---------- Seed sessions ----------
// Built relative to the current week so the demo always looks "live".
// On weekends we show next week, since this week is already over.

export function demoWeekStart(): string {
  const monday = startOfWeek(today())
  return weekdayIndex(today()) >= 5 ? addDays(monday, 7) : monday
}

export function makeSeedSessions(): Session[] {
  const mon = demoWeekStart()
  const day = (n: number) => addDays(mon, n) // 0 = Mon ... 4 = Fri

  return [
    { id: "s-001", course: "Software Engineering", lecturerId: "l-otieno", cohortId: "c-bbit2", roomId: "central-204", date: day(0), start: "08:00", end: "10:00" },
    { id: "s-002", course: "Database Systems", lecturerId: "l-wanjiru", cohortId: "c-bbit3", roomId: "msb-101", date: day(0), start: "10:00", end: "12:00" },
    { id: "s-003", course: "Web Development", lecturerId: "l-otieno", cohortId: "c-info3", roomId: "forge-1", date: day(1), start: "09:00", end: "11:00" },
    { id: "s-004", course: "Calculus I", lecturerId: "l-kamau", cohortId: "c-info1", roomId: "central-101", date: day(1), start: "11:00", end: "13:00" },
    { id: "s-005", course: "Computer Networks", lecturerId: "l-achieng", cohortId: "c-bbit3", roomId: "stmb-204", date: day(2), start: "14:00", end: "16:00" },
    { id: "s-006", course: "Algorithms", lecturerId: "l-wanjiru", cohortId: "c-info3", roomId: "oval-2", date: day(3), start: "10:00", end: "12:00" },
    { id: "s-007", course: "Operating Systems", lecturerId: "l-achieng", cohortId: "c-bbit2", roomId: "forge-1", date: day(4), start: "08:00", end: "10:00" },
    { id: "s-008", course: "Statistics", lecturerId: "l-kamau", cohortId: "c-bbit3", roomId: "central-101", date: day(4), start: "10:00", end: "12:00" },
  ]
}

// ---------- Demo drafts ----------
// Handy for presenting: a "Load demo" button can fill the form with these.

export function makeDemoDrafts(): { roomClash: SessionDraft; travelWarning: SessionDraft; allClear: SessionDraft } {
  const mon = demoWeekStart()
  return {
    // Same room (MSB 101) as Database Systems on Monday 10:00-12:00 → ROOM_CLASH error
    roomClash: {
      course: "Demo: Room Clash",
      lecturerId: "l-achieng",
      cohortId: "c-info3",
      roomId: "msb-101",
      date: mon,
      start: "10:00",
      end: "12:00",
    },
    // Dr. Otieno finishes in Central (Phase 1) at 10:00, then starts in STMB (Phase 2)
    // at 10:05 → TRAVEL warning (only 5 minutes), but no errors
    travelWarning: {
      course: "Demo: Travel Warning",
      lecturerId: "l-otieno",
      cohortId: "c-info3",
      roomId: "stmb-301",
      date: mon,
      start: "10:05",
      end: "12:00",
    },
    // Nothing wrong: everything green
    allClear: {
      course: "Demo: All Clear",
      lecturerId: "l-kamau",
      cohortId: "c-bbit3",
      roomId: "oval-2",
      date: mon,
      start: "14:00",
      end: "16:00",
    },
  }
}
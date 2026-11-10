// Times are "HH:mm" strings, dates are "YYYY-MM-DD" strings.
// All conversion happens here so the rest of the app never does date maths.

/** The teaching day. The timetable grid shows these hours and sessions must fit inside them. */
export const DAY_START_HOUR = 8
export const DAY_END_HOUR = 18

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

export function toTime(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0")
  const m = String(minutes % 60).padStart(2, "0")
  return `${h}:${m}`
}

/**
 * Do two time ranges overlap?
 * Strict comparison on purpose: a class ending at 10:00 and another starting
 * at 10:00 do NOT overlap. Using <= here is the classic off-by-one bug.
 */
export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd)
}

export function formatRange(start: string, end: string): string {
  return `${start}–${end}`
}

// ---------- Dates (local time, avoids UTC off-by-one-day surprises) ----------

export function parseDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function addDays(date: string, n: number): string {
  const d = parseDate(date)
  d.setDate(d.getDate() + n)
  return toDateString(d)
}

/** Whole days from one date to another. Rounded so a clock change can't shift the answer. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000)
}

/** e.g. "Mon 2 Nov" */
export function formatDate(date: string): string {
  return parseDate(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

/** Monday = 0 ... Sunday = 6 */
export function weekdayIndex(date: string): number {
  return (parseDate(date).getDay() + 6) % 7
}

/** The Monday of the week containing `date`. */
export function startOfWeek(date: string): string {
  return addDays(date, -weekdayIndex(date))
}

export function today(): string {
  return toDateString(new Date())
}

export function nowTime(): string {
  const d = new Date()
  return toTime(d.getHours() * 60 + d.getMinutes())
}
import type { Session, SessionFields } from "./types"
import { addDays, daysBetween } from "./time"

// A weekly repeat is stored as ordinary sessions that share a seriesId, one per week.
// The clash rules, grid and room finder only ever see single dated sessions.

/** Edit or cancel just this session, or this one and every later one in its series. */
export type EditScope = "one" | "following"

export function occurrenceDates(date: string, weeks: number): string[] {
  if (!date) return [date]
  return Array.from({ length: weeks }, (_, week) => addDays(date, week * 7))
}

export function seriesTargets(sessions: Session[], session: Session, scope: EditScope): Session[] {
  if (scope === "one" || !session.seriesId) return [session]
  return sessions
    .filter((s) => s.seriesId === session.seriesId && s.date >= session.date)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Apply the form's fields to one session of a series.
 * Moving the edited session by some days moves the others by the same amount,
 * so they keep their place in the following weeks.
 */
export function applyFields(target: Session, edited: Session, fields: SessionFields): Session {
  const date = fields.date && addDays(target.date, daysBetween(edited.date, fields.date))
  return { ...target, ...fields, date }
}

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type {
  AppNotification,
  Role,
  Room,
  RoomDraft,
  Session,
  SessionFields,
  Viewer,
} from "../lib/types"
import type { Campus } from "../lib/clash"
import {
  BUILDINGS,
  COHORTS,
  LECTURERS,
  ROOMS,
  demoWeekStart,
  makeSeedSessions,
  rollSessions,
} from "../lib/mockData"
import {
  cancelledNotification,
  isForViewer,
  newSessionNotification,
  updatedNotification,
  viewerKey,
} from "../lib/notifications"
import { applyFields, occurrenceDates, seriesTargets, type EditScope } from "../lib/series"
import { newId } from "../lib/utils"

// v2: sessions can have several cohorts, so older saved data no longer fits
const STORAGE_KEY = "slotwise:v2"

interface State {
  viewer: Viewer
  rooms: Room[]
  sessions: Session[]
  notifications: AppNotification[]
  /** The week the sessions were last lined up with (see rollSessions) */
  seedWeek: string
}

const defaultViewer: Viewer = {
  role: "officer",
  lecturerId: LECTURERS[0].id,
  cohortId: COHORTS[0].id,
}

function seed(): State {
  return {
    viewer: defaultViewer,
    rooms: ROOMS,
    sessions: makeSeedSessions(),
    notifications: [],
    seedWeek: demoWeekStart(),
  }
}

// Read saved data; if it's missing or corrupt, fall back to the seed data.
function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (Array.isArray(p.sessions) && Array.isArray(p.notifications) && Array.isArray(p.rooms)) {
        const week = demoWeekStart()
        return {
          viewer: { ...defaultViewer, ...p.viewer },
          rooms: p.rooms,
          sessions: rollSessions(p.sessions, p.seedWeek ?? week, week),
          notifications: p.notifications,
          seedWeek: week,
        }
      }
    }
  } catch {
    // storage unavailable or corrupt: use seed data
  }
  return seed()
}

interface Store {
  role: Role
  setRole: (role: Role) => void
  viewer: Viewer
  setViewer: (patch: Partial<Viewer>) => void
  campus: Campus
  sessions: Session[]
  addSessions: (fields: SessionFields, weeks: number) => void
  updateSessions: (id: string, fields: SessionFields, scope: EditScope) => void
  deleteSessions: (id: string, scope: EditScope) => void
  addRoom: (draft: RoomDraft) => void
  updateRoom: (room: Room) => void
  deleteRoom: (id: string) => void
  /** Only the notifications that affect the current viewer */
  notifications: AppNotification[]
  isUnread: (n: AppNotification) => boolean
  unreadCount: number
  markAllRead: () => void
  resetDemo: () => void
}

const SlotwiseContext = createContext<Store | null>(null)

export function SlotwiseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load)

  // Save on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full or blocked: the app still works, it just won't remember
    }
  }, [state])

  const campus = useMemo<Campus>(
    () => ({ rooms: state.rooms, buildings: BUILDINGS, cohorts: COHORTS }),
    [state.rooms]
  )

  const addSessions = (fields: SessionFields, weeks: number) => {
    const seriesId = weeks > 1 ? newId("series") : undefined
    const created: Session[] = occurrenceDates(fields.date, weeks).map((date) => ({
      ...fields,
      date,
      id: newId("s"),
      ...(seriesId && { seriesId }),
    }))
    setState((prev) => ({
      ...prev,
      sessions: [...prev.sessions, ...created],
      notifications: [newSessionNotification(created[0], weeks, prev.rooms), ...prev.notifications],
    }))
  }

  const updateSessions = (id: string, fields: SessionFields, scope: EditScope) => {
    setState((prev) => {
      const old = prev.sessions.find((s) => s.id === id)
      if (!old) return prev

      const targets = new Set(seriesTargets(prev.sessions, old, scope).map((s) => s.id))
      const notice = updatedNotification(old, applyFields(old, old, fields), targets.size - 1, prev.rooms)
      return {
        ...prev,
        sessions: prev.sessions.map((s) => (targets.has(s.id) ? applyFields(s, old, fields) : s)),
        notifications: notice ? [notice, ...prev.notifications] : prev.notifications,
      }
    })
  }

  const deleteSessions = (id: string, scope: EditScope) => {
    setState((prev) => {
      const gone = prev.sessions.find((s) => s.id === id)
      if (!gone) return prev

      const targets = new Set(seriesTargets(prev.sessions, gone, scope).map((s) => s.id))
      return {
        ...prev,
        sessions: prev.sessions.filter((s) => !targets.has(s.id)),
        notifications: [
          cancelledNotification(gone, targets.size - 1, prev.rooms),
          ...prev.notifications,
        ],
      }
    })
  }

  const key = viewerKey(state.viewer)
  const visible = state.notifications.filter((n) => isForViewer(n, state.viewer))
  const isUnread = (n: AppNotification) => !n.readBy.includes(key)

  const value: Store = {
    role: state.viewer.role,
    setRole: (role) => setState((prev) => ({ ...prev, viewer: { ...prev.viewer, role } })),
    viewer: state.viewer,
    setViewer: (patch) => setState((prev) => ({ ...prev, viewer: { ...prev.viewer, ...patch } })),
    campus,
    sessions: state.sessions,
    addSessions,
    updateSessions,
    deleteSessions,
    addRoom: (draft) =>
      setState((prev) => ({ ...prev, rooms: [...prev.rooms, { ...draft, id: newId("r") }] })),
    updateRoom: (room) =>
      setState((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => (r.id === room.id ? room : r)),
      })),
    deleteRoom: (id) =>
      setState((prev) => ({ ...prev, rooms: prev.rooms.filter((r) => r.id !== id) })),
    notifications: visible,
    isUnread,
    unreadCount: visible.filter(isUnread).length,
    markAllRead: () =>
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          isForViewer(n, prev.viewer) && !n.readBy.includes(key)
            ? { ...n, readBy: [...n.readBy, key] }
            : n
        ),
      })),
    resetDemo: () => setState((prev) => ({ ...seed(), viewer: prev.viewer })),
  }

  return <SlotwiseContext.Provider value={value}>{children}</SlotwiseContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSlotwise(): Store {
  const ctx = useContext(SlotwiseContext)
  if (!ctx) throw new Error("useSlotwise must be used inside <SlotwiseProvider>")
  return ctx
}

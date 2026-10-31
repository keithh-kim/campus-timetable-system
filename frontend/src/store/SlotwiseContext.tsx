import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { AppNotification, Role, Session } from "../lib/types"
import { ROOMS, makeSeedSessions } from "../lib/mockData"
import { formatRange } from "../lib/time"

const STORAGE_KEY = "slotwise:v1"

interface State {
  role: Role
  sessions: Session[]
  notifications: AppNotification[]
}

function seed(): State {
  return { role: "officer", sessions: makeSeedSessions(), notifications: [] }
}

// Read saved data; if it's missing or corrupt, fall back to the seed data.
function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (Array.isArray(p.sessions) && Array.isArray(p.notifications)) {
        return {
          role: p.role ?? "officer",
          sessions: p.sessions,
          notifications: p.notifications,
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
  sessions: Session[]
  addSession: (draft: Omit<Session, "id">) => void
  updateSession: (session: Session) => void
  deleteSession: (id: string) => void
  notifications: AppNotification[]
  unreadCount: number
  markAllRead: () => void
  resetDemo: () => void
}

const SlotwiseContext = createContext<Store | null>(null)

const roomName = (id: string) => ROOMS.find((r) => r.id === id)?.name ?? id
const where = (s: Session) =>
  `${roomName(s.roomId)}, ${s.date} ${formatRange(s.start, s.end)}`
const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

function notification(message: string, sessionId: string): AppNotification {
  return {
    id: newId("n"),
    message,
    createdAt: new Date().toISOString(),
    read: false,
    sessionId,
  }
}

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

  const addSession = (draft: Omit<Session, "id">) => {
    const session: Session = { ...draft, id: newId("s") }
    setState((prev) => ({
      ...prev,
      sessions: [...prev.sessions, session],
      notifications: [
        notification(`New session: ${session.course} · ${where(session)}`, session.id),
        ...prev.notifications,
      ],
    }))
  }

  // Simulated notification service: a changed room or time creates a notification
  const updateSession = (updated: Session) => {
    setState((prev) => {
      const old = prev.sessions.find((s) => s.id === updated.id)
      const moved =
        old &&
        (old.roomId !== updated.roomId ||
          old.date !== updated.date ||
          old.start !== updated.start ||
          old.end !== updated.end)
      return {
        ...prev,
        sessions: prev.sessions.map((s) => (s.id === updated.id ? updated : s)),
        notifications:
          moved && old
            ? [
                notification(
                  `${updated.course} moved: ${where(old)} → ${where(updated)}`,
                  updated.id
                ),
                ...prev.notifications,
              ]
            : prev.notifications,
      }
    })
  }

  const deleteSession = (id: string) => {
    setState((prev) => {
      const gone = prev.sessions.find((s) => s.id === id)
      return {
        ...prev,
        sessions: prev.sessions.filter((s) => s.id !== id),
        notifications: gone
          ? [notification(`Cancelled: ${gone.course} · ${where(gone)}`, id), ...prev.notifications]
          : prev.notifications,
      }
    })
  }

  const value: Store = {
    role: state.role,
    setRole: (role) => setState((prev) => ({ ...prev, role })),
    sessions: state.sessions,
    addSession,
    updateSession,
    deleteSession,
    notifications: state.notifications,
    unreadCount: state.notifications.filter((n) => !n.read).length,
    markAllRead: () =>
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, read: true })),
      })),
    resetDemo: () => setState((prev) => ({ ...seed(), role: prev.role })),
  }

  return <SlotwiseContext.Provider value={value}>{children}</SlotwiseContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSlotwise(): Store {
  const ctx = useContext(SlotwiseContext)
  if (!ctx) throw new Error("useSlotwise must be used inside <SlotwiseProvider>")
  return ctx
}
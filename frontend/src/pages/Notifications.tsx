import { Bell, CalendarClock, CalendarPlus, CalendarX } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AppNotification } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useSlotwise } from "@/store/SlotwiseContext"

type Kind = "added" | "cancelled" | "moved" | "other"

const icons = {
  added: CalendarPlus,
  cancelled: CalendarX,
  moved: CalendarClock,
  other: Bell,
} as const

// The store writes plain-text messages, so we read the prefix to decide how to show them.
function describe(n: AppNotification): { kind: Kind; title: string; lines: string[] } {
  const m = n.message
  if (m.startsWith("New session: ")) {
    return { kind: "added", title: "New session scheduled", lines: [m.replace("New session: ", "")] }
  }
  if (m.startsWith("Cancelled: ")) {
    return { kind: "cancelled", title: "Session cancelled", lines: [m.replace("Cancelled: ", "")] }
  }
  const [head, rest] = m.split(" moved: ")
  if (rest) {
    const [from, to] = rest.split(" → ")
    return {
      kind: "moved",
      title: `${head} moved`,
      lines: to ? [`From: ${from}`, `To: ${to}`] : [rest],
    }
  }
  return { kind: "other", title: m, lines: [] }
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export default function Notifications() {
  const { notifications, unreadCount, markAllRead } = useSlotwise()

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
          Mark all as read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center">
          <Bell className="mx-auto mb-3 size-5 text-muted-foreground" />
          <p className="text-sm font-medium">No notifications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When a session is scheduled, moved or cancelled, affected students and lecturers are
            notified here.
          </p>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border">
          {notifications.map((n) => {
            const { kind, title, lines } = describe(n)
            const Icon = icons[kind]
            return (
              <li key={n.id} className={cn("flex gap-3 p-4", !n.read && "bg-muted/50")}>
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{title}</p>
                    {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  {lines.map((line) => (
                    <p key={line} className="text-sm text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
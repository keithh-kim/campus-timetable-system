import { Bell, CalendarClock, CalendarCog, CalendarPlus, CalendarX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSlotwise } from "@/store/SlotwiseContext"

const icons = {
  added: CalendarPlus,
  cancelled: CalendarX,
  moved: CalendarClock,
  changed: CalendarCog,
} as const

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
  const { notifications, isUnread, unreadCount, markAllRead } = useSlotwise()

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
            const Icon = icons[n.kind]
            const unread = isUnread(n)
            return (
              <li key={n.id} className={cn("flex gap-3 p-4", unread && "bg-muted/50")}>
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    {unread && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  {n.lines.map((line) => (
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

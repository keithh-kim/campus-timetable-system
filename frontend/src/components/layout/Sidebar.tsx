import { NavLink } from "react-router-dom"
import { Bell, CalendarDays, CalendarPlus, DoorOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSlotwise } from "@/store/SlotwiseContext"

const links = [
  { to: "/timetable", label: "Timetable", icon: CalendarDays, officerOnly: false },
  { to: "/schedule", label: "Schedule Session", icon: CalendarPlus, officerOnly: true },
  { to: "/rooms", label: "Room Finder", icon: DoorOpen, officerOnly: false },
  { to: "/notifications", label: "Notifications", icon: Bell, officerOnly: false },
]

export default function Sidebar() {
  const { role, unreadCount } = useSlotwise()
  const visible = links.filter((l) => !l.officerOnly || role === "officer")

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-5">
        <span className="text-base font-semibold tracking-tight">Slotwise</span>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-background font-medium text-foreground shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              )
            }
          >
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
            {to === "/notifications" && unreadCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
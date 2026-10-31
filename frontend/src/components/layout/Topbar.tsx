import { Link, useLocation } from "react-router-dom"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Role } from "../../lib/types"
import { useSlotwise } from "@/store/SlotwiseContext"

const titles: Record<string, string> = {
  "/timetable": "Timetable",
  "/schedule": "Schedule Session",
  "/rooms": "Room Finder",
  "/notifications": "Notifications",
}

const roleLabels: Record<Role, string> = {
  officer: "Timetabling Officer",
  lecturer: "Lecturer",
  student: "Student",
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { role, setRole, unreadCount } = useSlotwise()

  // "/schedule/s-001" should still read "Schedule Session"
  const title =
    titles[pathname] ??
    titles["/" + pathname.split("/")[1]] ??
    "Slotwise"

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
      <h1 className="text-base font-semibold">{title}</h1>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link to="/notifications" aria-label="Notifications">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" />
            )}
          </Link>
        </Button>

        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger className="w-48" aria-label="Switch role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(roleLabels) as Role[]).map((r) => (
              <SelectItem key={r} value={r}>
                {roleLabels[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  )
}
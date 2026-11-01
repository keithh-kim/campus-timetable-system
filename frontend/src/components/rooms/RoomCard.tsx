import { Clock, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Room } from "@/lib/types"
import { BUILDINGS, PHASES } from "@/lib/mockData"
import { cn } from "@/lib/utils"

interface Props {
  room: Room
  /** "HH:mm" of the next booking, or null when free for the rest of the day */
  freeUntil: string | null
}

// Same colours as the timetable blocks, so phases look consistent everywhere
const phaseDot = { phase1: "bg-sky-500", phase2: "bg-teal-500" } as const

export default function RoomCard({ room, freeUntil }: Props) {
  const building = BUILDINGS.find((b) => b.id === room.buildingId)
  const phase = PHASES.find((p) => p.id === building?.phaseId)

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold leading-tight">{room.name}</h3>
            <p className="text-sm text-muted-foreground">{building?.name}</p>
          </div>
          {phase && (
            <Badge variant="outline" className="gap-1.5">
              <span className={cn("size-2 rounded-full", phaseDot[phase.id])} />
              {phase.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="size-4" />
            {room.capacity} seats
          </span>
          <span className="capitalize">{room.type}</span>
        </div>

        {room.equipment.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {room.equipment.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 border-t pt-3 text-sm">
          <Clock className="size-4 text-green-600 dark:text-green-400" />
          <span className="font-medium">
            {freeUntil ? `Free until ${freeUntil}` : "Free for the rest of the day"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
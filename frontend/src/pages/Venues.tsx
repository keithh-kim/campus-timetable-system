import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Notice from "@/components/layout/Notice"
import RoomDialog from "@/components/venues/RoomDialog"
import { BUILDINGS, PHASES } from "@/lib/mockData"
import type { Room } from "@/lib/types"
import { sessionsInRoom } from "@/lib/venues"
import { useSlotwise } from "@/store/SlotwiseContext"

export default function Venues() {
  const { role, campus, sessions, deleteRoom } = useSlotwise()
  const [editing, setEditing] = useState<Room | "new" | null>(null)

  if (role !== "officer") {
    return (
      <Notice
        title="Timetabling Officers only"
        text="Switch the role in the top bar to Timetabling Officer to manage venues."
      />
    )
  }

  const handleDelete = (room: Room) => {
    deleteRoom(room.id)
    toast.success("Room deleted", { description: room.name })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Venues</h2>
          <p className="text-sm text-muted-foreground">
            Rooms here are what scheduling, clash checks and the room finder use.
          </p>
        </div>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          Add room
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead className="text-right">Seats</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {campus.rooms.map((room) => {
              const building = BUILDINGS.find((b) => b.id === room.buildingId)
              const booked = sessionsInRoom(sessions, room.id)
              return (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>{building?.name}</TableCell>
                  <TableCell>{PHASES.find((p) => p.id === building?.phaseId)?.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{room.capacity}</TableCell>
                  <TableCell className="capitalize">{room.type}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {room.equipment.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{booked}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(room)}>
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-600">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {booked > 0 ? `${room.name} is in use` : `Delete ${room.name}?`}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {booked > 0
                              ? `It has ${booked} session${booked === 1 ? "" : "s"} booked. Move or cancel them before deleting the room.`
                              : "It will no longer be available for booking."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{booked > 0 ? "OK" : "Keep it"}</AlertDialogCancel>
                          {booked === 0 && (
                            <AlertDialogAction onClick={() => handleDelete(room)}>
                              Delete room
                            </AlertDialogAction>
                          )}
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <RoomDialog
          key={editing === "new" ? "new" : editing.id}
          room={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BUILDINGS, COHORTS, PHASES } from "@/lib/mockData"
import type { Room, RoomDraft, RoomType } from "@/lib/types"
import { checkRoom } from "@/lib/venues"
import { useSlotwise } from "@/store/SlotwiseContext"

const roomTypes: { value: RoomType; label: string }[] = [
  { value: "lecture", label: "Lecture" },
  { value: "lab", label: "Lab" },
  { value: "seminar", label: "Seminar" },
]

interface Props {
  /** The room to edit, or undefined to add a new one */
  room?: Room
  onClose: () => void
}

export default function RoomDialog({ room, onClose }: Props) {
  const { campus, sessions, addRoom, updateRoom } = useSlotwise()

  const [name, setName] = useState(room?.name ?? "")
  const [buildingId, setBuildingId] = useState(room?.buildingId ?? "")
  const [capacity, setCapacity] = useState(room ? String(room.capacity) : "")
  const [type, setType] = useState<RoomType>(room?.type ?? "lecture")
  const [equipment, setEquipment] = useState(room?.equipment.join(", ") ?? "")
  const [submitted, setSubmitted] = useState(false)

  const draft: RoomDraft = {
    id: room?.id,
    name: name.trim(),
    buildingId,
    capacity: Number(capacity) || 0,
    type,
    equipment: equipment
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  }
  const errors = checkRoom(draft, campus.rooms, sessions, COHORTS)

  const handleSave = () => {
    setSubmitted(true)
    if (errors.length > 0) return
    if (room) {
      updateRoom({ ...draft, id: room.id })
      toast.success("Room updated", { description: draft.name })
    } else {
      addRoom(draft)
      toast.success("Room added", { description: draft.name })
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room ? `Edit ${room.name}` : "Add a room"}</DialogTitle>
          <DialogDescription>Rooms can then be booked straight away.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Name</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MSB 103"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-building">Building</Label>
            <Select value={buildingId} onValueChange={setBuildingId}>
              <SelectTrigger id="room-building" className="w-full">
                <SelectValue placeholder="Select building" />
              </SelectTrigger>
              <SelectContent>
                {PHASES.map((p) => (
                  <SelectGroup key={p.id}>
                    <SelectLabel>{p.name}</SelectLabel>
                    {BUILDINGS.filter((b) => b.phaseId === p.id).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room-capacity">Capacity</Label>
              <Input
                id="room-capacity"
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as RoomType)}>
                <SelectTrigger id="room-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-equipment">Equipment</Label>
            <Input
              id="room-equipment"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g. Projector, PCs"
            />
          </div>

          {submitted && errors.length > 0 && (
            <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{room ? "Save changes" : "Add room"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

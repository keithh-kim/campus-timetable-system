import { CircleCheck, CircleX, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CheckResult } from "@/lib/types"
import { BUILDINGS, PHASES, ROOMS } from "@/lib/mockData"

interface Props {
  result: CheckResult
  onPickRoom: (roomId: string) => void
}

function phaseNameOfRoom(roomId: string) {
  const room = ROOMS.find((r) => r.id === roomId)
  const building = BUILDINGS.find((b) => b.id === room?.buildingId)
  return PHASES.find((p) => p.id === building?.phaseId)?.name
}

export default function CheckResults({ result, onPickRoom }: Props) {
  if (!result.complete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live checks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Choose a room, lecturer, cohort, date and times. Clashes, capacity and
            cross-phase travel time are checked as you type.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { errors, warnings, passed, suggestedRooms } = result

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Live checks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary banner */}
        {errors.length > 0 ? (
          <Alert variant="destructive">
            <CircleX />
            <AlertTitle>Can't save yet</AlertTitle>
            <AlertDescription>
              {errors.length} problem{errors.length === 1 ? "" : "s"} to fix first.
            </AlertDescription>
          </Alert>
        ) : warnings.length > 0 ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            <TriangleAlert />
            <AlertTitle>Can be saved, with a warning</AlertTitle>
            <AlertDescription className="text-amber-900/80 dark:text-amber-100/80">
              Worth a look before you confirm.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-300 bg-green-50 text-green-950 dark:border-green-800 dark:bg-green-950/30 dark:text-green-100">
            <CircleCheck />
            <AlertTitle>All clear</AlertTitle>
            <AlertDescription className="text-green-900/80 dark:text-green-100/80">
              No clashes, capacity fits, and travel time is fine.
            </AlertDescription>
          </Alert>
        )}

        {/* Details */}
        <ul className="space-y-2 text-sm">
          {errors.map((e, i) => (
            <li key={`e${i}`} className="flex gap-2">
              <CircleX className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{e.message}</span>
            </li>
          ))}
          {warnings.map((w, i) => (
            <li key={`w${i}`} className="flex gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{w.message}</span>
            </li>
          ))}
          {passed.map((p) => (
            <li key={p} className="flex gap-2 text-muted-foreground">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
              <span>{p}</span>
            </li>
          ))}
        </ul>

        {/* Suggested rooms */}
        {suggestedRooms.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Free rooms that fit</p>
            <div className="flex flex-col gap-2">
              {suggestedRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onPickRoom(room.id)}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-medium">{room.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {room.capacity} seats · {phaseNameOfRoom(room.id)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
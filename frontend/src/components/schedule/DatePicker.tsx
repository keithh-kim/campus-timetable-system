import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { parseDate, toDateString } from "@/lib/time"
import { cn } from "@/lib/utils"

interface Props {
  id?: string
  /** "YYYY-MM-DD", or "" when nothing is picked yet */
  value: string
  onChange: (date: string) => void
}

export default function DatePicker({ id, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseDate(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start font-normal",
            !selected && "text-muted-foreground"
          )}
        >
          <CalendarDays className="size-4" />
          {selected
            ? selected.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          weekStartsOn={1}
          // The timetable only shows Monday to Friday, so weekends can't be picked
          disabled={{ dayOfWeek: [0, 6] }}
          onSelect={(d) => {
            if (d) {
              onChange(toDateString(d))
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
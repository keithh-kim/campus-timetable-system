import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-md space-y-3 pt-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button asChild variant="outline">
        <Link to="/timetable">Back to timetable</Link>
      </Button>
    </div>
  )
}

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function App() {
  return (
    <div className="flex items-center gap-3 p-8">
      <Button>Slotwise is alive</Button>
      <Badge variant="secondary">Phase 2</Badge>
    </div>
  )
}
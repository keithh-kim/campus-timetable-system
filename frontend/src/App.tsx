import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { SlotwiseProvider } from "@/store/SlotwiseContext"
import AppLayout from "@/components/layout/AppLayout"
import Timetable from "@/pages/Timetable"
import ScheduleSession from "@/pages/ScheduleSession"
import RoomFinder from "@/pages/RoomFinder"
import Notifications from "@/pages/Notifications"

export default function App() {
  return (
    <SlotwiseProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/timetable" replace />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/schedule" element={<ScheduleSession />} />
            <Route path="/schedule/:id" element={<ScheduleSession />} />
            <Route path="/rooms" element={<RoomFinder />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SlotwiseProvider>
  )
}
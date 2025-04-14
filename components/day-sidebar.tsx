"use client"

import { useState } from "react"
import type { DayOfWeek } from "@/types"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DaySidebarProps {
  selectedDay: DayOfWeek
  onSelectDay: (day: DayOfWeek) => void
  onAddEvent?: (event: { title: string; day: DayOfWeek; start: string; end: string; color: string }) => void
  onRefresh?: () => void
}

const DAYS: { label: DayOfWeek; fullName: string }[] = [
  { label: "M", fullName: "Monday" },
  { label: "T", fullName: "Tuesday" },
  { label: "W", fullName: "Wednesday" },
  { label: "Th", fullName: "Thursday" },
  { label: "F", fullName: "Friday" },
  { label: "S", fullName: "Saturday" },
  { label: "Su", fullName: "Sunday" }
]

export function DaySidebar({ selectedDay, onSelectDay, onAddEvent, onRefresh }: DaySidebarProps) {
  const [showAddEventDialog, setShowAddEventDialog] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    day: selectedDay,
    start: "09:00",
    end: "10:00",
    color: "blue"
  })

  const handleAddEvent = () => {
    if (onAddEvent) {
      onAddEvent(newEvent)
    }
    setShowAddEventDialog(false)
    // Reset form
    setNewEvent({
      title: "",
      day: selectedDay,
      start: "09:00",
      end: "10:00",
      color: "blue"
    })
  }

  return (
    <div className="h-full flex flex-col bg-sidebar border-r w-20">
      <div className="flex h-14 items-center justify-center border-b px-2">
        <h2 className="text-sm font-semibold">SKED</h2>
      </div>
      <div className="flex flex-col items-center p-1 flex-1 overflow-auto justify-center">
        <div className="flex w-full flex-col items-center space-y-4">
          {DAYS.map((day) => (
            <button
              key={day.label}
              onClick={() => onSelectDay(day.label)}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-md text-sm font-medium transition-colors bg-gray-800 border border-gray-700",
                selectedDay === day.label ? "bg-blue-700 text-blue-50 border-blue-500" : "hover:bg-gray-700 text-gray-200",
              )}
              aria-label={day.fullName}
              title={day.fullName}
            >
              {day.label}
            </button>
          ))}
          
          {/* Add Event Button */}
          <button
            onClick={() => setShowAddEventDialog(true)}
            className="flex h-11 w-11 items-center justify-center rounded-md text-sm font-medium transition-colors bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200 mt-4"
            aria-label="Add new event"
            title="Add new event"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => onRefresh?.()}
            className="flex h-11 w-11 items-center justify-center rounded-md text-sm font-medium transition-colors bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200 mt-2"
            aria-label="Reset to default events"
            title="Reset to default events"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9-9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-title" className="text-right">
                Title
              </Label>
              <Input
                id="event-title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="col-span-3 bg-gray-800 border-gray-700"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-day" className="text-right">
                Day
              </Label>
              <Select 
                value={newEvent.day} 
                onValueChange={(value: DayOfWeek) => setNewEvent({ ...newEvent, day: value })}
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {DAYS.map((day) => (
                    <SelectItem key={day.label} value={day.label}>
                      {day.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-start" className="text-right">
                Start
              </Label>
              <Input
                id="event-start"
                value={newEvent.start}
                onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                placeholder="HH:MM"
                className="col-span-3 bg-gray-800 border-gray-700"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-end" className="text-right">
                End
              </Label>
              <Input
                id="event-end"
                value={newEvent.end}
                onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                placeholder="HH:MM"
                className="col-span-3 bg-gray-800 border-gray-700"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-color" className="text-right">
                Color
              </Label>
              <Select 
                value={newEvent.color} 
                onValueChange={(value) => setNewEvent({ ...newEvent, color: value })}
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleAddEvent}
              className="bg-blue-700 hover:bg-blue-800"
            >
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

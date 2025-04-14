"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { DayOfWeek, Event } from "@/types"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CalendarViewProps {
  selectedDay: DayOfWeek
  events?: Record<DayOfWeek, Event[]>
  onEventsChange?: (events: Record<DayOfWeek, Event[]>) => void
  onDayChange?: (day: DayOfWeek) => void
  onEventUpdate?: (event: Event) => Promise<void>
  onEventDelete?: (eventId: string) => Promise<void>
}

// Map day abbreviations to full day names
const DAY_NAMES: Record<DayOfWeek, string> = {
  M: "Monday",
  T: "Tuesday",
  W: "Wednesday",
  Th: "Thursday",
  F: "Friday",
  S: "Saturday",
  Su: "Sunday",
}

// Sample events for each day - we'll convert this to state
const INITIAL_EVENTS: Record<DayOfWeek, Event[]> = {
  M: [
    { id: 1, title: "Team Meeting", day: "M", start: "09:00", end: "10:00", color: "blue" },
    { id: 2, title: "Project Review", day: "M", start: "13:00", end: "14:30", color: "green" },
  ],
  T: [
    { id: 3, title: "Client Call", day: "T", start: "10:30", end: "11:30", color: "purple" },
    { id: 4, title: "Lunch with Sarah", day: "T", start: "12:00", end: "13:00", color: "yellow" },
    { id: 5, title: "Development Time", day: "T", start: "14:00", end: "17:00", color: "red" },
  ],
  W: [
    { id: 6, title: "Dentist Appointment", day: "W", start: "09:00", end: "10:00", color: "blue" },
    { id: 7, title: "Weekly Report", day: "W", start: "15:00", end: "16:00", color: "green" },
  ],
  Th: [
    { id: 8, title: "Product Demo", day: "Th", start: "11:00", end: "12:00", color: "purple" },
    { id: 9, title: "Team Building", day: "Th", start: "14:00", end: "16:00", color: "red" },
  ],
  F: [
    { id: 10, title: "Weekly Review", day: "F", start: "09:30", end: "10:30", color: "blue" },
    { id: 11, title: "Happy Hour", day: "F", start: "17:00", end: "18:30", color: "yellow" },
  ],
  S: [
    { id: 12, title: "Gym", day: "S", start: "10:00", end: "11:30", color: "green" },
    { id: 13, title: "Grocery Shopping", day: "S", start: "14:00", end: "15:00", color: "blue" },
  ],
  Su: [
    { id: 14, title: "Family Brunch", day: "Su", start: "11:00", end: "13:00", color: "yellow" },
    { id: 15, title: "Movie Night", day: "Su", start: "19:00", end: "21:30", color: "purple" },
  ],
}

// Generate time slots from 8 AM to 8 PM
const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8
  return hour < 12 ? `${hour}:00 AM` : hour === 12 ? `${hour}:00 PM` : `${hour - 12}:00 PM`
})

// Helper functions for converting between time and grid positions
const timeToPosition = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours + minutes / 60) - 8; // Subtract 8 because our grid starts at 8 AM
};

const positionToTime = (position: number): string => {
  const totalHours = position + 8; // Add 8 because our grid starts at 8 AM
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Color classes for events
const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-900 border-blue-700 text-blue-100",
  green: "bg-green-900 border-green-700 text-green-100",
  yellow: "bg-yellow-900 border-yellow-700 text-yellow-100",
  purple: "bg-purple-900 border-purple-700 text-purple-100",
  red: "bg-red-900 border-red-700 text-red-100",
};

// Empty events structure
const EMPTY_EVENTS: Record<DayOfWeek, Event[]> = {
  M: [],
  T: [],
  W: [],
  Th: [],
  F: [],
  S: [],
  Su: [],
}

export function CalendarView({ selectedDay, events = EMPTY_EVENTS, onEventsChange, onDayChange, onEventUpdate, onEventDelete }: CalendarViewProps) {
  // Use events from props if provided, otherwise fall back to local state
  const [localEventsMap, setLocalEventsMap] = useState<Record<DayOfWeek, Event[]>>(INITIAL_EVENTS)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editedEventData, setEditedEventData] = useState<Partial<Event>>({})
  const [draggingEvent, setDraggingEvent] = useState<Event | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Use events from props if available, otherwise use local state
  const eventsMap = events || localEventsMap
  const eventsForSelectedDay = eventsMap[selectedDay] || []
  const dayName = DAY_NAMES[selectedDay]

  // Handle double click/tap on event
  const handleEventDoubleClick = (event: Event) => {
    setEditingEvent(event)
    setEditedEventData(event)
  }

  // Handle saving edited event
  const handleSaveEdit = () => {
    if (!editingEvent || !editedEventData.title) return;

    const newEvents = eventsForSelectedDay.map(event => 
      event.id === editingEvent.id 
        ? { ...event, ...editedEventData }
        : event
    );

    if (onEventsChange) {
      onEventsChange({
        ...eventsMap,
        [selectedDay]: newEvents,
      });
    } else {
      setLocalEventsMap({
        ...eventsMap,
        [selectedDay]: newEvents,
      });
    }

    setEditingEvent(null);
    setEditedEventData({});
  }

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);
  
  // Swipe gesture handling
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  
  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50

  // Refs for drag functionality
  const gridRef = useRef<HTMLDivElement>(null)
  const [activeEvent, setActiveEvent] = useState<{
    id: number
    action: "move" | "resize-top" | "resize-bottom" | "resize-corner"
    startY: number
    initialTop: number
    initialHeight: number
  } | null>(null)

  // Get current date and adjust to selected day
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.

  // Map our day format to JavaScript's day of week
  const selectedDayNumber = (() => {
    switch (selectedDay) {
      case "M":
        return 1
      case "T":
        return 2
      case "W":
        return 3
      case "Th":
        return 4
      case "F":
        return 5
      case "S":
        return 6
      case "Su":
        return 7
      default:
        return 1
    }
  })()

  // Adjust dayOfWeek to make Monday (1) the first day of the week
  const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek
  // Calculate the difference to adjust the date
  const diff = selectedDayNumber - adjustedDayOfWeek
  const selectedDate = new Date(today)
  selectedDate.setDate(today.getDate() + diff)

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  // Start dragging
  const startDrag = (
    e: React.MouseEvent | React.TouchEvent,
    eventId: number,
    action: "move" | "resize-top" | "resize-bottom" | "resize-corner",
  ) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling

    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    const eventElement = e.currentTarget.closest(".event-card") as HTMLElement

    if (!eventElement || !gridRef.current) return

    const rect = eventElement.getBoundingClientRect()
    const gridRect = gridRef.current.getBoundingClientRect()

    setActiveEvent({
      id: eventId,
      action,
      startY: clientY,
      initialTop: rect.top - gridRect.top,
      initialHeight: rect.height,
    })
  }

  // Handle drag movement
  const handleDrag = (e: MouseEvent | TouchEvent) => {
    // Prevent default scrolling behavior
    e.preventDefault()
    
    if (!activeEvent || !gridRef.current) return

    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    const deltaY = clientY - activeEvent.startY
    const hourHeight = 80 // Height of each hour slot

    // Find the event we're dragging
    const event = eventsForSelectedDay.find((ev) => ev.id === activeEvent.id)
    if (!event) return

    // Create a copy of the events
    const newEvents = [...eventsForSelectedDay]
    const eventIndex = newEvents.findIndex((ev) => ev.id === activeEvent.id)

    if (activeEvent.action === "move") {
      // Calculate new position
      const newTop = Math.max(0, activeEvent.initialTop + deltaY)
      const gridHeight = gridRef.current.clientHeight
      const eventHeight = timeToPosition(event.end) - timeToPosition(event.start)
      const maxTop = gridHeight - eventHeight * hourHeight
      const clampedTop = Math.min(newTop, maxTop)

      // Convert position to time
      const startPosition = clampedTop / hourHeight
      const duration = timeToPosition(event.end) - timeToPosition(event.start)

      // Update event times
      newEvents[eventIndex] = {
        ...event,
        start: positionToTime(startPosition),
        end: positionToTime(startPosition + duration),
      }
    } else if (activeEvent.action === "resize-top") {
      // Resize from the top
      const newTop = Math.max(0, activeEvent.initialTop + deltaY)
      const endPosition = timeToPosition(event.end)
      const startPosition = newTop / hourHeight

      // Ensure minimum height (15 minutes)
      if (endPosition - startPosition < 0.25) return

      newEvents[eventIndex] = {
        ...event,
        start: positionToTime(startPosition),
      }
    } else if (activeEvent.action === "resize-bottom") {
      // Resize from the bottom
      const newHeight = Math.max(20, activeEvent.initialHeight + deltaY) // Minimum 20px height
      const startPosition = timeToPosition(event.start)
      const endPosition = startPosition + newHeight / hourHeight

      // Ensure we don't go beyond the grid (8 PM)
      const maxEndPosition = 12 // 8 PM - 8 AM = 12 hours
      const clampedEndPosition = Math.min(endPosition, maxEndPosition)

      newEvents[eventIndex] = {
        ...event,
        end: positionToTime(clampedEndPosition),
      }
    } else if (activeEvent.action === "resize-corner") {
      // Resize from the corner - this is the same as resize-bottom
      // since we're only supporting vertical resizing
      const newHeight = Math.max(20, activeEvent.initialHeight + deltaY) // Minimum 20px height
      const startPosition = timeToPosition(event.start)
      const endPosition = startPosition + newHeight / hourHeight

      // Ensure we don't go beyond the grid (8 PM)
      const maxEndPosition = 12 // 8 PM - 8 AM = 12 hours
      const clampedEndPosition = Math.min(endPosition, maxEndPosition)

      newEvents[eventIndex] = {
        ...event,
        end: positionToTime(clampedEndPosition),
      }
    }

    // Update the events for the selected day
    if (onEventsChange) {
      // If we have a callback from parent, use it
      onEventsChange({
        ...eventsMap,
        [selectedDay]: newEvents,
      });
    } else {
      // Otherwise fall back to local state
      setLocalEventsMap({
        ...eventsMap,
        [selectedDay]: newEvents,
      });
    }
  }

  // End dragging
  const endDrag = async () => {
    if (activeEvent) {
      const event = eventsForSelectedDay.find((ev) => ev.id === activeEvent.id);
      if (event && onEventUpdate) {
        await onEventUpdate(event);
      }
    }
    setActiveEvent(null)
  }
  
  // Handle event deletion
  const handleDeleteEvent = async (eventId: number) => {
    try {
      if (onEventDelete) {
        await onEventDelete(eventId.toString());
      }
      
      const newEvents = eventsForSelectedDay.filter(event => event.id !== eventId);
      
      if (onEventsChange) {
        // If we have a callback from parent, use it
        onEventsChange({
          ...eventsMap,
          [selectedDay]: newEvents,
        });
      } else {
        // Otherwise fall back to local state
        setLocalEventsMap({
          ...eventsMap,
          [selectedDay]: newEvents,
        });
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  }
  
  // Function to get the next/previous day
  const changeDay = (direction: 'next' | 'prev') => {
    if (!onDayChange) return;
    
    const dayOrder: DayOfWeek[] = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'];
    const currentIndex = dayOrder.indexOf(selectedDay);
    
    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % dayOrder.length;
      onDayChange(dayOrder[nextIndex]);
    } else {
      const prevIndex = (currentIndex - 1 + dayOrder.length) % dayOrder.length;
      onDayChange(dayOrder[prevIndex]);
    }
  }
  
  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    // Store the initial touch position
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null); // Reset end position
  }
  
  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    // Update the current touch position
    setTouchEnd(e.targetTouches[0].clientX);
  }
  
  // Handle touch end
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSignificantSwipe = Math.abs(distance) > minSwipeDistance;
    
    // If the swipe was significant enough
    if (isSignificantSwipe) {
      if (distance > 0) {
        // Swiped left (next day)
        changeDay('next');
      } else {
        // Swiped right (previous day)
        changeDay('prev');
      }
    }
    
    // Reset touch positions
    setTouchStart(null);
    setTouchEnd(null);
  }

  // Add and remove event listeners
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      // This prevents the page from scrolling during touch drag operations
      if (activeEvent) {
        e.preventDefault();
      }
    };

    if (activeEvent) {
      window.addEventListener("mousemove", handleDrag, { passive: false })
      window.addEventListener("touchmove", handleDrag, { passive: false })
      // Add this listener with the non-passive option to allow preventDefault
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      window.addEventListener("mouseup", endDrag)
      window.addEventListener("touchend", endDrag)
    }

    return () => {
      window.removeEventListener("mousemove", handleDrag)
      window.removeEventListener("touchmove", handleDrag)
      document.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("mouseup", endDrag)
      window.removeEventListener("touchend", endDrag)
    }
  }, [activeEvent, events])

  return (
    <div 
      className="flex-1 overflow-auto bg-background p-0 md:pr-6 md:pb-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fixed header for day name and date */}
      <div className="sticky top-0 z-20 bg-background px-4 md:pr-4 flex justify-end py-3">
        <div className="text-right">
          <h1 className="text-2xl font-bold">{dayName}</h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>
      </div>

      <div className="relative border rounded-lg mx-0 mr-4 md:mr-4 bg-gray-900">
        {/* Time indicators */}
        <div className="absolute top-0 bottom-0 left-0 w-12 md:w-16 border-r bg-gray-800 flex flex-col">
          {TIME_SLOTS.map((time, index) => (
            <div
              key={time}
              className="h-20 flex items-start justify-end pr-2 text-xs text-muted-foreground font-medium text-right w-full"
              style={{ marginTop: index === 0 ? "0" : "" }}
            >
              {time}
            </div>
          ))}
        </div>

        {/* Grid lines */}
        <div className="ml-12 md:ml-16 relative" ref={gridRef}>
          {TIME_SLOTS.map((time, index) => (
            <div key={time} className={cn("h-20 border-b flex items-center", index === 0 && "border-t")} />
          ))}

          {/* Current time indicator */}
          {currentTime.getHours() >= 8 && currentTime.getHours() < 20 && (
            <div 
              className="absolute left-0 right-0 flex items-center z-10"
              style={{
                top: `${(currentTime.getHours() + currentTime.getMinutes() / 60 - 8) * 80}px`,
              }}
            >
              <div className="w-full border-t-2 border-red-500" />
              <div className="absolute -left-2 w-2 h-2 rounded-full bg-red-500" />
            </div>
          )}

          {/* Events */}
          <div className="absolute top-0 left-0 right-0 bottom-0">
            {eventsForSelectedDay.map((event) => {
              const startPos = timeToPosition(event.start)
              const endPos = timeToPosition(event.end)
              const duration = endPos - startPos

              return (
                <div
                  key={event.id}
                  className={cn(
                    "event-card absolute left-2 right-2 md:left-4 md:right-4 rounded-md border p-2 shadow-sm",
                    COLOR_CLASSES[event.color],
                    activeEvent?.id === event.id ? "opacity-80 ring-2 ring-primary z-10" : "",
                  )}
                  style={{
                    top: `${startPos * 80}px`, // 80px is the height of each hour slot
                    height: `${duration * 80}px`,
                  }}
                  onMouseDown={(e) => startDrag(e, event.id, "move")}
                  onTouchStart={(e) => startDrag(e, event.id, "move")}
                  onDoubleClick={() => !activeEvent && handleEventDoubleClick(event)}
                  onTouchEnd={(e) => {
                    if (!activeEvent && e.target === e.currentTarget) {
                      handleEventDoubleClick(event);
                    }
                  }}
                >
                  {/* Resize handle - top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize z-10"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startDrag(e, event.id, "resize-top");
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      startDrag(e, event.id, "resize-top");
                    }}
                  />

                  <div className="font-medium cursor-move">{event.title}</div>
                  <div className="text-xs mt-1 cursor-move">
                    {event.start} - {event.end}
                  </div>

                  {/* Resize handle - bottom */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize z-10"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startDrag(e, event.id, "resize-bottom");
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      startDrag(e, event.id, "resize-bottom");
                    }}
                  />
                  
                  {/* Corner resize handle repurposed as delete button */}
                  <div
                    className="absolute bottom-0 right-0 w-10 h-10 cursor-pointer rounded flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDeleteEvent(event.id);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDeleteEvent(event.id);
                    }}
                    title="Delete event"
                  >
                    <svg
                      className="text-current opacity-60 hover:opacity-100"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22 22L13 13M13 22L22 13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-title" className="text-right">Title</Label>
              <Input
                id="event-title"
                value={editedEventData.title || ""}
                onChange={(e) => setEditedEventData({ ...editedEventData, title: e.target.value })}
                className="col-span-3 bg-gray-800 border-gray-700"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-start" className="text-right">Start</Label>
              <Input
                id="event-start"
                value={editedEventData.start || ""}
                onChange={(e) => setEditedEventData({ ...editedEventData, start: e.target.value })}
                className="col-span-3 bg-gray-800 border-gray-700"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-end" className="text-right">End</Label>
              <Input
                id="event-end"
                value={editedEventData.end || ""}
                onChange={(e) => setEditedEventData({ ...editedEventData, end: e.target.value })}
                className="col-span-3 bg-gray-800 border-gray-700"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-color" className="text-right">Color</Label>
              <Select 
                value={editedEventData.color} 
                onValueChange={(value: Event["color"]) => setEditedEventData({ ...editedEventData, color: value })}
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
            <Button onClick={handleSaveEdit} className="bg-blue-700 hover:bg-blue-800">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

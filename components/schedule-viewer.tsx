"use client"

import { useState, useEffect } from "react"
import { DaySidebar } from "./day-sidebar"
import { CalendarView } from "./calendar-view"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

import type { DayOfWeek, Event } from "@/types"

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

// Convert JavaScript day number to DayOfWeek type
const getCurrentDay = (): DayOfWeek => {
  const dayMap: Record<number, DayOfWeek> = {
    1: "M",
    2: "T",
    3: "W",
    4: "Th",
    5: "F",
    6: "S",
    0: "Su"  // Sunday is mapped from 0
  };
  const today = new Date().getDay();
  // Convert Sunday (0) to position 7 to keep Monday as first day
  const adjustedDay = today === 0 ? 7 : today;
  return dayMap[adjustedDay === 7 ? 0 : adjustedDay];
};

export function ScheduleViewer() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getCurrentDay())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [eventsMap, setEventsMap] = useState<Record<DayOfWeek, Event[]>>(EMPTY_EVENTS)
  const [loading, setLoading] = useState(true)

  // Fetch events from the API
  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/events')
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setEventsMap(data)
    } catch (error) {
      console.error('Error fetching events:', error)
      // You might want to show this error to the user through a toast or alert
    } finally {
      setLoading(false)
    }
  }

  // Load events on initial render
  useEffect(() => {
    fetchEvents()
  }, [])

  // Function to handle adding a new event
  const handleAddEvent = async (newEvent: { title: string; day: DayOfWeek; start: string; end: string; color: string }) => {
    const { title, day, start, end, color } = newEvent
    
    try {
      // Send the new event to the API
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, day, start, end, color })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create event')
      }
      
      // Get the created event with its ID
      const createdEvent = await response.json()
      
      // Update the local state
      setEventsMap(prevEvents => ({
        ...prevEvents,
        [day]: [...(prevEvents[day] || []), createdEvent]
      }))
      
      // Switch to the day where the event was added
      setSelectedDay(day)
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  // Function to handle updating an event
  const updateEvent = async (event: Event) => {
    try {
      const response = await fetch(`/api/events`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      // Refresh events after update
      await fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  // Function to handle deleting an event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      // Send the delete request to the API
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Refresh events to get the updated list from the server
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  }

  // Function to handle resetting events to default
  const handleRefresh = () => {
    fetchEvents();
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Mobile sidebar toggle - hidden since sidebar is always visible */}
        <div className="fixed top-4 left-4 z-50 md:hidden hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="shadow-md"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        {/* Mobile sidebar - hidden since we're using permanent sidebar */}
        <div className="hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-16">
            <DaySidebar
              selectedDay={selectedDay}
              onSelectDay={(day) => {
                setSelectedDay(day)
                setMobileOpen(false)
              }}
              onRefresh={handleRefresh}
            />
          </div>
        </div>

        {/* Permanent sidebar - visible on all screen sizes */}
        <div className="block">
          <DaySidebar 
            selectedDay={selectedDay} 
            onSelectDay={setSelectedDay}
            onAddEvent={handleAddEvent}
            onRefresh={handleRefresh}
          />
        </div>

        <CalendarView 
          selectedDay={selectedDay}
          events={eventsMap}
          onEventsChange={setEventsMap}
          onDayChange={setSelectedDay}
          onEventUpdate={updateEvent}
          onEventDelete={handleDeleteEvent}
        />
      </div>
    </SidebarProvider>
  )
}

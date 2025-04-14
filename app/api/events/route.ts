import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection string - replace with your actual connection string
const uri = process.env.MONGODB_URI || '';
const client = new MongoClient(uri);

// Type definitions for events
type EventColor = "blue" | "green" | "yellow" | "purple" | "red";
type DayOfWeek = "M" | "T" | "W" | "Th" | "F" | "S" | "Su";

interface Event {
  _id?: ObjectId;
  title: string;
  day: DayOfWeek;
  start: string;
  end: string;
  color: EventColor;
}

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    return client.db('schedule_db').collection('events');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Helper function to group events by day
function groupEventsByDay(events: Event[]) {
  const eventsByDay: Record<DayOfWeek, Event[]> = {
    M: [],
    T: [],
    W: [],
    Th: [],
    F: [],
    S: [],
    Su: [],
  };
  
  events.forEach(event => {
    if (eventsByDay[event.day]) {
      eventsByDay[event.day].push(event);
    }
  });
  
  return eventsByDay;
}

export async function GET() {
  try {
    const collection = await connectDB();
    
    // Fetch all events from MongoDB
    const events = await collection.find({}).toArray();
    
    // Transform MongoDB _id to id for frontend compatibility
    const transformedEvents = events.map(event => ({
      id: event._id.toString(),
      title: event.title,
      day: event.day,
      start: event.start,
      end: event.end,
      color: event.color
    }));
    
    // Group events by day
    const eventsByDay = groupEventsByDay(transformedEvents);
    
    return NextResponse.json(eventsByDay);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function POST(request: Request) {
  try {
    const eventData = await request.json();
    const { title, day, start, end, color } = eventData;
    
    // Validate input
    if (!title || !day || !start || !end || !color) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const collection = await connectDB();
    
    // Insert the new event
    const result = await collection.insertOne({
      title,
      day,
      start,
      end,
      color,
    });
    
    return NextResponse.json({
      id: result.insertedId.toString(),
      title,
      day,
      start,
      end,
      color
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function PUT(request: Request) {
  try {
    const eventData = await request.json();
    const { id, title, day, start, end, color } = eventData;
    
    // Validate input
    if (!id || !title || !day || !start || !end || !color) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const collection = await connectDB();
    
    // Update the event
    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          day,
          start,
          end,
          color
        }
      }
    );
    
    return NextResponse.json({ id, title, day, start, end, color });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    
    if (!idParam) {
      return NextResponse.json(
        { error: 'Missing event ID' },
        { status: 400 }
      );
    }
    
    const collection = await connectDB();
    
    // Delete the event
    await collection.deleteOne({ _id: new ObjectId(idParam) });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  } finally {
    await client.close();
  }
}

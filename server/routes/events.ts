import { Router } from "express";
import { db } from "@db";
import { events, eventRegistrations } from "@db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Get all active events
router.get("/", async (_req, res) => {
  try {
    const allEvents = await db.query.events.findMany({
      where: eq(events.isActive, true),
      orderBy: (events, { desc }) => [desc(events.featured), desc(events.startDate)],
    });
    res.json(allEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Get single event by ID
router.get("/:id", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        registrations: true,
      },
    });
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// Admin routes (require auth)
const requireAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const adminToken = authHeader?.split(" ")[1];
  
  // Check if token exists in localStorage (this is a simple auth check)
  if (!adminToken || adminToken !== process.env.ADMIN_SECRET_TOKEN) {
    const localToken = req.headers["x-admin-token"];
    if (!localToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }
  
  next();
};

// Create event schema
const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  images: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
  links: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
  })).default([]),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  capacity: z.number().nullable().optional(),
  price: z.number().nullable().optional().transform(val => val !== null && val !== undefined ? val.toString() : null),
});

// Create new event (admin only)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const validatedData = createEventSchema.parse(req.body);
    
    const [newEvent] = await db.insert(events).values({
      ...validatedData,
      updatedAt: new Date(),
    }).returning();
    
    res.json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Update event (admin only)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const validatedData = createEventSchema.partial().parse(req.body);
    
    const [updatedEvent] = await db
      .update(events)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();
    
    if (!updatedEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update event" });
  }
});

// Delete event (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    // Soft delete by setting isActive to false
    const [deletedEvent] = await db
      .update(events)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning();
    
    if (!deletedEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// Get all events for admin (including inactive)
router.get("/admin/all", requireAdmin, async (_req, res) => {
  try {
    const allEvents = await db.query.events.findMany({
      orderBy: (events, { desc }) => [desc(events.createdAt)],
      with: {
        registrations: true,
      },
    });
    res.json(allEvents);
  } catch (error) {
    console.error("Error fetching admin events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

export default router;
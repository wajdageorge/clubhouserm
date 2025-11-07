import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCourseSchema,
  insertTeeTimeSlotSchema,
  insertBookingSchema,
  insertPricingRuleSchema,
  insertCompetitorSchema,
  insertWeatherDataSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.courseId) {
        return res.status(400).json({ message: "User not associated with a course" });
      }

      const stats = await storage.getDashboardStats(user.courseId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Course routes
  app.get('/api/courses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const courses = await storage.getCoursesByUser(userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post('/api/courses', isAuthenticated, async (req, res) => {
    try {
      const validated = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validated);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.get('/api/courses/:id', isAuthenticated, async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Tee time routes
  app.get('/api/courses/:courseId/tee-times', isAuthenticated, async (req, res) => {
    try {
      const { courseId } = req.params;
      const { date } = req.query;
      const teeTimeSlots = await storage.getTeeTimeSlotsByCourse(courseId, date as string);
      res.json(teeTimeSlots);
    } catch (error) {
      console.error("Error fetching tee times:", error);
      res.status(500).json({ message: "Failed to fetch tee times" });
    }
  });

  app.post('/api/courses/:courseId/tee-times', isAuthenticated, async (req, res) => {
    try {
      const validated = insertTeeTimeSlotSchema.parse({
        ...req.body,
        courseId: req.params.courseId
      });
      const teeTimeSlot = await storage.createTeeTimeSlot(validated);
      res.status(201).json(teeTimeSlot);
    } catch (error) {
      console.error("Error creating tee time:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tee time" });
    }
  });

  app.put('/api/tee-times/:id', isAuthenticated, async (req, res) => {
    try {
      const teeTimeSlot = await storage.updateTeeTimeSlot(req.params.id, req.body);
      res.json(teeTimeSlot);
    } catch (error) {
      console.error("Error updating tee time:", error);
      res.status(500).json({ message: "Failed to update tee time" });
    }
  });

  app.delete('/api/tee-times/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTeeTimeSlot(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tee time:", error);
      res.status(500).json({ message: "Failed to delete tee time" });
    }
  });

  // Booking routes
  app.get('/api/courses/:courseId/bookings', isAuthenticated, async (req, res) => {
    try {
      const bookings = await storage.getBookingsByCourse(req.params.courseId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', async (req, res) => {
    try {
      const validated = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validated);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get('/api/bookings/:id', isAuthenticated, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.put('/api/bookings/:id', isAuthenticated, async (req, res) => {
    try {
      const booking = await storage.updateBooking(req.params.id, req.body);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Pricing rules routes
  app.get('/api/courses/:courseId/pricing-rules', isAuthenticated, async (req, res) => {
    try {
      const rules = await storage.getPricingRulesByCourse(req.params.courseId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching pricing rules:", error);
      res.status(500).json({ message: "Failed to fetch pricing rules" });
    }
  });

  app.post('/api/courses/:courseId/pricing-rules', isAuthenticated, async (req, res) => {
    try {
      const validated = insertPricingRuleSchema.parse({
        ...req.body,
        courseId: req.params.courseId
      });
      const rule = await storage.createPricingRule(validated);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating pricing rule:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create pricing rule" });
    }
  });

  app.put('/api/pricing-rules/:id', isAuthenticated, async (req, res) => {
    try {
      const rule = await storage.updatePricingRule(req.params.id, req.body);
      res.json(rule);
    } catch (error) {
      console.error("Error updating pricing rule:", error);
      res.status(500).json({ message: "Failed to update pricing rule" });
    }
  });

  // Competitor routes
  app.get('/api/courses/:courseId/competitors', isAuthenticated, async (req, res) => {
    try {
      const competitors = await storage.getCompetitorsByCourse(req.params.courseId);
      res.json(competitors);
    } catch (error) {
      console.error("Error fetching competitors:", error);
      res.status(500).json({ message: "Failed to fetch competitors" });
    }
  });

  app.post('/api/courses/:courseId/competitors', isAuthenticated, async (req, res) => {
    try {
      const validated = insertCompetitorSchema.parse({
        ...req.body,
        courseId: req.params.courseId
      });
      const competitor = await storage.createCompetitor(validated);
      res.status(201).json(competitor);
    } catch (error) {
      console.error("Error creating competitor:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create competitor" });
    }
  });

  // Competitor pricing routes
  app.get('/api/competitors/:competitorId/pricing', isAuthenticated, async (req, res) => {
    try {
      const { date } = req.query;
      const pricing = await storage.getCompetitorPricing(req.params.competitorId, date as string);
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching competitor pricing:", error);
      res.status(500).json({ message: "Failed to fetch competitor pricing" });
    }
  });

  // Weather routes
  app.get('/api/courses/:courseId/weather', async (req, res) => {
    try {
      const { date } = req.query;
      const weather = await storage.getWeatherData(req.params.courseId, date as string);
      res.json(weather);
    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ message: "Failed to fetch weather" });
    }
  });

  app.post('/api/courses/:courseId/weather', isAuthenticated, async (req, res) => {
    try {
      const validated = insertWeatherDataSchema.parse({
        ...req.body,
        courseId: req.params.courseId
      });
      const weather = await storage.createWeatherData(validated);
      res.status(201).json(weather);
    } catch (error) {
      console.error("Error creating weather data:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create weather data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

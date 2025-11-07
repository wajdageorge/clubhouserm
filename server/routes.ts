import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
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

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});

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
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);

      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Verify user owns this course
      if (!user?.courseId || user.courseId !== req.params.id) {
        return res.status(403).json({ message: "Access denied: You don't have permission to view this course" });
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
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Verify user owns this course
      if (!user?.courseId || user.courseId !== req.params.courseId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to view this course's tee times" });
      }

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
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Verify user owns this course
      if (!user?.courseId || user.courseId !== req.params.courseId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to create tee times for this course" });
      }

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
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Fetch tee time to verify course ownership
      const teeTimeSlot = await storage.getTeeTimeSlot(req.params.id);
      if (!teeTimeSlot) {
        return res.status(404).json({ message: "Tee time slot not found" });
      }

      // Verify user owns this course
      if (!user?.courseId || teeTimeSlot.courseId !== user.courseId) {
        return res.status(403).json({ message: "Access denied: This tee time belongs to a different course" });
      }

      const updatedSlot = await storage.updateTeeTimeSlot(req.params.id, req.body);
      res.json(updatedSlot);
    } catch (error) {
      console.error("Error updating tee time:", error);
      res.status(500).json({ message: "Failed to update tee time" });
    }
  });

  app.delete('/api/tee-times/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Fetch tee time to verify course ownership
      const teeTimeSlot = await storage.getTeeTimeSlot(req.params.id);
      if (!teeTimeSlot) {
        return res.status(404).json({ message: "Tee time slot not found" });
      }

      // Verify user owns this course
      if (!user?.courseId || teeTimeSlot.courseId !== user.courseId) {
        return res.status(403).json({ message: "Access denied: This tee time belongs to a different course" });
      }

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
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Verify user owns this course
      if (!user?.courseId || user.courseId !== req.params.courseId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to view this course's bookings" });
      }

      const bookings = await storage.getBookingsByCourse(req.params.courseId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      
      // Parse incoming data (without totalPrice from client)
      const { teeTimeSlotId, playerCount, customerName, customerEmail, customerPhone, notes } = req.body;
      
      // Fetch tee time slot to get base price
      const teeTimeSlot = await storage.getTeeTimeSlot(teeTimeSlotId);
      if (!teeTimeSlot) {
        return res.status(404).json({ message: "Tee time slot not found" });
      }

      if (!teeTimeSlot.isAvailable) {
        return res.status(400).json({ message: "Tee time slot is not available" });
      }

      // Fetch course to get pricing rules
      const user = await storage.getUser(userId);
      if (!user?.courseId) {
        return res.status(400).json({ message: "User not associated with a course" });
      }

      // Verify tee time belongs to user's course
      if (teeTimeSlot.courseId !== user.courseId) {
        return res.status(403).json({ message: "Access denied: This tee time belongs to a different course" });
      }

      const pricingRules = await storage.getPricingRulesByCourse(user.courseId);
      
      // Calculate price server-side
      const basePrice = parseFloat(teeTimeSlot.currentPrice);
      let totalMultiplier = 1.0;

      const slotDate = new Date(teeTimeSlot.date);
      const dayOfWeek = slotDate.getDay();
      const [hours] = teeTimeSlot.time.split(':').map(Number);

      // Apply active pricing rules
      pricingRules
        .filter(rule => rule.isActive)
        .forEach(rule => {
          const modifier = parseFloat(rule.modifier);
          const conditions = rule.conditions as any;

          switch (rule.ruleType) {
            case 'time_based':
              if (conditions?.startHour !== undefined && conditions?.endHour !== undefined) {
                if (hours >= conditions.startHour && hours < conditions.endHour) {
                  totalMultiplier *= modifier;
                }
              }
              break;

            case 'day_based':
              if (conditions?.days && Array.isArray(conditions.days)) {
                if (conditions.days.includes(dayOfWeek)) {
                  totalMultiplier *= modifier;
                }
              }
              break;
          }
        });

      // Calculate final price
      const totalPrice = (basePrice * totalMultiplier * playerCount).toFixed(2);

      // Create booking with server-calculated price
      const validated = insertBookingSchema.parse({
        teeTimeSlotId,
        customerId: userId,
        playerCount,
        totalPrice,
        customerName,
        customerEmail,
        customerPhone,
        notes,
        status: "pending",
        paymentStatus: "pending",
      });

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
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);

      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Fetch tee time to verify course ownership
      const teeTimeSlot = await storage.getTeeTimeSlot(booking.teeTimeSlotId);
      if (!teeTimeSlot) {
        return res.status(404).json({ message: "Associated tee time not found" });
      }

      // Verify user owns this course
      if (!user?.courseId || teeTimeSlot.courseId !== user.courseId) {
        return res.status(403).json({ message: "Access denied: This booking belongs to a different course" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.put('/api/bookings/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);

      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Fetch tee time to verify course ownership
      const teeTimeSlot = await storage.getTeeTimeSlot(booking.teeTimeSlotId);
      if (!teeTimeSlot) {
        return res.status(404).json({ message: "Associated tee time not found" });
      }

      // Verify user owns this course
      if (!user?.courseId || teeTimeSlot.courseId !== user.courseId) {
        return res.status(403).json({ message: "Access denied: This booking belongs to a different course" });
      }

      const updatedBooking = await storage.updateBooking(req.params.id, req.body);
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Customer routes
  app.get('/api/courses/:courseId/customers', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Verify user owns this course
      if (!user?.courseId || user.courseId !== req.params.courseId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to view this course's customers" });
      }

      const customers = await storage.getUsersByCourse(req.params.courseId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/:customerId/bookings', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Fetch the customer to verify they belong to the same course
      const customer = await storage.getUser(req.params.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Verify customer belongs to the same course as the authenticated user
      if (!user?.courseId || customer.courseId !== user.courseId) {
        return res.status(403).json({ message: "Access denied: This customer belongs to a different course" });
      }

      const bookings = await storage.getBookingsByCustomer(req.params.customerId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch customer bookings" });
    }
  });

  // Pricing rules routes
  app.get('/api/courses/:courseId/pricing-rules', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Verify user owns this course
      if (!user?.courseId || user.courseId !== req.params.courseId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to view this course's pricing rules" });
      }

      const rules = await storage.getPricingRulesByCourse(req.params.courseId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching pricing rules:", error);
      res.status(500).json({ message: "Failed to fetch pricing rules" });
    }
  });

  app.post('/api/courses/:courseId/pricing-rules', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Verify user owns this course
      if (!user?.courseId || user.courseId !== req.params.courseId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to create pricing rules for this course" });
      }

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
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);

      // Fetch pricing rule to verify course ownership
      const rule = await storage.getPricingRule(req.params.id);
      if (!rule) {
        return res.status(404).json({ message: "Pricing rule not found" });
      }

      // Verify user owns this course
      if (!user?.courseId || rule.courseId !== user.courseId) {
        return res.status(403).json({ message: "Access denied: This pricing rule belongs to a different course" });
      }

      const updatedRule = await storage.updatePricingRule(req.params.id, req.body);
      res.json(updatedRule);
    } catch (error) {
      console.error("Error updating pricing rule:", error);
      res.status(500).json({ message: "Failed to update pricing rule" });
    }
  });

  // Competitor routes
  app.get('/api/courses/:courseId/competitors', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Verify user owns this course
      if (!user?.courseId || user.courseId !== req.params.courseId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to view this course's competitors" });
      }

      const competitors = await storage.getCompetitorsByCourse(req.params.courseId);
      res.json(competitors);
    } catch (error) {
      console.error("Error fetching competitors:", error);
      res.status(500).json({ message: "Failed to fetch competitors" });
    }
  });

  app.post('/api/courses/:courseId/competitors', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Verify user owns this course
      if (!user?.courseId || user.courseId !== req.params.courseId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to create competitors for this course" });
      }

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
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);

      // Fetch competitor to verify course ownership
      const competitor = await storage.getCompetitor(req.params.competitorId);
      if (!competitor) {
        return res.status(404).json({ message: "Competitor not found" });
      }

      // Verify user owns this course
      if (!user?.courseId || competitor.courseId !== user.courseId) {
        return res.status(403).json({ message: "Access denied: This competitor belongs to a different course" });
      }

      const { date } = req.query;
      const pricing = await storage.getCompetitorPricing(req.params.competitorId, date as string);
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching competitor pricing:", error);
      res.status(500).json({ message: "Failed to fetch competitor pricing" });
    }
  });

  // Weather routes
  app.get('/api/courses/:courseId/weather', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Verify user owns this course
      if (!user?.courseId || user.courseId !== req.params.courseId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to view this course's weather data" });
      }

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
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Verify user owns this course
      if (!user?.courseId || user.courseId !== req.params.courseId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to create weather data for this course" });
      }

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

  // Stripe payment routes
  app.post('/api/create-payment-intent', isAuthenticated, async (req, res) => {
    try {
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      // Fetch booking from database to get the actual amount
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify booking belongs to authenticated user or is accessible
      const userId = (req as any).user.claims.sub;
      if (booking.customerId !== userId) {
        return res.status(403).json({ message: "Unauthorized to create payment for this booking" });
      }

      // Use server-side amount from booking
      const amount = parseFloat(booking.totalPrice);
      if (amount <= 0) {
        return res.status(400).json({ message: "Invalid booking amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          bookingId: booking.id,
          customerId: booking.customerId,
          teeTimeSlotId: booking.teeTimeSlotId,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post('/api/confirm-payment', isAuthenticated, async (req, res) => {
    try {
      const { bookingId, paymentIntentId } = req.body;

      if (!bookingId || !paymentIntentId) {
        return res.status(400).json({ message: "Missing booking ID or payment intent ID" });
      }

      // Fetch booking from database
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify booking belongs to authenticated user
      const userId = (req as any).user.claims.sub;
      if (booking.customerId !== userId) {
        return res.status(403).json({ message: "Unauthorized to confirm payment for this booking" });
      }

      // Verify payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Verify payment succeeded
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment has not succeeded" });
      }

      // Verify amount matches booking
      const expectedAmount = Math.round(parseFloat(booking.totalPrice) * 100);
      if (paymentIntent.amount !== expectedAmount) {
        return res.status(400).json({ message: "Payment amount mismatch" });
      }

      // Verify metadata matches
      if (paymentIntent.metadata.bookingId !== bookingId) {
        return res.status(400).json({ message: "Payment intent does not match booking" });
      }

      // Update booking with payment information
      await storage.updateBooking(bookingId, {
        paymentStatus: 'paid',
        paymentIntentId,
        status: 'confirmed',
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Error confirming payment: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

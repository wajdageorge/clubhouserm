import {
  users,
  courses,
  teeTimeSlots,
  bookings,
  pricingRules,
  competitors,
  competitorPricing,
  weatherData,
  type User,
  type UpsertUser,
  type Course,
  type InsertCourse,
  type TeeTimeSlot,
  type InsertTeeTimeSlot,
  type Booking,
  type InsertBooking,
  type PricingRule,
  type InsertPricingRule,
  type Competitor,
  type InsertCompetitor,
  type CompetitorPricing,
  type InsertCompetitorPricing,
  type WeatherData,
  type InsertWeatherData,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByCourse(courseId: string): Promise<User[]>;
  getBookingsByCustomer(customerId: string): Promise<Booking[]>;

  // Course operations
  getCourse(id: string): Promise<Course | undefined>;
  getCoursesByUser(userId: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course>;

  // Tee time operations
  getTeeTimeSlot(id: string): Promise<TeeTimeSlot | undefined>;
  getTeeTimeSlotsByCourse(courseId: string, date?: string): Promise<TeeTimeSlot[]>;
  createTeeTimeSlot(slot: InsertTeeTimeSlot): Promise<TeeTimeSlot>;
  updateTeeTimeSlot(id: string, slot: Partial<InsertTeeTimeSlot>): Promise<TeeTimeSlot>;
  deleteTeeTimeSlot(id: string): Promise<void>;

  // Booking operations
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByCourse(courseId: string): Promise<Booking[]>;
  getBookingsByTeeTime(teeTimeSlotId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking>;
  deleteBooking(id: string): Promise<void>;

  // Pricing rule operations
  getPricingRule(id: string): Promise<PricingRule | undefined>;
  getPricingRulesByCourse(courseId: string): Promise<PricingRule[]>;
  createPricingRule(rule: InsertPricingRule): Promise<PricingRule>;
  updatePricingRule(id: string, rule: Partial<InsertPricingRule>): Promise<PricingRule>;
  deletePricingRule(id: string): Promise<void>;

  // Competitor operations
  getCompetitor(id: string): Promise<Competitor | undefined>;
  getCompetitorsByCourse(courseId: string): Promise<Competitor[]>;
  createCompetitor(competitor: InsertCompetitor): Promise<Competitor>;
  updateCompetitor(id: string, competitor: Partial<InsertCompetitor>): Promise<Competitor>;
  deleteCompetitor(id: string): Promise<void>;

  // Competitor pricing operations
  getCompetitorPricing(competitorId: string, date?: string): Promise<CompetitorPricing[]>;
  createCompetitorPricing(pricing: InsertCompetitorPricing): Promise<CompetitorPricing>;

  // Weather operations
  getWeatherData(courseId: string, date?: string): Promise<WeatherData | undefined>;
  createWeatherData(weather: InsertWeatherData): Promise<WeatherData>;

  // Pricing engine operations
  getCompetitorRatesByDate(courseId: string, date: string): Promise<number[]>;
  getUtilizationForDate(courseId: string, date: string): Promise<number>;
  getTeeTimeSlotsCountForDate(courseId: string, date: string): Promise<{ total: number; booked: number }>;

  // Analytics operations
  getDashboardStats(courseId: string): Promise<{
    todayBookings: number;
    todayRevenue: string;
    availableSlots: number;
    utilization: number;
    weeklyRevenue: string;
    averageBooking: string;
    totalBookings: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByCourse(courseId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.courseId, courseId)).orderBy(desc(users.createdAt));
  }

  async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.customerId, customerId)).orderBy(desc(bookings.createdAt));
  }

  // Course operations
  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCoursesByUser(userId: string): Promise<Course[]> {
    const user = await this.getUser(userId);
    if (!user?.courseId) return [];
    
    return await db.select().from(courses).where(eq(courses.id, user.courseId));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...course, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  // Tee time operations
  async getTeeTimeSlot(id: string): Promise<TeeTimeSlot | undefined> {
    const [slot] = await db.select().from(teeTimeSlots).where(eq(teeTimeSlots.id, id));
    return slot;
  }

  async getTeeTimeSlotsByCourse(courseId: string, date?: string): Promise<TeeTimeSlot[]> {
    let query = db.select().from(teeTimeSlots).where(eq(teeTimeSlots.courseId, courseId));
    
    if (date) {
      query = query.where(and(eq(teeTimeSlots.courseId, courseId), eq(teeTimeSlots.date, date)));
    }
    
    return await query.orderBy(asc(teeTimeSlots.date), asc(teeTimeSlots.time));
  }

  async createTeeTimeSlot(slot: InsertTeeTimeSlot): Promise<TeeTimeSlot> {
    const [newSlot] = await db.insert(teeTimeSlots).values(slot).returning();
    return newSlot;
  }

  async updateTeeTimeSlot(id: string, slot: Partial<InsertTeeTimeSlot>): Promise<TeeTimeSlot> {
    const [updatedSlot] = await db
      .update(teeTimeSlots)
      .set({ ...slot, updatedAt: new Date() })
      .where(eq(teeTimeSlots.id, id))
      .returning();
    return updatedSlot;
  }

  async deleteTeeTimeSlot(id: string): Promise<void> {
    await db.delete(teeTimeSlots).where(eq(teeTimeSlots.id, id));
  }

  // Booking operations
  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByCourse(courseId: string): Promise<Booking[]> {
    return await db
      .select({
        id: bookings.id,
        teeTimeSlotId: bookings.teeTimeSlotId,
        customerId: bookings.customerId,
        playerCount: bookings.playerCount,
        totalPrice: bookings.totalPrice,
        status: bookings.status,
        customerName: bookings.customerName,
        customerEmail: bookings.customerEmail,
        customerPhone: bookings.customerPhone,
        notes: bookings.notes,
        paymentStatus: bookings.paymentStatus,
        paymentIntentId: bookings.paymentIntentId,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
      })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.teeTimeSlotId, teeTimeSlots.id))
      .where(eq(teeTimeSlots.courseId, courseId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingsByTeeTime(teeTimeSlotId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.teeTimeSlotId, teeTimeSlotId));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async deleteBooking(id: string): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  // Pricing rule operations
  async getPricingRule(id: string): Promise<PricingRule | undefined> {
    const [rule] = await db.select().from(pricingRules).where(eq(pricingRules.id, id));
    return rule;
  }

  async getPricingRulesByCourse(courseId: string): Promise<PricingRule[]> {
    return await db
      .select()
      .from(pricingRules)
      .where(eq(pricingRules.courseId, courseId))
      .orderBy(asc(pricingRules.priority));
  }

  async createPricingRule(rule: InsertPricingRule): Promise<PricingRule> {
    const [newRule] = await db.insert(pricingRules).values(rule).returning();
    return newRule;
  }

  async updatePricingRule(id: string, rule: Partial<InsertPricingRule>): Promise<PricingRule> {
    const [updatedRule] = await db
      .update(pricingRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(pricingRules.id, id))
      .returning();
    return updatedRule;
  }

  async deletePricingRule(id: string): Promise<void> {
    await db.delete(pricingRules).where(eq(pricingRules.id, id));
  }

  // Competitor operations
  async getCompetitor(id: string): Promise<Competitor | undefined> {
    const [competitor] = await db.select().from(competitors).where(eq(competitors.id, id));
    return competitor;
  }

  async getCompetitorsByCourse(courseId: string): Promise<Competitor[]> {
    return await db
      .select()
      .from(competitors)
      .where(eq(competitors.courseId, courseId))
      .orderBy(asc(competitors.name));
  }

  async createCompetitor(competitor: InsertCompetitor): Promise<Competitor> {
    const [newCompetitor] = await db.insert(competitors).values(competitor).returning();
    return newCompetitor;
  }

  async updateCompetitor(id: string, competitor: Partial<InsertCompetitor>): Promise<Competitor> {
    const [updatedCompetitor] = await db
      .update(competitors)
      .set({ ...competitor, updatedAt: new Date() })
      .where(eq(competitors.id, id))
      .returning();
    return updatedCompetitor;
  }

  async deleteCompetitor(id: string): Promise<void> {
    await db.delete(competitors).where(eq(competitors.id, id));
  }

  // Competitor pricing operations
  async getCompetitorPricing(competitorId: string, date?: string): Promise<CompetitorPricing[]> {
    let query = db.select().from(competitorPricing).where(eq(competitorPricing.competitorId, competitorId));
    
    if (date) {
      query = query.where(and(eq(competitorPricing.competitorId, competitorId), eq(competitorPricing.date, date)));
    }
    
    return await query.orderBy(desc(competitorPricing.createdAt));
  }

  async createCompetitorPricing(pricing: InsertCompetitorPricing): Promise<CompetitorPricing> {
    const [newPricing] = await db.insert(competitorPricing).values(pricing).returning();
    return newPricing;
  }

  // Weather operations
  async getWeatherData(courseId: string, date?: string): Promise<WeatherData | undefined> {
    let query = db.select().from(weatherData).where(eq(weatherData.courseId, courseId));
    
    if (date) {
      query = query.where(and(eq(weatherData.courseId, courseId), eq(weatherData.date, date)));
    }
    
    const [weather] = await query.orderBy(desc(weatherData.createdAt)).limit(1);
    return weather;
  }

  async createWeatherData(weather: InsertWeatherData): Promise<WeatherData> {
    const [newWeather] = await db.insert(weatherData).values(weather).returning();
    return newWeather;
  }

  async getCompetitorRatesByDate(courseId: string, date: string): Promise<number[]> {
    const courseCompetitors = await db.select().from(competitors).where(eq(competitors.courseId, courseId));
    if (courseCompetitors.length === 0) return [];

    const competitorIds = courseCompetitors.map(c => c.id);
    const rates: number[] = [];

    for (const compId of competitorIds) {
      const pricing = await db
        .select()
        .from(competitorPricing)
        .where(and(eq(competitorPricing.competitorId, compId), eq(competitorPricing.date, date)));
      for (const p of pricing) {
        rates.push(parseFloat(p.price));
      }
    }

    return rates;
  }

  async getUtilizationForDate(courseId: string, date: string): Promise<number> {
    const counts = await this.getTeeTimeSlotsCountForDate(courseId, date);
    if (counts.total === 0) return 0;
    return (counts.booked / counts.total) * 100;
  }

  async getTeeTimeSlotsCountForDate(courseId: string, date: string): Promise<{ total: number; booked: number }> {
    const allSlots = await db
      .select()
      .from(teeTimeSlots)
      .where(and(eq(teeTimeSlots.courseId, courseId), eq(teeTimeSlots.date, date)));

    const total = allSlots.length;
    const booked = allSlots.filter(s => !s.isAvailable).length;

    const confirmedBookings = await db
      .select()
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.teeTimeSlotId, teeTimeSlots.id))
      .where(and(
        eq(teeTimeSlots.courseId, courseId),
        eq(teeTimeSlots.date, date),
        eq(bookings.status, 'confirmed')
      ));

    const bookedFromBookings = confirmedBookings.length;

    return { total, booked: Math.max(booked, bookedFromBookings) };
  }

  // Analytics operations
  async getDashboardStats(courseId: string): Promise<{
    todayBookings: number;
    todayRevenue: string;
    availableSlots: number;
    utilization: number;
    weeklyRevenue: string;
    averageBooking: string;
    totalBookings: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's bookings
    const todayBookingsResult = await db
      .select()
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.teeTimeSlotId, teeTimeSlots.id))
      .where(and(
        eq(teeTimeSlots.courseId, courseId),
        eq(teeTimeSlots.date, today),
        eq(bookings.status, 'confirmed')
      ));

    const todayBookings = todayBookingsResult.length;
    const todayRevenue = todayBookingsResult.reduce((sum, booking) => sum + parseFloat(booking.bookings.totalPrice), 0);

    // Get available slots for today
    const availableSlotsResult = await db
      .select()
      .from(teeTimeSlots)
      .where(and(
        eq(teeTimeSlots.courseId, courseId),
        eq(teeTimeSlots.date, today),
        eq(teeTimeSlots.isAvailable, true)
      ));

    const totalSlots = availableSlotsResult.length;
    const availableSlots = totalSlots - todayBookings;
    const utilization = totalSlots > 0 ? Math.round((todayBookings / totalSlots) * 100) : 0;

    // Get weekly stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const weeklyBookingsResult = await db
      .select()
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.teeTimeSlotId, teeTimeSlots.id))
      .where(and(
        eq(teeTimeSlots.courseId, courseId),
        gte(teeTimeSlots.date, weekAgoStr),
        eq(bookings.status, 'confirmed')
      ));

    const weeklyRevenue = weeklyBookingsResult.reduce((sum, booking) => sum + parseFloat(booking.bookings.totalPrice), 0);
    const totalBookings = weeklyBookingsResult.length;
    const averageBooking = totalBookings > 0 ? weeklyRevenue / totalBookings : 0;

    return {
      todayBookings,
      todayRevenue: todayRevenue.toFixed(2),
      availableSlots,
      utilization,
      weeklyRevenue: weeklyRevenue.toFixed(2),
      averageBooking: averageBooking.toFixed(2),
      totalBookings,
    };
  }
}

export const storage = new DatabaseStorage();

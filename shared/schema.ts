import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  decimal,
  boolean,
  text,
  date,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "manager", "staff", "customer"] }).notNull().default("customer"),
  courseId: varchar("course_id").references(() => courses.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  address: text("address"),
  phone: varchar("phone"),
  email: varchar("email"),
  website: varchar("website"),
  holes: integer("holes").notNull().default(18),
  par: integer("par").notNull().default(72),
  yardage: integer("yardage"),
  rating: decimal("rating", { precision: 3, scale: 1 }),
  slope: integer("slope"),
  timezone: varchar("timezone").notNull().default("America/New_York"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teeTimeSlots = pgTable("tee_time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  date: date("date").notNull(),
  time: time("time").notNull(),
  maxPlayers: integer("max_players").notNull().default(4),
  basePrice: decimal("base_price", { precision: 8, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 8, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  holes: integer("holes").notNull().default(18),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teeTimeSlotId: varchar("tee_time_slot_id").notNull().references(() => teeTimeSlots.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  playerCount: integer("player_count").notNull(),
  totalPrice: decimal("total_price", { precision: 8, scale: 2 }).notNull(),
  status: varchar("status", { enum: ["pending", "confirmed", "cancelled", "completed"] }).notNull().default("pending"),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerPhone: varchar("customer_phone"),
  notes: text("notes"),
  paymentStatus: varchar("payment_status", { enum: ["pending", "paid", "refunded"] }).notNull().default("pending"),
  paymentIntentId: varchar("payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pricingRules = pgTable("pricing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  name: varchar("name").notNull(),
  description: text("description"),
  ruleType: varchar("rule_type", { enum: ["time_based", "day_based", "weather_based", "utilization_based", "lead_time"] }).notNull(),
  modifier: decimal("modifier", { precision: 5, scale: 2 }).notNull(), // e.g., 1.25 for +25%, 0.8 for -20%
  conditions: jsonb("conditions").notNull(), // Store rule conditions as JSON
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(1),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const competitors = pgTable("competitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  name: varchar("name").notNull(),
  website: varchar("website"),
  address: text("address"),
  phone: varchar("phone"),
  distance: decimal("distance", { precision: 5, scale: 2 }), // Distance in miles
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const competitorPricing = pgTable("competitor_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitorId: varchar("competitor_id").notNull().references(() => competitors.id),
  date: date("date").notNull(),
  time: time("time"),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  holes: integer("holes").notNull().default(18),
  playerCount: integer("player_count").notNull().default(1),
  scraped: boolean("scraped").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weatherData = pgTable("weather_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  date: date("date").notNull(),
  temperature: integer("temperature"),
  humidity: integer("humidity"),
  windSpeed: integer("wind_speed"),
  precipitation: integer("precipitation"),
  condition: varchar("condition"),
  icon: varchar("icon"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  course: one(courses, {
    fields: [users.courseId],
    references: [courses.id],
  }),
  bookings: many(bookings),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  users: many(users),
  teeTimeSlots: many(teeTimeSlots),
  pricingRules: many(pricingRules),
  competitors: many(competitors),
  weatherData: many(weatherData),
}));

export const teeTimeSlotsRelations = relations(teeTimeSlots, ({ one, many }) => ({
  course: one(courses, {
    fields: [teeTimeSlots.courseId],
    references: [courses.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  teeTimeSlot: one(teeTimeSlots, {
    fields: [bookings.teeTimeSlotId],
    references: [teeTimeSlots.id],
  }),
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
  }),
}));

export const pricingRulesRelations = relations(pricingRules, ({ one }) => ({
  course: one(courses, {
    fields: [pricingRules.courseId],
    references: [courses.id],
  }),
}));

export const competitorsRelations = relations(competitors, ({ one, many }) => ({
  course: one(courses, {
    fields: [competitors.courseId],
    references: [courses.id],
  }),
  pricing: many(competitorPricing),
}));

export const competitorPricingRelations = relations(competitorPricing, ({ one }) => ({
  competitor: one(competitors, {
    fields: [competitorPricing.competitorId],
    references: [competitors.id],
  }),
}));

export const weatherDataRelations = relations(weatherData, ({ one }) => ({
  course: one(courses, {
    fields: [weatherData.courseId],
    references: [courses.id],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

export type TeeTimeSlot = typeof teeTimeSlots.$inferSelect;
export type InsertTeeTimeSlot = typeof teeTimeSlots.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = typeof pricingRules.$inferInsert;

export type Competitor = typeof competitors.$inferSelect;
export type InsertCompetitor = typeof competitors.$inferInsert;

export type CompetitorPricing = typeof competitorPricing.$inferSelect;
export type InsertCompetitorPricing = typeof competitorPricing.$inferInsert;

export type WeatherData = typeof weatherData.$inferSelect;
export type InsertWeatherData = typeof weatherData.$inferInsert;

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertCourseSchema = createInsertSchema(courses).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertTeeTimeSlotSchema = createInsertSchema(teeTimeSlots).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertCompetitorSchema = createInsertSchema(competitors).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertWeatherDataSchema = createInsertSchema(weatherData).omit({ 
  id: true, 
  createdAt: true 
});

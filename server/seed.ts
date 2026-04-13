import { db } from "./db";
import {
  courses,
  users,
  teeTimeSlots,
  bookings,
  pricingRules,
  competitors,
  competitorPricing,
} from "@shared/schema";
import { eq, ilike, inArray } from "drizzle-orm";

// ─── Name pools ──────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Barbara", "David", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
  "Steven", "Dorothy", "Paul", "Kimberly", "Andrew", "Emily", "Joshua", "Donna",
  "Kenneth", "Michelle", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
  "Timothy", "Deborah",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen",
  "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera",
  "Campbell", "Mitchell", "Carter", "Roberts",
];

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Generate HH:MM slots from 06:00 to 18:00, every 10 minutes (73 slots/day). */
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 18; h++) {
    for (let m = 0; m < 60; m += 10) {
      if (h === 18 && m > 0) break;
      slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }
  return slots; // 73 entries
}

/** Base price varies by time of day to reflect real-world pricing. */
function getBasePrice(timeStr: string): number {
  const h = parseInt(timeStr.split(":")[0], 10);
  if (h < 7) return 42;   // Early bird 6am–7am
  if (h < 8) return 52;   // Pre-peak 7am–8am
  if (h < 12) return 68;  // Peak morning 8am–noon
  if (h < 14) return 62;  // Midday 12pm–2pm
  if (h < 16) return 55;  // Afternoon 2pm–4pm
  return 44;               // Twilight 4pm–6pm
}

/** Probability that a slot is booked, weighted by time and day. */
function occupancyProb(hour: number, dayOfWeek: number): number {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  let p: number;
  if (hour < 7) p = 0.12;
  else if (hour < 8) p = 0.28;
  else if (hour < 11) p = 0.62; // peak demand
  else if (hour < 13) p = 0.50;
  else if (hour < 15) p = 0.38;
  else if (hour < 17) p = 0.26;
  else p = 0.13; // twilight
  return isWeekend ? Math.min(p * 1.6, 0.85) : p;
}

/** Deterministic pseudo-random — avoids Math.random() for reproducible seeds. */
function drand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Main seed ────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting database seed...\n");

  // ── 1. Course ──────────────────────────────────────────────────────────────
  let [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.name, "Pineview Golf Club"))
    .limit(1);

  if (!course) {
    [course] = await db
      .insert(courses)
      .values({
        name: "Pineview Golf Club",
        description:
          "Championship 18-hole golf course with stunning mountain views and challenging fairways",
        address: "123 Golf Course Drive, Boulder, CO 80301",
        phone: "(303) 555-0100",
        email: "info@pineviewgolf.com",
        website: "https://pineviewgolf.com",
        holes: 18,
        par: 72,
        yardage: 6800,
        rating: "72.5",
        slope: 135,
        timezone: "America/Denver",
        isActive: true,
      })
      .returning();
    console.log(`✓ Created course: ${course.name}`);
  } else {
    console.log(`✓ Using existing course: ${course.name} (${course.id})`);
  }

  // ── 2. Pricing rules ───────────────────────────────────────────────────────
  const existingRules = await db
    .select()
    .from(pricingRules)
    .where(eq(pricingRules.courseId, course.id));

  if (existingRules.length === 0) {
    await db.insert(pricingRules).values([
      {
        courseId: course.id,
        name: "Weekend Premium",
        description: "Saturday and Sunday +25%",
        ruleType: "day_based",
        modifier: "1.25",
        conditions: { days: [0, 6] },
        isActive: true,
        priority: 1,
      },
      {
        courseId: course.id,
        name: "Peak Hours",
        description: "8:00 AM – 11:00 AM +20%",
        ruleType: "time_based",
        modifier: "1.20",
        conditions: { startHour: 8, endHour: 11 },
        isActive: true,
        priority: 2,
      },
      {
        courseId: course.id,
        name: "Twilight Discount",
        description: "After 4:00 PM −20%",
        ruleType: "time_based",
        modifier: "0.80",
        conditions: { startHour: 16, endHour: 20 },
        isActive: true,
        priority: 3,
      },
      {
        courseId: course.id,
        name: "Early Bird Special",
        description: "Before 7:00 AM −15%",
        ruleType: "time_based",
        modifier: "0.85",
        conditions: { startHour: 6, endHour: 7 },
        isActive: true,
        priority: 4,
      },
      {
        courseId: course.id,
        name: "Last-Minute Discount",
        description: "Booked same-day −10%",
        ruleType: "lead_time",
        modifier: "0.90",
        conditions: { maxHours: 4 },
        isActive: true,
        priority: 5,
      },
    ]);
    console.log("✓ Created 5 pricing rules");
  } else {
    console.log(`✓ ${existingRules.length} pricing rules already exist`);
  }

  // ── 3. Competitors ─────────────────────────────────────────────────────────
  const existingCompetitors = await db
    .select()
    .from(competitors)
    .where(eq(competitors.courseId, course.id));

  if (existingCompetitors.length === 0) {
    const today = new Date().toISOString().split("T")[0];
    const competitorData = [
      {
        courseId: course.id,
        name: "Oak Hills Country Club",
        website: "https://oakhillscc.com",
        address: "456 Oak Hills Road, Boulder, CO 80302",
        phone: "(303) 555-0200",
        distance: "3.5",
        isActive: true,
      },
      {
        courseId: course.id,
        name: "Meadowbrook Golf Course",
        website: "https://meadowbrookgolf.com",
        address: "789 Meadow Lane, Boulder, CO 80303",
        phone: "(303) 555-0300",
        distance: "5.2",
        isActive: true,
      },
      {
        courseId: course.id,
        name: "Mountain Vista Golf Club",
        website: "https://mountainvistagolf.com",
        address: "321 Vista Drive, Boulder, CO 80304",
        phone: "(303) 555-0400",
        distance: "7.8",
        isActive: true,
      },
    ];
    const createdComps = await db
      .insert(competitors)
      .values(competitorData)
      .returning();

    // Sample pricing for each competitor
    const pricingRows = [];
    const compPrices = [52, 58, 68];
    for (let i = 0; i < createdComps.length; i++) {
      for (const timeStr of ["08:00", "10:00", "12:00", "14:00"]) {
        pricingRows.push({
          competitorId: createdComps[i].id,
          date: today,
          time: timeStr,
          price: (compPrices[i] + Math.floor(drand(i * 7 + compPrices[i]) * 10)).toFixed(2),
          holes: 18,
          playerCount: 1,
          scraped: false,
        });
      }
    }
    await db.insert(competitorPricing).values(pricingRows);
    console.log(`✓ Created ${createdComps.length} competitors with sample pricing`);
  } else {
    console.log(`✓ ${existingCompetitors.length} competitors already exist`);
  }

  // ── 4. Mock customers ──────────────────────────────────────────────────────
  const existingCustomers = await db
    .select()
    .from(users)
    .where(ilike(users.email, "%@pineviewgc.test"));

  let customerIds: string[];

  if (existingCustomers.length < 50) {
    const customerData = FIRST_NAMES.map((firstName, i) => {
      const lastName = LAST_NAMES[i % LAST_NAMES.length];
      return {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@pineviewgc.test`,
        firstName,
        lastName,
        courseId: course.id,
        role: "customer" as const,
      };
    });

    const created = await db
      .insert(users)
      .values(customerData)
      .onConflictDoNothing()
      .returning();

    if (created.length > 0) {
      customerIds = created.map((c) => c.id);
      console.log(`✓ Created ${created.length} mock customers`);
    } else {
      const refetched = await db
        .select()
        .from(users)
        .where(ilike(users.email, "%@pineviewgc.test"));
      customerIds = refetched.map((c) => c.id);
      console.log(`✓ Found ${customerIds.length} existing mock customers`);
    }
  } else {
    customerIds = existingCustomers.map((c) => c.id);
    console.log(`✓ ${customerIds.length} mock customers already exist`);
  }

  // ── 5. Tee time slots ──────────────────────────────────────────────────────
  const existingSlotCount = await db
    .select()
    .from(teeTimeSlots)
    .where(eq(teeTimeSlots.courseId, course.id));

  if (existingSlotCount.length > 500) {
    console.log(
      `✓ Already have ${existingSlotCount.length} tee time slots — skipping slot+booking generation`
    );
    console.log("\n✅ Database seed complete (already populated)!");
    return;
  }

  const times = generateTimeSlots(); // 73 slots/day
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  // 15 days back + today + 14 days forward = 30 days
  const dates: string[] = [];
  for (let d = -15; d <= 14; d++) {
    const dt = new Date(todayMidnight);
    dt.setDate(todayMidnight.getDate() + d);
    dates.push(dt.toISOString().split("T")[0]);
  }

  const totalExpected = dates.length * times.length;
  console.log(
    `\n📅 Generating ${dates.length} days × ${times.length} slots = ${totalExpected} tee times...`
  );

  // Build all slot values
  const slotValues: any[] = [];
  for (const dateStr of dates) {
    for (const time of times) {
      slotValues.push({
        courseId: course.id,
        date: dateStr,
        time,
        maxPlayers: 4,
        basePrice: getBasePrice(time).toFixed(2),
        currentPrice: getBasePrice(time).toFixed(2),
        isAvailable: true,
        holes: 18,
      });
    }
  }

  // Batch insert slots (100 at a time)
  const BATCH = 100;
  const insertedSlots: any[] = [];
  for (let i = 0; i < slotValues.length; i += BATCH) {
    const chunk = await db
      .insert(teeTimeSlots)
      .values(slotValues.slice(i, i + BATCH))
      .onConflictDoNothing()
      .returning();
    insertedSlots.push(...chunk);
  }
  console.log(`✓ Inserted ${insertedSlots.length} tee time slots`);

  // ── 6. Mock bookings (~40% occupancy) ─────────────────────────────────────
  console.log("📋 Generating mock bookings...");

  const bookingValues: any[] = [];
  const slotsToMarkBooked: string[] = [];
  let seedVal = 1;

  for (const slot of insertedSlots) {
    const slotDate = new Date(slot.date + "T00:00:00");
    const dayOfWeek = slotDate.getDay();
    const hour = parseInt(slot.time.split(":")[0], 10);

    const prob = occupancyProb(hour, dayOfWeek);
    const rand = drand(seedVal++);

    if (rand < prob && customerIds.length > 0) {
      const cidx = Math.floor(drand(seedVal + 1000) * customerIds.length);
      const customerId = customerIds[cidx];
      const playerCount = Math.max(1, Math.ceil(drand(seedVal + 2000) * 4));

      const basePrice = parseFloat(slot.basePrice);
      // Apply a simple weekend multiplier to mimic the pricing engine
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const pricePerPlayer = isWeekend ? basePrice * 1.25 : basePrice;
      const totalPrice = (pricePerPlayer * playerCount).toFixed(2);

      // Past = completed + paid; today/future = confirmed + pending
      const isPast = slotDate < todayMidnight;
      const status = isPast ? "completed" : "confirmed";
      const paymentStatus = isPast ? "paid" : "pending";

      const firstName = FIRST_NAMES[cidx % FIRST_NAMES.length];
      const lastName = LAST_NAMES[cidx % LAST_NAMES.length];

      bookingValues.push({
        teeTimeSlotId: slot.id,
        customerId,
        playerCount,
        totalPrice,
        customerName: `${firstName} ${lastName}`,
        customerEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${cidx}@pineviewgc.test`,
        customerPhone: `(303) 555-${String((cidx * 173 + 1000) % 9000 + 1000)}`,
        status,
        paymentStatus,
        notes: null,
      });
      slotsToMarkBooked.push(slot.id);
    }
  }

  // Batch insert bookings
  const insertedBookings: any[] = [];
  for (let i = 0; i < bookingValues.length; i += BATCH) {
    const chunk = await db
      .insert(bookings)
      .values(bookingValues.slice(i, i + BATCH))
      .onConflictDoNothing()
      .returning();
    insertedBookings.push(...chunk);
  }
  console.log(
    `✓ Created ${insertedBookings.length} bookings` +
    ` (~${Math.round((insertedBookings.length / insertedSlots.length) * 100)}% occupancy)`
  );

  // Mark booked slots as unavailable (batched inArray updates)
  if (slotsToMarkBooked.length > 0) {
    for (let i = 0; i < slotsToMarkBooked.length; i += 500) {
      const chunk = slotsToMarkBooked.slice(i, i + 500);
      await db
        .update(teeTimeSlots)
        .set({ isAvailable: false })
        .where(inArray(teeTimeSlots.id, chunk));
    }
    console.log(`✓ Marked ${slotsToMarkBooked.length} slots as unavailable`);
  }

  console.log("\n✅ Database seed complete!");
  console.log(
    `   Course: ${course.name}\n` +
    `   Customers: ${customerIds.length}\n` +
    `   Slots: ${insertedSlots.length} (${dates.length} days × ${times.length} per day)\n` +
    `   Bookings: ${insertedBookings.length}`
  );
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));

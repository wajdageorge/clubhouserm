import { db } from "./db";
import { courses, users, teeTimeSlots, bookings, pricingRules, competitors, competitorPricing } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Create a sample golf course
    const [course] = await db
      .insert(courses)
      .values({
        name: "Pineview Golf Club",
        description: "Championship 18-hole golf course with stunning mountain views",
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
      .onConflictDoNothing()
      .returning();

    if (!course) {
      console.log("✓ Course already exists");
      const [existingCourse] = await db
        .select()
        .from(courses)
        .where(eq(courses.name, "Pineview Golf Club"))
        .limit(1);
      
      if (!existingCourse) {
        throw new Error("Failed to create or find course");
      }
      
      console.log("✓ Using existing course:", existingCourse.id);
      await seedTeeTimesAndRules(existingCourse.id);
      return;
    }

    console.log("✓ Created course:", course.name);
    await seedTeeTimesAndRules(course.id);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

async function seedTeeTimesAndRules(courseId: string) {
  // Create pricing rules
  const weekendRule = await db
    .insert(pricingRules)
    .values({
      courseId,
      name: "Weekend Premium",
      description: "Saturdays and Sundays +25%",
      ruleType: "day_based",
      modifier: "1.25",
      conditions: { days: [0, 6] }, // Sunday, Saturday
      isActive: true,
      priority: 1,
    })
    .onConflictDoNothing()
    .returning();

  if (weekendRule.length > 0) {
    console.log("✓ Created pricing rule: Weekend Premium");
  }

  const peakHoursRule = await db
    .insert(pricingRules)
    .values({
      courseId,
      name: "Peak Hours Premium",
      description: "8:00 AM - 11:00 AM +15%",
      ruleType: "time_based",
      modifier: "1.15",
      conditions: { startHour: 8, endHour: 11 },
      isActive: true,
      priority: 2,
    })
    .onConflictDoNothing()
    .returning();

  if (peakHoursRule.length > 0) {
    console.log("✓ Created pricing rule: Peak Hours Premium");
  }

  const twilightRule = await db
    .insert(pricingRules)
    .values({
      courseId,
      name: "Twilight Discount",
      description: "After 4:00 PM -20%",
      ruleType: "time_based",
      modifier: "0.80",
      conditions: { startHour: 16, endHour: 20 },
      isActive: true,
      priority: 3,
    })
    .onConflictDoNothing()
    .returning();

  if (twilightRule.length > 0) {
    console.log("✓ Created pricing rule: Twilight Discount");
  }

  // Create tee time slots for today and tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dates = [
    today.toISOString().split('T')[0],
    tomorrow.toISOString().split('T')[0],
  ];

  const times = [
    "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
  ];

  let slotsCreated = 0;
  for (const date of dates) {
    for (const time of times) {
      const basePrice = 55;
      
      const [slot] = await db
        .insert(teeTimeSlots)
        .values({
          courseId,
          date,
          time,
          maxPlayers: 4,
          basePrice: basePrice.toFixed(2),
          currentPrice: basePrice.toFixed(2),
          isAvailable: true,
          holes: 18,
        })
        .onConflictDoNothing()
        .returning();

      if (slot) {
        slotsCreated++;
      }
    }
  }

  if (slotsCreated > 0) {
    console.log(`✓ Created ${slotsCreated} tee time slots`);
  } else {
    console.log("✓ Tee time slots already exist");
  }

  // Create competitors
  const competitor1 = await db
    .insert(competitors)
    .values({
      courseId,
      name: "Oak Hills Country Club",
      website: "https://oakhillscc.com",
      address: "456 Oak Hills Road, Boulder, CO 80302",
      phone: "(303) 555-0200",
      distance: "3.5",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  if (competitor1.length > 0) {
    console.log("✓ Created competitor: Oak Hills Country Club");
    
    // Add sample pricing for competitor
    await db
      .insert(competitorPricing)
      .values({
        competitorId: competitor1[0].id,
        date: dates[0],
        time: "08:00",
        price: "52.00",
        holes: 18,
        playerCount: 1,
        scraped: false,
      })
      .onConflictDoNothing();
  }

  const competitor2 = await db
    .insert(competitors)
    .values({
      courseId,
      name: "Meadowbrook Golf Course",
      website: "https://meadowbrookgolf.com",
      address: "789 Meadow Lane, Boulder, CO 80303",
      phone: "(303) 555-0300",
      distance: "5.2",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  if (competitor2.length > 0) {
    console.log("✓ Created competitor: Meadowbrook Golf Course");
    
    // Add sample pricing for competitor
    await db
      .insert(competitorPricing)
      .values({
        competitorId: competitor2[0].id,
        date: dates[0],
        time: "08:00",
        price: "58.00",
        holes: 18,
        playerCount: 1,
        scraped: false,
      })
      .onConflictDoNothing();
  }

  const competitor3 = await db
    .insert(competitors)
    .values({
      courseId,
      name: "Mountain Vista Golf Club",
      website: "https://mountainvistagolf.com",
      address: "321 Vista Drive, Boulder, CO 80304",
      phone: "(303) 555-0400",
      distance: "7.8",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  if (competitor3.length > 0) {
    console.log("✓ Created competitor: Mountain Vista Golf Club");
    
    // Add sample pricing for competitor
    await db
      .insert(competitorPricing)
      .values({
        competitorId: competitor3[0].id,
        date: dates[0],
        time: "08:00",
        price: "68.00",
        holes: 18,
        playerCount: 1,
        scraped: false,
      })
      .onConflictDoNothing();
  }

  console.log("✅ Database seeding completed successfully!");
}

seed()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

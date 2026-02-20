import { storage } from "../storage";
import type { TeeTimeSlot, PricingRule, WeatherData } from "@shared/schema";

// ─── Default Fallback Multipliers ────────────────────────────────────────────
// Used when no matching PricingRule is found in the database for a given type.

const DEFAULTS = {
  timeOfDay: {
    morning:  1.20,   // Before 11:00 AM — peak demand
    midday:   1.00,   // 11:00 AM – 3:00 PM — standard
    twilight: 0.75,   // After 3:00 PM — discounted
  },
  utilization: {
    highThreshold: 85,   // % booked → surge pricing
    highMultiplier: 1.15,
    lowThreshold:  30,   // % booked within 48 hrs → discount
    lowMultiplier:  0.80,
    normalMultiplier: 1.00,
  },
  weather: {
    rain:         0.80,
    perfectLow:   65,
    perfectHigh:  80,
    perfectMultiplier: 1.05,
    normalMultiplier:  1.00,
  },
  leadTime: {
    shortHours: 48,  // "last-minute" window
    highUtilMultiplier: 1.15,  // < 48h + high utilization → surge
    lowUtilMultiplier:  0.75,  // < 48h + low utilization  → discount
    normalMultiplier:   1.00,
  },
  marketCap: {
    maxExceedPct: 0.10,  // Never exceed max competitor by more than 10%
  },
};

// ─── Condition Interfaces ────────────────────────────────────────────────────

export interface CurrentConditions {
  weatherCondition?: string;    // "rain", "clear", "cloudy", etc.
  temperature?: number;         // Fahrenheit
  overrideUtilization?: number; // Allow manual override for testing
}

export interface PricingBreakdown {
  teeTimeId: string;
  date: string;
  timeSlot: string;
  basePrice: number;
  timeOfDayMultiplier: number;
  utilizationMultiplier: number;
  weatherMultiplier: number;
  leadTimeMultiplier: number;
  rawCalculatedPrice: number;
  competitorCapApplied: boolean;
  maxCompetitorPrice: number | null;
  competitorCapLimit: number | null;
  finalPrice: number;
  appliedRules: string[];
}

// ─── Helper: classify time slot ──────────────────────────────────────────────

function classifyTimeOfDay(timeStr: string): "morning" | "midday" | "twilight" {
  const [hours] = timeStr.split(":").map(Number);
  if (hours < 11) return "morning";
  if (hours < 15) return "midday";
  return "twilight";
}

// ─── Helper: hours until tee time ────────────────────────────────────────────

function hoursUntilTeeTime(date: string, time: string): number {
  const teeDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  return (teeDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
}

// ─── Helper: find matching DB rule ───────────────────────────────────────────

function findRuleByType(
  rules: PricingRule[],
  ruleType: string,
  matchFn?: (conditions: any) => boolean
): PricingRule | undefined {
  return rules
    .filter(r => r.isActive && r.ruleType === ruleType)
    .sort((a, b) => b.priority - a.priority) // higher priority first
    .find(r => {
      if (!matchFn) return true;
      return matchFn(r.conditions as any);
    });
}

// ─── Main Pricing Function ───────────────────────────────────────────────────

export async function calculateDynamicPrice(
  teeTimeId: string,
  currentConditions: CurrentConditions = {}
): Promise<PricingBreakdown> {
  const teeTime = await storage.getTeeTimeSlot(teeTimeId);
  if (!teeTime) {
    throw new Error(`Tee time slot not found: ${teeTimeId}`);
  }

  const basePrice = parseFloat(teeTime.basePrice);
  const courseId = teeTime.courseId;
  const date = teeTime.date;
  const timeSlot = teeTime.time;

  const dbRules = await storage.getPricingRulesByCourse(courseId);
  const appliedRules: string[] = [];

  // ── 1. Time of Day Multiplier ──────────────────────────────────────────

  let timeOfDayMultiplier = DEFAULTS.timeOfDay.midday;
  const timeCategory = classifyTimeOfDay(timeSlot);

  const timeRule = findRuleByType(dbRules, "time_based", (cond) => {
    if (!cond?.startHour && cond?.startHour !== 0) return false;
    const [hours] = timeSlot.split(":").map(Number);
    return hours >= cond.startHour && hours < cond.endHour;
  });

  if (timeRule) {
    timeOfDayMultiplier = parseFloat(timeRule.modifier);
    appliedRules.push(`DB Rule: ${timeRule.name} (time_based) → ${timeOfDayMultiplier}x`);
  } else {
    timeOfDayMultiplier = DEFAULTS.timeOfDay[timeCategory];
    appliedRules.push(`Fallback: ${timeCategory} time_of_day → ${timeOfDayMultiplier}x`);
  }

  // ── 2. Utilization Multiplier ──────────────────────────────────────────

  let utilizationMultiplier = DEFAULTS.utilization.normalMultiplier;
  const utilization =
    currentConditions.overrideUtilization ??
    (await storage.getUtilizationForDate(courseId, date));

  const utilRule = findRuleByType(dbRules, "utilization_based", (cond) => {
    if (cond?.minUtil !== undefined && utilization >= cond.minUtil) return true;
    if (cond?.maxUtil !== undefined && utilization <= cond.maxUtil) return true;
    return false;
  });

  if (utilRule) {
    utilizationMultiplier = parseFloat(utilRule.modifier);
    appliedRules.push(`DB Rule: ${utilRule.name} (utilization_based @ ${utilization.toFixed(1)}%) → ${utilizationMultiplier}x`);
  } else {
    if (utilization > DEFAULTS.utilization.highThreshold) {
      utilizationMultiplier = DEFAULTS.utilization.highMultiplier;
      appliedRules.push(`Fallback: high utilization (${utilization.toFixed(1)}% > ${DEFAULTS.utilization.highThreshold}%) → ${utilizationMultiplier}x`);
    } else if (utilization < DEFAULTS.utilization.lowThreshold) {
      utilizationMultiplier = DEFAULTS.utilization.lowMultiplier;
      appliedRules.push(`Fallback: low utilization (${utilization.toFixed(1)}% < ${DEFAULTS.utilization.lowThreshold}%) → ${utilizationMultiplier}x`);
    } else {
      appliedRules.push(`Fallback: normal utilization (${utilization.toFixed(1)}%) → ${utilizationMultiplier}x`);
    }
  }

  // ── 3. Weather Multiplier ──────────────────────────────────────────────

  let weatherMultiplier = DEFAULTS.weather.normalMultiplier;
  const weatherCondition = currentConditions.weatherCondition?.toLowerCase();
  const temperature = currentConditions.temperature;

  if (!weatherCondition && !temperature) {
    const weatherData = await storage.getWeatherData(courseId, date);
    if (weatherData) {
      const dbCondition = weatherData.condition?.toLowerCase();
      const dbTemp = weatherData.temperature;

      const weatherRule = findRuleByType(dbRules, "weather_based", (cond) => {
        if (cond?.condition && dbCondition?.includes(cond.condition)) return true;
        if (cond?.minTemp && cond?.maxTemp && dbTemp) {
          return dbTemp >= cond.minTemp && dbTemp <= cond.maxTemp;
        }
        return false;
      });

      if (weatherRule) {
        weatherMultiplier = parseFloat(weatherRule.modifier);
        appliedRules.push(`DB Rule: ${weatherRule.name} (weather_based) → ${weatherMultiplier}x`);
      } else if (dbCondition?.includes("rain")) {
        weatherMultiplier = DEFAULTS.weather.rain;
        appliedRules.push(`Fallback: rain weather → ${weatherMultiplier}x`);
      } else if (dbTemp && dbTemp >= DEFAULTS.weather.perfectLow && dbTemp <= DEFAULTS.weather.perfectHigh) {
        weatherMultiplier = DEFAULTS.weather.perfectMultiplier;
        appliedRules.push(`Fallback: perfect weather (${dbTemp}°F) → ${weatherMultiplier}x`);
      } else {
        appliedRules.push(`Fallback: normal weather → ${weatherMultiplier}x`);
      }
    } else {
      appliedRules.push(`Fallback: no weather data → ${weatherMultiplier}x`);
    }
  } else {
    const weatherRule = findRuleByType(dbRules, "weather_based", (cond) => {
      if (cond?.condition && weatherCondition?.includes(cond.condition)) return true;
      if (cond?.minTemp && cond?.maxTemp && temperature) {
        return temperature >= cond.minTemp && temperature <= cond.maxTemp;
      }
      return false;
    });

    if (weatherRule) {
      weatherMultiplier = parseFloat(weatherRule.modifier);
      appliedRules.push(`DB Rule: ${weatherRule.name} (weather_based) → ${weatherMultiplier}x`);
    } else if (weatherCondition?.includes("rain")) {
      weatherMultiplier = DEFAULTS.weather.rain;
      appliedRules.push(`Fallback: rain weather → ${weatherMultiplier}x`);
    } else if (temperature && temperature >= DEFAULTS.weather.perfectLow && temperature <= DEFAULTS.weather.perfectHigh) {
      weatherMultiplier = DEFAULTS.weather.perfectMultiplier;
      appliedRules.push(`Fallback: perfect weather (${temperature}°F) → ${weatherMultiplier}x`);
    } else {
      appliedRules.push(`Fallback: normal weather → ${weatherMultiplier}x`);
    }
  }

  // ── 4. Lead Time Multiplier ────────────────────────────────────────────

  let leadTimeMultiplier = DEFAULTS.leadTime.normalMultiplier;
  const hoursUntil = hoursUntilTeeTime(date, timeSlot);
  const isShortLeadTime = hoursUntil > 0 && hoursUntil < DEFAULTS.leadTime.shortHours;

  const leadTimeRule = findRuleByType(dbRules, "lead_time", (cond) => {
    if (cond?.maxHoursAhead && hoursUntil <= cond.maxHoursAhead) return true;
    return false;
  });

  if (leadTimeRule) {
    leadTimeMultiplier = parseFloat(leadTimeRule.modifier);
    appliedRules.push(`DB Rule: ${leadTimeRule.name} (lead_time @ ${hoursUntil.toFixed(1)}h) → ${leadTimeMultiplier}x`);
  } else if (isShortLeadTime) {
    if (utilization > DEFAULTS.utilization.highThreshold) {
      leadTimeMultiplier = DEFAULTS.leadTime.highUtilMultiplier;
      appliedRules.push(`Fallback: short lead (${hoursUntil.toFixed(1)}h) + high util → ${leadTimeMultiplier}x`);
    } else if (utilization < DEFAULTS.utilization.lowThreshold) {
      leadTimeMultiplier = DEFAULTS.leadTime.lowUtilMultiplier;
      appliedRules.push(`Fallback: short lead (${hoursUntil.toFixed(1)}h) + low util → ${leadTimeMultiplier}x`);
    } else {
      appliedRules.push(`Fallback: short lead + normal util → ${leadTimeMultiplier}x`);
    }
  } else {
    appliedRules.push(`Fallback: normal lead time (${hoursUntil.toFixed(1)}h) → ${leadTimeMultiplier}x`);
  }

  // ── 5. Raw Calculated Price ────────────────────────────────────────────

  const rawCalculatedPrice = basePrice
    * timeOfDayMultiplier
    * utilizationMultiplier
    * weatherMultiplier
    * leadTimeMultiplier;

  // ── 6. Market Cap Safeguard (Competitor Check) ─────────────────────────

  let finalPrice = rawCalculatedPrice;
  let competitorCapApplied = false;
  let maxCompetitorPrice: number | null = null;
  let competitorCapLimit: number | null = null;

  const competitorRates = await storage.getCompetitorRatesByDate(courseId, date);

  if (competitorRates.length > 0) {
    maxCompetitorPrice = Math.max(...competitorRates);
    competitorCapLimit = maxCompetitorPrice * (1 + DEFAULTS.marketCap.maxExceedPct);

    if (rawCalculatedPrice > competitorCapLimit) {
      finalPrice = competitorCapLimit;
      competitorCapApplied = true;
      appliedRules.push(
        `Market Cap: $${rawCalculatedPrice.toFixed(2)} exceeded max competitor $${maxCompetitorPrice.toFixed(2)} + 10% = $${competitorCapLimit.toFixed(2)} → capped`
      );
    } else {
      appliedRules.push(
        `Market Cap: $${rawCalculatedPrice.toFixed(2)} within competitor ceiling $${competitorCapLimit.toFixed(2)} → no cap`
      );
    }
  } else {
    appliedRules.push("Market Cap: no competitor rates found → no cap applied");
  }

  finalPrice = Math.round(finalPrice * 100) / 100;

  return {
    teeTimeId,
    date,
    timeSlot,
    basePrice,
    timeOfDayMultiplier,
    utilizationMultiplier,
    weatherMultiplier,
    leadTimeMultiplier,
    rawCalculatedPrice: Math.round(rawCalculatedPrice * 100) / 100,
    competitorCapApplied,
    maxCompetitorPrice,
    competitorCapLimit: competitorCapLimit ? Math.round(competitorCapLimit * 100) / 100 : null,
    finalPrice,
    appliedRules,
  };
}

// ─── Batch: recalculate all tee times for a course on a given date ───────────

export async function recalculateCoursePricing(
  courseId: string,
  date: string,
  conditions: CurrentConditions = {}
): Promise<PricingBreakdown[]> {
  const slots = await storage.getTeeTimeSlotsByCourse(courseId, date);
  const results: PricingBreakdown[] = [];

  for (const slot of slots) {
    const breakdown = await calculateDynamicPrice(slot.id, conditions);
    await storage.updateTeeTimeSlot(slot.id, {
      currentPrice: breakdown.finalPrice.toFixed(2),
    });
    results.push(breakdown);
  }

  return results;
}

// ─── Mock Data Demo ──────────────────────────────────────────────────────────
// This function creates sample data and runs the pricing engine to show the
// math in action. Called via the /api/pricing-engine/demo endpoint.

export async function runPricingDemo(courseId: string): Promise<{
  scenarios: Array<{
    label: string;
    conditions: CurrentConditions;
    breakdown: PricingBreakdown;
    mathExplanation: string;
  }>;
}> {
  const slots = await storage.getTeeTimeSlotsByCourse(courseId);
  if (slots.length === 0) {
    throw new Error("No tee time slots found for this course. Create tee times first.");
  }

  const scenarios = [];

  // Scenario 1: Morning tee time, perfect weather, high utilization
  const morningSlot = slots.find(s => {
    const [h] = s.time.split(":").map(Number);
    return h < 11;
  }) || slots[0];

  const breakdown1 = await calculateDynamicPrice(morningSlot.id, {
    weatherCondition: "clear",
    temperature: 72,
    overrideUtilization: 90,
  });

  scenarios.push({
    label: "Morning | Perfect Weather | High Utilization (90%)",
    conditions: { weatherCondition: "clear", temperature: 72, overrideUtilization: 90 },
    breakdown: breakdown1,
    mathExplanation: `$${breakdown1.basePrice.toFixed(2)} × ${breakdown1.timeOfDayMultiplier} (time) × ${breakdown1.utilizationMultiplier} (util) × ${breakdown1.weatherMultiplier} (weather) × ${breakdown1.leadTimeMultiplier} (lead) = $${breakdown1.rawCalculatedPrice.toFixed(2)}${breakdown1.competitorCapApplied ? ` → capped to $${breakdown1.finalPrice.toFixed(2)}` : ""}`,
  });

  // Scenario 2: Twilight tee time, rain, low utilization
  const twilightSlot = slots.find(s => {
    const [h] = s.time.split(":").map(Number);
    return h >= 15;
  }) || slots[slots.length - 1];

  const breakdown2 = await calculateDynamicPrice(twilightSlot.id, {
    weatherCondition: "rain",
    temperature: 55,
    overrideUtilization: 20,
  });

  scenarios.push({
    label: "Twilight | Rain | Low Utilization (20%)",
    conditions: { weatherCondition: "rain", temperature: 55, overrideUtilization: 20 },
    breakdown: breakdown2,
    mathExplanation: `$${breakdown2.basePrice.toFixed(2)} × ${breakdown2.timeOfDayMultiplier} (time) × ${breakdown2.utilizationMultiplier} (util) × ${breakdown2.weatherMultiplier} (weather) × ${breakdown2.leadTimeMultiplier} (lead) = $${breakdown2.rawCalculatedPrice.toFixed(2)}${breakdown2.competitorCapApplied ? ` → capped to $${breakdown2.finalPrice.toFixed(2)}` : ""}`,
  });

  // Scenario 3: Midday, normal conditions
  const middaySlot = slots.find(s => {
    const [h] = s.time.split(":").map(Number);
    return h >= 11 && h < 15;
  }) || slots[Math.floor(slots.length / 2)];

  const breakdown3 = await calculateDynamicPrice(middaySlot.id, {
    weatherCondition: "cloudy",
    temperature: 60,
    overrideUtilization: 50,
  });

  scenarios.push({
    label: "Midday | Cloudy | Normal Utilization (50%)",
    conditions: { weatherCondition: "cloudy", temperature: 60, overrideUtilization: 50 },
    breakdown: breakdown3,
    mathExplanation: `$${breakdown3.basePrice.toFixed(2)} × ${breakdown3.timeOfDayMultiplier} (time) × ${breakdown3.utilizationMultiplier} (util) × ${breakdown3.weatherMultiplier} (weather) × ${breakdown3.leadTimeMultiplier} (lead) = $${breakdown3.rawCalculatedPrice.toFixed(2)}${breakdown3.competitorCapApplied ? ` → capped to $${breakdown3.finalPrice.toFixed(2)}` : ""}`,
  });

  return { scenarios };
}

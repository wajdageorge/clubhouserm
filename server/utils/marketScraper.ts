import axios, { type AxiosRequestHeaders } from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer-core";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NormalizedTeeTime {
  time: string;   // 24hr format, e.g. "14:00"
  price: number;  // e.g. 65.00
}

export interface ScrapeResult {
  success: boolean;
  strategy: "api" | "dom" | "cheerio";
  competitorName: string;
  date: string;
  data: NormalizedTeeTime[];
  error?: string;
  scrapedAt: string;
}

export interface APIScraperConfig {
  apiUrl: string;
  headers?: Record<string, string>;
  payload?: Record<string, any>;
  method?: "GET" | "POST";
  timePath?: string;    // JSON path to time values in response, e.g. "data.slots[].time"
  pricePath?: string;   // JSON path to price values in response, e.g. "data.slots[].price"
}

export interface DOMScraperConfig {
  url: string;
  timeSelector: string;    // CSS selector for time elements
  priceSelector: string;   // CSS selector for price elements
  waitTimeout?: number;    // ms to wait for selector, default 10000
}

// ─── Strategy 1: Hidden API Approach ─────────────────────────────────────────
// Many golf course booking sites use a hidden JSON API behind the scenes.
// This function mimics a browser request to fetch that data directly.

const DEFAULT_BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
};

export async function scrapeViaAPI(
  config: APIScraperConfig
): Promise<{ rawTimes: string[]; rawPrices: string[]; rawResponse: any }> {
  const {
    apiUrl,
    headers = {},
    payload = {},
    method = "GET",
  } = config;

  const mergedHeaders = { ...DEFAULT_BROWSER_HEADERS, ...headers };

  let retries = 0;
  const maxRetries = 3;
  let lastError: Error | null = null;

  while (retries <= maxRetries) {
    try {
      const response = method === "POST"
        ? await axios.post(apiUrl, payload, {
            headers: mergedHeaders as AxiosRequestHeaders,
            timeout: 15000,
          })
        : await axios.get(apiUrl, {
            headers: mergedHeaders as AxiosRequestHeaders,
            params: payload,
            timeout: 15000,
          });

      const rawTimes = extractNestedValues(response.data, config.timePath || "time");
      const rawPrices = extractNestedValues(response.data, config.pricePath || "price");

      return { rawTimes, rawPrices, rawResponse: response.data };

    } catch (error: any) {
      lastError = error;

      // Handle rate limiting (HTTP 429) with exponential backoff
      if (error?.response?.status === 429) {
        retries++;
        if (retries > maxRetries) {
          throw new Error(
            `Rate limited (429) after ${maxRetries} retries on ${apiUrl}. ` +
            `Retry-After: ${error.response.headers?.["retry-after"] || "unknown"}`
          );
        }

        const retryAfter = parseInt(error.response.headers?.["retry-after"] || "0", 10);
        const backoffMs = retryAfter > 0
          ? retryAfter * 1000
          : Math.min(1000 * Math.pow(2, retries), 30000); // exponential: 2s, 4s, 8s

        console.log(`[MarketScraper] Rate limited. Waiting ${backoffMs}ms before retry ${retries}/${maxRetries}...`);
        await delay(backoffMs);
        continue;
      }

      // Handle other HTTP errors
      if (error?.response?.status) {
        throw new Error(
          `HTTP ${error.response.status} from ${apiUrl}: ${error.response.statusText}`
        );
      }

      throw new Error(`Network error scraping ${apiUrl}: ${error.message}`);
    }
  }

  throw lastError || new Error("Unknown scraping error");
}

// ─── Strategy 2: Headless Browser Approach ───────────────────────────────────
// For competitor sites that render tee times via client-side JavaScript,
// we launch a headless Chromium browser to wait for the DOM to populate.

export async function scrapeViaDOM(
  config: DOMScraperConfig
): Promise<{ rawTimes: string[]; rawPrices: string[] }> {
  const {
    url,
    timeSelector,
    priceSelector,
    waitTimeout = 10000,
  } = config;

  const chromiumPath = process.env.CHROMIUM_PATH || findChromiumPath();

  const browser = await puppeteer.launch({
    executablePath: chromiumPath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
      "--single-process",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(DEFAULT_BROWSER_HEADERS["User-Agent"]);
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    await page.waitForSelector(timeSelector, { timeout: waitTimeout });

    const rawTimes = await page.$$eval(timeSelector, (elements) =>
      elements.map((el) => (el as HTMLElement).innerText.trim())
    );

    const rawPrices = await page.$$eval(priceSelector, (elements) =>
      elements.map((el) => (el as HTMLElement).innerText.trim())
    );

    return { rawTimes, rawPrices };

  } finally {
    await browser.close();
  }
}

// ─── Strategy 2b: Cheerio Fallback (no browser needed) ──────────────────────
// For competitor sites that render tee times in server-side HTML (no JS needed).
// Lighter and faster than Puppeteer.

export async function scrapeViaCheerio(
  url: string,
  timeSelector: string,
  priceSelector: string
): Promise<{ rawTimes: string[]; rawPrices: string[] }> {
  const response = await axios.get(url, {
    headers: DEFAULT_BROWSER_HEADERS as AxiosRequestHeaders,
    timeout: 15000,
  });

  const $ = cheerio.load(response.data);

  const rawTimes: string[] = [];
  $(timeSelector).each((_, el) => {
    rawTimes.push($(el).text().trim());
  });

  const rawPrices: string[] = [];
  $(priceSelector).each((_, el) => {
    rawPrices.push($(el).text().trim());
  });

  return { rawTimes, rawPrices };
}

// ─── Data Normalization ──────────────────────────────────────────────────────
// Takes messy string outputs from scrapers, cleans them up, and returns
// a structured array of { time, price } objects ready for the database.

export function normalizeMarketData(
  rawTimes: string[],
  rawPrices: string[]
): NormalizedTeeTime[] {
  const minLength = Math.min(rawTimes.length, rawPrices.length);
  const results: NormalizedTeeTime[] = [];

  for (let i = 0; i < minLength; i++) {
    const time = normalizeTime(rawTimes[i]);
    const price = normalizePrice(rawPrices[i]);

    if (time && price !== null && price > 0) {
      results.push({ time, price });
    }
  }

  return results;
}

// Convert various time formats to 24hr "HH:MM"
// Handles: "2:00 PM", "2:00PM", "14:00", "2pm", "02:00 pm"
function normalizeTime(raw: string): string | null {
  if (!raw) return null;

  let cleaned = raw.trim().toUpperCase();

  // Already in 24hr format like "14:00"
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
  }

  // 12hr format: "2:00 PM", "2:00PM", "2PM", "02:00 AM"
  const match12 = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2] || "0", 10);
    const period = match12[3];

    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
  }

  return null;
}

// Clean price string to a float
// Handles: "$65.00", "$ 65.00", "65", "$65", "USD 65.00", "65.00/player"
function normalizePrice(raw: string): number | null {
  if (!raw) return null;

  let cleaned = raw
    .replace(/[,$]/g, "")          // remove dollar signs and commas
    .replace(/USD\s*/i, "")        // remove "USD" prefix
    .replace(/\/player.*/i, "")    // remove "/player" suffix
    .replace(/per\s*player.*/i, "")
    .replace(/\s+/g, "")          // collapse whitespace
    .trim();

  const match = cleaned.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;

  const price = parseFloat(match[1]);
  return isNaN(price) ? null : Math.round(price * 100) / 100;
}

// ─── Orchestrator ────────────────────────────────────────────────────────────
// High-level function that ties together scraping + normalization + storage.

export async function scrapeCompetitor(
  competitorName: string,
  date: string,
  config: APIScraperConfig | DOMScraperConfig,
  strategy: "api" | "dom" | "cheerio" = "api"
): Promise<ScrapeResult> {
  try {
    let rawTimes: string[] = [];
    let rawPrices: string[] = [];

    switch (strategy) {
      case "api": {
        const result = await scrapeViaAPI(config as APIScraperConfig);
        rawTimes = result.rawTimes;
        rawPrices = result.rawPrices;
        break;
      }
      case "dom": {
        const domConfig = config as DOMScraperConfig;
        const result = await scrapeViaDOM(domConfig);
        rawTimes = result.rawTimes;
        rawPrices = result.rawPrices;
        break;
      }
      case "cheerio": {
        const domConfig = config as DOMScraperConfig;
        const result = await scrapeViaCheerio(domConfig.url, domConfig.timeSelector, domConfig.priceSelector);
        rawTimes = result.rawTimes;
        rawPrices = result.rawPrices;
        break;
      }
    }

    const data = normalizeMarketData(rawTimes, rawPrices);

    return {
      success: true,
      strategy,
      competitorName,
      date,
      data,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      strategy,
      competitorName,
      date,
      data: [],
      error: error.message,
      scrapedAt: new Date().toISOString(),
    };
  }
}

// ─── Mock Execution Demo ─────────────────────────────────────────────────────
// Simulates the scraping pipeline with mock data to show the math in action.

export function runScraperDemo(): {
  apiDemo: { raw: { times: string[]; prices: string[] }; normalized: NormalizedTeeTime[] };
  domDemo: { raw: { times: string[]; prices: string[] }; normalized: NormalizedTeeTime[] };
  consoleOutput: string;
} {
  // Simulate raw data from an API scrape (JSON response)
  const apiRawTimes = ["7:00 AM", "7:30 AM", "8:00 AM", "9:30AM", "11:00 AM", "1:00 PM", "3:30 PM", "5:00PM"];
  const apiRawPrices = ["$55.00", "$55.00", "$62.00", "$62.00", "$58.00", "$52.00", "$45.00", "$38.00"];

  // Simulate raw data from a DOM scrape (messy HTML text)
  const domRawTimes = ["6:30am", "07:00 AM", "8:00 am", "10:00AM", "12:00 PM", "2:30 PM", "4pm", "5:30 PM"];
  const domRawPrices = ["$ 48.00", "USD 52.00", "$58", "65.00/player", "$62.00", "$55.00", "$42.00", "$35.00 per player"];

  const apiNormalized = normalizeMarketData(apiRawTimes, apiRawPrices);
  const domNormalized = normalizeMarketData(domRawTimes, domRawPrices);

  let output = "";
  output += "\n╔══════════════════════════════════════════════════════════════╗\n";
  output += "║           MARKET SCRAPER — MOCK EXECUTION DEMO              ║\n";
  output += "╚══════════════════════════════════════════════════════════════╝\n\n";

  output += "┌─ Strategy 1: API Scrape (Meadowbrook Golf Course)\n";
  output += "│  Raw Times:  " + JSON.stringify(apiRawTimes) + "\n";
  output += "│  Raw Prices: " + JSON.stringify(apiRawPrices) + "\n";
  output += "│\n";
  output += "│  Normalized Output:\n";
  for (const item of apiNormalized) {
    output += `│    ${item.time}  →  $${item.price.toFixed(2)}\n`;
  }
  output += "└──────────────────────────────────────────────────────\n\n";

  output += "┌─ Strategy 2: DOM Scrape (Mountain Vista Golf Club)\n";
  output += "│  Raw Times:  " + JSON.stringify(domRawTimes) + "\n";
  output += "│  Raw Prices: " + JSON.stringify(domRawPrices) + "\n";
  output += "│\n";
  output += "│  Normalized Output:\n";
  for (const item of domNormalized) {
    output += `│    ${item.time}  →  $${item.price.toFixed(2)}\n`;
  }
  output += "└──────────────────────────────────────────────────────\n\n";

  output += "┌─ Normalization Examples:\n";
  output += '│  "7:00 AM"       → "07:00"    (12hr → 24hr)\n';
  output += '│  "5:00PM"        → "17:00"    (no space before AM/PM)\n';
  output += '│  "4pm"           → "16:00"    (hour only, no minutes)\n';
  output += '│  "$55.00"        → 55.00      (strip dollar sign)\n';
  output += '│  "USD 52.00"     → 52.00      (strip currency prefix)\n';
  output += '│  "65.00/player"  → 65.00      (strip suffix)\n';
  output += "└──────────────────────────────────────────────────────\n";

  console.log(output);

  return {
    apiDemo: { raw: { times: apiRawTimes, prices: apiRawPrices }, normalized: apiNormalized },
    domDemo: { raw: { times: domRawTimes, prices: domRawPrices }, normalized: domNormalized },
    consoleOutput: output,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findChromiumPath(): string {
  const paths = [
    "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ];
  return process.env.CHROMIUM_PATH || paths[0];
}

// Extract values from a nested JSON structure using a dot-path key
// e.g. extractNestedValues({data: {slots: [{time: "8:00"}]}}, "time")
// will find all "time" keys at any depth
function extractNestedValues(obj: any, key: string): string[] {
  const results: string[] = [];

  function recurse(current: any) {
    if (current === null || current === undefined) return;

    if (Array.isArray(current)) {
      for (const item of current) {
        recurse(item);
      }
      return;
    }

    if (typeof current === "object") {
      for (const [k, v] of Object.entries(current)) {
        if (k === key && (typeof v === "string" || typeof v === "number")) {
          results.push(String(v));
        }
        recurse(v);
      }
    }
  }

  recurse(obj);
  return results;
}

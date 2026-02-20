# ClubHouseRM - Golf Course Revenue Management Platform

## Overview
A comprehensive golf course revenue management system featuring dynamic pricing optimization, booking management with Stripe payment processing, competitor analysis, revenue analytics, demand forecasting, and role-based authentication.

## Recent Changes (Feb 2026)
- **UI/UX Modernization**: Complete state-of-the-art UI upgrade
  - ThemeProvider with dark mode support (localStorage key: "clubhouse-theme", respects system preferences)
  - All Font Awesome icons replaced with Lucide React icons across entire codebase
  - Modern collapsible sidebar (68px collapsed with tooltips, 256px expanded)
  - Mobile-responsive sidebar using Sheet component drawer
  - Enhanced TopBar with dark mode toggle, notification bell, user dropdown menu
  - Gradient hero landing page with animated feature cards
  - Revenue Analytics dashboard uses real Recharts AreaChart
  - QuickActions connected to actual routes
  - SEO meta tags and Open Graph tags added
  - Inter font family, streamlined Google Fonts loading
  - CSS custom properties for shadows with proper depth in both light/dark modes
  - Glass morphism utility class, gradient utilities, fade/slide animations

## Architecture
- **Frontend**: React + Vite + TypeScript, Tailwind CSS + shadcn/ui, wouter routing, TanStack Query v5
- **Backend**: Express.js, Drizzle ORM with PostgreSQL (Neon), Stripe integration
- **Auth**: Replit OIDC authentication with role-based access (admin, manager, staff)
- **Styling**: Tailwind with CSS variables for theming, darkMode: ["class"]

## Project Structure
- `client/src/pages/` - All page components (dashboard, tee-times, pricing, analytics, competitors, settings, course-details, holes, staff, landing)
- `client/src/components/layout/` - sidebar.tsx, top-bar.tsx, mobile-sidebar.tsx
- `client/src/components/dashboard/` - quick-stats, quick-actions, weather-card, competitor-pricing, tee-time-schedule, pricing-engine, revenue-analytics, demand-forecast
- `client/src/components/booking/` - booking-form.tsx
- `client/src/components/theme-provider.tsx` - ThemeProvider context
- `server/routes.ts` - API routes
- `server/storage.ts` - Storage interface and implementation
- `server/utils/pricingEngine.ts` - Dynamic pricing algorithm
- `server/utils/marketScraper.ts` - Competitor scraping module (API, DOM, Cheerio strategies)
- `shared/schema.ts` - Drizzle schema + Zod validation

## Dynamic Pricing Engine (`server/utils/pricingEngine.ts`)
- **Formula**: Base Price × Time of Day × Utilization × Weather × Lead Time
- **4 Multiplier Types** with DB-driven rules (PricingRules table) and fallback defaults:
  - Time of Day: Morning 1.2x, Midday 1.0x, Twilight 0.75x
  - Utilization: >85% booked → 1.15x, <30% booked → 0.8x
  - Weather: Rain → 0.8x, Perfect (65-80°F) → 1.05x
  - Lead Time: <48h + High Util → 1.15x, <48h + Low Util → 0.75x
- **Market Cap Safeguard**: Final price capped at max competitor rate + 10%
- **API Endpoints**:
  - `GET /api/pricing-engine/calculate/:teeTimeId` - Calculate price with breakdown
  - `POST /api/pricing-engine/recalculate` - Batch recalculate all tee times for a date
  - `GET /api/pricing-engine/demo` - Run demo scenarios with console output
- Booking route (`POST /api/bookings`) uses the pricing engine for server-side price calculation

## Key Features
- Dynamic pricing with configurable rules (time-based, day-based, weather-based, utilization-based, lead-time)
- Demand forecasting with baseline algorithm and user-adjustable caps
- Stripe payment processing for bookings
- Competitor tracking and pricing analysis with market cap safeguard
- Revenue analytics with interactive Recharts visualizations
- Role-based access control (admin, manager, staff)
- Dark mode with smooth transitions

## User Preferences
- Modern, state-of-the-art UI/UX design
- Lucide React icons (no Font Awesome)
- Dark mode support
- Mobile responsive

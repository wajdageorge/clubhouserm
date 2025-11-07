# ClubHouseRM Design Guidelines

## Design Approach
**Selected Framework:** Design System Approach with dashboard-first methodology
**Primary References:** Linear's clean data presentation + Stripe Dashboard's professional aesthetic + Notion's information hierarchy
**Rationale:** Revenue management requires clarity, trust, and efficient data parsing. Drawing from established SaaS dashboard patterns ensures professional credibility.

## Core Design Principles
1. **Data First**: Charts and metrics take visual priority over decoration
2. **Golf Course Context**: Subtle golf references without kitsch (course silhouettes, tee time patterns)
3. **Professional Trust**: Banking-grade UI polish for financial data
4. **Scanning Efficiency**: Information hierarchy optimized for quick decision-making

---

## Typography System
**Primary Font:** Inter (Google Fonts) - exceptional legibility for data-heavy interfaces
**Hierarchy:**
- Dashboard Headers: 2xl/3xl, semibold
- Section Titles: xl, semibold  
- Metrics/KPIs: 4xl/5xl, bold (large numbers demand attention)
- Body/Tables: base, regular/medium
- Captions/Labels: sm, medium

---

## Layout System
**Spacing Primitives:** Tailwind units of 3, 4, 6, 8, 12 (tighter for data density)
**Grid Structure:** 12-column responsive grid
**Dashboard Layout:** Sidebar navigation (fixed, 64-72 width units) + main content area with max-w-7xl container

---

## Component Library

### Navigation & Structure
**Sidebar Navigation:**
- Fixed left sidebar with logo at top
- Vertical nav menu with icons + labels
- Collapsible section groups (Dashboard, Revenue, Analytics, Settings)
- Bottom section for user profile + help

**Top Bar:**
- Page title + breadcrumb trail
- Date range selector (critical for revenue data)
- Quick actions dropdown
- Notification bell

### Dashboard Components

**KPI Cards:**
- 4-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Each card: Large metric number, label, trend indicator (↑↓), sparkline chart
- Subtle border, clean background, generous padding (p-6)

**Revenue Charts:**
- 2-column layout for primary charts (grid-cols-1 lg:grid-cols-2)
- Chart types: Line graphs (revenue trends), bar charts (comparative analysis), donut charts (revenue breakdown)
- Chart containers with headers including timeframe selectors
- Legend placement: bottom or right side, never obstructive

**Data Tables:**
- Full-width tables with alternating row backgrounds for readability
- Sticky headers on scroll
- Column headers: sortable indicators, filter icons
- Row actions: kebab menu (⋮) on hover
- Pagination at bottom with rows-per-page selector

**Tee Sheet Integration:**
- Calendar-style grid showing bookings
- Time slots on Y-axis, dates on X-axis
- Visual density showing booking status
- Click-to-expand for booking details

### Forms & Inputs
**Input Fields:**
- Consistent height (h-10 to h-12)
- Clear labels above inputs
- Validation states with inline messaging
- Grouped related fields with subtle dividers

**Buttons:**
- Primary: Golf green background with white text (main actions)
- Secondary: Outlined with golf green border (secondary actions)
- Ghost: Text-only for tertiary actions
- Sizes: sm, base, lg with consistent padding scale

**Date Pickers:**
- Calendar dropdown with range selection capability
- Preset options (Today, This Week, This Month, Last 30 Days, Custom)
- Critical for revenue analysis features

### Data Visualization
**Chart Style:**
- Clean, minimalist aesthetic
- Golf green as primary data color, grays for comparative data
- Grid lines: subtle, non-distracting
- Tooltips on hover with precise values
- Export functionality (CSV, PDF) in chart headers

**Statistical Displays:**
- Comparison metrics: side-by-side with percentage change indicators
- Trend arrows with contextual meaning
- Progress bars for capacity/utilization metrics

---

## Page Structures

### Landing/Marketing Page (External)
**Hero Section:** (80vh)
- Full-width background image: Pristine golf course at golden hour with clubhouse
- Centered overlay content with blurred button backgrounds
- Headline: "Maximize Your Golf Course Revenue" (3xl/4xl)
- Subheadline explaining value proposition
- Primary CTA button + secondary "View Demo" button
- Trust indicators below: "Trusted by 200+ courses nationwide"

**Feature Showcase:** (3-column grid lg:grid-cols-3)
- Icon + title + description cards
- Features: Revenue Optimization, Tee Time Management, Analytics Dashboard, Dynamic Pricing, Member Management, Reporting Suite
- Each card with subtle hover elevation

**Dashboard Preview:**
- Large screenshot of actual dashboard interface
- Annotated callouts highlighting key features
- Demonstrates professional UI quality

**Testimonials:** (2-column grid md:grid-cols-2)
- Golf course manager quotes with headshots
- Course name and location
- Star ratings

**Pricing Table:** (3-column comparison)
- Tier cards (Starter, Professional, Enterprise)
- Feature comparison checkmarks
- Prominent CTA buttons

**Footer:**
- 4-column layout: Product links, Resources, Company, Contact
- Newsletter signup with golf course management tips
- Social proof badges (security, integrations)

### Dashboard (Application)
**Overview Page:**
- Top metrics row: Today's Revenue, Bookings, Occupancy Rate, Average Transaction
- Revenue chart (prominent, 2/3 width) + Quick Stats sidebar (1/3 width)
- Recent bookings table below
- Weather widget (impacts course operations)

**Revenue Analytics:**
- Multi-tab interface (Daily, Weekly, Monthly, Yearly)
- Comparative charts showing year-over-year
- Revenue breakdown by source (Tee Times, Pro Shop, F&B, Events)
- Downloadable reports section

**Tee Sheet Management:**
- Calendar view with time slots
- Filtering by course (for multi-course facilities)
- Color-coded booking statuses
- Quick-add booking modal

---

## Images

**Hero Image (Landing Page):**
- Pristine championship golf course, morning/golden hour lighting
- Clubhouse visible in background
- Professional photography quality
- Dimensions: Full-width, 1920x1080 minimum
- Placement: Hero section background with overlay gradient

**Dashboard Screenshots:**
- Actual dashboard interface previews for marketing page
- Show real data visualizations
- Placement: Feature showcase section

**Optional Supporting Images:**
- Golf course manager at desk with dashboard on screen
- Close-up of putting green (for testimonial section backgrounds)
- Keep minimal - focus on UI demonstrations

---

## Accessibility & Performance
- Maintain WCAG AA contrast ratios for all text
- Keyboard navigation throughout dashboard
- Focus states clearly visible
- Charts include accessible data tables
- Skip-to-content links
- Screen reader labels for icons
- Responsive breakpoints: sm(640), md(768), lg(1024), xl(1280), 2xl(1536)

---

**Animation Philosophy:** Minimal, purposeful only. Smooth transitions for data updates (0.2s ease), subtle hover states on interactive elements, loading skeletons for async data. No gratuitous motion.
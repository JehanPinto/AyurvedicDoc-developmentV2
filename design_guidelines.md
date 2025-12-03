# Design Guidelines: Ayurvedic Doctor Channeling Platform

## Design Approach

**Selected Approach:** Design System (Material Design + Healthcare Platform Patterns)

**Justification:** This healthcare booking platform prioritizes trust, efficiency, and clarity over visual experimentation. Drawing from Material Design's established patterns combined with successful healthcare platforms like Zocdoc and Practo ensures professional credibility while maintaining intuitive user flows.

**Core Principles:**
1. **Medical Professionalism** - Clean, trustworthy aesthetic that inspires confidence
2. **Information Clarity** - Clear visual hierarchy for complex medical data
3. **Efficient Workflows** - Streamlined booking and management processes
4. **Cultural Sensitivity** - Design accommodates Sinhala, Tamil, and English

---

## Typography

**Font Families:**
- Primary: Inter (sans-serif) - excellent multilingual support, professional, highly readable
- Secondary: Poppins - softer alternative for headings, works well with Sinhala/Tamil scripts

**Hierarchy:**
- **Hero Headings:** text-4xl md:text-5xl lg:text-6xl, font-bold
- **Section Headings:** text-2xl md:text-3xl, font-semibold
- **Card Titles:** text-xl, font-semibold
- **Body Text:** text-base, font-normal, leading-relaxed
- **Captions/Meta:** text-sm, font-medium
- **Labels:** text-xs uppercase tracking-wide, font-semibold

---

## Layout System

**Spacing Units:** Consistently use Tailwind units of **4, 6, 8, 12, 16, 20, 24** (e.g., p-4, gap-8, mt-12, py-20)

**Container Strategy:**
- **Max Widths:** max-w-7xl for main content, max-w-4xl for forms, max-w-prose for text content
- **Section Padding:** py-16 md:py-24 for major sections, py-8 md:py-12 for subsections
- **Card Spacing:** p-6 for standard cards, p-8 for feature cards
- **Grid Gaps:** gap-6 for card grids, gap-4 for form fields

---

## Component Library

### Navigation
**Patient/Doctor Web:**
- Clean horizontal navbar with logo left, navigation center, user menu right
- Sticky positioning with subtle shadow on scroll
- Dropdown menus for user profiles showing quick actions (My Appointments, Profile, Logout)

**Superadmin Console:**
- Persistent sidebar navigation (w-64) with collapsible sections
- Top bar showing breadcrumbs and admin profile
- Sidebar groups: Dashboard, Doctors, Patients, Appointments, Analytics, Settings

### Cards & Containers
**Doctor Profile Cards:**
- Structured layout: Doctor photo (rounded-lg, aspect-square), name/specialization, rating stars, consultation types (badges), location, availability indicator
- Hover: subtle elevation increase (shadow-md to shadow-lg)
- CTA button: "Book Appointment" (primary action)

**Appointment Cards:**
- Timeline-style layout showing date/time, doctor info, status badge, action buttons
- Color-coded status: Booked (blue), Completed (green), Cancelled (gray)

**Information Panels:**
- Medical records use bordered containers (border rounded-lg) with clear section headers
- Prescription display: Monospace font for medication details, clear dosage formatting

### Forms
**Input Fields:**
- Floating labels or top-aligned labels (label above input)
- Full-width inputs with border-2, rounded-md, focus ring
- Error states: border-red-500 with error text below
- Required field indicators: asterisk in label

**Search & Filters:**
- Prominent search bar with icon (magnifying glass)
- Filter chips/tags for specialization, location, availability
- Clear "Apply Filters" and "Reset" actions

**Booking Flow:**
- Multi-step form with progress indicator (stepper component)
- Steps: Select Date/Time → Patient Details → Consultation Type → Payment → Confirmation
- Each step in clean card container with clear next/previous navigation

### Buttons
**Primary Actions:** Solid background, medium padding (px-6 py-3), rounded-md, font-semibold
**Secondary Actions:** Outlined style with border-2
**Tertiary/Text:** No background, underline on hover
**Icon Buttons:** Square aspect, padding-2, for actions like edit/delete

### Data Display
**Calendars:**
- Grid-based monthly view for appointment slot selection
- Available slots highlighted, booked slots grayed out
- Selected date clearly marked

**Tables (Admin):**
- Striped rows for better readability
- Sortable column headers
- Action column (right-aligned) with icon buttons
- Pagination at bottom

**Status Badges:**
- Small, rounded-full, px-3 py-1
- Semantic colors: Pending (yellow), Active (green), Rejected (red), Completed (blue)

### Overlays
**Modals:**
- Centered overlay with max-w-2xl container
- Close button top-right
- Used for: Appointment details, Confirmation dialogs, Quick doctor preview

**Notifications/Toasts:**
- Top-right position
- Auto-dismiss after 5 seconds
- Icon + message + optional action button

---

## Images

**Hero Sections:**

1. **Patient Landing Page:**
   - Large hero image showing diverse Ayurvedic consultation scene (doctor with patient in calm, professional setting)
   - Hero overlay with search functionality front and center
   - Image: Warm, trustworthy, culturally appropriate (Sri Lankan context)
   
2. **Doctor Portal Landing:**
   - Professional hero image of doctor using digital tools/calendar
   - Emphasizes modern practice management
   
**Throughout Application:**

- **Doctor Profile Photos:** High-quality headshots, consistent sizing (aspect-square), professional backgrounds
- **Clinic/Hospital Images:** Optional gallery in doctor profiles showing facilities
- **Specialization Icons:** Use Heroicons for specialization categories (herb icon for herbal medicine, etc.)
- **Empty States:** Friendly illustrations (not photos) for "No appointments yet," "Search returned no results"
- **Onboarding/Help:** Simple illustrations explaining booking process steps

**Image Placement:**
- Hero sections: Full-width with content overlay (buttons on blurred/darkened background)
- Doctor cards: Left-aligned photo with info right
- About/Info sections: Alternating image-left/text-right and text-left/image-right layouts

---

## Platform-Specific Considerations

**Patient Interface:**
- Welcoming, warm aesthetic with generous whitespace
- Emphasis on search and discovery experience
- Clear CTAs: "Find a Doctor," "Book Now," "View My Appointments"

**Doctor Interface:**
- Dashboard-centric with key metrics (Today's Appointments, Pending Reviews, Earnings)
- Calendar-first view for schedule management
- Efficient appointment management tools

**Superadmin Console:**
- Data-dense professional interface
- Heavy use of tables, charts, and analytics visualizations
- Verification workflows with approve/reject actions clearly presented

**Multi-Language:**
- Ensure adequate spacing for text expansion (Sinhala/Tamil may require 20-30% more space)
- Icons supplement text for universal understanding
- RTL-ready layout structure

---

## Animations

**Minimal Approach:**
- Smooth transitions on hover states (transition-all duration-200)
- Subtle fade-in for modal overlays
- Loading spinners for async actions
- No scroll-triggered or complex animations
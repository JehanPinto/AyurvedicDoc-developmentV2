# Ayurvedic Doctor Channeling Platform

## Overview

This is a healthcare booking platform that connects patients with Ayurvedic practitioners in Sri Lanka. The application enables patients to search for doctors by specialization, location, and availability, book appointments (both in-person and online), and manage their healthcare journey. Doctors can manage their profiles, availability schedules, and appointments, while administrators oversee platform operations including doctor verification and system management.

The platform supports multilingual content (English, Sinhala, Tamil) and handles various consultation types including in-person visits, online consultations, and home visits.

## Current Development Progress

### Completed Features
- Complete REST API with JWT authentication and role-based access control
- User registration and login for patients and doctors  
- Doctor profiles with verification workflow
- Specialization and hospital management
- Appointment slot and booking system
- Payment tracking (online and pay-at-clinic)
- Review and rating system
- Notification system
- Home page with hero section, specializations, and featured doctors
- Doctors listing page with search and filter functionality
- Login and registration pages with form validation
- Responsive UI with Ayurvedic green theme

### Admin Dashboard Features (Completed)
- **Doctors Management** (/admin/doctors): View, search, filter, verify/reject/suspend doctors with status badges
- **Patients Management** (/admin/patients): View and search registered patients with profile details
- **Appointments Management** (/admin/appointments): View all appointments with status filters and detailed view dialogs
- **Specializations Management** (/admin/specializations): Full CRUD for Ayurvedic specializations with icon selection
- **Payments Management** (/admin/payments): View payments, process refunds, filter by status/method
- **Platform Settings** (/admin/settings): Configure commission rates, booking settings, notifications (local state)

### Doctor Dashboard Features (Completed)
- **Dashboard** (/doctor): Overview with today's stats, quick actions, upcoming appointments
- **Appointments Management** (/doctor/appointments): View/filter appointments by status (Today, Upcoming, Completed, Cancelled), confirm/complete/cancel appointments, mark patient as called/no-show
- **Schedule Management** (/doctor/schedule): Weekly calendar view, create/block/delete appointment slots
- **Patients Roster** (/doctor/patients): View all patients with consultation history, search by name
- **Reviews Management** (/doctor/reviews): View patient reviews with ratings, respond to reviews, filter by rating/response status
- **Earnings Overview** (/doctor/earnings): Total/pending earnings, monthly breakdown, payment history with filters, export functionality

### Patient Dashboard Features (Completed)
- **Dashboard** (/patient): Overview with stats (upcoming/completed appointments, prescriptions, total spent), upcoming and recent appointments
- **Appointments** (/patient/appointments): View all appointments with status filters, appointment details
- **My Reviews** (/patient/reviews): View reviews written for doctors, rating summary, edit/delete reviews, see doctor responses
- **Settings** (/patient/settings): Profile management (name, phone, address, language), password change, notification preferences (email/SMS toggles)

### In Progress / Pending
- Video consultation integration
- Payment gateway integration (UI ready, needs Stripe integration)
- Email notifications
- Multi-language UI translations
- Advanced search and filtering
- Medical history timeline

### Completed Database Migration
- PostgreSQL database fully integrated with Drizzle ORM
- All dashboard APIs return real data from database
- Seed script available at `server/seed.ts` for development data
- Test accounts:
  - Admin: admin@ayurvedicdoctor.lk / password123
  - Doctor: dr.silva@example.com / password123
  - Patient: patient@example.com / password123

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter for client-side routing, providing a lightweight alternative to React Router.

**UI Component Library**: Shadcn UI (New York style variant) built on Radix UI primitives. Components use Tailwind CSS for styling with a custom design system featuring:
- Primary color scheme based on Ayurvedic green (#152 60% 32%)
- Secondary amber accent colors
- Custom HSL-based theming system supporting light/dark modes
- Consistent spacing units (4, 6, 8, 12, 16, 20, 24)
- Typography using Inter and Poppins fonts optimized for multilingual support

**State Management**: 
- React Context API for authentication (`AuthContext`) and theme management (`ThemeContext`)
- TanStack Query (React Query) for server state management and data fetching
- Local storage for persisting user sessions and theme preferences

**Form Handling**: React Hook Form with Zod validation for type-safe form schemas.

**Design Principles**: Material Design patterns combined with healthcare-specific UI conventions, prioritizing medical professionalism, information clarity, and cultural sensitivity.

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js.

**API Design**: RESTful API architecture with all routes prefixed with `/api`. The routes are registered through a centralized `registerRoutes` function that accepts the HTTP server and Express app instances.

**Development Setup**: 
- Separate Vite development server integrated as Express middleware for HMR (Hot Module Replacement)
- Custom logging middleware tracking request duration and response status
- Raw body preservation for webhook signature verification

**Session Management**: Designed to support express-session with connect-pg-simple for PostgreSQL-backed sessions.

**Storage Layer**: Abstracted through an `IStorage` interface with a PostgreSQL-based implementation (`DbStorage`) using Drizzle ORM. All data is persisted to the database.

### Data Storage Architecture

**Database**: PostgreSQL accessed via Neon serverless driver with WebSocket support.

**ORM**: Drizzle ORM with Zod integration for type-safe database operations and validation.

**Schema Design**: Comprehensive healthcare domain model including:
- User management with role-based access (Patient, Doctor, Admin)
- Doctor profiles with verification workflow (pending → verified/rejected/suspended)
- Hospital and specialization master data
- Appointment scheduling with slot management
- Payment tracking supporting multiple methods (online, at-clinic)
- Review and rating system
- Multi-language support at the data level

**Migration Management**: Drizzle Kit handles schema migrations with files stored in `/migrations` directory.

### Authentication & Authorization

**Strategy**: JWT-based authentication with role-based access control (RBAC).

**User Roles**: Three distinct roles with different permission levels:
- Patient: Book appointments, view doctors, manage personal health records
- Doctor: Manage profile, set availability, handle appointments
- Admin: Oversee platform operations, verify doctors, manage system data

**Protected Routes**: Custom `ProtectedRoute` component wraps authenticated pages and enforces role-based access restrictions.

**Session Persistence**: User data and JWT tokens stored in browser localStorage, validated on app initialization.

### Build & Deployment

**Build Process**: Custom build script (`script/build.ts`) that:
- Builds client assets using Vite
- Bundles server code with esbuild
- Selectively bundles heavy dependencies (allowlist approach) to reduce cold start times
- Outputs to `/dist` directory with public assets and server bundle

**Production Server**: Serves static files from the build output and falls back to `index.html` for client-side routing.

## External Dependencies

### UI & Component Libraries
- **Radix UI**: Comprehensive collection of unstyled, accessible UI primitives (accordion, dialog, dropdown, popover, select, etc.)
- **Tailwind CSS**: Utility-first CSS framework with PostCSS for processing
- **class-variance-authority & clsx**: Component variant management and conditional class merging
- **Lucide React**: Icon library
- **embla-carousel-react**: Carousel/slider component
- **cmdk**: Command palette component
- **react-day-picker**: Date picker component
- **recharts**: Charting library for data visualization

### Database & ORM
- **@neondatabase/serverless**: PostgreSQL driver optimized for serverless environments with WebSocket support
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-zod**: Zod schema generation from Drizzle schemas
- **ws**: WebSocket client required by Neon driver

### Form & Validation
- **react-hook-form**: Form state management and validation
- **@hookform/resolvers**: Resolver adapters for validation libraries
- **zod**: TypeScript-first schema validation
- **zod-validation-error**: User-friendly error formatting

### Data Fetching & State
- **@tanstack/react-query**: Server state management, caching, and synchronization
- **date-fns**: Date manipulation and formatting utilities

### Development Tools
- **Vite**: Development server and build tool with React plugin
- **TypeScript**: Static typing throughout the codebase
- **tsx**: TypeScript execution for build scripts and development
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development enhancements (runtime error overlay, cartographer, dev banner)

### Potential Future Integrations
The codebase includes package dependencies suggesting planned integrations for:
- Payment processing (Stripe)
- Email notifications (Nodemailer)
- AI features (@google/generative-ai, OpenAI)
- File uploads (Multer)
- Real-time features (WebSocket server)
- Rate limiting (express-rate-limit)
- Spreadsheet exports (XLSX)
- Authentication strategies (Passport.js with local strategy)
# Overview

CapyTrackAI is a civic engagement platform built with Next.js 15 that tracks legislative activity, processes meeting transcripts, and provides transparency into government proceedings. The application focuses on making legislative data accessible through legislator profiles, real-time meeting tracking, and AI-powered issue categorization. Initially targeting Memphis city council, the system is architected to scale across multiple jurisdictions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Framework
- **Next.js 15 (App Router)** - Server-side rendering with React Server Components for optimal performance
- **TypeScript** - Type safety across the application
- **Tailwind CSS v4** - Utility-first styling with custom theme variables
- Uses the App Router pattern with file-based routing under `/app` directory

## UI Component Strategy
- **shadcn/ui** - Accessible component library built on Radix UI primitives
  - Progress component for visualizing data (installed 2025-10-21)
- **FontAwesome** - Icon library for consistent visual elements
- **Custom components** in `/components` for reusable UI elements:
  - NavBar, UserIcon, TotalCard - Global navigation and UI elements
  - StatementCard - Displays legislator statements chronologically with meeting info and issue tags
  - TopIssuesCard - Shows legislator's top issue areas with progress bars indicating relative mention frequency
- Client-side interactivity separated from server components (e.g., SearchableLegislators)

## Styling Architecture
- Custom CSS variables in `globals.css` using OKLCH color space for better color manipulation
- Theme system with semantic color tokens (--background, --foreground, --card, etc.)
- Dark mode support via custom variants
- Geist Sans and Geist Mono fonts from Google Fonts
- Custom utility classes via `lib/styleUtils.ts` combining clsx and tailwind-merge

## Data Layer
- **Supabase** - PostgreSQL database with real-time capabilities
- Server-side data fetching using async Server Components
- Data access layer organized in `lib/data/` with separate modules for different data concerns:
  - `legislator.ts` - Individual legislator details
  - `legislator_card.ts` - List view data
  - `legislator_profile.ts` - Full profile with statistics
  - `legislator_statements.ts` - Legislator statements with issues from transcription segments
- Supabase client configured in `lib/utils/supabase.ts` using environment variables

## Database Design Principles
- Multi-jurisdiction support from the start (scalable beyond Memphis)
- Sentence-level transcript granularity with speaker attribution
- AI-generated issue taxonomy with manual curation capabilities
- Pre-computed statistics tables for performance (legislator_statistics)
- Row Level Security (RLS) for user-specific data (bookmarks, alerts)
- Public read access for all legislative data (transparency model)
- Audit logging for manual corrections and data quality

## Type System
- TypeScript types defined in `/types` directory
- `Legislator.ts` includes comprehensive types for legislator data, statistics, committees, and social media
- Flexible type definitions allowing for evolving data structures with index signatures

## Routing Strategy
- Dynamic routes for legislator profiles: `/legislators/[slug]`
- Dedicated loading states per route using `loading.tsx` files
- Custom 404 handling with `not-found.tsx`
- Server-side data fetching before component rendering

## State Management
- Minimal client-side state using React useState for UI interactions (search filtering)
- Server state handled through Next.js data fetching patterns
- No global state management library (keeping it simple)

## Performance Optimization
- Server Components by default for reduced client bundle size
- Strategic use of 'use client' directive only when needed (SearchableLegislators, NavBar)
- Image optimization through Next.js Image component
- Font optimization using next/font

## Development Workflow
- Development server runs on port 5000 with network access (0.0.0.0)
- ESLint configured for code quality
- Hot reload enabled for rapid development

## Design Patterns
- Separation of concerns: UI components, data fetching, utilities, and types in distinct directories
- Composition over configuration for UI components
- Server-first architecture with client components only where interactive
- Progressive enhancement approach

# External Dependencies

## Database & Backend Services
- **Supabase** (`@supabase/supabase-js`) - Managed PostgreSQL with built-in authentication, real-time subscriptions, and REST API
  - Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables
  - Used for all legislative data storage and retrieval
  - Configured for Row Level Security (RLS) policies

## UI Libraries
- **Radix UI** - Unstyled, accessible UI primitives
  - `@radix-ui/react-label` - Label component
  - `@radix-ui/react-progress` - Progress/loading bar component
- **shadcn/ui** - Pre-built accessible components with Radix UI foundation
  - Configuration in `components.json` with "new-york" style
  - Components stored in `@/components/ui`
  - Installed components: Label, Input, Progress
- **FontAwesome** (multiple packages) - Comprehensive icon library
  - Core package with React bindings
  - Solid, regular, and brand icon sets
- **Lucide React** - Alternative icon library for additional icon needs

## Styling
- **Tailwind CSS v4** (`tailwindcss`, `@tailwindcss/postcss`) - Utility-first CSS framework
- **tw-animate-css** - Additional animation utilities for Tailwind
- **class-variance-authority** - Type-safe variant management for component styling
- **clsx** & **tailwind-merge** - Utility for conditional className composition

## Development Environment
- Custom port configuration (5000) for both dev and production
- Network binding to 0.0.0.0 for external access
- No specific deployment platform lock-in (can deploy to Vercel, Netlify, or custom hosting)

## YouTube Transcription Pipeline
- **Puppeteer** - Headless browser automation for YouTube audio recording
  - System dependency: Chromium installed via Nix package manager
  - Configured via `CHROMIUM_PATH` environment variable (required for deployment)
  - Falls back to Puppeteer's bundled Chrome if `CHROMIUM_PATH` not set
  - Location: `/nix/store/.../bin/chromium` (path varies by Nix version)
- **Puppeteer-stream** - Audio capture from browser sessions
- **fluent-ffmpeg** - Audio processing and format conversion
- **OpenAI Whisper API** - Speech-to-text transcription ($0.006/minute)
  - Requires `OPENAI_API_KEY` environment variable
- **API Route**: `/api/transcribe/youtube` handles video processing workflow
  - Dynamic import of youtube-downloader prevents webpack bundling in prerendered pages
  - Background processing with cleanup of temporary audio files

## Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for database writes)
- `OPENAI_API_KEY` - OpenAI API key for Whisper transcription
- `CHROMIUM_PATH` - Path to system Chromium executable (deployment only)
  - Set to: `/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium`
  - Or run `which chromium` to get current path after Chromium installation

## Future Integration Points
- AI/ML services for issue categorization (not yet implemented)
- Video streaming services for live meeting feeds (architecture prepared)
- Full-text search capabilities (PostgreSQL built-in support available)
- Vector embeddings for semantic search (PostgreSQL pgvector extension ready)
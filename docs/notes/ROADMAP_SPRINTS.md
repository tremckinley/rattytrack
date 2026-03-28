# CapyTrack Development Sprints & Roadmap

Based on the strategic thoughts from `PROGRESS_THOUGHTS.md`, this roadmap moves CapyTrack from an MVP state into a scalable, secure, and production-ready product. We've broken down your identified issues and future architectural needs into clear, actionable development sprints.

## Phase 1: Foundation & Cleanup

### Sprint 1: UI Consistency & Component Architecture (Issue 3)
**Goal:** Create a uniform design system and reusable templates to speed up future development.
- **Task 1.1:** Audit existing UI components for style consistency and extract reusable bits.
- **Task 1.2:** Build reusable page templates (e.g., generic table layout, form layout, detail view).
- **Task 1.3:** Standardize the styling system across the app (already in progress via your recent component/color work).
- **Task 1.4:** Reorganize file structure to group by feature rather than type.

### Sprint 2: Core Backend Hardening (The Next Level)
**Goal:** Ensure the backend structure is robust and safe before handling paid users or intensive AI tasks.
- **Task 2.1:** Evaluate and solidify the database schema. (A relational structure via Supabase is highly recommended for structured government data).
- **Task 2.2:** Introduce an ORM (like Prisma or Drizzle) to provide safer, typed database queries within Next.js.
- **Task 2.3:** Centralize data fetching and mutations (extract raw logic from components into dedicated service/controller files).
- **Task 2.4:** Set up optimized object storage (e.g., S3 or Supabase Storage) for transcribed audio/video files and PDFs to handle scale.

## Phase 2: Commercial Readiness 

### Sprint 3: Authentication & Security (Issue 2)
**Goal:** Lock down the application and ensure user data and platform data are secure.
- **Task 3.1:** Implement robust robust user authentication (Supabase Auth, Auth.js, or Clerk).
- **Task 3.2:** Configure Database Row-Level Security (RLS) to restrict unauthorized access to data.
- **Task 3.3:** Create server-side route guards in Next.js to fully protect back-end API routes and private pages.

### Sprint 4: Monetization Pipeline (Issue 2)
**Goal:** Start accepting payments, gating core features, and marketing the app.
- **Task 4.1:** Integrate a payment provider (Stripe is the industry standard for SaaS and Next.js).
- **Task 4.2:** Build user subscription tier logic in the database (e.g., Free vs. Premium access).
- **Task 4.3:** Develop paywalls across the UI for specific premium features (e.g., advanced AI insights, deep transcript search).
- **Task 4.4:** Establish a Marketing Landing Page. *(Recommendation: Keep the marketing site separate from the main SaaS Next.js app to preserve speed—tools like Framer, Webflow, or a static Next.js site work best here.)*

## Phase 3: The "Back-Office" & AI Scaling

### Sprint 5: Infrastructure & Admin Controls (Issue 2 & Next Level)
**Goal:** Separate administrative tasks from the user-facing site and manage the app's health.
- **Task 5.1:** Build a separate Admin Dashboard / Portal (or a strictly role-gated section in the current app).
- **Task 5.2:** Implement an overarching logging and tracking system (e.g., Sentry) to monitor application errors.
- **Task 5.3:** Create a manual override interface for admins to QA and fix any incorrectly scraped/transcribed data.

### Sprint 6: Baseline AI & Automation (Issue 1)
**Goal:** Offload manual tracking and processing to automated backend agents.
- **Task 6.1:** Decouple scrapers from standard web requests; implement automated CRON jobs (e.g., Vercel Cron, GitHub Actions, or Inngest) to check for new meetings/documents periodically.
- **Task 6.2:** Set up an async processing background queue for heavy tasks like downloading large videos or kicking off transcripts.
- **Task 6.3:** Integrate an off-the-shelf transcription API (e.g., AssemblyAI, Deepgram, or Whisper) for audio-to-text conversion.

### Sprint 7: Advanced AI Refinement (Issue 1)
**Goal:** Train the system to understand nuance and specific legislative recording contexts.
- **Task 7.1:** Implement API models with strictly defined contextual prompts (e.g., defining local legislative terminology, names, and procedures) to improve entity extraction.
- **Task 7.2:** Integrate Speaker Diarization into the transcription pipeline to recognize and label different legislators' voices.
- **Task 7.3:** Write AI post-processing functions to identify and crop out irrelevant transcript data (intermissions, commercials, cross-talk).

## Phase 4: User Experience Expansion & Intelligence Discovery

### Sprint 8: Transcript UI & Intelligent Display (Issue 3 & AI Overhaul)
**Goal:** Translate background AI extractions into public-facing UX/UI data visualizations.
- **Task 8.1:** Rebuild the `[meetingId]` layout/page to prominently feature the Claude-generated Executive Summaries natively on the dashboard.
- **Task 8.2:** Implement a "Voting Outcome Scorecard" component on the meeting page that visually tallies (Yea/Nay) the aggregate positions for each agenda item.
- **Task 8.3:** Overhaul the Transcript Reader component to segment speeches by Agenda Item headers rather than a continuous wall of text.
- **Task 8.4:** Build interactive highlighting/filtering (e.g., "Jump to vote", "Filter negative sentiments") into the transcript reader.

### Sprint 9: Speaker Mapping & Diarization Logic (Admin + AI)
**Goal:** Safely map dynamic AssemblyAI speaker tags (Speaker A, Speaker B) definitively to real Memphis Councilmembers.
- **Task 9.1:** Build a lightweight Admin tool UI that isolates short audio snippets of "Speaker_X" per meeting to allow an admin to bind a voice directly to a `legislator_id` manually.
- **Task 9.2:** Develop an LLM-driven logical inference system (e.g., matching the phrase "Thank you Councilman Smiley" directly to the preceding speaker) to auto-suggest Speaker-to-Legislator maps when confidence is 95%+.
- **Task 9.3:** *Crucial Constraint:* Enforce rigid validation loops so "Speaker A" in Meeting 1 is never assumed to be "Speaker A" in Meeting 2 without manual or high-confidence logical verification.

### Sprint 10: Deep Search & Analytics (The Next Level)
**Goal:** Implement true platform-wide queryability so users can find specific quotes or voting blocks instantly.
- **Task 10.1:** Implement a vector database (PgVector in Supabase) to convert transcript texts into searchable embeddings for true semantic search.
- **Task 10.2:** Build a global frontend `/search` experience capable of returning precise timestamps for video playback.

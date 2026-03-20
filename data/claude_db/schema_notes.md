**Key Design Considerations:**
- Multi-jurisdiction support (start Memphis, expand later)
- Sentence-level transcription with speaker attribution
- AI-generated issue taxonomy with manual curation option
- Rich legislative tracking (bills, votes, actions)
- User engagement features (bookmarks, alerts, subscriptions)
- Manual override capabilities for data quality
- Pre-computed analytics for performance

Let me create a comprehensive database schema:## Database Schema Complete! 

I've created a comprehensive PostgreSQL schema for CapyTrackAI with **27 core tables** plus views and functions. Here's what I've designed:

### **Core Architecture Highlights:**

1. **Multi-Jurisdiction Support** - Scalable from Memphis to any legislative body
2. **Granular Transcription** - Sentence-level segments with timestamps, speaker attribution, and confidence scores
3. **AI-Powered Issue Taxonomy** - Dynamic issue generation with manual curation capabilities
4. **Rich Legislative Tracking** - Bills, votes, actions, sponsors, and voting records
5. **User Engagement** - Bookmarks, alerts, and customizable notifications
6. **Analytics Ready** - Pre-computed statistics tables for performance
7. **Data Quality** - Manual override capabilities, confidence scores, and audit logging

### **Key Design Decisions:**

- **Polymorphic relationships** for bookmarks (one table for all bookmark types)
- **Denormalized stats tables** for fast dashboard queries
- **JSONB fields** for flexible metadata and evolving requirements
- **Full-text search indexes** on transcripts
- **Soft deletes** via `is_active` flags where appropriate
- **Audit trail** for all manual corrections
- **Job queue system** for async AI processing

### **Recommended Next Steps:**

1. **Set up Row Level Security (RLS)** in Supabase for the `users`, `user_bookmarks`, and `user_alerts` tables
2. **Create scheduled jobs** to populate the statistics tables nightly
3. **Implement full-text search** using PostgreSQL's built-in capabilities
4. **Add database functions** for complex queries (top legislators by issue, trending topics, etc.)

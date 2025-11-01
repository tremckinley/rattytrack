# YouTube Transcription Setup Instructions

## Prerequisites
You must have already applied the `claude_db/meeting_uploads_schema.sql` to your Supabase database.

## Step 1: Apply YouTube Schema Updates

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `claude_db/meeting_uploads_schema_youtube.sql`
4. Click "Run" to execute

This will add:
- `youtube_video_id` column for storing YouTube video IDs
- Make `video_filename` and `video_size_bytes` nullable (since YouTube videos don't need file storage)
- Add constraint to ensure either uploaded file OR YouTube video ID exists

## Step 2: Set Admin Emails (Optional)

If you want to restrict re-transcription to specific admins:

1. Go to Replit Secrets
2. Add a new secret: `ADMIN_EMAILS`
3. Value: Comma-separated email addresses (e.g., `admin@example.com,user@example.com`)

If not set, anyone can re-transcribe videos (not recommended for production).

## Step 3: Verify Environment Variables

Make sure these secrets are set:
- `YOUTUBE_API_KEY` - Your YouTube Data API v3 key
- `OPENAI_API_KEY` - Your OpenAI API key for Whisper
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database writes
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## How It Works

1. User clicks "Transcribe" on a YouTube video
2. System checks if video is already transcribed in database
3. If not, shows warning modal for videos <1 hour
4. Downloads audio using Puppeteer (headless browser)
5. Compresses/chunks audio to fit OpenAI's 25MB limit
6. Transcribes using Whisper API
7. Saves transcript with timestamps to database
8. All users can then view the transcript (shared resource)

## Admin Re-transcription

- Once transcribed, button changes to "Get Transcription"
- Only admins can re-transcribe (for fixing errors/updates)
- Non-admins will be redirected to view existing transcript

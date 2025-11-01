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
4. **Records audio using Puppeteer browser automation** (opens YouTube video in browser, captures audio stream)
   - Uses `puppeteer-stream` library to record audio directly from playback
   - Runs in headful mode (browser window opens during recording)
   - Monitors video playback to stop when video ends (supports 4+ hour videos)
5. Compresses WebM audio to MP3 and chunks if needed to fit OpenAI's 25MB limit
6. Transcribes using Whisper API with speaker diarization
7. Saves transcript with timestamps to database
8. All users can then view the transcript (shared resource)

## Important Notes

- **Browser Window**: During transcription, a browser window will open to play the YouTube video. This is required for audio capture and will close automatically when done.
- **Long Videos**: The system supports videos up to 4 hours long. Recording stops automatically when video playback ends.
- **Audio Quality**: Recorded at 128kbps, then compressed to 64kbps mono at 16kHz for Whisper (optimal for speech recognition).

## Admin Re-transcription

- Once transcribed, button changes to "Get Transcription"
- Only admins can re-transcribe (for fixing errors/updates)
- Non-admins will be redirected to view existing transcript

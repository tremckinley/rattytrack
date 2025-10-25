# Meeting Transcription Setup Instructions

Your meeting transcription feature is almost ready! You just need to create the database tables in Supabase.

## Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://prcqgekflufxlzokwjrb.supabase.co
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Schema
1. Open the file `claude_db/meeting_uploads_schema.sql` in this project
2. Copy **all** the SQL code (lines 1-136)
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

You should see: "Success. No rows returned"

### Step 3: Test It Out!
1. Go to the Meetings page in your app
2. Upload a short audio or video file (under 25MB)
3. Add a title like "Test Meeting"
4. Click "Transcribe Audio"
5. Wait for it to process (you'll see a loading indicator)
6. The transcript will appear in the "Saved Transcripts" section!

## What This Does

The schema creates two tables:

1. **uploaded_meetings** - Stores video metadata and full transcripts
2. **uploaded_meeting_segments** - Stores timestamped segments for searchability

It also sets up:
- Security policies so only your server can write data
- Full-text search indexes for fast searching
- Public read access for transparency

## Troubleshooting

**If you get an error about tables already existing:**
- The tables are already there! You're good to go. Try uploading a video.

**If transcription fails:**
- Check that the file is under 25MB
- Make sure it's a supported format (MP3, MP4, WAV, M4A, WebM)
- Check the browser console for detailed error messages

**If saved transcripts don't appear:**
- Make sure you ran the SQL schema in Supabase
- Check the Supabase table browser to verify the tables exist

## Next Steps

After setup works:
1. Test with a real city council meeting video
2. For large files (>25MB), compress the video first or extract just the audio
3. Start building the connection between uploaded transcripts and legislators!

---

Questions? Check the logs in your browser's developer console (F12) for detailed error messages.

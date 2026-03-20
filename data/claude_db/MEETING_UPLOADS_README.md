# Meeting Uploads - Database Schema

## Overview
This schema adds support for user-uploaded meeting videos with AI transcription storage.

## Tables

### `uploaded_meetings`
Stores metadata about uploaded video files and their transcription status.

**Key fields:**
- `id` - Unique identifier
- `title`, `description` - User-provided metadata
- `video_filename`, `video_size_bytes`, `video_duration_seconds` - File information
- `full_transcript` - Complete transcription text
- `transcription_status` - pending, processing, completed, failed
- `uploaded_at` - When video was uploaded
- `search_vector` - Full-text search index

### `uploaded_meeting_segments`
Stores timestamped transcript segments for precise playback and search.

**Key fields:**
- `uploaded_meeting_id` - References uploaded_meetings
- `segment_index` - Order in video
- `start_time_seconds`, `end_time_seconds` - Timing
- `text` - Segment transcript
- `speaker_name`, `speaker_id` - Optional speaker identification
- `search_vector` - Full-text search on segment text

## Installation

### 1. Add Service Role Key
Add your Supabase service role key to your environment secrets:
- Go to Supabase Dashboard → Settings → API
- Copy the `service_role` key (NOT the anon key)
- Add it as `SUPABASE_SERVICE_ROLE_KEY` in your Replit Secrets

**⚠️ Important:** The service role key has admin privileges. Never expose it to the browser!

### 2. Apply Database Schema
Run in your Supabase SQL Editor:
```sql
-- Run the entire meeting_uploads_schema.sql file
```

## Usage

### 1. Save a new upload
```typescript
const { data, error } = await supabase
  .from('uploaded_meetings')
  .insert({
    title: 'City Council Meeting - Oct 2025',
    video_filename: 'council_meeting.mp4',
    video_size_bytes: 50000000,
    transcription_status: 'pending'
  })
  .select()
  .single();
```

### 2. Update with transcription
```typescript
const { data, error } = await supabase
  .from('uploaded_meetings')
  .update({
    full_transcript: transcriptText,
    video_duration_seconds: duration,
    video_language: 'en',
    transcription_status: 'completed',
    processed_at: new Date().toISOString()
  })
  .eq('id', meetingId);
```

### 3. Save segments
```typescript
const segments = [
  {
    uploaded_meeting_id: meetingId,
    segment_index: 0,
    start_time_seconds: 0,
    end_time_seconds: 5.2,
    text: 'First segment...'
  },
  // ... more segments
];

await supabase
  .from('uploaded_meeting_segments')
  .insert(segments);
```

### 4. Retrieve uploaded meetings
```typescript
const { data, error } = await supabase
  .from('uploaded_meetings')
  .select('*')
  .eq('transcription_status', 'completed')
  .eq('is_active', true)
  .order('uploaded_at', { ascending: false });
```

### 5. Search transcripts
```typescript
const { data, error } = await supabase
  .rpc('search_uploaded_transcripts', {
    search_query: 'budget infrastructure',
    result_limit: 20
  });
```

## Features

✅ **Full-text search** - Search across all uploaded transcripts
✅ **Timestamped segments** - Jump to specific parts of videos
✅ **Public read access** - Transparency by default
✅ **Speaker identification** - Link segments to legislators (optional)
✅ **Status tracking** - Monitor transcription progress
✅ **Soft deletes** - Archive without losing data

## Next Steps

1. **Apply schema** - Run `meeting_uploads_schema.sql` in Supabase
2. **Update API** - Save transcripts to database after Whisper processing
3. **Build UI** - Show list of uploaded meetings with search
4. **Add speaker detection** - ML to identify who's speaking (future)
5. **Link to meetings** - Connect uploads to official meeting records (future)

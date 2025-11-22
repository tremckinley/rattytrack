# CapyTrackAI API & AI Features Guide

> **Purpose**: Complete reference for all API endpoints and AI-powered features in CapyTrackAI, including transcription services, YouTube integration, and cost optimization strategies.

---

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [AI Features](#ai-features)
4. [Supporting Utilities](#supporting-utilities)
5. [Cost Optimization](#cost-optimization)
6. [Error Handling](#error-handling)
7. [Code Examples](#code-examples)
8. [Production Deployment](#production-deployment)

---

## Overview

### What This System Does

CapyTrackAI uses AI to automate civic engagement tracking:

1. **YouTube Video Transcription** - Automatically transcribes city council meetings from YouTube
2. **File Upload Transcription** - Accepts audio/video file uploads for transcription
3. **Speaker Attribution** - Identifies who said what in meetings
4. **Issue Categorization** - AI-powered tagging of topics discussed
5. **Cost Tracking** - Monitors OpenAI API usage and costs

### Technology Stack

**AI Services**:
- **OpenAI Whisper API** - Speech-to-text transcription ($0.006/minute)
- **Eleven Labs Speech-to-Text API** - Advanced STT with speaker diarization ($0.006/minute)
- **Puppeteer** - Browser automation for YouTube downloads
- **FFmpeg** - Audio processing and chunking

**External APIs**:
- **YouTube Data API v3** - Fetch video metadata
- **ytmp3.as** - Third-party YouTube to MP3 converter

### Current Costs

| Service | Cost | Notes |
|---------|------|-------|
| OpenAI Whisper | $0.006/minute | ~$0.36 per 1-hour meeting |
| YouTube Data API | Free | 10,000 quota units/day |
| ytmp3.as | Free | Third-party service |
| FFmpeg | Free | Open source |

**Example**: A 2-hour city council meeting costs approximately **$0.72** to transcribe.

---

## API Endpoints

### 1. YouTube Video Transcription

**Endpoint**: `POST /api/transcribe/youtube`

**Purpose**: Transcribe a YouTube video or check existing transcription status.

#### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "videoId": "dQw4w9WgXcQ",
  "forceRetry": false,  // Optional, admin-only
  "provider": "elevenlabs",  // Optional: "elevenlabs" (default) or "whisper"
  "numSpeakers": 10  // Optional: for Eleven Labs diarization (max 32)
}
```

**Parameters**:
- `videoId` (string, required) - YouTube video ID (from URL: `youtube.com/watch?v=VIDEOID`)
- `forceRetry` (boolean, optional) - Admin-only flag to delete and re-transcribe existing video
- `provider` (string, optional) - Transcription provider: `"elevenlabs"` (default) or `"whisper"`
- `numSpeakers` (number, optional) - Number of expected speakers for Eleven Labs diarization (1-32, omit for auto-detection)

#### Response

**Success - New Transcription Started** (200):
```json
{
  "message": "Transcription started",
  "transcription": {
    "id": "uuid-here",
    "video_id": "dQw4w9WgXcQ",
    "title": "Memphis City Council Meeting - November 15, 2024",
    "channel_title": "Memphis City Council",
    "published_at": "2024-11-15T10:00:00Z",
    "duration": 7200,
    "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "status": "processing",
    "error_message": null,
    "cost": null,
    "created_at": "2024-11-17T14:30:00Z",
    "updated_at": "2024-11-17T14:30:00Z"
  },
  "processing": true
}
```

**Success - Already Transcribed** (200):
```json
{
  "message": "Video already transcribed",
  "transcription": {
    "id": "uuid-here",
    "video_id": "dQw4w9WgXcQ",
    "status": "completed",
    "cost": 0.72,
    "created_at": "2024-11-15T10:30:00Z",
    "updated_at": "2024-11-15T12:45:00Z"
  },
  "alreadyExists": true
}
```

**Success - Currently Processing** (200):
```json
{
  "message": "Transcription already in progress",
  "transcription": {
    "id": "uuid-here",
    "video_id": "dQw4w9WgXcQ",
    "status": "processing",
    "created_at": "2024-11-17T14:25:00Z"
  },
  "processing": true
}
```

**Error - Missing Video ID** (400):
```json
{
  "error": "Video ID is required"
}
```

**Error - Video Not Found** (404):
```json
{
  "error": "Video not found or invalid video ID"
}
```

**Error - Admin Required** (403):
```json
{
  "error": "Only admins can retry transcriptions"
}
```

**Error - Server Error** (500):
```json
{
  "error": "Internal server error"
}
```

#### How It Works

1. **Check Existing**: Queries database for existing transcription
2. **Return Early**: If already transcribed or processing, returns immediately
3. **Fetch Metadata**: Gets video details from YouTube Data API
4. **Create Record**: Saves transcription record with status `processing`
5. **Background Processing**: Starts async transcription job
6. **Return Immediately**: API responds while transcription runs in background

#### Background Process

Once the API responds, this happens asynchronously:

1. **Download MP3**: Uses Puppeteer to automate ytmp3.as converter
2. **Check Size**: If file > 25MB, splits into 10-minute chunks with FFmpeg
3. **Transcribe**: Sends audio to OpenAI Whisper API
4. **Save Results**: Stores transcript segments in database
5. **Update Status**: Marks as `completed` or `error`
6. **Cleanup**: Deletes temporary audio files

**Time Estimate**: 
- Download: 1-3 minutes
- Transcription: ~1 minute per 5 minutes of audio
- Total for 1-hour meeting: ~15-20 minutes

#### Usage Example

```typescript
// Start transcription
const response = await fetch('/api/transcribe/youtube', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ videoId: 'dQw4w9WgXcQ' })
});

const data = await response.json();

if (data.processing) {
  console.log('Transcription started:', data.transcription.id);
  // Poll for status using GET endpoint
} else if (data.alreadyExists) {
  console.log('Already transcribed!');
}
```

---

### 2. Check YouTube Transcription Status

**Endpoint**: `GET /api/transcribe/youtube?videoId={videoId}`

**Purpose**: Check the status of a YouTube video transcription.

#### Request

**Query Parameters**:
- `videoId` (string, required) - YouTube video ID

**Example**:
```
GET /api/transcribe/youtube?videoId=dQw4w9WgXcQ
```

#### Response

**Success** (200):
```json
{
  "transcription": {
    "id": "uuid-here",
    "video_id": "dQw4w9WgXcQ",
    "title": "Memphis City Council Meeting - November 15, 2024",
    "status": "completed",
    "cost": 0.72,
    "created_at": "2024-11-15T10:30:00Z",
    "updated_at": "2024-11-15T12:45:00Z"
  }
}
```

**Error - Not Found** (404):
```json
{
  "error": "Transcription not found"
}
```

#### Status Values

| Status | Meaning | Next Steps |
|--------|---------|------------|
| `processing` | Transcription in progress | Poll every 30s |
| `completed` | Successfully transcribed | Fetch segments from DB |
| `error` | Transcription failed | Check `error_message` field |

#### Polling Example

```typescript
async function waitForTranscription(videoId: string): Promise<void> {
  const maxAttempts = 60; // 30 minutes max (30s intervals)
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/api/transcribe/youtube?videoId=${videoId}`);
    const { transcription } = await response.json();
    
    if (transcription.status === 'completed') {
      console.log('Transcription complete!');
      return;
    }
    
    if (transcription.status === 'error') {
      throw new Error(`Transcription failed: ${transcription.error_message}`);
    }
    
    // Wait 30 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  
  throw new Error('Transcription timed out');
}
```

---

### 3. Manual Speaker Mapping (Diarization)

**Endpoint**: `GET/PATCH /api/transcribe/youtube/speakers`

**Purpose**: After transcribing with Eleven Labs diarization, manually map speaker labels (e.g., "SPEAKER_00") to actual legislators.

#### Workflow

1. **Transcribe with Eleven Labs**: Use `provider: "elevenlabs"` to get speaker diarization
2. **Get Speaker Labels**: Retrieve list of detected speakers with segment counts
3. **Map Speakers**: Assign legislator IDs to each speaker label
4. **Segments Updated**: All segments with that label now link to the legislator

---

#### Get Speaker Labels

**Endpoint**: `GET /api/transcribe/youtube/speakers?videoId={videoId}`

**Purpose**: Retrieve all speaker labels detected in a transcription with their current mappings.

**Request**:
```
GET /api/transcribe/youtube/speakers?videoId=dQw4w9WgXcQ
```

**Response**:
```json
{
  "videoId": "dQw4w9WgXcQ",
  "speakers": [
    {
      "label": "SPEAKER_00",
      "segmentCount": 45,
      "currentLegislatorId": null,
      "currentLegislatorName": null
    },
    {
      "label": "SPEAKER_01",
      "segmentCount": 38,
      "currentLegislatorId": "uuid-123",
      "currentLegislatorName": "Edmund Ford"
    },
    {
      "label": "SPEAKER_02",
      "segmentCount": 22,
      "currentLegislatorId": null,
      "currentLegislatorName": null
    }
  ],
  "totalSpeakers": 3,
  "totalSegments": 105
}
```

**Notes**:
- Speakers sorted by segment count (most active first)
- `currentLegislatorId` shows existing mapping if already set
- Use this to identify which speakers need mapping

---

#### Update Speaker Mappings

**Endpoint**: `PATCH /api/transcribe/youtube/speakers`

**Purpose**: Map speaker labels to legislator UUIDs.

**Request**:
```json
{
  "videoId": "dQw4w9WgXcQ",
  "mappings": {
    "SPEAKER_00": "legislator-uuid-1",
    "SPEAKER_01": "legislator-uuid-2",
    "SPEAKER_02": null
  }
}
```

**Parameters**:
- `videoId` (string, required) - YouTube video ID
- `mappings` (object, required) - Map of speaker label → legislator UUID
  - Use `null` to clear a mapping

**Response**:
```json
{
  "message": "Updated 3 speaker mapping(s)",
  "videoId": "dQw4w9WgXcQ",
  "results": [
    {
      "label": "SPEAKER_00",
      "success": true,
      "segmentsUpdated": 45
    },
    {
      "label": "SPEAKER_01",
      "success": true,
      "segmentsUpdated": 38
    },
    {
      "label": "SPEAKER_02",
      "success": true,
      "segmentsUpdated": 22
    }
  ],
  "summary": {
    "total": 3,
    "success": 3,
    "failed": 0
  }
}
```

**Notes**:
- `segmentsUpdated` shows how many transcript segments were updated for each speaker label
- Multiple speaker labels can map to the same legislator (e.g., if diarization incorrectly split one speaker into SPEAKER_00 and SPEAKER_01)
- `segmentsUpdated: 0` indicates the speaker label wasn't found in any segments

**Error Response** (400):
```json
{
  "error": "One or more legislator IDs are invalid"
}
```

---

#### Complete Example: Diarization Workflow

```typescript
// Step 1: Transcribe with Eleven Labs
const transcribeResponse = await fetch('/api/transcribe/youtube', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoId: 'abc123',
    provider: 'elevenlabs',
    numSpeakers: 10  // Memphis has ~13 council members
  })
});

// Step 2: Wait for completion (poll status endpoint)
// ... wait for status === 'completed' ...

// Step 3: Get speaker labels
const speakersResponse = await fetch('/api/transcribe/youtube/speakers?videoId=abc123');
const { speakers } = await speakersResponse.json();

console.log('Detected speakers:', speakers);
// SPEAKER_00: 45 segments
// SPEAKER_01: 38 segments
// SPEAKER_02: 22 segments

// Step 4: Manually identify speakers (listen to audio, check context, etc.)
// Then create mapping:
const mappings = {
  'SPEAKER_00': 'edmund-ford-uuid',      // Council Member Edmund Ford
  'SPEAKER_01': 'frank-colvett-uuid',    // Council Member Frank Colvett
  'SPEAKER_02': 'mayor-young-uuid'       // Mayor Paul Young
};

// Step 5: Apply mappings
const updateResponse = await fetch('/api/transcribe/youtube/speakers', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoId: 'abc123',
    mappings
  })
});

const result = await updateResponse.json();
console.log(`Mapped ${result.summary.success} speakers`);

// Now all segments have speaker_id linked to legislators!
```

**Tips for Identifying Speakers**:
- Listen to a few segments from each speaker
- Check meeting agenda for speaking order
- Mayor typically speaks first/most
- Council members may introduce themselves
- Cross-reference with video if available

---

### 4. File Upload Transcription

**Endpoint**: `POST /api/transcribe`

**Purpose**: Transcribe an uploaded audio or video file.

#### Request

**Headers**:
```
Content-Type: multipart/form-data
```

**Body** (FormData):
```javascript
const formData = new FormData();
formData.append('audio', audioFile); // File object
formData.append('title', 'Meeting Title'); // Optional
formData.append('description', 'Description'); // Optional
```

**File Limits**:
- **Max Size**: 25MB (OpenAI Whisper API limit)
- **Supported Formats**: MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM

#### Response

**Success** (200):
```json
{
  "meetingId": "uuid-here",
  "text": "Full transcript text here...",
  "segments": [
    {
      "id": 0,
      "seek": 0,
      "start": 0.0,
      "end": 5.2,
      "text": " Good morning everyone.",
      "tokens": [50364, 2205, 2446, 1518, 13, 50622],
      "temperature": 0.0,
      "avg_logprob": -0.3,
      "compression_ratio": 1.2,
      "no_speech_prob": 0.01
    },
    {
      "id": 1,
      "seek": 0,
      "start": 5.2,
      "end": 10.8,
      "text": " Let us begin the meeting.",
      "tokens": [50622, 961, 505, 1841, 264, 3440, 13, 50902],
      "temperature": 0.0,
      "avg_logprob": -0.3,
      "compression_ratio": 1.2,
      "no_speech_prob": 0.02
    }
  ],
  "duration": 3600.5,
  "language": "en"
}
```

**Error - No File** (400):
```json
{
  "error": "No audio file provided"
}
```

**Error - File Too Large** (400):
```json
{
  "error": "File size exceeds 25MB limit. Please upload a smaller file."
}
```

**Error - Transcription Failed** (500):
```json
{
  "error": "Transcription failed",
  "details": "API timeout"
}
```

#### How It Works

1. **Receive Upload**: Extracts file from FormData
2. **Validate Size**: Checks against 25MB limit
3. **Create Record**: Saves to `uploaded_meetings` table
4. **Transcribe**: Sends directly to OpenAI Whisper API
5. **Save Results**: Stores transcript and segments
6. **Return**: Sends full response (no background processing)

**Processing Time**: 
- Synchronous (blocks until complete)
- ~1 minute per 5 minutes of audio
- Max recommended: 10-15 minute videos

#### Usage Example

```typescript
async function transcribeFile(file: File) {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('title', 'Committee Hearing - Budget');
  formData.append('description', 'Finance committee budget discussion');
  
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const result = await response.json();
  console.log('Transcribed:', result.meetingId);
  console.log('Segments:', result.segments.length);
  console.log('Duration:', result.duration, 'seconds');
  
  return result;
}
```

---

## AI Features

### 1. OpenAI Whisper Transcription

**Module**: `lib/utils/whisper-client.ts`

**Purpose**: Client wrapper for OpenAI Whisper API with cost tracking and chunking support.

#### Functions

##### `transcribeAudio(options)`

Transcribes a single audio file.

**Parameters**:
```typescript
interface TranscribeOptions {
  filePath: string;      // Path to audio file
  language?: string;     // ISO language code (e.g., 'en') or auto-detect
  prompt?: string;       // Context hint for better accuracy
}
```

**Returns**:
```typescript
interface TranscribeResult {
  text: string;                                    // Full transcript
  segments: Array<{                                // Timestamped segments
    start: number;
    end: number;
    text: string;
  }>;
  duration: number;                                // Audio duration in seconds
  cost: number;                                    // Estimated cost in USD
}
```

**Example**:
```typescript
import { transcribeAudio } from '@/lib/utils/whisper-client';

const result = await transcribeAudio({
  filePath: '/tmp/meeting.mp3',
  language: 'en',
  prompt: 'Memphis City Council meeting transcription'
});

console.log('Cost:', result.cost.toFixed(4)); // $0.7200
console.log('Duration:', result.duration, 'seconds');
console.log('Segments:', result.segments.length);
```

**Prompt Optimization**:
- Improves accuracy for domain-specific terms
- Examples:
  - `"Memphis City Council meeting transcription"`
  - `"Legislative session with technical budget terms"`
  - `"Public hearing with community speakers"`

---

##### `transcribeAudioChunks(chunkPaths, options)`

Transcribes multiple audio chunks and merges results.

**Parameters**:
```typescript
chunkPaths: string[]  // Array of chunk file paths
options?: {
  language?: string;
  prompt?: string;
}
```

**Returns**: Same as `transcribeAudio()` but with merged segments and cumulative cost.

**Example**:
```typescript
import { transcribeAudioChunks } from '@/lib/utils/whisper-client';

const chunks = [
  '/tmp/chunk_000.mp3',
  '/tmp/chunk_001.mp3',
  '/tmp/chunk_002.mp3'
];

const result = await transcribeAudioChunks(chunks, {
  language: 'en',
  prompt: 'City council budget hearing'
});

// Timestamps are automatically adjusted across chunks
console.log('Total cost:', result.cost);
console.log('Total duration:', result.duration);
```

**How Timestamps Work**:
- Each chunk's timestamps are offset by previous chunks' duration
- Example:
  - Chunk 0 (0-600s): Segment at 10s → 10s
  - Chunk 1 (600-1200s): Segment at 10s → 610s
  - Chunk 2 (1200-1800s): Segment at 10s → 1210s

---

##### `transcribeWithAutoChunking(filePaths, options)`

Wrapper that handles single files or multiple chunks automatically.

**Parameters**:
```typescript
filePaths: string[]    // Single file or array of chunks
options?: {
  language?: string;
  prompt?: string;
}
```

**Returns**: Same as `transcribeAudio()`

**Usage**:
```typescript
import { transcribeWithAutoChunking } from '@/lib/utils/whisper-client';

// Single file
const result = await transcribeWithAutoChunking(['/tmp/audio.mp3']);

// Multiple chunks (automatically merges)
const chunkedResult = await transcribeWithAutoChunking([
  '/tmp/chunk_000.mp3',
  '/tmp/chunk_001.mp3'
]);
```

---

### 2. Eleven Labs Speech-to-Text with Diarization

**Module**: `lib/utils/elevenlabs-client.ts`

**Purpose**: Advanced speech-to-text with automatic speaker identification (diarization) for multi-speaker meetings.

#### Key Features

- **Speaker Diarization**: Automatically identifies and labels different speakers in audio
- **Word-Level Timestamps**: Precise timing for each word spoken
- **Multi-Speaker Support**: Handles up to 32 speakers simultaneously
- **Same Pricing**: $0.006/minute (same as Whisper)

#### Functions

##### `transcribeAudio(options)`

Transcribes a single audio file with speaker diarization.

**Parameters**:
```typescript
interface TranscribeOptions {
  filePath: string;              // Path to audio file
  language?: string;             // ISO language code (default: 'en')
  numSpeakers?: number | null;   // Expected number of speakers (1-32, null for auto)
  diarizationThreshold?: number; // Speaker separation sensitivity (0.1-0.4, default: 0.22)
}
```

**Returns**:
```typescript
interface TranscribeResult {
  text: string;                  // Full transcript
  segments: Array<{              // Speaker-labeled segments
    start: number;
    end: number;
    text: string;
    speaker?: string;            // Speaker label (e.g., "SPEAKER_00", "SPEAKER_01")
  }>;
  duration: number;
  cost: number;
}
```

**Example**:
```typescript
import { transcribeAudio } from '@/lib/utils/elevenlabs-client';

const result = await transcribeAudio({
  filePath: '/tmp/meeting.mp3',
  language: 'en',
  numSpeakers: 10,               // Expecting ~10 council members
  diarizationThreshold: 0.22     // Default sensitivity
});

console.log('Speakers detected:', new Set(result.segments.map(s => s.speaker)).size);
console.log('First segment:', result.segments[0].speaker, result.segments[0].text);
```

**Diarization Parameters**:
- **numSpeakers**: Exact number if known, or `null` for automatic detection
  - If you know there are 10 council members → `numSpeakers: 10`
  - If speaker count varies → `numSpeakers: null`
- **diarizationThreshold**: Controls speaker separation sensitivity
  - Lower (0.1): More likely to merge speakers (fewer speakers detected)
  - Higher (0.4): More likely to split speakers (more speakers detected)
  - Default (0.22): Balanced for most meetings

##### `transcribeWithAutoChunking(filePaths, options)`

Same as Whisper client but with diarization support.

**Usage**:
```typescript
import { transcribeWithAutoChunking } from '@/lib/utils/elevenlabs-client';

// Single file with diarization
const result = await transcribeWithAutoChunking(['/tmp/audio.mp3'], {
  language: 'en',
  numSpeakers: 12
});

// Multiple chunks (speaker labels preserved across chunks)
const chunkedResult = await transcribeWithAutoChunking([
  '/tmp/chunk_000.mp3',
  '/tmp/chunk_001.mp3'
], {
  numSpeakers: null  // Auto-detect
});
```

---

### 3. Speaker Matching

**Module**: `lib/utils/speaker-matcher.ts`

**Purpose**: Automatically match speaker labels (e.g., "SPEAKER_00") to legislators in the database using fuzzy name matching.

#### How It Works

1. **Extract Names**: Parses speaker labels to extract names and titles
   - "Council Member Smith" → { title: "council member", lastName: "Smith" }
   - "Mayor Jones" → { title: "mayor", lastName: "Jones" }
   - "SPEAKER_00" → Unmatched (generic label)

2. **Fuzzy Matching**: Compares extracted names to legislator database
   - Last name match: 50 points
   - First name match: 30 points
   - Title match: 20 points

3. **Confidence Scoring**:
   - **High** (70+ points): Last + first name match
   - **Medium** (50-69 points): Last name + partial first name
   - **Low** (30-49 points): Partial matches
   - **None** (<30 points): No match

#### Functions

##### `matchSpeakerToLegislator(speakerLabel)`

Match a single speaker label to a legislator.

**Parameters**:
```typescript
speakerLabel: string  // e.g., "Council Member Smith"
```

**Returns**:
```typescript
interface SpeakerMatch {
  legislatorId: string | null;      // UUID of matched legislator
  legislator: Legislator | null;    // Full legislator object
  confidence: 'high' | 'medium' | 'low' | 'none';
  speakerLabel: string;             // Original label
}
```

**Example**:
```typescript
import { matchSpeakerToLegislator } from '@/lib/utils/speaker-matcher';

const match = await matchSpeakerToLegislator("Council Member Edmund Ford");

if (match.confidence === 'high') {
  console.log('Matched:', match.legislator?.display_name);
  console.log('ID:', match.legislatorId);
}
```

##### `matchAllSpeakers(speakerLabels)`

Batch match multiple speakers.

**Parameters**:
```typescript
speakerLabels: string[]  // Array of unique speaker labels
```

**Returns**:
```typescript
Map<string, SpeakerMatch>  // Map of label → match result
```

**Example**:
```typescript
import { matchAllSpeakers } from '@/lib/utils/speaker-matcher';

const speakers = ["Council Member Smith", "Mayor Jones", "SPEAKER_02"];
const matches = await matchAllSpeakers(speakers);

matches.forEach((match, label) => {
  if (match.legislatorId) {
    console.log(`${label} → ${match.legislator?.display_name} (${match.confidence})`);
  } else {
    console.log(`${label} → Unmatched`);
  }
});
```

**Title Patterns Recognized**:
- Council Member, Councilmember
- Mayor, Vice Mayor
- Chairman, Chairwoman, Chair
- President
- Commissioner

---

### 4. YouTube Downloader

**Module**: `lib/utils/youtube-downloader.ts`

**Purpose**: Automated YouTube to MP3 conversion using Puppeteer and ytmp3.as.

#### Function: `recordYouTubeAudio(options)`

**Parameters**:
```typescript
interface DownloadOptions {
  videoId: string;       // YouTube video ID
  outputPath: string;    // Where to save MP3
}
```

**Returns**:
```typescript
interface DownloadResult {
  success: boolean;
  filePath?: string;     // Path to downloaded MP3 (if success)
  error?: string;        // Error message (if failure)
}
```

**Example**:
```typescript
import { recordYouTubeAudio } from '@/lib/utils/youtube-downloader';
import path from 'path';

const result = await recordYouTubeAudio({
  videoId: 'dQw4w9WgXcQ',
  outputPath: path.join('/tmp', 'audio.mp3')
});

if (result.success) {
  console.log('Downloaded to:', result.filePath);
} else {
  console.error('Download failed:', result.error);
}
```

#### How It Works

1. **Launch Browser**: Puppeteer starts Chromium in headless mode
2. **Navigate**: Goes to ytmp3.as converter page
3. **Submit URL**: Enters YouTube URL and clicks convert
4. **Wait for Conversion**: Polls for download button (up to 2 minutes)
5. **Download**: Clicks download button
6. **Poll for File**: Checks download directory for MP3 (up to 3 minutes)
7. **Verify**: Ensures file has content and isn't being written
8. **Rename**: Moves downloaded file to specified output path
9. **Cleanup**: Closes browser

**Timeouts**:
- Conversion: 120 seconds (2 minutes)
- Download: 180 seconds (3 minutes)
- Total max: ~6 minutes

**Chromium Path**:
- Uses `CHROMIUM_PATH` environment variable if set
- Falls back to Puppeteer's bundled Chrome
- Required for deployment: `/nix/store/.../chromium/bin/chromium`

#### Retry Safety

The downloader preserves previous successful downloads:
- ✅ **Safe**: Only replaces file after new download succeeds
- ✅ **Atomic**: Uses `fs.renameSync()` for atomic replacement
- ✅ **No Data Loss**: Failed retries don't delete existing MP3
- ✅ **Cleanup**: Only deletes partial/failed downloads

---

### 3. YouTube Data Fetcher

**Module**: `lib/data/youtube.ts`

**Purpose**: Fetch video metadata from YouTube Data API v3.

#### Functions

##### `fetchLatestVideos(maxResults)`

Fetches latest videos from Memphis City Council channel.

**Parameters**:
- `maxResults` (number, default: 5) - How many videos to fetch

**Returns**:
```typescript
interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;       // ISO timestamp
  duration: string;          // Seconds as string
  thumbnailUrl: string;
  description: string;
  url: string;               // Full YouTube URL
}
```

**Example**:
```typescript
import { fetchLatestVideos } from '@/lib/data/youtube';

const videos = await fetchLatestVideos(10);

videos.forEach(video => {
  console.log(`${video.title} (${video.duration}s)`);
  console.log(`Published: ${video.publishedAt}`);
  console.log(`URL: ${video.url}`);
});
```

**Cost**: Free (uses quota units, 10,000/day limit)

---

##### `getVideoDetails(videoId)`

Fetches detailed information for a single video.

**Parameters**:
- `videoId` (string) - YouTube video ID

**Returns**: `YouTubeVideo | null`

**Example**:
```typescript
import { getVideoDetails } from '@/lib/data/youtube';

const video = await getVideoDetails('dQw4w9WgXcQ');

if (video) {
  console.log('Title:', video.title);
  console.log('Duration:', video.duration, 'seconds');
  console.log('Channel:', video.channelTitle);
}
```

---

### 4. Audio Processor

**Module**: `lib/utils/audio-processor.ts`

**Purpose**: FFmpeg-based audio processing for Whisper API optimization.

#### Functions

##### `convertToMP3(options)`

Converts audio files to MP3 with Whisper-optimized settings.

**Parameters**:
```typescript
interface ConversionOptions {
  inputPath: string;
  outputPath: string;
  frequency?: number;     // Default: 16000 (16kHz)
  channels?: number;      // Default: 1 (mono)
  bitrate?: string;       // Default: '64k'
}
```

**Example**:
```typescript
import { convertToMP3 } from '@/lib/utils/audio-processor';

await convertToMP3({
  inputPath: '/tmp/video.webm',
  outputPath: '/tmp/audio.mp3',
  frequency: 16000,
  channels: 1,
  bitrate: '64k'
});
```

**Why These Settings?**:
- **16kHz**: Whisper's optimal frequency (lower = smaller file)
- **Mono**: Speech doesn't need stereo (halves file size)
- **64kbps**: Good quality for speech (lower than music)

---

##### `splitAudioIntoChunks(options)`

Splits large audio files into smaller chunks.

**Parameters**:
```typescript
interface ChunkOptions {
  inputPath: string;
  outputDir: string;
  chunkDuration: number;  // Seconds per chunk
}
```

**Returns**: `string[]` - Array of chunk file paths

**Example**:
```typescript
import { splitAudioIntoChunks } from '@/lib/utils/audio-processor';

const chunks = await splitAudioIntoChunks({
  inputPath: '/tmp/long-meeting.mp3',
  outputDir: '/tmp/chunks',
  chunkDuration: 600  // 10 minutes
});

console.log(`Created ${chunks.length} chunks`);
// Output: Created 12 chunks
// Files: chunk_000.mp3, chunk_001.mp3, ..., chunk_011.mp3
```

**Use Case**: Files over 25MB must be split before sending to Whisper API.

---

##### `exceedsFileSizeLimit(filePath, limitMB)`

Checks if file exceeds size limit.

**Parameters**:
- `filePath` (string) - Path to file
- `limitMB` (number, default: 25) - Size limit in megabytes

**Returns**: `boolean`

**Example**:
```typescript
import { exceedsFileSizeLimit } from '@/lib/utils/audio-processor';

if (exceedsFileSizeLimit('/tmp/audio.mp3', 25)) {
  console.log('File is too large, need to split');
}
```

---

##### `getAudioDuration(filePath)`

Gets audio file duration in seconds.

**Example**:
```typescript
import { getAudioDuration } from '@/lib/utils/audio-processor';

const duration = await getAudioDuration('/tmp/meeting.mp3');
console.log(`Duration: ${duration} seconds`);
```

---

##### `cleanupAudioFiles(paths)`

Deletes temporary audio files and directories.

**Example**:
```typescript
import { cleanupAudioFiles } from '@/lib/utils/audio-processor';

const tempFiles = [
  '/tmp/audio.mp3',
  '/tmp/chunks'  // Directory
];

cleanupAudioFiles(tempFiles);
```

---

## Cost Optimization

### OpenAI Whisper Pricing

**Rate**: $0.006 per minute of audio

**Examples**:
| Duration | Cost |
|----------|------|
| 10 minutes | $0.06 |
| 30 minutes | $0.18 |
| 1 hour | $0.36 |
| 2 hours | $0.72 |
| 3 hours | $1.08 |

### Cost Reduction Strategies

#### 1. Audio Optimization

**Before Sending to Whisper**:
```typescript
import { convertToMP3 } from '@/lib/utils/audio-processor';

// Convert with optimal settings
await convertToMP3({
  inputPath: 'meeting.wav',
  outputPath: 'meeting.mp3',
  frequency: 16000,   // Lower frequency = smaller file
  channels: 1,        // Mono instead of stereo
  bitrate: '64k'      // Lower bitrate for speech
});
```

**Savings**: ~70% file size reduction vs. unoptimized audio

---

#### 2. Deduplication

**Check Before Transcribing**:
```typescript
import { getTranscription } from '@/lib/data/youtube_transcriptions';

const existing = await getTranscription(videoId);

if (existing?.status === 'completed') {
  console.log('Already transcribed, skip API call');
  return existing;
}
```

**Savings**: $0 per duplicate (vs. full cost)

---

#### 3. Batch Processing

**Process Multiple Videos at Once**:
```typescript
async function batchTranscribe(videoIds: string[]) {
  const promises = videoIds.map(async (videoId) => {
    const existing = await getTranscription(videoId);
    if (existing) return existing;
    
    // Start transcription
    return await fetch('/api/transcribe/youtube', {
      method: 'POST',
      body: JSON.stringify({ videoId })
    });
  });
  
  return await Promise.all(promises);
}
```

**Benefit**: Parallel processing reduces total time

---

#### 4. Cost Tracking

**Monitor Usage**:
```typescript
import { supabase } from '@/lib/utils/supabase';

// Get total transcription costs
const { data } = await supabase
  .from('youtube_transcriptions')
  .select('cost')
  .eq('status', 'completed');

const totalCost = data.reduce((sum, t) => sum + (t.cost || 0), 0);
console.log(`Total spent: $${totalCost.toFixed(2)}`);
```

---

### YouTube Data API Quota

**Free Quota**: 10,000 units per day

**Costs per Operation**:
- Search videos: 100 units
- Get video details: 1 unit

**Example**:
```typescript
// Costs 100 units
const videos = await fetchLatestVideos(5);

// Costs 5 units (1 per video)
for (const video of videos) {
  await getVideoDetails(video.videoId);
}

// Total: 105 units used
```

**Daily Limit**: ~100 searches or 10,000 detail lookups

---

## Error Handling

### Transcription Errors

The system tracks transcription status to prevent stuck jobs:

```typescript
// In processTranscription()
try {
  // ... transcription logic
  await saveTranscriptSegments(videoId, segments, cost);
  await updateTranscriptionStatus(videoId, 'completed');
} catch (error) {
  // ALWAYS update status on error
  await updateTranscriptionStatus(
    videoId,
    'error',
    error instanceof Error ? error.message : 'Unknown error'
  );
}
```

**Why This Matters**: Without error status updates, failed jobs stay in `processing` state forever.

---

### Common Errors

#### 1. Download Timeout

**Error**: `"Download timed out - no MP3 file found after 3 minutes"`

**Cause**: ytmp3.as converter is slow or unavailable

**Solution**:
- Retry the transcription (admin-only `forceRetry: true`)
- Check if ytmp3.as is working manually
- Consider alternative download method

---

#### 2. File Too Large

**Error**: `"File size exceeds 25MB limit"`

**Cause**: OpenAI Whisper API has 25MB limit per request

**Solution**: Automatic chunking handles this
```typescript
if (exceedsFileSizeLimit(mp3Path, 25)) {
  const chunks = await splitAudioIntoChunks({
    inputPath: mp3Path,
    outputDir: '/tmp/chunks',
    chunkDuration: 600  // 10 min chunks
  });
}
```

---

#### 3. YouTube API Quota Exceeded

**Error**: `"YouTube API error: quotaExceeded"`

**Cause**: Exceeded 10,000 quota units per day

**Solution**:
- Wait until quota resets (midnight Pacific Time)
- Cache video metadata to reduce API calls
- Request quota increase from Google

---

#### 4. OpenAI API Timeout

**Error**: `"Transcription failed: API timeout"`

**Cause**: Whisper API is slow or overloaded

**Solution**:
- Retry automatically (built into API)
- Split large files into smaller chunks
- Add exponential backoff between retries

---

#### 5. Browser Automation Failed

**Error**: `"Timeout waiting for conversion to complete"`

**Cause**: ytmp3.as page structure changed or is down

**Solution**:
- Update selectors in `youtube-downloader.ts`
- Check if ytmp3.as changed their UI
- Consider alternative converter services

---

### Retry Logic Example

```typescript
async function transcribeWithRetry(
  videoId: string, 
  maxRetries: number = 3
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('/api/transcribe/youtube', {
        method: 'POST',
        body: JSON.stringify({ videoId })
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      // Don't retry client errors (400-499)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }
      
      // Retry server errors (500+)
      console.log(`Attempt ${attempt + 1} failed, retrying...`);
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000) // Exponential backoff
      );
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }
}
```

---

## Code Examples

### Complete YouTube Transcription Workflow

```typescript
import { fetchLatestVideos, getVideoDetails } from '@/lib/data/youtube';
import { getTranscription } from '@/lib/data/youtube_transcriptions';

async function transcribeCityCouncilMeetings() {
  // 1. Fetch latest videos from channel
  console.log('Fetching latest videos...');
  const videos = await fetchLatestVideos(10);
  
  // 2. Filter for city council meetings
  const meetings = videos.filter(v => 
    v.title.toLowerCase().includes('city council') ||
    v.title.toLowerCase().includes('meeting')
  );
  
  console.log(`Found ${meetings.length} meeting videos`);
  
  // 3. Check which are already transcribed
  const needTranscription = [];
  
  for (const video of meetings) {
    const existing = await getTranscription(video.videoId);
    
    if (!existing || existing.status === 'error') {
      needTranscription.push(video);
    } else if (existing.status === 'completed') {
      console.log(`✓ Already transcribed: ${video.title}`);
    } else {
      console.log(`⏳ Processing: ${video.title}`);
    }
  }
  
  // 4. Start transcriptions for new videos
  console.log(`Starting ${needTranscription.length} new transcriptions...`);
  
  for (const video of needTranscription) {
    const response = await fetch('/api/transcribe/youtube', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: video.videoId })
    });
    
    const result = await response.json();
    
    if (result.processing) {
      console.log(`✓ Started: ${video.title}`);
    } else if (result.error) {
      console.error(`✗ Failed: ${video.title} - ${result.error}`);
    }
    
    // Rate limiting: wait 5s between requests
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('All transcriptions queued!');
}

// Run it
transcribeCityCouncilMeetings().catch(console.error);
```

---

### File Upload with Progress Tracking

```typescript
async function uploadAndTranscribe(file: File) {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('title', file.name);
  
  console.log('Uploading:', file.name);
  console.log('Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
  
  // Check size before uploading
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (file.size > maxSize) {
    throw new Error(
      `File too large (${(file.size / 1024 / 1024).toFixed(2)} MB). ` +
      `Maximum is 25 MB. Consider using YouTube upload instead.`
    );
  }
  
  // Upload and transcribe
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }
  
  const result = await response.json();
  
  console.log('✓ Transcription complete!');
  console.log('Meeting ID:', result.meetingId);
  console.log('Duration:', (result.duration / 60).toFixed(1), 'minutes');
  console.log('Segments:', result.segments.length);
  console.log('Language:', result.language);
  
  return result;
}

// Usage
const fileInput = document.getElementById('audioUpload') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  uploadAndTranscribe(file)
    .then(result => console.log('Success:', result))
    .catch(error => console.error('Error:', error));
}
```

---

### Cost Calculator

```typescript
import { supabase } from '@/lib/utils/supabase';

async function calculateTranscriptionCosts(
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from('youtube_transcriptions')
    .select('id, video_id, title, duration, cost, created_at')
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });
  
  if (error || !data) {
    throw new Error('Failed to fetch transcriptions');
  }
  
  const totalCost = data.reduce((sum, t) => sum + (t.cost || 0), 0);
  const totalDuration = data.reduce((sum, t) => sum + (t.duration || 0), 0);
  const totalMinutes = totalDuration / 60;
  
  console.log('=== Transcription Cost Report ===');
  console.log(`Period: ${startDate} to ${endDate}`);
  console.log(`Total Videos: ${data.length}`);
  console.log(`Total Duration: ${(totalMinutes / 60).toFixed(1)} hours`);
  console.log(`Total Cost: $${totalCost.toFixed(2)}`);
  console.log(`Average Cost/Video: $${(totalCost / data.length).toFixed(2)}`);
  console.log(`Average Duration: ${(totalMinutes / data.length).toFixed(1)} min`);
  
  // Most expensive videos
  const sorted = [...data].sort((a, b) => (b.cost || 0) - (a.cost || 0));
  console.log('\nTop 5 Most Expensive:');
  sorted.slice(0, 5).forEach((t, i) => {
    console.log(`${i + 1}. ${t.title}: $${t.cost.toFixed(2)}`);
  });
  
  return {
    totalCost,
    totalDuration,
    count: data.length,
    videos: data
  };
}

// Usage
calculateTranscriptionCosts('2024-11-01', '2024-11-30')
  .then(report => console.log('Report generated:', report))
  .catch(error => console.error('Error:', error));
```

---

## Production Deployment

### Required Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# YouTube Data API
YOUTUBE_API_KEY=AIza...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Chromium (for Puppeteer)
CHROMIUM_PATH=/nix/store/.../chromium/bin/chromium

# Admin Access (optional)
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

### Chromium Installation

For Replit/Nix deployment:

```bash
# Install Chromium
nix-env -iA nixpkgs.chromium

# Get path
which chromium
# Output: /nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium

# Set in environment
export CHROMIUM_PATH=/nix/store/.../chromium/bin/chromium
```

### Performance Considerations

**1. Background Processing**:
- YouTube transcriptions run asynchronously
- API responds immediately
- Prevents timeout on long videos

**2. File Cleanup**:
- Temporary files deleted after processing
- Prevents disk space issues
- Atomic operations prevent data loss

**3. Rate Limiting**:
- 1s delay between Whisper API calls for chunks
- Prevents rate limit errors
- Consider adding queue system for scale

**4. Database Indexing**:
```sql
-- Add indexes for faster queries
CREATE INDEX idx_youtube_transcriptions_status 
  ON youtube_transcriptions(status);

CREATE INDEX idx_youtube_transcriptions_video_id 
  ON youtube_transcriptions(video_id);

CREATE INDEX idx_uploaded_meetings_status 
  ON uploaded_meetings(transcription_status);
```

---

### Monitoring

**Track Transcription Status**:
```typescript
import { supabase } from '@/lib/utils/supabase';

async function getTranscriptionStats() {
  const { data } = await supabase
    .from('youtube_transcriptions')
    .select('status');
  
  const stats = data.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('Transcription Status:');
  console.log(`  Completed: ${stats.completed || 0}`);
  console.log(`  Processing: ${stats.processing || 0}`);
  console.log(`  Error: ${stats.error || 0}`);
  
  return stats;
}
```

**Alert on Stuck Jobs**:
```typescript
async function findStuckTranscriptions() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('youtube_transcriptions')
    .select('id, video_id, title, created_at')
    .eq('status', 'processing')
    .lt('created_at', oneHourAgo);
  
  if (data && data.length > 0) {
    console.warn(`⚠️ ${data.length} transcriptions stuck in processing:`);
    data.forEach(t => {
      console.log(`  - ${t.title} (${t.video_id})`);
    });
  }
  
  return data;
}
```

---

## Quick Reference

### API Endpoints Summary

| Endpoint | Method | Purpose | Processing |
|----------|--------|---------|------------|
| `/api/transcribe/youtube` | POST | Start YouTube transcription | Async (background) |
| `/api/transcribe/youtube?videoId=xxx` | GET | Check transcription status | Sync |
| `/api/transcribe` | POST | Transcribe uploaded file | Sync |

### Cost Summary

| Service | Cost | Limit |
|---------|------|-------|
| OpenAI Whisper | $0.006/min | 25MB per file |
| YouTube Data API | Free | 10,000 units/day |
| ytmp3.as | Free | Varies |

### File Size Limits

| Type | Limit | Solution if Exceeded |
|------|-------|---------------------|
| Whisper API | 25MB | Auto-chunking with FFmpeg |
| Upload endpoint | 25MB | User must split manually |

### Status Values

| Status | Meaning | Action |
|--------|---------|--------|
| `processing` | Transcription in progress | Poll for updates |
| `completed` | Successfully transcribed | Fetch transcript |
| `error` | Failed | Check `error_message`, retry |

---

**Last Updated**: November 2024  
**OpenAI Model**: Whisper-1  
**API Version**: Next.js 15 App Router

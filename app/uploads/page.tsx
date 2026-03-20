import VideoTranscriber from '@/components/transcripts/VideoTranscriber';
import SavedTranscripts from '@/components/transcripts/SavedTranscripts';
import { getCompletedUploadedMeetings } from '@/lib/data/uploaded_meetings';

export default async function MeetingsPage() {
  const savedMeetings = await getCompletedUploadedMeetings(20);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Meeting Transcription</h1>
      <p className="text-muted-foreground mb-8">
        Upload a video or audio file to transcribe it using OpenAI Whisper. Transcripts are saved automatically.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <VideoTranscriber />
        </div>
        
        <div>
          <SavedTranscripts meetings={savedMeetings} />
        </div>
      </div>
    </main>
  );
}

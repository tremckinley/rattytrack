import VideoTranscriber from '@/components/VideoTranscriber';

export default function MeetingsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Meeting Transcription</h1>
      <p className="text-muted-foreground mb-8">
        Upload a video or audio file to transcribe it using OpenAI Whisper.
      </p>
      
      <VideoTranscriber />
    </main>
  );
}

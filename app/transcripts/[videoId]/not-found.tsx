import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Transcription Not Found</h2>
        <p className="text-muted-foreground mb-6">
          This video has not been transcribed yet, or the transcription ID is invalid.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/youtube"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Browse YouTube Videos
          </Link>
        </div>
      </div>
    </div>
  );
}

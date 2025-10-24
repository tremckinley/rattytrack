'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFileVideo, faSpinner, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface TranscriptionResponse {
  text: string;
  segments?: TranscriptionSegment[];
  duration?: number;
  language?: string;
  error?: string;
  details?: string;
}

export default function VideoTranscriber() {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    
    if (selectedFile.size > maxSize) {
      setError('File size exceeds 25MB limit. Please upload a smaller file.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setTranscription(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setTranscription(null);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data: TranscriptionResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Transcription failed');
      } else {
        setTranscription(data);
      }
    } catch (err) {
      setError('Failed to connect to transcription service');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FontAwesomeIcon
            icon={faFileVideo}
            className="text-6xl text-muted-foreground mb-4"
          />
          <h3 className="text-xl font-semibold mb-2">
            {file ? 'File Selected' : 'Upload Video or Audio File'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {file
              ? `${file.name} (${formatFileSize(file.size)})`
              : 'Drag and drop a file here, or click to browse'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Supported formats: MP3, MP4, WAV, M4A, WebM (max 25MB)
          </p>
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
          >
            <FontAwesomeIcon icon={faUpload} />
            {file ? 'Change File' : 'Select File'}
          </label>
        </div>

        {file && (
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                Transcribing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUpload} />
                Transcribe Audio
              </>
            )}
          </button>
        )}
      </form>

      {error && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
          <FontAwesomeIcon
            icon={faTimesCircle}
            className="text-destructive text-xl mt-0.5"
          />
          <div>
            <h4 className="font-semibold text-destructive">Error</h4>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {transcription && (
        <div className="mt-6 space-y-6">
          <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg flex items-start gap-3">
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="text-green-500 text-xl mt-0.5"
            />
            <div>
              <h4 className="font-semibold text-green-500">
                Transcription Complete
              </h4>
              <p className="text-sm">
                {transcription.duration && `Duration: ${formatTime(transcription.duration)}`}
                {transcription.language && ` | Language: ${transcription.language}`}
              </p>
            </div>
          </div>

          <div className="card p-6 bg-card border border-border">
            <h3 className="text-xl font-semibold mb-4">Full Transcript</h3>
            <div className="prose max-w-none">
              <p className="text-foreground whitespace-pre-wrap">
                {transcription.text}
              </p>
            </div>
          </div>

          {transcription.segments && transcription.segments.length > 0 && (
            <div className="card p-6 bg-card border border-border">
              <h3 className="text-xl font-semibold mb-4">Timestamped Segments</h3>
              <div className="space-y-3">
                {transcription.segments.map((segment) => (
                  <div
                    key={segment.id}
                    className="flex gap-4 p-3 rounded-md bg-background hover:bg-accent/50 transition-colors"
                  >
                    <div className="text-sm font-mono text-muted-foreground whitespace-nowrap">
                      {formatTime(segment.start)} - {formatTime(segment.end)}
                    </div>
                    <div className="flex-1 text-sm">{segment.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { AssemblyAI } from 'assemblyai';
import fs from 'fs';

const aai = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY || '',
});

export interface SubmitOptions {
    filePath: string;
    videoId: string; // Used to identify the webhook return
}

/**
 * Uploads a local audio file and submits it to AssemblyAI for async transcription.
 */
export async function submitToAssemblyAI({ filePath, videoId }: SubmitOptions) {
    if (!process.env.ASSEMBLYAI_API_KEY) {
        throw new Error('ASSEMBLYAI_API_KEY is not set');
    }

    console.log(`[AssemblyAI] Uploading file for ${videoId}...`);
    const fileStream = fs.createReadStream(filePath);
    const uploadedFileUrl = await aai.files.upload(fileStream);
    console.log(`[AssemblyAI] Uploaded securely. URL: ${uploadedFileUrl}`);

    // Determine the absolute webhook URL (assuming the app is hosted)
    // In local dev, webhooks won't work natively unless ngrok is used,
    // so we handle local dev cleanly.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VELOCITY_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/webhooks/assemblyai?videoId=${videoId}`;

    console.log(`[AssemblyAI] Submitting transcript. Webhook: ${webhookUrl}`);
    
    const transcript = await aai.transcripts.submit({
        audio_url: uploadedFileUrl,
        speaker_labels: true, // Enables Speaker Diarization
        webhook_url: webhookUrl,
        webhook_auth_header_name: 'x-api-key',
        webhook_auth_header_value: process.env.ASSEMBLYAI_API_KEY, // Simple auth check
    });

    console.log(`[AssemblyAI] Submitted! Transcript ID: ${transcript.id}`);
    return transcript.id;
}

/**
 * Wait for a transcript to finish synchronously (used only for local fallback when webhooks are disabled)
 */
export async function waitForTranscript(transcriptId: string) {
    console.log(`[AssemblyAI] Waiting synchronously for ${transcriptId}...`);
    return await aai.transcripts.waitUntilReady(transcriptId, { pollingInterval: 5000 });
}

export function formatSegments(utterances: any[]) {
    if (!utterances) return [];
    
    // Convert AssemblyAI utterances format to our internal Segment format
    return utterances.map((u: any) => ({
        start: Math.floor(u.start / 1000), // convert ms to seconds
        end: Math.floor(u.end / 1000),
        text: u.text,
        speakerName: `Speaker ${u.speaker}`, // generic "Speaker A", "Speaker B"
        speakerId: null,
    }));
}

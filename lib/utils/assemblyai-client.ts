import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import { MEMPHIS_BOOST_WORDS } from '@/lib/ai/memphis-context';

const aai = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY || '',
});

export interface SubmitOptions {
    filePath: string;
    videoId: string; // Used to identify the webhook return
}

export interface SubmitBufferOptions {
    buffer: Buffer | Uint8Array | ArrayBuffer;
    videoId: string;
    source?: 'granicus' | 'upload';
}

/**
 * Uploads a local audio file and submits it to AssemblyAI for async transcription.
 */
export async function submitToAssemblyAI({ filePath, videoId, source = 'upload' }: SubmitOptions & { source?: 'granicus' | 'upload' }) {
    if (!process.env.ASSEMBLYAI_API_KEY) {
        throw new Error('ASSEMBLYAI_API_KEY is not set');
    }

    console.log(`[AssemblyAI] Uploading file for ${videoId}...`);
    const fileStream = fs.createReadStream(filePath);
    const uploadedFileUrl = await aai.files.upload(fileStream);
    console.log(`[AssemblyAI] Uploaded securely. URL: ${uploadedFileUrl}`);

    // Determine the absolute webhook URL (assuming the app is hosted)
    // In local dev, webhooks won't work natively unless ngrok is used,
    // so we handle local dev cleanly through QStash simulation.
    const isDev = process.env.NODE_ENV === 'development';
    const getVercelUrl = () => process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const getProdUrl = () => process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
    const baseUrl = isDev ? 'http://127.0.0.1:5000' : (process.env.NEXT_PUBLIC_APP_URL || getVercelUrl() || getProdUrl() || '');
    const webhookUrl = `${baseUrl}/api/webhooks/assemblyai?videoId=${videoId}&source=${source}`;

    console.log(`[AssemblyAI] Submitting transcript. Webhook: ${webhookUrl}`);
    
    const useBypass = !!process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

    const transcript = await aai.transcripts.submit({
        audio_url: uploadedFileUrl,
        speech_models: ['universal-3-pro', 'universal-2'] as any,
        speaker_labels: true,
        sentiment_analysis: true,
        word_boost: MEMPHIS_BOOST_WORDS,
        webhook_url: webhookUrl,
        webhook_auth_header_name: useBypass ? 'x-vercel-protection-bypass' : 'x-api-key',
        webhook_auth_header_value: useBypass ? process.env.VERCEL_AUTOMATION_BYPASS_SECRET! : process.env.ASSEMBLYAI_API_KEY!,
    });

    console.log(`[AssemblyAI] Submitted! Transcript ID: ${transcript.id}`);
    return transcript.id;
}

/**
 * Uploads a raw buffer to AssemblyAI for async transcription.
 */
export async function submitBufferToAssemblyAI({ buffer, videoId, source = 'upload' }: SubmitBufferOptions) {
    if (!process.env.ASSEMBLYAI_API_KEY) {
        throw new Error('ASSEMBLYAI_API_KEY is not set');
    }

    console.log(`[AssemblyAI] Uploading buffer for ${videoId}...`);
    // AssemblyAI SDK accepts Buffer directly
    const uploadedFileUrl = await aai.files.upload(buffer as unknown as Buffer);
    console.log(`[AssemblyAI] Uploaded securely. URL: ${uploadedFileUrl}`);

    const isDev = process.env.NODE_ENV === 'development';
    const getVercelUrl = () => process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const getProdUrl = () => process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
    const baseUrl = isDev ? 'http://127.0.0.1:5000' : (process.env.NEXT_PUBLIC_APP_URL || getVercelUrl() || getProdUrl() || '');
    const webhookUrl = `${baseUrl}/api/webhooks/assemblyai?videoId=${videoId}&source=${source}`;

    console.log(`[AssemblyAI] Submitting transcript. Webhook: ${webhookUrl}`);
    
    const useBypass = !!process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

    // We disable speaker labels for simple audio uploads if they don't explicitly require it, 
    // but diarization is always good, so we keep it enabled.
    const transcript = await aai.transcripts.submit({
        audio_url: uploadedFileUrl,
        speech_models: ['universal-3-pro', 'universal-2'] as any,
        speaker_labels: true,
        sentiment_analysis: true,
        word_boost: MEMPHIS_BOOST_WORDS,
        webhook_url: webhookUrl,
        webhook_auth_header_name: useBypass ? 'x-vercel-protection-bypass' : 'x-api-key',
        webhook_auth_header_value: useBypass ? process.env.VERCEL_AUTOMATION_BYPASS_SECRET! : process.env.ASSEMBLYAI_API_KEY!,
    });

    console.log(`[AssemblyAI] Submitted buffer! Transcript ID: ${transcript.id}`);
    return transcript.id;
}

export interface SubmitUrlOptions {
    remoteUrl: string; // Publicly accessible URL (e.g. Granicus CDN)
    videoId: string;
    source?: 'granicus' | 'upload';
}

/**
 * Submits a publicly-accessible remote URL directly to AssemblyAI.
 * AssemblyAI downloads the file from their side — zero memory usage on our server.
 * This is essential for large meeting videos that would OOM Vercel Serverless.
 */
export async function submitUrlToAssemblyAI({ remoteUrl, videoId, source = 'granicus' }: SubmitUrlOptions) {
    if (!process.env.ASSEMBLYAI_API_KEY) {
        throw new Error('ASSEMBLYAI_API_KEY is not set');
    }

    const isDev = process.env.NODE_ENV === 'development';
    const getVercelUrl = () => process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const getProdUrl = () => process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
    const baseUrl = isDev ? 'http://127.0.0.1:5000' : (process.env.NEXT_PUBLIC_APP_URL || getVercelUrl() || getProdUrl() || '');
    const webhookUrl = `${baseUrl}/api/webhooks/assemblyai?videoId=${videoId}&source=${source}`;

    console.log(`[AssemblyAI] Submitting remote URL directly. Webhook: ${webhookUrl}`);
    
    const useBypass = !!process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

    const transcript = await aai.transcripts.submit({
        audio_url: remoteUrl, // AssemblyAI downloads directly from this URL
        speech_models: ['universal-3-pro', 'universal-2'] as any,
        speaker_labels: true,
        sentiment_analysis: true,
        word_boost: MEMPHIS_BOOST_WORDS,
        webhook_url: webhookUrl,
        webhook_auth_header_name: useBypass ? 'x-vercel-protection-bypass' : 'x-api-key',
        webhook_auth_header_value: useBypass ? process.env.VERCEL_AUTOMATION_BYPASS_SECRET! : process.env.ASSEMBLYAI_API_KEY!,
    });

    console.log(`[AssemblyAI] Submitted remote URL! Transcript ID: ${transcript.id}`);
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
        sentiment: u.sentiment, // AssemblyAI provides sentiment if enabled
    }));
}

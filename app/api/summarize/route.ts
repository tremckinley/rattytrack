// API route for generating AI meeting summaries
// Uses OpenAI GPT-4 to analyze transcript and produce structured summary

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getTranscriptionWithSegments } from '@/lib/data/transcriptions';
import { getAgendaItemsForVideo } from '@/lib/data/client/agenda-items-client';
import { upsertMeetingSummary } from '@/lib/data/meeting-summaries';
import { requireAdminApi } from '@/lib/utils/api-auth';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert at analyzing city council meeting transcripts. 
Your task is to create a concise, informative summary of the meeting.

You will receive the transcript text and a list of agenda items with their status.

Respond with a JSON object containing:
1. "summary_text": A 2-3 sentence overview of the meeting (what type of meeting, main topics discussed, overall outcomes)
2. "key_points": An array of 3-7 key discussion points (important topics, debates, concerns raised)
3. "decisions": An array of decisions made during the meeting (what was approved, denied, or deferred)
4. "votes_overview": An array of objects with "item" (description) and "result" ("passed" or "failed")

Be factual and objective. Focus on the most important information for citizens to understand what happened.`;

export async function POST(request: Request) {
    try {
        await requireAdminApi();

        const { videoId } = await request.json();

        if (!videoId) {
            return NextResponse.json(
                { error: 'Video ID is required' },
                { status: 400 }
            );
        }

        // Fetch transcript segments
        const { transcription, segments } = await getTranscriptionWithSegments(videoId);

        if (!transcription || segments.length === 0) {
            return NextResponse.json(
                { error: 'No transcript found for this video' },
                { status: 404 }
            );
        }

        // Fetch agenda items
        const agendaItems = await getAgendaItemsForVideo(videoId);

        // Build transcript text (limit to avoid token limits)
        const transcriptText = segments
            .slice(0, 200) // Limit segments to manage API costs
            .map(s => s.text)
            .join(' ');

        // Build agenda context
        const agendaContext = agendaItems.length > 0
            ? `\n\nAgenda Items:\n${agendaItems.map(item =>
                `- Item ${item.item_number}: ${item.title} (Status: ${item.status}${item.vote_result ? `, Vote: ${item.vote_result}` : ''})`
            ).join('\n')}`
            : '';

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `Please analyze this city council meeting transcript and provide a structured summary.\n\nMeeting: ${transcription.title || 'City Council Meeting'}\n\nTranscript:\n${transcriptText}${agendaContext}`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 1500,
        });

        const responseContent = completion.choices[0]?.message?.content;
        if (!responseContent) {
            return NextResponse.json(
                { error: 'No response from AI' },
                { status: 500 }
            );
        }

        // Parse the AI response
        const parsedResponse = JSON.parse(responseContent);

        // Store the summary
        const summary = await upsertMeetingSummary(videoId, {
            summaryText: parsedResponse.summary_text || 'Summary not available.',
            keyPoints: parsedResponse.key_points || [],
            decisions: parsedResponse.decisions || [],
            votesOverview: parsedResponse.votes_overview || [],
            aiModelVersion: 'gpt-4-turbo-preview',
        });

        if (!summary) {
            return NextResponse.json(
                { error: 'Failed to store summary' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            summary,
            usage: completion.usage,
        });

    } catch (error) {
        console.error('Error generating summary:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate summary' },
            { status: 500 }
        );
    }
}

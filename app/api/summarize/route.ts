// API route for generating AI meeting summaries
// Uses OpenAI GPT-4 to analyze transcript and produce structured summary

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getTranscriptionWithSegments } from '@/lib/data/transcriptions';
import { getAgendaItemsForVideo } from '@/lib/data/client/agenda-items-client';
import { upsertMeetingSummary } from '@/lib/data/meeting-summaries';
import { requireAdminApi } from '@/lib/utils/api-auth';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const SYSTEM_PROMPT = `You are an expert at analyzing city council meeting transcripts. 
Your task is to create a concise, informative summary of the meeting.

You will receive the transcript text and a list of agenda items with their status. Be factual and objective. Focus on the most important information for citizens to understand what happened.`;

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

        // Call Anthropic API using Tool Use for guaranteed structured output
        const completion = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Please analyze this city council meeting transcript and provide a structured summary.\n\nMeeting: ${transcription.title || 'City Council Meeting'}\n\nTranscript:\n${transcriptText}${agendaContext}`
                }
            ],
            tools: [
                {
                    name: 'save_meeting_summary',
                    description: 'Save the generated summary data for the transcript',
                    input_schema: {
                        type: 'object',
                        properties: {
                            summary_text: { type: 'string', description: 'A 2-3 sentence overview of the meeting' },
                            key_points: { type: 'array', items: { type: 'string' }, description: 'An array of 3-7 key discussion points' },
                            decisions: { type: 'array', items: { type: 'string' }, description: 'An array of decisions made during the meeting' },
                            votes_overview: { 
                                type: 'array', 
                                items: { 
                                    type: 'object', 
                                    properties: { 
                                        item: { type: 'string' }, 
                                        result: { type: 'string', enum: ['passed', 'failed', 'deferred'] } 
                                    },
                                    required: ['item', 'result']
                                }, 
                                description: 'An array of objects with description and result' 
                            }
                        },
                        required: ['summary_text', 'key_points', 'decisions', 'votes_overview']
                    }
                }
            ],
            tool_choice: { type: 'tool', name: 'save_meeting_summary' }
        });

        const toolCall = completion.content.find(c => c.type === 'tool_use');
        if (!toolCall || toolCall.type !== 'tool_use') {
            return NextResponse.json(
                { error: 'No response from AI' },
                { status: 500 }
            );
        }

        // Parse the AI response
        const parsedResponse = toolCall.input as any;

        // Store the summary
        const summary = await upsertMeetingSummary(videoId, {
            summaryText: parsedResponse.summary_text || 'Summary not available.',
            keyPoints: parsedResponse.key_points || [],
            decisions: parsedResponse.decisions || [],
            votesOverview: parsedResponse.votes_overview || [],
            aiModelVersion: 'claude-sonnet-4-5-20250929',
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

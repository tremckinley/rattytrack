// LLM-Driven Speaker Inference (Sprint 9 Task 9.2)
// Uses Claude to logically deduce speaker identities from transcript context
// Only invoked for speakers that remain unidentified after deterministic strategies

import Anthropic from '@anthropic-ai/sdk';
import { MEMPHIS_SYSTEM_PROMPT } from './memphis-context';
import type { TranscriptSegment, SpeakerSuggestion } from '@/lib/utils/speaker-matcher';

const anthropic = new Anthropic();

interface LLMInferenceResult {
  speakerLabel: string;
  legislatorName: string | null;
  confidence: number;
  reasoning: string;
}

/**
 * Build a focused context window for an unidentified speaker.
 * Includes their first ~20 segments plus 2 surrounding segments for each
 * to give Claude conversational context.
 */
function buildSpeakerContext(
  allSegments: TranscriptSegment[],
  targetSpeaker: string,
  maxSegments: number = 20
): string {
  const lines: string[] = [];
  let included = 0;

  for (let i = 0; i < allSegments.length && included < maxSegments; i++) {
    const seg = allSegments[i];
    if (seg.speaker !== targetSpeaker) continue;

    // Include 2 segments before for context
    const contextStart = Math.max(0, i - 2);
    for (let j = contextStart; j <= Math.min(i + 2, allSegments.length - 1); j++) {
      const ctx = allSegments[j];
      const marker = j === i ? '>>>' : '   ';
      const timeStr = ctx.start ? `[${Math.floor(ctx.start / 60)}:${String(Math.floor(ctx.start % 60)).padStart(2, '0')}]` : '';
      lines.push(`${marker} ${ctx.speaker || 'Unknown'} ${timeStr}: ${ctx.text.substring(0, 300)}`);
    }
    lines.push('---');
    included++;
  }

  return lines.join('\n');
}

/**
 * Infer speaker identities using Claude for unmatched speakers.
 * Returns suggestions only when Claude reports ≥ 0.90 confidence.
 */
export async function inferSpeakerIdentities(
  segments: TranscriptSegment[],
  unmatchedSpeakers: string[]
): Promise<Map<string, SpeakerSuggestion>> {
  const suggestions = new Map<string, SpeakerSuggestion>();

  // Don't waste API calls if there's nothing to infer
  if (unmatchedSpeakers.length === 0) return suggestions;

  // Build context for all unmatched speakers in a single prompt to reduce API calls
  const speakerContexts = unmatchedSpeakers.map(speaker => {
    const context = buildSpeakerContext(segments, speaker);
    return `### ${speaker}\n${context}`;
  }).join('\n\n');

  const prompt = `You are analyzing a Memphis City Council meeting transcript to identify unnamed speakers.

The transcript uses generic labels like "Speaker A", "Speaker B", etc. from automatic speech recognition.
Your job is to use contextual clues to determine which Memphis council member each speaker is.

${MEMPHIS_SYSTEM_PROMPT}

Below are excerpts from the transcript for each unidentified speaker. Lines marked with ">>>" are spoken by the target speaker. Surrounding lines provide conversational context showing how others address them or how they address others.

${speakerContexts}

For each speaker, analyze the contextual clues carefully:
- How do other speakers address them? (e.g., "Thank you, Chairman Smiley")
- Do they refer to themselves? (e.g., "As chair, I will...")
- What role do they play in the proceedings? (e.g., calling votes = likely chairman)
- What topics do they champion? (known policy positions)

Respond with a JSON array. For each speaker you can identify, include:
{
  "speakerLabel": "the exact speaker label",
  "legislatorName": "full name of the legislator",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of how you determined this"
}

If you cannot confidently identify a speaker (confidence < 0.85), omit them from the array entirely.
Only include identifications you are highly confident about.

Respond ONLY with the JSON array, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract text from response
    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.type === 'text' ? block.text : '')
      .join('');

    // Parse JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('LLM speaker inference returned no parseable JSON');
      return suggestions;
    }

    const results: LLMInferenceResult[] = JSON.parse(jsonMatch[0]);

    for (const result of results) {
      if (result.confidence >= 0.90 && result.legislatorName) {
        suggestions.set(result.speakerLabel, {
          legislatorId: null, // Will be resolved by the caller against the legislators table
          legislatorName: result.legislatorName,
          confidence: result.confidence,
          reason: `LLM inference: ${result.reasoning}`,
          source: 'llm_inference',
        });
      }
    }

    console.log(`LLM speaker inference: ${results.length} results, ${suggestions.size} accepted (≥0.90 confidence)`);
  } catch (error) {
    console.error('Error in LLM speaker inference:', error);
    // Non-fatal: return empty suggestions
  }

  return suggestions;
}

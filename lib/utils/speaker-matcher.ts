import { supabase } from '../utils/supabase';
import { Legislator } from '@/types/Legislator';

export type MatchConfidence = 'high' | 'medium' | 'low' | 'none';

export interface SpeakerMatch {
  legislatorId: string | null;
  legislator: Legislator | null;
  confidence: MatchConfidence;
  speakerLabel: string;
}

const TITLE_PATTERNS = [
  'council member',
  'councilmember',
  'mayor',
  'vice mayor',
  'chairman',
  'chairwoman',
  'chair',
  'president',
  'commissioner',
];

function extractNameFromSpeakerLabel(speakerLabel: string): {
  title?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
} {
  const normalized = speakerLabel.toLowerCase().trim();
  
  let title: string | undefined;
  let namePart = normalized;
  
  for (const pattern of TITLE_PATTERNS) {
    if (normalized.startsWith(pattern)) {
      title = pattern;
      namePart = normalized.substring(pattern.length).trim();
      break;
    }
  }
  
  const nameParts = namePart.split(/\s+/).filter(p => p.length > 0);
  
  if (nameParts.length === 0) {
    return { fullName: speakerLabel };
  }
  
  const lastName = nameParts[nameParts.length - 1];
  const firstName = nameParts.length > 1 ? nameParts[0] : undefined;
  
  return {
    title,
    firstName,
    lastName,
    fullName: namePart,
  };
}

function calculateMatchScore(legislator: Legislator, parsed: ReturnType<typeof extractNameFromSpeakerLabel>): number {
  let score = 0;
  
  if (parsed.lastName) {
    const legislatorLastName = legislator.last_name.toLowerCase();
    const parsedLastName = parsed.lastName.toLowerCase();
    
    if (legislatorLastName === parsedLastName) {
      score += 50;
    } else if (legislatorLastName.includes(parsedLastName) || parsedLastName.includes(legislatorLastName)) {
      score += 30;
    }
  }
  
  if (parsed.firstName) {
    const legislatorFirstName = legislator.first_name.toLowerCase();
    const parsedFirstName = parsed.firstName.toLowerCase();
    
    if (legislatorFirstName === parsedFirstName) {
      score += 30;
    } else if (legislatorFirstName.startsWith(parsedFirstName) || parsedFirstName.startsWith(legislatorFirstName)) {
      score += 15;
    }
  }
  
  if (parsed.title && legislator.title) {
    const legislatorTitle = legislator.title.toLowerCase();
    const parsedTitle = parsed.title.toLowerCase();
    
    if (legislatorTitle.includes(parsedTitle) || parsedTitle.includes(legislatorTitle)) {
      score += 20;
    }
  }
  
  return score;
}

function getConfidence(score: number): MatchConfidence {
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'low';
  return 'none';
}

export async function matchSpeakerToLegislator(speakerLabel: string): Promise<SpeakerMatch> {
  if (!speakerLabel || speakerLabel.match(/^speaker\s+\d+$/i)) {
    return {
      legislatorId: null,
      legislator: null,
      confidence: 'none',
      speakerLabel,
    };
  }

  const parsed = extractNameFromSpeakerLabel(speakerLabel);
  
  const { data: legislators, error } = await supabase
    .from('legislators')
    .select('*')
    .or('is_active.eq.true,is_active.is.null');

  if (error || !legislators || legislators.length === 0) {
    console.error('Error fetching legislators for speaker matching:', error);
    return {
      legislatorId: null,
      legislator: null,
      confidence: 'none',
      speakerLabel,
    };
  }

  let bestMatch: Legislator | null = null;
  let bestScore = 0;

  for (const legislator of legislators) {
    const score = calculateMatchScore(legislator, parsed);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = legislator;
    }
  }

  const confidence = getConfidence(bestScore);

  if (confidence === 'none' || !bestMatch) {
    return {
      legislatorId: null,
      legislator: null,
      confidence: 'none',
      speakerLabel,
    };
  }

  console.log(
    `Matched "${speakerLabel}" to ${bestMatch.display_name} ` +
    `(score: ${bestScore}, confidence: ${confidence})`
  );

  return {
    legislatorId: bestMatch.id,
    legislator: bestMatch,
    confidence,
    speakerLabel,
  };
}

export async function matchAllSpeakers(
  speakerLabels: string[]
): Promise<Map<string, SpeakerMatch>> {
  const uniqueLabels = [...new Set(speakerLabels)];
  const matches = new Map<string, SpeakerMatch>();

  for (const label of uniqueLabels) {
    const match = await matchSpeakerToLegislator(label);
    matches.set(label, match);
  }

  return matches;
}

// ============================================================================
// NEW: Enhanced Speaker Suggestion System
// ============================================================================

export interface SpeakerSuggestion {
  legislatorId: string | null;
  legislatorName: string | null;
  confidence: number; // 0-1 score
  reason: string;
  source: 'learned_pattern' | 'text_analysis' | 'name_match' | 'contextual_address' | 'llm_inference';
}

export interface TranscriptSegment {
  speaker?: string;
  text: string;
  start?: number;
  end?: number;
}

/**
 * Check if a speaker label is a generic diarization label (e.g., "Speaker A", "speaker_1")
 * Generic labels must NOT be trusted across different videos.
 */
function isGenericSpeakerLabel(label: string): boolean {
  return /^speaker[_ ]?[a-z0-9]+$/i.test(label.trim());
}

/**
 * Check learned patterns from the speaker_patterns table.
 * Generic labels ("Speaker A", "speaker_1") are scoped to the same video.
 * Named labels ("Chairman Smiley") match globally.
 */
async function matchFromLearnedPatterns(
  speakerLabel: string,
  videoId?: string
): Promise<SpeakerSuggestion | null> {
  let query = supabase
    .from('speaker_patterns')
    .select(`
      legislator_id,
      pattern_value,
      confidence_score,
      usage_count,
      video_id,
      legislators!inner(display_name)
    `)
    .eq('pattern_type', 'speaker_label')
    .eq('pattern_value', speakerLabel.toLowerCase())
    .order('usage_count', { ascending: false })
    .limit(1);

  // Cross-meeting safety: scope generic labels to the same video
  if (isGenericSpeakerLabel(speakerLabel) && videoId) {
    query = query.eq('video_id', videoId);
  }

  const { data: patterns, error } = await query;

  if (error || !patterns || patterns.length === 0) {
    return null;
  }

  const pattern = patterns[0];
  const legislator = pattern.legislators as unknown as { display_name: string };

  return {
    legislatorId: pattern.legislator_id,
    legislatorName: legislator?.display_name || null,
    confidence: pattern.confidence_score * (Math.min(pattern.usage_count, 10) / 10),
    reason: `Matched learned pattern (used ${pattern.usage_count} time${pattern.usage_count > 1 ? 's' : ''})`,
    source: 'learned_pattern',
  };
}

/**
 * Contextual Address Pattern Analyzer (Task 9.1)
 * Analyzes surrounding transcript context to deduce who is speaking.
 * Key insight: if Speaker B says "Thank you Chairman Smiley" and the
 * NEXT speaker is Speaker A, then Speaker A is likely Chairman Smiley.
 * Conversely, "Councilman Ford, you have the floor" → the NEXT speaker is Ford.
 */
async function analyzeContextualAddressing(
  segments: TranscriptSegment[]
): Promise<Map<string, SpeakerSuggestion>> {
  const suggestions = new Map<string, SpeakerSuggestion>();

  // Get all legislators for matching
  const { data: legislators } = await supabase
    .from('legislators')
    .select('id, display_name, first_name, last_name')
    .or('is_active.eq.true,is_active.is.null');

  if (!legislators || legislators.length === 0) return suggestions;

  // Build a last-name lookup for fast matching
  const lastNameMap = new Map<string, { id: string; displayName: string }>();
  for (const leg of legislators) {
    lastNameMap.set(leg.last_name.toLowerCase(), {
      id: leg.id,
      displayName: leg.display_name,
    });
  }

  // Patterns that address someone who speaks NEXT
  // "Thank you, Chairman Smiley" → the previous speaker WAS Smiley
  // "Councilman Ford, you have the floor" → the next speaker IS Ford
  const addressPatterns = [
    // "Thank you [title] [name]" → PREVIOUS speaker is [name]
    { regex: /thank you,?\s+(?:chairman|chairwoman|chair|council\s*(?:man|woman|member)|mr\.|mrs\.|ms\.)\s+(\w+)/gi, direction: 'previous' as const },
    // "[title] [name], you have the floor / go ahead / please proceed" → NEXT speaker is [name]
    { regex: /(?:chairman|chairwoman|chair|council\s*(?:man|woman|member)|mr\.|mrs\.|ms\.)\s+(\w+),?\s+(?:you have the floor|go ahead|please proceed|you're recognized|you are recognized|your turn)/gi, direction: 'next' as const },
    // "I yield to [title] [name]" → NEXT speaker is [name]
    { regex: /(?:i )?yield(?:s|ing)? (?:to|the floor to)\s+(?:chairman|chairwoman|chair|council\s*(?:man|woman|member)|mr\.|mrs\.|ms\.)\s+(\w+)/gi, direction: 'next' as const },
    // "[title] [name], would you like to ..." → NEXT speaker is [name]
    { regex: /(?:chairman|chairwoman|chair|council\s*(?:man|woman|member)|mr\.|mrs\.|ms\.)\s+(\w+),?\s+would you/gi, direction: 'next' as const },
  ];

  // Tally: speakerLabel → { legislatorId → count }
  const tally = new Map<string, Map<string, { count: number; legislatorName: string }>>();

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg.text) continue;

    for (const pattern of addressPatterns) {
      // Reset regex lastIndex
      pattern.regex.lastIndex = 0;
      let match;

      while ((match = pattern.regex.exec(seg.text)) !== null) {
        const extractedName = match[1]?.toLowerCase();
        if (!extractedName || extractedName.length < 3) continue;

        const legislator = lastNameMap.get(extractedName);
        if (!legislator) continue;

        // Determine which speaker this identifies
        let targetSpeaker: string | undefined;
        if (pattern.direction === 'previous' && i > 0 && segments[i - 1]?.speaker) {
          // "Thank you X" → the person who just spoke (previous segment) is X
          targetSpeaker = segments[i - 1].speaker;
        } else if (pattern.direction === 'next' && i < segments.length - 1 && segments[i + 1]?.speaker) {
          // "X, go ahead" → the next person to speak is X
          targetSpeaker = segments[i + 1].speaker;
        }

        if (!targetSpeaker) continue;

        // Don't map a speaker to themselves if they're already identified
        if (targetSpeaker === seg.speaker) continue;

        // Tally this observation
        if (!tally.has(targetSpeaker)) {
          tally.set(targetSpeaker, new Map());
        }
        const speakerTally = tally.get(targetSpeaker)!;
        const existing = speakerTally.get(legislator.id) || { count: 0, legislatorName: legislator.displayName };
        existing.count++;
        speakerTally.set(legislator.id, existing);
      }
    }
  }

  // Convert tallies to suggestions, picking the highest-count legislator per speaker
  for (const [speakerLabel, legislatorTally] of tally) {
    let bestId = '';
    let bestCount = 0;
    let bestName = '';

    for (const [legId, data] of legislatorTally) {
      if (data.count > bestCount) {
        bestCount = data.count;
        bestId = legId;
        bestName = data.legislatorName;
      }
    }

    if (bestId && bestCount > 0) {
      // Confidence scales with observation count: 1 → 0.70, 2 → 0.80, 3+ → 0.85, 5+ → 0.90
      const confidence = Math.min(0.95, 0.65 + (bestCount * 0.05));

      suggestions.set(speakerLabel, {
        legislatorId: bestId,
        legislatorName: bestName,
        confidence,
        reason: `Addressed as "${bestName}" by other speakers ${bestCount} time${bestCount > 1 ? 's' : ''} in context`,
        source: 'contextual_address',
      });
    }
  }

  return suggestions;
}

/**
 * Analyze transcript text to find speaker mentions
 * Returns a map of speaker labels to potential legislator mentions found in their text
 */
export function extractSpeakerMentions(
  segments: TranscriptSegment[]
): Map<string, string[]> {
  const mentions = new Map<string, string[]>();
  
  // Extended patterns for detecting legislator references in speech
  const mentionPatterns = [
    /(?:thank you,?\s+)?(?:chairman|chairwoman|chair)\s+([a-z]+)/gi,
    /(?:council\s*(?:man|woman|member))\s+([a-z]+)/gi,
    /(?:mr\.|mrs\.|ms\.)\s+([a-z]+)/gi,
    /(?:representative|rep\.)\s+([a-z]+)/gi,
    /(?:councilor)\s+([a-z]+)/gi,
  ];

  for (const segment of segments) {
    if (!segment.speaker || !segment.text) continue;
    
    const speakerLabel = segment.speaker;
    const existingMentions = mentions.get(speakerLabel) || [];
    
    // Look for self-identification patterns in the speaker's own text
    // e.g., "This is Council Member Ford speaking"
    const selfIdPattern = /(?:this is|i am|i'm)\s+(?:council\s*(?:man|woman|member)|chairman|chairwoman)\s+([a-z]+)/gi;
    let match;
    
    while ((match = selfIdPattern.exec(segment.text)) !== null) {
      const name = match[1];
      if (name && name.length > 2 && !existingMentions.includes(name.toLowerCase())) {
        existingMentions.push(name.toLowerCase());
      }
    }
    
    // Also look for when OTHER speakers address this speaker
    // We'll need to look at surrounding context for this
    
    mentions.set(speakerLabel, existingMentions);
  }

  return mentions;
}

/**
 * Search transcript for mentions that could identify speakers
 * by looking at how other speakers address them
 */
async function analyzeTranscriptForSpeakers(
  segments: TranscriptSegment[]
): Promise<Map<string, SpeakerSuggestion>> {
  const suggestions = new Map<string, SpeakerSuggestion>();
  
  // Get all legislators for matching
  const { data: legislators } = await supabase
    .from('legislators')
    .select('id, display_name, first_name, last_name')
    .or('is_active.eq.true,is_active.is.null');

  if (!legislators || legislators.length === 0) {
    return suggestions;
  }

  // Get all learned title patterns
  const { data: patterns } = await supabase
    .from('speaker_patterns')
    .select('legislator_id, pattern_value, confidence_score')
    .eq('pattern_type', 'title_variation');

  const patternMap = new Map<string, { legislatorId: string; confidence: number }>();
  patterns?.forEach(p => {
    patternMap.set(p.pattern_value.toLowerCase(), {
      legislatorId: p.legislator_id,
      confidence: p.confidence_score,
    });
  });

  // Analyze each unique speaker
  const speakerTexts = new Map<string, string[]>();
  segments.forEach(seg => {
    if (!seg.speaker) return;
    const texts = speakerTexts.get(seg.speaker) || [];
    texts.push(seg.text);
    speakerTexts.set(seg.speaker, texts);
  });

  for (const [speakerLabel, texts] of speakerTexts) {
    const combinedText = texts.join(' ').toLowerCase();
    
    // Check for matches against learned patterns
    for (const [patternValue, patternInfo] of patternMap) {
      if (combinedText.includes(patternValue.toLowerCase())) {
        const legislator = legislators.find(l => l.id === patternInfo.legislatorId);
        if (legislator && !suggestions.has(speakerLabel)) {
          suggestions.set(speakerLabel, {
            legislatorId: patternInfo.legislatorId,
            legislatorName: legislator.display_name,
            confidence: patternInfo.confidence * 0.7, // Reduce confidence for text-based
            reason: `Found "${patternValue}" in transcript text`,
            source: 'text_analysis',
          });
        }
      }
    }

    // Direct last name matching in text
    for (const legislator of legislators) {
      const lastName = legislator.last_name.toLowerCase();
      // Look for patterns like "thank you [name]" or "[title] [name]"
      const namePattern = new RegExp(
        `(?:thank you,?\\s+|chairman\\s+|council\\s*(?:man|woman|member)\\s+)${lastName}`,
        'i'
      );
      
      if (namePattern.test(combinedText) && !suggestions.has(speakerLabel)) {
        suggestions.set(speakerLabel, {
          legislatorId: legislator.id,
          legislatorName: legislator.display_name,
          confidence: 0.6,
          reason: `Found name reference "${lastName}" in transcript`,
          source: 'text_analysis',
        });
      }
    }
  }

  return suggestions;
}

/**
 * Main function: Generate comprehensive speaker suggestions for a transcript
 * Combines learned patterns, contextual addressing, LLM inference, text analysis, and name matching
 */
export async function suggestSpeakerMatches(
  segments: TranscriptSegment[],
  videoId?: string
): Promise<Map<string, SpeakerSuggestion>> {
  const suggestions = new Map<string, SpeakerSuggestion>();
  
  // Get unique speaker labels
  const uniqueSpeakers = [...new Set(
    segments.map(s => s.speaker).filter((s): s is string => !!s)
  )];

  // Strategy 1: Check learned patterns first (highest confidence)
  // Cross-meeting safety: generic labels are scoped to same video
  for (const speaker of uniqueSpeakers) {
    const learnedMatch = await matchFromLearnedPatterns(speaker, videoId);
    if (learnedMatch && learnedMatch.confidence > 0.5) {
      suggestions.set(speaker, learnedMatch);
    }
  }

  // Strategy 2: Contextual address pattern analysis
  // Reads "Thank you Chairman X" → maps previous/next speaker to X
  const contextualSuggestions = await analyzeContextualAddressing(segments);
  for (const [speaker, suggestion] of contextualSuggestions) {
    if (!suggestions.has(speaker)) {
      suggestions.set(speaker, suggestion);
    }
  }

  // Strategy 3: LLM-driven inference for remaining unknowns
  // Imported dynamically to avoid circular deps and only when needed
  const unmatchedSpeakers = uniqueSpeakers.filter(s => !suggestions.has(s));
  if (unmatchedSpeakers.length > 0) {
    try {
      const { inferSpeakerIdentities } = await import('@/lib/ai/speaker-inference');
      const llmSuggestions = await inferSpeakerIdentities(segments, unmatchedSpeakers);
      for (const [speaker, suggestion] of llmSuggestions) {
        if (!suggestions.has(speaker) && suggestion.confidence >= 0.90) {
          suggestions.set(speaker, suggestion);
        }
      }
    } catch (err) {
      console.error('LLM speaker inference failed (non-fatal):', err);
    }
  }

  // Strategy 4: Analyze transcript text for remaining speakers
  const textSuggestions = await analyzeTranscriptForSpeakers(
    segments.filter(s => s.speaker && !suggestions.has(s.speaker))
  );
  
  for (const [speaker, suggestion] of textSuggestions) {
    if (!suggestions.has(speaker)) {
      suggestions.set(speaker, suggestion);
    }
  }

  // Strategy 5: Try name-based matching for any remaining (original logic)
  for (const speaker of uniqueSpeakers) {
    if (suggestions.has(speaker)) continue;
    
    const nameMatch = await matchSpeakerToLegislator(speaker);
    if (nameMatch.confidence !== 'none' && nameMatch.legislator) {
      suggestions.set(speaker, {
        legislatorId: nameMatch.legislatorId,
        legislatorName: nameMatch.legislator.display_name,
        confidence: nameMatch.confidence === 'high' ? 0.9 : 
                   nameMatch.confidence === 'medium' ? 0.7 : 0.5,
        reason: `Name match: "${speaker}"`,
        source: 'name_match',
      });
    }
  }

  return suggestions;
}

/**
 * Save a confirmed speaker mapping to learned patterns
 * This improves suggestions for future transcripts
 */
export async function learnSpeakerMapping(
  speakerLabel: string,
  legislatorId: string,
  videoId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('speaker_patterns')
      .upsert({
        legislator_id: legislatorId,
        pattern_type: 'speaker_label',
        pattern_value: speakerLabel.toLowerCase(),
        video_id: videoId,
        confidence_score: 0.85,
        usage_count: 1,
      }, {
        onConflict: 'legislator_id,pattern_type,pattern_value',
      });

    if (error) {
      // If conflict, increment usage count instead
      await supabase
        .from('speaker_patterns')
        .update({ 
          usage_count: supabase.rpc('increment_usage_count'),
          updated_at: new Date().toISOString(),
        })
        .eq('legislator_id', legislatorId)
        .eq('pattern_type', 'speaker_label')
        .eq('pattern_value', speakerLabel.toLowerCase());
    }

    console.log(`Learned speaker mapping: ${speakerLabel} -> ${legislatorId}`);
    return true;
  } catch (err) {
    console.error('Error saving speaker pattern:', err);
    return false;
  }
}

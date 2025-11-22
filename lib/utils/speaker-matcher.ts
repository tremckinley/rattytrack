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

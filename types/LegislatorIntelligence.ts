// Type definitions for the Legislator Intelligence Platform
// Extends existing types with agenda items, key quotes, and positions

// ============================================================================
// AGENDA ITEMS
// ============================================================================

export type AgendaItemType =
    | 'motion'
    | 'consent'
    | 'public_hearing'
    | 'discussion'
    | 'vote'
    | 'procedural';

export type AgendaItemStatus =
    | 'pending'
    | 'discussed'
    | 'voted'
    | 'tabled'
    | 'deferred';

export type DetectionMethod =
    | 'robert_rules'
    | 'agenda_pdf'
    | 'manual';

export interface AgendaItem {
    id: string;
    video_id: string;  // Links to video_transcriptions.video_id
    item_number: number;
    item_type: AgendaItemType;
    title: string;
    description?: string | null;
    start_time?: number | null;  // Seconds into video
    end_time?: number | null;    // Seconds into video
    bill_id?: string | null;
    status: AgendaItemStatus;
    vote_result?: 'passed' | 'failed' | null;
    detection_method?: DetectionMethod | null;
    detection_confidence?: number | null;
    trigger_phrase?: string | null;
    metadata?: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// KEY QUOTES
// ============================================================================

export type QuoteImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export type QuoteType =
    | 'policy_stance'
    | 'controversial'
    | 'emotional'
    | 'decisive';

export interface KeyQuote {
    id: string;
    segment_id: number;  // INTEGER in actual schema
    legislator_id?: string | null;
    quote_text: string;
    context_before?: string | null;
    context_after?: string | null;
    impact_level: QuoteImpactLevel;
    quote_type?: QuoteType | null;
    sentiment_score?: number | null;
    sentiment_intensity?: number | null;
    primary_issue_id?: string | null;
    ai_model_version?: string | null;
    detection_confidence?: number | null;
    is_featured: boolean;
    is_approved: boolean;
    metadata?: Record<string, any> | null;
    created_at: string;
}

// ============================================================================
// LEGISLATOR POSITIONS
// ============================================================================

export type PositionValue = 'for' | 'against' | 'neutral' | 'undecided';

export type PositionSource =
    | 'explicit_vote'
    | 'deliberation_analysis'
    | 'motion_made'
    | 'seconded';

export interface LegislatorPosition {
    id: string;
    legislator_id: string;
    bill_id: string;
    agenda_item_id?: string | null;
    position: PositionValue;
    position_strength?: number | null;
    source: PositionSource;
    supporting_segments?: number[] | null;  // INTEGER[] in actual schema
    ai_confidence?: number | null;
    ai_model_version?: string | null;
    first_expressed_at?: string | null;
    final_position: boolean;
    metadata?: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// STANCE SUMMARY (from view)
// ============================================================================

export interface LegislatorStanceSummary {
    legislator_id: string;
    display_name: string;
    bill_id: string;
    bill_number: string;
    bill_title: string;
    final_position?: PositionValue | null;
    explicit_vote?: string | null;
    avg_deliberation_sentiment?: number | null;
    relevant_quote_count: number;
}

// ============================================================================
// ROBERT'S RULES PARSING
// ============================================================================

export type RobertRulesEventType =
    | 'topic_transition'
    | 'motion'
    | 'second'
    | 'vote_call'
    | 'vote_response'
    | 'tabling'
    | 'public_comment'
    | 'adjournment';

export type VoteValue = 'aye' | 'nay' | 'abstain' | 'present';

export interface RobertRulesEvent {
    type: RobertRulesEventType;
    confidence: number;
    triggerPhrase: string;
    timestampSeconds: number;
    speakerId?: string | null;
    metadata?: {
        itemNumber?: number;
        voteValue?: VoteValue;
        motionDescription?: string;
        // Consent agenda grouping
        consentItemCount?: number;
        firstItemNumber?: number;
        lastItemNumber?: number;
    };
}

// ============================================================================
// PIPELINE ANALYSIS RESULTS
// ============================================================================

export interface VoteExtractionResult {
    agendaItemId: string;
    billId?: string | null;
    voteType: 'voice' | 'roll_call' | 'unanimous_consent';
    votes: Array<{
        legislatorId: string;
        vote: 'yes' | 'no' | 'abstain' | 'absent' | 'present';
        confidence: number;
        segmentId: string;
    }>;
    result: 'passed' | 'failed' | 'tabled';
    yesCount: number;
    noCount: number;
    abstainCount: number;
}

export interface QuoteDetectionResult {
    segmentId: string;
    legislatorId?: string | null;
    quoteText: string;
    impactLevel: QuoteImpactLevel;
    quoteType?: QuoteType | null;
    sentimentScore: number;
    sentimentIntensity: number;
    confidence: number;
    primaryIssueId?: string | null;
}

export interface PositionAggregationResult {
    legislatorId: string;
    billId: string;
    agendaItemId?: string | null;
    position: PositionValue;
    positionStrength: number;
    source: PositionSource;
    supportingSegmentIds: string[];
    confidence: number;
    isFinal: boolean;
}

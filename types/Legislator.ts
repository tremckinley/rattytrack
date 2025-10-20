export type TopIssue = {
  // Example: { name: "transportation", score: 12 }
  name: string;
  score?: number;
  // allow additional fields if your API returns richer objects
  [key: string]: any;
};

export type Stat = {
  id: string;
  votes_no: number;
  votes_yes: number;
  created_at: string; // ISO timestamp
  period_end: string; // ISO date (YYYY-MM-DD)
  top_issues: TopIssue[] | null;
  votes_cast: number;
  period_type: 'all_time' | 'year' | 'session' | string;
  motions_made: number;
  period_start: string; // ISO date
  legislator_id: string;
  votes_abstain: number;
  total_segments: number;
  bills_sponsored: number;
  meetings_missed: number;
  average_sentiment: number;
  bills_cosponsored: number;
  meetings_attended: number;
  last_calculated_at: string; // ISO timestamp
  total_speaking_time_seconds: number;
  average_segment_length_seconds: number;
  // allow extra fields if present
  [key: string]: any;
};

export type SocialMedia = {
  twitter?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  // platform-agnostic extra entries
  [platform: string]: string | null | undefined;
};

export type Committee = {
  id?: string;
  name?: string;
  role?: string | null;
  [key: string]: any;
};

export type Legislator = {
  id: string;
  legislative_body_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  title: string | null;
  district: string | null;
  party_affiliation: string | null;
  email: string | null;
  phone: string | null;
  office_address: string | null;
  photo_url: string | null;
  website_url: string | null;
  social_media: SocialMedia | null;
  date_of_birth: string | null; // ISO date string or null
  gender: string | null;
  race_ethnicity: string | null;
  education: string | null;
  occupation: string | null;
  term_start: string | null; // ISO date or null
  term_end: string | null; // ISO date or null
  is_active: boolean;
  voice_profile_id: string | null;
  face_profile_id: string | null;
  bio: string | null;
  metadata: Record<string, any> | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  committees: string[] | null;
  stats: Stat[] | null;
  // allow future extension
  [key: string]: any;
};
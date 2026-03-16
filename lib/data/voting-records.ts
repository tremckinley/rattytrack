/**
 * Data fetching for legislator voting records
 * Includes mock data for development until real voting data is populated
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface VoteRecord {
    id: string;
    billNumber: string;
    billTitle: string;
    billDescription?: string;
    vote: 'yes' | 'no' | 'abstain' | 'absent';
    voteDate: string;
    billStatus: 'passed' | 'failed' | 'pending' | 'tabled';
    issueCategory?: string;
    isKeyVote?: boolean;
}

export interface VotingSummary {
    totalVotes: number;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
    absentVotes: number;
    attendanceRate: number;
}

// Mock voting data for Memphis City Council issues
const MOCK_VOTING_DATA: Record<string, VoteRecord[]> = {
    default: [
        {
            id: '1',
            billNumber: 'ORD-2024-001',
            billTitle: 'FY2024 Budget Appropriations',
            billDescription: 'Annual city budget including public safety and infrastructure funding',
            vote: 'yes',
            voteDate: '2024-06-15',
            billStatus: 'passed',
            issueCategory: 'budget',
            isKeyVote: true,
        },
        {
            id: '2',
            billNumber: 'ORD-2024-012',
            billTitle: 'Affordable Housing Trust Fund',
            billDescription: 'Establish $10M fund for affordable housing development',
            vote: 'yes',
            voteDate: '2024-05-20',
            billStatus: 'passed',
            issueCategory: 'housing',
            isKeyVote: true,
        },
        {
            id: '3',
            billNumber: 'RES-2024-045',
            billTitle: 'Police Department Body Camera Policy',
            billDescription: 'Update requirements for officer body camera usage',
            vote: 'yes',
            voteDate: '2024-04-10',
            billStatus: 'passed',
            issueCategory: 'public_safety',
            isKeyVote: true,
        },
        {
            id: '4',
            billNumber: 'ORD-2024-023',
            billTitle: 'Sidewalk Infrastructure Bond',
            billDescription: '$15M bond for citywide sidewalk repairs and ADA compliance',
            vote: 'yes',
            voteDate: '2024-03-25',
            billStatus: 'passed',
            issueCategory: 'infrastructure',
        },
        {
            id: '5',
            billNumber: 'RES-2024-067',
            billTitle: 'Youth Employment Program Expansion',
            billDescription: 'Expand summer youth employment to serve 500 additional students',
            vote: 'yes',
            voteDate: '2024-02-15',
            billStatus: 'passed',
            issueCategory: 'education',
        },
        {
            id: '6',
            billNumber: 'ORD-2024-034',
            billTitle: 'Short-Term Rental Regulations',
            billDescription: 'Require permits and limit days for Airbnb-style rentals',
            vote: 'no',
            voteDate: '2024-01-30',
            billStatus: 'passed',
            issueCategory: 'housing',
        },
        {
            id: '7',
            billNumber: 'RES-2024-089',
            billTitle: 'Climate Action Plan Resolution',
            billDescription: 'Commit to 50% emissions reduction by 2035',
            vote: 'yes',
            voteDate: '2023-12-12',
            billStatus: 'passed',
            issueCategory: 'environment',
            isKeyVote: true,
        },
        {
            id: '8',
            billNumber: 'ORD-2024-056',
            billTitle: 'Food Truck Licensing Reform',
            billDescription: 'Streamline licensing process for mobile food vendors',
            vote: 'yes',
            voteDate: '2023-11-20',
            billStatus: 'passed',
            issueCategory: 'economic_development',
        },
    ],
};

// Variation data for different legislators
const VOTE_VARIATIONS: Record<string, Partial<VoteRecord>[]> = {
    // Create some variation in voting patterns
    variation_conservative: [
        { id: '6', vote: 'yes' },   // Supported rental regs
        { id: '7', vote: 'no' },    // Opposed climate action
    ],
    variation_progressive: [
        { id: '6', vote: 'no' },    // Opposed rental regs
        { id: '7', vote: 'yes' },   // Supported climate action
    ],
};

/**
 * Get voting records for a specific legislator
 */
export async function getVotingRecordsForLegislator(
    legislatorId: string,
    options?: {
        limit?: number;
        issueFilter?: string;
        keyVotesOnly?: boolean;
    }
): Promise<VoteRecord[]> {
    // First try to get real data from database
    const { data: realVotes, error } = await supabase
        .from('vote_records')
        .select(`
      id,
      vote,
      created_at,
      legislative_actions!inner(
        id,
        action_description,
        occurred_at,
        vote_result,
        bills(
          id,
          bill_number,
          title,
          description,
          status
        )
      )
    `)
        .eq('legislator_id', legislatorId)
        .order('created_at', { ascending: false })
        .limit(options?.limit || 50);

    if (!error && realVotes && realVotes.length > 0) {
        // Transform real data to VoteRecord format
        return realVotes.map((v: Record<string, unknown>) => {
            const action = v.legislative_actions as Record<string, unknown>;
            const bill = (action?.bills as Record<string, unknown>) || {};
            return {
                id: v.id as string,
                billNumber: (bill.bill_number as string) || 'Unknown',
                billTitle: (bill.title as string) || (action?.action_description as string) || 'Unknown',
                billDescription: bill.description as string | undefined,
                vote: v.vote as 'yes' | 'no' | 'abstain' | 'absent',
                voteDate: (action?.occurred_at as string) || (v.created_at as string),
                billStatus: (bill.status as 'passed' | 'failed' | 'pending' | 'tabled') ||
                    ((action?.vote_result as string) === 'passed' ? 'passed' : 'pending'),
                issueCategory: undefined,
                isKeyVote: false,
            };
        });
    }

    // Fall back to mock data with some variation based on legislator ID
    let mockVotes = [...MOCK_VOTING_DATA.default];

    // Apply some variation based on last character of ID to simulate different voting patterns
    const lastChar = legislatorId.slice(-1);
    if (lastChar >= '0' && lastChar <= '4') {
        // Apply conservative variation
        for (const variation of VOTE_VARIATIONS.variation_conservative) {
            const idx = mockVotes.findIndex(v => v.id === variation.id);
            if (idx !== -1) {
                mockVotes[idx] = { ...mockVotes[idx], ...variation };
            }
        }
    } else if (lastChar >= '5' && lastChar <= '9') {
        // Apply progressive variation
        for (const variation of VOTE_VARIATIONS.variation_progressive) {
            const idx = mockVotes.findIndex(v => v.id === variation.id);
            if (idx !== -1) {
                mockVotes[idx] = { ...mockVotes[idx], ...variation };
            }
        }
    }

    // Randomly make one or two abstain/absent for realism
    const randomIdx = parseInt(legislatorId.slice(-2), 16) % mockVotes.length;
    if (randomIdx < mockVotes.length) {
        mockVotes[randomIdx] = { ...mockVotes[randomIdx], vote: 'abstain' };
    }

    // Apply filters
    if (options?.issueFilter) {
        mockVotes = mockVotes.filter(v => v.issueCategory === options.issueFilter);
    }
    if (options?.keyVotesOnly) {
        mockVotes = mockVotes.filter(v => v.isKeyVote);
    }
    if (options?.limit) {
        mockVotes = mockVotes.slice(0, options.limit);
    }

    return mockVotes;
}

/**
 * Get voting summary statistics for a legislator
 */
export async function getVotingSummary(legislatorId: string): Promise<VotingSummary> {
    const votes = await getVotingRecordsForLegislator(legislatorId);

    const yesVotes = votes.filter(v => v.vote === 'yes').length;
    const noVotes = votes.filter(v => v.vote === 'no').length;
    const abstainVotes = votes.filter(v => v.vote === 'abstain').length;
    const absentVotes = votes.filter(v => v.vote === 'absent').length;
    const totalVotes = votes.length;

    const presentVotes = yesVotes + noVotes + abstainVotes;
    const attendanceRate = totalVotes > 0 ? (presentVotes / totalVotes) * 100 : 100;

    return {
        totalVotes,
        yesVotes,
        noVotes,
        abstainVotes,
        absentVotes,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
    };
}

/**
 * Get unique issue categories from voting records
 */
export function getIssueCategories(votes: VoteRecord[]): string[] {
    const categories = new Set<string>();
    votes.forEach(v => {
        if (v.issueCategory) {
            categories.add(v.issueCategory);
        }
    });
    return Array.from(categories).sort();
}

export interface VotingActivityOverview {
    totalActions: number;
    passed: number;
    failed: number;
    tabled: number;
    pending: number;
}

/**
 * Get overall voting activity summary for the dashboard
 */
export async function getOverallVotingActivity(): Promise<VotingActivityOverview> {
    // Try to get real data from legislative_actions
    const { data, error } = await supabase
        .from('legislative_actions')
        .select('vote_result');

    if (!error && data && data.length > 0) {
        const passed = data.filter((a: any) => a.vote_result === 'passed').length;
        const failed = data.filter((a: any) => a.vote_result === 'failed').length;
        const tabled = data.filter((a: any) => a.vote_result === 'tabled').length;
        const pending = data.filter((a: any) => !a.vote_result || a.vote_result === 'pending').length;

        return {
            totalActions: data.length,
            passed,
            failed,
            tabled,
            pending,
        };
    }

    // Fallback mock data
    return {
        totalActions: 8,
        passed: 6,
        failed: 1,
        tabled: 1,
        pending: 0,
    };
}

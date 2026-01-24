/**
 * Data fetching for legislator attendance records
 * Includes mock data for development
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AttendanceRecord {
    date: string;
    attended: boolean;
    meetingType?: string;
    meetingTitle?: string;
}

/**
 * Get attendance records for a legislator
 */
export async function getAttendanceForLegislator(
    legislatorId: string
): Promise<AttendanceRecord[]> {
    // Try to get real data from meeting_attendees table
    const { data: realAttendance, error } = await supabase
        .from('meeting_attendees')
        .select(`
      attendance_status,
      meetings!inner(
        scheduled_start,
        meeting_type,
        title
      )
    `)
        .eq('legislator_id', legislatorId)
        .order('created_at', { ascending: false });

    if (!error && realAttendance && realAttendance.length > 0) {
        return realAttendance.map((record: Record<string, unknown>) => {
            const meeting = record.meetings as Record<string, unknown>;
            const scheduledStart = meeting?.scheduled_start as string;
            return {
                date: scheduledStart ? scheduledStart.split('T')[0] : '',
                attended: record.attendance_status === 'present',
                meetingType: meeting?.meeting_type as string,
                meetingTitle: meeting?.title as string,
            };
        });
    }

    // Return empty array - the component will use mock data
    return [];
}

/**
 * Get attendance summary stats
 */
export async function getAttendanceSummary(legislatorId: string): Promise<{
    totalMeetings: number;
    attended: number;
    missed: number;
    attendanceRate: number;
}> {
    const records = await getAttendanceForLegislator(legislatorId);
    const attended = records.filter(r => r.attended).length;
    const missed = records.filter(r => !r.attended).length;
    const total = records.length;

    return {
        totalMeetings: total,
        attended,
        missed,
        attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 100,
    };
}

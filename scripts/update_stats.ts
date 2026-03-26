#!/usr/bin/env tsx
/**
 * Update Legislator Statistics
 * 
 * This script calls the database function to calculate and populate
 * the legislator_statistics table.
 * 
 * Usage:
 *   npm run db:update-stats
 *   or
 *   tsx scripts/update_stats.ts
 */

import { createClient } from '@supabase/supabase-js';

export async function updateStatistics() {
    console.log('Starting legislator statistics calculation...');
    let output = '';

    try {
        // Use service role for admin tasks
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Call the database function to calculate statistics
        const { data, error } = await supabase.rpc('calculate_legislator_statistics', {
            p_period_type: 'all_time',
            p_start_date: '1900-01-01',
            p_end_date: new Date().toISOString().split('T')[0]
        });

        if (error) {
            console.error('Error calculating statistics:', error);
            return { success: false, error: 'Error calculating statistics', stderr: JSON.stringify(error) };
        }

        output += '✓ Statistics calculated successfully!\n';

        // Verify the results
        const { count, error: countError } = await supabase
            .from('legislator_statistics')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            output += `Error verifying statistics: ${JSON.stringify(countError)}\n`;
        } else {
            output += `✓ Total statistics records: ${count}\n`;
        }

        return { success: true, stdout: output };
    } catch (err: any) {
        console.error('Unexpected error:', err);
        return { success: false, error: 'Unexpected error', stderr: err.message };
    }
}

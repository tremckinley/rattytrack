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

import { supabase } from '../lib/utils/supabase';

async function updateStatistics() {
    console.log('Starting legislator statistics calculation...');

    try {
        // Call the database function to calculate statistics
        const { data, error } = await supabase.rpc('calculate_legislator_statistics', {
            p_period_type: 'all_time',
            p_start_date: '1900-01-01',
            p_end_date: new Date().toISOString().split('T')[0]
        });

        if (error) {
            console.error('Error calculating statistics:', error);
            process.exit(1);
        }

        console.log('✓ Statistics calculated successfully!');

        // Verify the results
        const { count, error: countError } = await supabase
            .from('legislator_statistics')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error verifying statistics:', countError);
        } else {
            console.log(`✓ Total statistics records: ${count}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

updateStatistics();

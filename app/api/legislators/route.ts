import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('legislators')
            .select('id, display_name')
            .eq('is_active', true)
            .order('display_name');

        if (error) {
            console.error('Error fetching legislators:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ legislators: data });
    } catch (err: any) {
        console.error('Unexpected error fetching legislators:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

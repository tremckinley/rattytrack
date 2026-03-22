import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils/api-auth';

export async function GET() {
    try {
        const { supabase } = await requireAuth();

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
        if (err instanceof NextResponse) return err;
        console.error('Unexpected error fetching legislators:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

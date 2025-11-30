
import { supabase } from './lib/utils/supabase';

async function checkData() {
    const { count: segmentsCount, error: segmentsError } = await supabase
        .from('transcription_segments')
        .select('*', { count: 'exact', head: true });

    if (segmentsError) console.error('Error checking segments:', segmentsError);
    else console.log('Transcription Segments:', segmentsCount);

    const { count: meetingsCount, error: meetingsError } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true });

    if (meetingsError) console.error('Error checking meetings:', meetingsError);
    else console.log('Meetings:', meetingsCount);

    const { count: legislatorsCount, error: legislatorsError } = await supabase
        .from('legislators')
        .select('*', { count: 'exact', head: true });

    if (legislatorsError) console.error('Error checking legislators:', legislatorsError);
    else console.log('Legislators:', legislatorsCount);
}

checkData();

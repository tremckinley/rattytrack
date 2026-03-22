import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function upgradeUser() {
    const { data, error } = await supabase
        .from('users')
        .update({
            subscription_tier: 'premium',
            subscription_status: 'active'
        })
        .eq('email', 'admin@capytrackai.com')
        .select();
    
    if (error) {
        console.error('Error upgrading:', error);
    } else {
        console.log('Upgraded successfully! DB now says:', data[0].subscription_tier);
    }
}

upgradeUser();

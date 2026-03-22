import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(10);
    
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('Users in DB:');
        console.dir(data, { depth: null });
    }
}

checkUsers();

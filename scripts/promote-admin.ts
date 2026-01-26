import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteToAdmin(email: string) {
    console.log(`Promoting ${email} to admin...`);
    const { data, error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', email)
        .select();

    if (error) {
        console.error("Error updating role:", error);
    } else {
        console.log("Success! Updated user data:");
        console.table(data);
    }
}

promoteToAdmin('tremckinley901@gmail.com');

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
    console.log("--- PUBLIC.USERS TABLE ---");
    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error("Error fetching public users:", error);
    } else {
        console.table(users);
    }

    console.log("\n--- AUTH.USERS TABLE ---");
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("Error fetching auth users:", authError);
    } else {
        const authData = authUsers.users.map(u => ({
            id: u.id,
            email: u.email,
            last_sign_in: u.last_sign_in_at
        }));
        console.table(authData);
    }
}

checkUsers();

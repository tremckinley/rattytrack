import { createAdminClient } from "./lib/utils/supabase/admin";

async function checkUsers() {
    const adminClient = createAdminClient();

    console.log("Checking public.users table...");
    const { data: publicUsers, error: publicError } = await adminClient
        .from("users")
        .select("*");

    if (publicError) {
        console.error("Error fetching public users:", publicError);
    } else {
        console.log(`Found ${publicUsers?.length || 0} users in public.users`);
        publicUsers?.forEach(u => console.log(`- ${u.email} (${u.role})`));
    }

    console.log("\nChecking auth.users via admin.listUsers()...");
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();

    if (authError) {
        console.error("Error listing auth users:", authError);
    } else {
        console.log(`Found ${authUsers.users.length} users in auth`);
        authUsers.users.forEach(u => console.log(`- ${u.email}`));
    }
}

checkUsers();

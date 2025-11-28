// Test environment variables
// Run with: npx tsx lib/ai/test-env.ts

import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Testing Environment Variables:\n');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Loaded' : '❌ Missing');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('\n⚠️  Make sure .env.local exists in the root directory');
}

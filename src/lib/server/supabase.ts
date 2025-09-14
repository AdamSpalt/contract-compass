import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';

// Add runtime checks to ensure the environment variables are loaded correctly and are of the correct type.
// This will provide a clear error message if the .env file is missing or misconfigured.
if (typeof SUPABASE_URL !== 'string' || typeof SUPABASE_ANON_KEY !== 'string') {
	throw new Error('`SUPABASE_URL` and `SUPABASE_ANON_KEY` are required as string environment variables.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
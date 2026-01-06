import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rjqgywzmkepnxkzkypid.supabase.co';
const supabaseAnonKey = 'sb_publishable_kNSIMV1nVs35pn3UJgVDsg_zCwHZhWh';

//const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
//const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 
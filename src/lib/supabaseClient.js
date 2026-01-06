import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

const supabaseUrl = config.database.supabase.url;
const supabaseAnonKey = config.database.supabase.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 
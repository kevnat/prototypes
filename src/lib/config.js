// Database configuration
const isDevelopment = import.meta.env.MODE === 'development';
const forceDatabase = import.meta.env.VITE_DATABASE_PROVIDER; // 'supabase' or 'mysql'

export const DATABASE_PROVIDER = forceDatabase || (isDevelopment ? 'mysql' : 'supabase');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — set these in .env or Netlify environment variables.');
}

export const config = {
  database: {
    provider: DATABASE_PROVIDER,

    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    },

    // MySQL configuration (local development — backend not implemented)
    mysql: {
      host: import.meta.env.VITE_MYSQL_HOST || 'localhost',
      port: import.meta.env.VITE_MYSQL_PORT || 3306,
      user: import.meta.env.VITE_MYSQL_USER || 'root',
      password: import.meta.env.VITE_MYSQL_PASSWORD || '',
      database: import.meta.env.VITE_MYSQL_DATABASE || 'prototypes'
    }
  }
};

console.log(`🗄️ Database Provider: ${DATABASE_PROVIDER}`);
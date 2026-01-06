// Database configuration
const isDevelopment = import.meta.env.MODE === 'development';
const forceDatabase = import.meta.env.VITE_DATABASE_PROVIDER; // 'supabase' or 'mysql'

export const DATABASE_PROVIDER = forceDatabase || (isDevelopment ? 'mysql' : 'supabase');

export const config = {
  database: {
    provider: DATABASE_PROVIDER,

    // Supabase configuration
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || 'https://rjqgywzmkepnxkzkypid.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kNSIMV1nVs35pn3UJgVDsg_zCwHZhWh'
    },

    // MySQL configuration (local development)
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
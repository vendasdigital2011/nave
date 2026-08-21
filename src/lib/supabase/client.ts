import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.vps10855.panel.icontainer.net';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  console.log('SUPABASE_URL_RUNTIME', process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl);

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

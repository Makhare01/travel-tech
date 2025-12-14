import { createClient } from "@supabase/supabase-js";

export function createServerClient() {
  // Use service role key for server-side operations to bypass RLS
  // Since we're already authenticating with Clerk, we can use service role
  // Make sure SUPABASE_SERVICE_ROLE_KEY is set in your .env.local file
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Use service role key if available, otherwise fallback to anon key
  // Note: Service role key bypasses RLS, which is needed for server-side operations
  const keyToUse = serviceRoleKey || anonKey;

  if (!serviceRoleKey) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY not set. Using anon key which may cause RLS errors. Add SUPABASE_SERVICE_ROLE_KEY to .env.local"
    );
  }

  return createClient(supabaseUrl, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

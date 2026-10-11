import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/env";

/**
 * Supabase client server-only menggunakan service role key.
 * Digunakan untuk background job, API routes, dan server actions.
 * JANGAN PERNAH di-import di Client Component.
 */
export function createServerDb() {
  const env = getServerEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase URL atau SERVICE_ROLE_KEY belum dikonfigurasi di environment.",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

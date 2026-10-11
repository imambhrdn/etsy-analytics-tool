import { z } from "zod";

/**
 * Skema environment server-side.
 *
 * Semua nilai OPSIONAL agar aplikasi tetap bisa jalan (mode kosong/empty state)
 * sebelum kredensial Etsy/Supabase tersedia — lihat IMPLEMENTATION_PLAN.md B1/B2.
 * Validasi ini hanya memastikan bentuk (format) saat nilainya diisi.
 */
const serverEnvSchema = z.object({
  // Supabase (server)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Etsy API
  ETSY_API_KEY: z.string().min(1).optional(),
  ETSY_SHARED_SECRET: z.string().min(1).optional(),
  ETSY_REDIRECT_URI: z.url().optional(),

  // Keamanan token OAuth
  TOKEN_ENCRYPTION_KEY: z.string().min(1).optional(),

  // n8n (server-only)
  N8N_BASE_URL: z.url().optional(),
  N8N_WEBHOOK_SECRET: z.string().min(1).optional(),

  // AI (opsional)
  AI_PROVIDER_API_KEY: z.string().min(1).optional(),

  // App
  APP_TIMEZONE: z.string().min(1).default("Asia/Jakarta"),
});

/**
 * Skema environment publik (dibundel ke client).
 * JANGAN tambahkan rahasia di sini.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

/**
 * Baca + validasi environment server-side.
 * Panggil dari kode server-only saja (server component / route handler).
 */
export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ETSY_API_KEY: process.env.ETSY_API_KEY,
    ETSY_SHARED_SECRET: process.env.ETSY_SHARED_SECRET,
    ETSY_REDIRECT_URI: process.env.ETSY_REDIRECT_URI,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
    N8N_BASE_URL: process.env.N8N_BASE_URL,
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
    AI_PROVIDER_API_KEY: process.env.AI_PROVIDER_API_KEY,
    APP_TIMEZONE: process.env.APP_TIMEZONE,
  });
}

/** Baca environment publik (aman di client). */
export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/**
 * Ringkasan status koneksi untuk UI diagnostik (PRD §7.8).
 * Hanya mengembalikan boolean terisi/tidak — TIDAK pernah nilai rahasia.
 */
export function getIntegrationStatus() {
  const has = (v: string | undefined) => typeof v === "string" && v.length > 0;
  return {
    etsyApiKey: has(process.env.ETSY_API_KEY),
    etsySharedSecret: has(process.env.ETSY_SHARED_SECRET),
    etsyRedirectUri: has(process.env.ETSY_REDIRECT_URI),
    supabaseUrl: has(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRole: has(process.env.SUPABASE_SERVICE_ROLE_KEY),
    n8n: has(process.env.N8N_BASE_URL),
    aiProvider: has(process.env.AI_PROVIDER_API_KEY),
    tokenEncryptionKey: has(process.env.TOKEN_ENCRYPTION_KEY),
  } as const;
}

import { z } from "zod";

/**
 * Preprocessor untuk menangani nilai empty string ("") dari file .env
 * agar dianggap undefined daripada gagal di validasi min(1) atau url().
 */
const emptyToUndefined = z.preprocess((val) => {
  if (typeof val === "string" && val.trim() === "") return undefined;
  return val;
}, z.string().optional());

const emptyToUndefinedUrl = z.preprocess((val) => {
  if (typeof val === "string" && val.trim() === "") return undefined;
  return val;
}, z.url().optional());

/**
 * Skema environment server-side.
 * Semua nilai bersifat OPSIONAL agar aplikasi tetap berjalan aman
 * meskipun sebagian kredensial belum diisi di .env.local.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: emptyToUndefined,
  ETSY_API_KEY: emptyToUndefined,
  ETSY_SHARED_SECRET: emptyToUndefined,
  ETSY_REDIRECT_URI: emptyToUndefinedUrl,
  TOKEN_ENCRYPTION_KEY: emptyToUndefined,
  N8N_BASE_URL: emptyToUndefinedUrl,
  N8N_WEBHOOK_SECRET: emptyToUndefined,
  AI_PROVIDER_API_KEY: emptyToUndefined,
  APP_TIMEZONE: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? v : "Asia/Jakarta"),
      z.string(),
    )
    .default("Asia/Jakarta"),
});

/**
 * Skema environment publik (dibundel ke client).
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: emptyToUndefinedUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: emptyToUndefined,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

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

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getIntegrationStatus() {
  const has = (v: string | undefined) => typeof v === "string" && v.trim().length > 0;
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

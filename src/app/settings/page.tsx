import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getIntegrationStatus } from "@/lib/config/env";
import { APP } from "@/lib/config/app";
import { getDiscoverySeeds, getLastDiscoveryJob } from "@/lib/db/discovery-repo";
import { SeedSettings } from "@/components/settings/seed-settings";
import { TriangleAlert } from "lucide-react";

/**
 * Settings — status koneksi, seed discovery, dan konfigurasi (PRD §7.8, P0).
 * Menampilkan HANYA status terhubung/ada; tidak pernah nilai rahasia.
 */
async function SettingsContent() {
  await connection();
  const status = getIntegrationStatus();
  const seeds = await getDiscoverySeeds();
  const lastJob = await getLastDiscoveryJob();

  const rows: { label: string; ok: boolean; hint: string }[] = [
    { label: "Etsy API key", ok: status.etsyApiKey, hint: "ETSY_API_KEY" },
    { label: "Etsy shared secret", ok: status.etsySharedSecret, hint: "ETSY_SHARED_SECRET" },
    { label: "Etsy redirect URI", ok: status.etsyRedirectUri, hint: "ETSY_REDIRECT_URI" },
    { label: "Supabase URL", ok: status.supabaseUrl, hint: "NEXT_PUBLIC_SUPABASE_URL" },
    {
      label: "Supabase anon key",
      ok: status.supabaseAnonKey,
      hint: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    },
    {
      label: "Supabase service role",
      ok: status.supabaseServiceRole,
      hint: "SUPABASE_SERVICE_ROLE_KEY",
    },
    { label: "n8n", ok: status.n8n, hint: "N8N_BASE_URL" },
    { label: "AI provider", ok: status.aiProvider, hint: "AI_PROVIDER_API_KEY" },
    {
      label: "Token encryption key",
      ok: status.tokenEncryptionKey,
      hint: "TOKEN_ENCRYPTION_KEY",
    },
  ];

  const missing = rows.filter((r) => !r.ok).length;

  return (
    <div className="space-y-6">
      {missing > 0 && (
        <Alert>
          <TriangleAlert />
          <AlertTitle>{missing} integrasi belum dikonfigurasi</AlertTitle>
          <AlertDescription>
            Aplikasi berjalan dengan fallback aman sampai kredensial diisi di file{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">.env.local</code>. Nilai
            rahasia tidak pernah ditampilkan di antarmuka.
          </AlertDescription>
        </Alert>
      )}

      {/* Discovery Seeds & Scheduled Job Trigger (P3-01, P3-02) */}
      <SeedSettings initialSeeds={seeds} initialLastJob={lastJob} />

      {/* Status Integrasi API */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Integrasi API</CardTitle>
          <CardDescription>
            Hanya status terhubung/ada. Nilai rahasia tidak pernah ditampilkan (PRD §7.8, §12).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {rows.map((row) => (
            <div key={row.hint}>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-muted-foreground font-mono text-xs">{row.hint}</p>
                </div>
                <Badge variant={row.ok ? "default" : "outline"}>
                  {row.ok ? "Terisi" : "Kosong"}
                </Badge>
              </div>
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Konfigurasi Aplikasi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Konfigurasi Jadwal & Lingkungan</CardTitle>
          <CardDescription>Pengaturan operasional sistem.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Timezone Operasional</span>
            <span className="font-mono">{APP.timezone}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Jadwal Refresh Otomatis</span>
            <span>Harian, target 02.00 WIB (via n8n / cron trigger)</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Seed Keywords Aktif</span>
            <span>{seeds.filter((s) => s.enabled).length} dari {seeds.length} kata kunci</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Status koneksi, kelola seed keywords discovery, dan pemicu sinkronisasi."
      />
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <SettingsContent />
      </Suspense>
    </div>
  );
}

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { getIntegrationStatus } from "@/lib/config/env";
import { APP } from "@/lib/config/app";
import { TriangleAlert } from "lucide-react";

/**
 * Settings — Phase 1: status koneksi & diagnostik (PRD §7.8, P0).
 * Menampilkan HANYA status terhubung/ada; tidak pernah nilai rahasia.
 * Pengaturan seed/schedule/alert menyusul di fase terkait.
 */
export default function SettingsPage() {
  const status = getIntegrationStatus();

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
      <PageHeader
        title="Settings"
        description="Status koneksi, diagnostik API, dan konfigurasi dasar."
      />

      {missing > 0 && (
        <Alert>
          <TriangleAlert />
          <AlertTitle>{missing} integrasi belum dikonfigurasi</AlertTitle>
          <AlertDescription>
            Aplikasi berjalan dengan empty state sampai kredensial diisi di file{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">.env.local</code> (lihat{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">.env.example</code>). Rahasia
            tidak ditampilkan di sini — hanya status terisi/kosong.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Status integrasi</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi aplikasi</CardTitle>
          <CardDescription>Nilai non-rahasia yang berlaku saat ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Timezone</span>
            <span className="font-mono">{APP.timezone}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Default refresh schedule</span>
            <span>Harian, 02.00 (WIB) — diimplementasikan di Phase 3</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Seed keywords</span>
            <span>Dikonfigurasi di Phase 3</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

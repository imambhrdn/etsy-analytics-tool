import { EmptyState } from "@/components/states";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, Settings as SettingsIcon } from "lucide-react";

/**
 * Today's Etsy Trends — landing page (PRD §7.1, P0).
 *
 * Phase 1: kerangka + empty state jujur. Data akan diisi pada Phase 3
 * (daily discovery & snapshots). TIDAK menampilkan angka rekaan.
 */
export default function TodaysTrendsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's Etsy Trends"
        description="Kandidat discovery otomatis dari seed keyword. Ranking transparan berdasarkan data yang tersimpan."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tracked listings", hint: "Listing yang dipantau" },
          { label: "Newly discovered", hint: "Kandidat baru ditemukan" },
          { label: "Emerging", hint: "Histori masih terbatas" },
          { label: "Last updated", hint: "Waktu sinkronisasi terakhir" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-2xl font-semibold">—</p>
              <p className="text-muted-foreground text-xs">{kpi.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmptyState
        icon={Sparkles}
        title="Belum ada hasil discovery"
        description="Discovery belum dijalankan atau belum ada seed keyword aktif. Tambahkan seed keyword dan konfigurasi Etsy API di Settings untuk mulai mengumpulkan kandidat. Setelah sinkronisasi harian berjalan, kandidat akan muncul di sini."
        action={
          <Button render={<Link href="/settings" />}>
            <SettingsIcon />
            Buka Settings
          </Button>
        }
      />
    </div>
  );
}

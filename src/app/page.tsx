import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  Sparkles,
  Settings as SettingsIcon,
  Clock,
  AlertTriangle,
  Layers,
  TrendingUp,
  Award,
} from "lucide-react";
import { EmptyState } from "@/components/states";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDiscoveryKpis, getTodayTrends } from "@/lib/db/discovery-repo";
import { getExchangeRates } from "@/lib/currency";
import { formatDateIndo, formatNumber } from "@/lib/utils";
import { TrendCard, type TrendCandidateItem } from "@/components/trends/trend-card";
import { TrendFilters } from "@/components/trends/trend-filters";
import { TrendSyncButton } from "@/components/trends/trend-sync-button";

type TrendsPageParams = Promise<{
  class?: "emerging" | "accelerating" | "established" | "all";
  sort?: "highest_score" | "fastest_growth" | "most_attention" | "recent";
  window?: "7d" | "30d" | "90d";
}>;

async function TrendsContent({ searchParams }: { searchParams: TrendsPageParams }) {
  await connection();
  const params = await searchParams;
  const classification = params.class || "all";
  const sort = params.sort || "highest_score";

  const [kpis, trendsData, fx] = await Promise.all([
    getDiscoveryKpis(),
    getTodayTrends({ classification, sort }),
    getExchangeRates(),
  ]);

  const rates = fx?.rates ?? null;
  const lastJob = kpis.lastJob;

  // Tentukan status kesegaran data (PRD §7.1: Live / Stale / Empty)
  const now = new Date();
  const lastRunTime = lastJob?.finished_at ? new Date(lastJob.finished_at) : null;
  const isStale = lastRunTime ? now.getTime() - lastRunTime.getTime() > 24 * 60 * 60 * 1000 : false;
  const dataStatus: "live" | "stale" | "empty" = !lastRunTime
    ? "empty"
    : isStale
      ? "stale"
      : "live";

  return (
    <div className="space-y-6">
      {/* Sync Status Header (PRD §7.1: Last updated, Next refresh, Data status) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3.5 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-muted-foreground block text-[11px]">Terakhir Diperbarui:</span>
            <span className="font-medium flex items-center gap-1.5 mt-0.5">
              <Clock className="size-3.5 text-muted-foreground" />
              {lastJob?.finished_at ? formatDateIndo(lastJob.finished_at) : "Belum pernah"}
            </span>
          </div>

          <div className="border-l pl-4">
            <span className="text-muted-foreground block text-[11px]">Target Refresh Berikutnya:</span>
            <span className="font-medium mt-0.5 block">Harian, 02.00 WIB</span>
          </div>

          <div className="border-l pl-4">
            <span className="text-muted-foreground block text-[11px]">Status Kesegaran Data:</span>
            <div className="mt-0.5">
              {dataStatus === "live" ? (
                <Badge className="bg-emerald-600 text-white gap-1 text-[10px] px-1.5 py-0">
                  <span className="size-1.5 rounded-full bg-white animate-pulse" />
                  Live (Terbaru)
                </Badge>
              ) : dataStatus === "stale" ? (
                <Badge variant="outline" className="text-amber-600 border-amber-500/40 gap-1 text-[10px] px-1.5 py-0">
                  <AlertTriangle className="size-3 text-amber-500" />
                  Data Stale (&gt;24 jam)
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0">
                  Belum Ada Data
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tombol Manual Trigger Discovery (P3-02) */}
        <div className="flex items-center gap-2">
          <TrendSyncButton />
        </div>
      </div>

      {/* Warning jika data stale (PRD §7.1) */}
      {isStale && (
        <div className="p-3 rounded-lg text-xs flex items-center justify-between gap-3 bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <span>
              Sinkronisasi terakhir lebih dari 24 jam yang lalu. Data yang ditampilkan adalah snapshot tersimpan terakhir. Klik &quot;Sinkronkan Sekarang&quot; untuk memperbarui data live.
            </span>
          </div>
          <TrendSyncButton />
        </div>
      )}

      {/* KPI Cards (PRD §7.1: Tracked listings, Newly discovered / Emerging, Accelerating, Established) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Listing Terpantau</span>
            <Layers className="size-4" />
          </div>
          <p className="text-2xl font-bold mt-2">
            {kpis.trackedListings > 0 ? formatNumber(kpis.trackedListings) : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Total database listing</p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Kandidat Emerging</span>
            <Sparkles className="size-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-sky-600 dark:text-sky-400">
            {kpis.emergingCount > 0 ? formatNumber(kpis.emergingCount) : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Baru ditemukan / observasi awal</p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Kandidat Accelerating</span>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
            {kpis.acceleratingCount > 0 ? formatNumber(kpis.acceleratingCount) : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Pertumbuhan metrik positif</p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Kandidat Established</span>
            <Award className="size-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-600 dark:text-purple-400">
            {kpis.establishedCount > 0 ? formatNumber(kpis.establishedCount) : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Perhatian pasar relatif tinggi</p>
        </Card>
      </div>

      {/* Filter Bar (PRD §7.1: Category, Window, Sort, Classification) */}
      <div className="space-y-3">
        <Suspense fallback={null}>
          <TrendFilters />
        </Suspense>
      </div>

      {/* Kandidat Produk Tren atau Empty State (PRD §7.1) */}
      {trendsData.results.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Belum ada kandidat tren yang tersimpan"
          description="Sistem belum menjalankan proses discovery harian. Anda dapat menekan tombol 'Sinkronkan Sekarang' di atas atau mengelola kata kunci seed di Settings untuk mulai memantau tren otomatis."
          action={
            <div className="flex gap-2 mt-2">
              <TrendSyncButton />
              <Button variant="outline" size="sm" render={<Link href="/settings" />}>
                <SettingsIcon className="size-3.5" />
                Buka Settings
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Menampilkan <strong>{formatNumber(trendsData.results.length)}</strong> kandidat tren (Run Date: {trendsData.runDate})
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trendsData.results.map((item) => (
              <TrendCard key={item.id} item={item as unknown as TrendCandidateItem} rates={rates} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TodaysTrendsPage(props: { searchParams: TrendsPageParams }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's Etsy Trends"
        description="Landing page kandidat produk dan tren Etsy otomatis berdasarkan seed keyword tanpa pencarian manual."
      />

      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-14 w-full" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        }
      >
        <TrendsContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

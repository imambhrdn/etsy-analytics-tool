"use client";

import { useState } from "react";
import { Plus, Trash2, Play, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateIndo } from "@/lib/utils";
import type { DiscoverySeed, JobRun } from "@/lib/db/discovery-repo";

export function SeedSettings({
  initialSeeds,
  initialLastJob,
}: {
  initialSeeds: DiscoverySeed[];
  initialLastJob: JobRun | null;
}) {
  const [seeds, setSeeds] = useState<DiscoverySeed[]>(initialSeeds);
  const [lastJob, setLastJob] = useState<JobRun | null>(initialLastJob);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState("Digital Downloads");
  const [newPriority, setNewPriority] = useState(5);
  const [isAdding, setIsAdding] = useState(false);
  const [isRunningJob, setIsRunningJob] = useState(false);
  const [jobFeedback, setJobFeedback] = useState<{
    status: string;
    message: string;
  } | null>(null);

  const handleToggle = async (seed: DiscoverySeed) => {
    try {
      const res = await fetch(`/api/seeds/${seed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !seed.enabled }),
      });
      if (res.ok) {
        setSeeds((prev) =>
          prev.map((s) => (s.id === seed.id ? { ...s, enabled: !s.enabled } : s)),
        );
      }
    } catch (err) {
      console.error("Gagal toggle seed:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kata kunci seed ini?")) return;
    try {
      const res = await fetch(`/api/seeds/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSeeds((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Gagal hapus seed:", err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || isAdding) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          category: newCategory,
          priority: newPriority,
        }),
      });
      const data = await res.json();
      if (res.ok && data.seed) {
        setSeeds((prev) => [data.seed, ...prev]);
        setNewKeyword("");
      } else {
        alert(data.error || "Gagal menambah seed");
      }
    } catch (err) {
      console.error("Error add seed:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleTriggerDiscovery = async () => {
    if (isRunningJob) return;
    setIsRunningJob(true);
    setJobFeedback(null);

    try {
      const res = await fetch("/api/jobs/discovery", { method: "POST" });
      const data = await res.json();

      if (res.ok && data.summary) {
        setJobFeedback({
          status: data.summary.status,
          message: `Job selesai dengan status: ${data.summary.status}. Berhasil memproses ${data.summary.listingsFound} listing dari ${data.summary.seedsProcessed} seed keyword. Disimpan: ${data.summary.trendResultsSaved} tren.`,
        });
        // Refresh last job status
        const jobRes = await fetch("/api/jobs/discovery");
        const jobData = await jobRes.json();
        if (jobData.lastJob) setLastJob(jobData.lastJob);
      } else {
        setJobFeedback({
          status: "failed",
          message: data.error || "Job gagal dijalankan",
        });
      }
    } catch (err) {
      setJobFeedback({
        status: "failed",
        message: (err as Error).message,
      });
    } finally {
      setIsRunningJob(false);
    }
  };

  const categories = [
    "Digital Downloads",
    "Handmade & Personalized",
    "Home Decor",
    "Jewelry",
    "Apparel",
    "Other",
  ];

  return (
    <div className="space-y-6">
      {/* Kartu Status Job Sinkronisasi & Manual Trigger (P3-02) */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base">Discovery Terjadwal & Manual Trigger</CardTitle>
            <CardDescription>
              Mesin discovery otomatis mengumpulkan listing setiap hari berdasarkan seed keywords yang aktif.
            </CardDescription>
          </div>
          <Button
            onClick={handleTriggerDiscovery}
            disabled={isRunningJob}
            className="gap-2 shrink-0 cursor-pointer"
          >
            {isRunningJob ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Sedang Sinkronisasi...
              </>
            ) : (
              <>
                <Play className="size-4" />
                Jalankan Discovery Sekarang
              </>
            )}
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {jobFeedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                jobFeedback.status === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-800/40"
                  : jobFeedback.status === "partial"
                    ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200"
                    : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              {jobFeedback.status === "success" ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : jobFeedback.status === "partial" ? (
                <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
              ) : (
                <XCircle className="size-4 shrink-0 text-destructive mt-0.5" />
              )}
              <span>{jobFeedback.message}</span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3 text-xs bg-muted/40 p-3 rounded-lg border">
            <div>
              <span className="text-muted-foreground block">Status Job Terakhir:</span>
              <span className="font-semibold flex items-center gap-1.5 mt-0.5 capitalize">
                {lastJob?.status === "success" ? (
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                ) : lastJob?.status === "running" ? (
                  <RefreshCw className="size-3.5 animate-spin text-sky-500" />
                ) : (
                  <Clock className="size-3.5 text-muted-foreground" />
                )}
                {lastJob?.status || "Belum pernah dijalankan"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Waktu Terakhir:</span>
              <span className="font-mono mt-0.5 block">
                {lastJob?.finished_at ? formatDateIndo(lastJob.finished_at) : "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Item Diproses:</span>
              <span className="font-semibold mt-0.5 block">
                {lastJob?.items_processed ? `${lastJob.items_processed} listing` : "0"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kartu Kelola Seed Keywords (P3-01) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seed Keywords Discovery ({seeds.length})</CardTitle>
          <CardDescription>
            Kata kunci awal untuk menjelajah listing Etsy dan mendeteksi tren otomatis. Anda dapat menambah, mengubah prioritas, atau menonaktifkan kata kunci di sini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form Tambah Seed Baru */}
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 p-3 bg-muted/30 rounded-lg border">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Kata Kunci Baru
              </label>
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="mis. vintage aesthetic tee, macrame plant hanger..."
                className="h-8 text-xs bg-background"
                required
              />
            </div>
            <div className="w-[180px]">
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Kategori
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[80px]">
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Prioritas
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(Number(e.target.value))}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" disabled={isAdding} className="h-8 text-xs gap-1">
              <Plus className="size-3.5" />
              Tambah Seed
            </Button>
          </form>

          {/* Daftar Seed Keywords */}
          <div className="border rounded-lg divide-y max-h-[420px] overflow-y-auto">
            {seeds.map((s) => (
              <div
                key={s.id}
                className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(s)}
                    className={`size-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                      s.enabled ? "bg-primary border-primary text-primary-foreground" : "bg-background border-input"
                    }`}
                    title={s.enabled ? "Nonaktifkan seed" : "Aktifkan seed"}
                  >
                    {s.enabled && "✓"}
                  </button>
                  <div className="min-w-0">
                    <span className={`font-medium block truncate ${s.enabled ? "" : "text-muted-foreground line-through"}`}>
                      {s.keyword}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {s.category || "General"} · Prio: {s.priority}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={s.enabled ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
                    {s.enabled ? "Aktif" : "Nonaktif"}
                  </Badge>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => handleDelete(s.id)}
                    className="text-muted-foreground hover:text-destructive size-7"
                    title="Hapus kata kunci"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { NextResponse } from "next/server";
import { runDiscoveryJob } from "@/lib/discovery/runner";
import { getLastDiscoveryJob, getDiscoveryKpis } from "@/lib/db/discovery-repo";

export async function POST(request: Request) {
  try {
    let body: { seedId?: string; limit?: number } = {};
    try {
      body = await request.json();
    } catch {
      // Body kosong diperbolehkan
    }

    const summary = await runDiscoveryJob({
      specificSeedId: body.seedId,
      maxListingsPerSeed: body.limit,
    });

    return NextResponse.json({
      success: summary.status !== "failed",
      summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan pada discovery job";
    console.error("[api/jobs/discovery] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const lastJob = await getLastDiscoveryJob();
    const kpis = await getDiscoveryKpis();

    return NextResponse.json({
      lastJob,
      kpis,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil status job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

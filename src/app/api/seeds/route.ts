import { NextResponse } from "next/server";
import { z } from "zod";
import { getDiscoverySeeds, addDiscoverySeed } from "@/lib/db/discovery-repo";

const createSeedSchema = z.object({
  keyword: z.string().trim().min(2, "Kata kunci minimal 2 karakter").max(80),
  category: z.string().trim().max(50).optional(),
  priority: z.coerce.number().int().min(1).max(10).default(5),
  maxPages: z.coerce.number().int().min(1).max(5).default(1),
});

export async function GET() {
  try {
    const seeds = await getDiscoverySeeds();
    return NextResponse.json({ seeds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil seeds";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = createSeedSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload seed tidak valid", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const created = await addDiscoverySeed(parsed.data);
    return NextResponse.json({ success: true, seed: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambah seed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

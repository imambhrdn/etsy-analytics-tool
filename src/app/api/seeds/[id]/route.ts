import { NextResponse } from "next/server";
import { z } from "zod";
import { updateDiscoverySeed, deleteDiscoverySeed } from "@/lib/db/discovery-repo";

const updateSeedSchema = z.object({
  enabled: z.boolean().optional(),
  priority: z.coerce.number().int().min(1).max(10).optional(),
  category: z.string().trim().max(50).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const json = await request.json();
    const parsed = updateSeedSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload tidak valid", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const updated = await updateDiscoverySeed(id, parsed.data);
    return NextResponse.json({ success: true, seed: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengupdate seed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await deleteDiscoverySeed(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus seed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

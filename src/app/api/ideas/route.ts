import { NextResponse } from "next/server";
import { z } from "zod";
import { saveProductIdea } from "@/lib/db/listings-repo";

const createIdeaSchema = z.object({
  title: z.string().trim().min(1, "Judul ide tidak boleh kosong").max(200),
  category: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
  targetPrice: z.coerce.number().min(0).optional(),
  sourceUrl: z.url().optional(),
  listingId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = createIdeaSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload ide tidak valid", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const ideaId = await saveProductIdea(parsed.data);
    return NextResponse.json({ success: true, id: ideaId }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan ide";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

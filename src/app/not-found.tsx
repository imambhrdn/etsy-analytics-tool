import { EmptyState } from "@/components/states";
import { PageHeader } from "@/components/page-header";

/** Halaman 404 (PRD §15). */
export default function NotFound() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tidak ditemukan" description="Halaman yang Anda cari tidak ada." />
      <EmptyState
        title="404 — halaman tidak ditemukan"
        description="Periksa URL atau kembali ke Today's Etsy Trends."
      />
    </div>
  );
}

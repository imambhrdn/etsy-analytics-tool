import { Construction } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";

type ComingLaterProps = {
  title: string;
  description?: string;
  /** Fase PRD tempat fitur ini direncanakan. */
  phase?: string;
};

/**
 * Placeholder jujur untuk fitur yang belum berfungsi (PRD §6).
 * Tidak menampilkan data palsu atau UI yang tampak aktif.
 */
export function ComingLater({ title, description, phase }: ComingLaterProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title="Coming later"
        description={
          phase
            ? `Fitur ini belum diimplementasikan (direncanakan pada ${phase}). Menu ditandai "Later" sampai integrasi nyata tersedia.`
            : "Fitur ini belum diimplementasikan. Menu ditandai \"Later\" sampai integrasi nyata tersedia."
        }
      />
    </div>
  );
}

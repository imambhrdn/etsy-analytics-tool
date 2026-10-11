import { cn } from "@/lib/utils";

/** Style judul segmen kanonik — dipakai seragam di seluruh halaman. */
export const PAGE_TITLE_CLASS =
  "text-sm font-semibold tracking-tight text-muted-foreground";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Kontrol di kanan header (filter, tombol aksi). */
  actions?: React.ReactNode;
  className?: string;
};

/** Header halaman konsisten (judul + deskripsi + aksi). */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

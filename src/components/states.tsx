import type { LucideIcon } from "lucide-react";
import { TriangleAlert, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
};

/** Empty state dengan instruksi (PRD §15). */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: StateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <Icon className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          {description && (
            <p className="text-muted-foreground mx-auto max-w-md text-sm">{description}</p>
          )}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

/** Error state dengan retry aman (PRD §15). */
export function ErrorState({
  title = "Terjadi kesalahan",
  description,
  icon: Icon = TriangleAlert,
  action,
  className,
}: Partial<StateProps> & { className?: string } = {}) {
  return (
    <Card className={cn("border-destructive/40", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
          <Icon className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          {description && (
            <p className="text-muted-foreground mx-auto max-w-md text-sm">{description}</p>
          )}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

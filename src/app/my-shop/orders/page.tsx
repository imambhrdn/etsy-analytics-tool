import { ComingLater } from "@/components/coming-later";

export default function OrdersPage() {
  return (
    <ComingLater
      title="Orders & Sales"
      description="Hanya muncul jika endpoint dan scope memang menyediakan data."
      phase="Phase 5"
    />
  );
}

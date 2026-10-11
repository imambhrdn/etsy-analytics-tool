import { ComingLater } from "@/components/coming-later";

export default function MyListingsPage() {
  return (
    <ComingLater
      title="My Listings"
      description="Listing milik toko sendiri (read-only) via OAuth sesuai scope."
      phase="Phase 5"
    />
  );
}

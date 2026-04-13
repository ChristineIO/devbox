import { items } from "@/lib/mock-data";
import { ItemRow } from "@/components/dashboard/ItemRow";

const RECENT_LIMIT = 10;

export function RecentItems() {
  const recent = [...items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, RECENT_LIMIT);

  if (recent.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-heading text-lg font-semibold">Recent Items</h2>
      <div className="flex flex-col gap-3">
        {recent.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

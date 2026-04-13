import { getRecentItems } from "@/lib/db/items";
import { ItemRow } from "@/components/dashboard/ItemRow";

export async function RecentItems() {
  const recent = await getRecentItems(10);

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

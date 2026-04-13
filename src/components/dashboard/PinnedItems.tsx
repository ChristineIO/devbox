import { Pin } from "lucide-react";

import { getPinnedItems } from "@/lib/db/items";
import { ItemRow } from "@/components/dashboard/ItemRow";

export async function PinnedItems() {
  const pinned = await getPinnedItems();

  if (pinned.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Pin className="size-4 text-muted-foreground" />
        <h2 className="font-heading text-lg font-semibold">Pinned</h2>
      </div>
      <div className="flex flex-col gap-3">
        {pinned.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

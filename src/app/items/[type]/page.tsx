import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getItemsByType } from "@/lib/db/items";
import { ItemCard } from "@/components/items/ItemCard";

export const dynamic = "force-dynamic";

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const match = await prisma.itemType.findFirst({
    where: { name: decodeURIComponent(type) },
    select: { id: true, name: true },
  });
  if (!match) notFound();

  const items = await getItemsByType(match.id);

  return (
    <div>
      <h2 className="text-2xl font-semibold capitalize">{match.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {items.length} {items.length === 1 ? "item" : "items"}
      </p>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No {match.name.toLowerCase()} items yet.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

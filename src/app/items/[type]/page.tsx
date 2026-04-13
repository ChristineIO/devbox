import { notFound } from "next/navigation";

import { itemTypes } from "@/lib/mock-data";

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const match = itemTypes.find((t) => t.id === type);
  if (!match) notFound();

  return (
    <div>
      <h2 className="text-2xl font-semibold">{match.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Items of type {match.name.toLowerCase()}.
      </p>
    </div>
  );
}

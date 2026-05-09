"use client";

import { createContext, useContext, useState } from "react";

import type { ItemCardData } from "@/lib/db/items";
import { ItemDrawer } from "./ItemDrawer";

type ItemDrawerContextValue = {
  selected: ItemCardData | null;
  open: (item: ItemCardData) => void;
  close: () => void;
};

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function ItemDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<ItemCardData | null>(null);

  const value = {
    selected,
    open: (item: ItemCardData) => setSelected(item),
    close: () => setSelected(null),
  };

  return (
    <ItemDrawerContext.Provider value={value}>
      {children}
      <ItemDrawer />
    </ItemDrawerContext.Provider>
  );
}

export function useItemDrawer() {
  const ctx = useContext(ItemDrawerContext);
  if (!ctx) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return ctx;
}

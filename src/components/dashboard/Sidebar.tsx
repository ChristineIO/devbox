"use client";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { SidebarItemType } from "@/lib/db/items";
import type { SidebarCollection } from "@/lib/db/collections";
import type { SidebarUser } from "@/lib/db/user";
import { SidebarContent } from "./SidebarContent";
import { useSidebar } from "./SidebarContext";

type Props = {
  itemTypes: SidebarItemType[];
  collections: SidebarCollection[];
  user: SidebarUser | null;
};

export function Sidebar({ itemTypes, collections, user }: Props) {
  const { desktopCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 sm:max-w-xs"
          showCloseButton={false}
        >
          <SidebarContent
            onNavigate={() => setMobileOpen(false)}
            itemTypes={itemTypes}
            collections={collections}
            user={user}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-sidebar transition-[width] duration-200",
        desktopCollapsed ? "w-14" : "w-64",
      )}
    >
      <SidebarContent
        collapsed={desktopCollapsed}
        itemTypes={itemTypes}
        collections={collections}
        user={user}
      />
    </aside>
  );
}

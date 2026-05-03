import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/SidebarContext";
import { TopBar } from "@/components/dashboard/TopBar";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getSidebarCollections } from "@/lib/db/collections";
import { getSidebarUser } from "@/lib/db/user";

export const dynamic = "force-dynamic";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [itemTypes, collections, user] = await Promise.all([
    getSidebarItemTypes(),
    getSidebarCollections(),
    getSidebarUser(),
  ]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar itemTypes={itemTypes} collections={collections} user={user} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

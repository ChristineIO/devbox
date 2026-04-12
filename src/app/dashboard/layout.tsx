import { TopBar } from "@/components/dashboard/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopBar />
      <div className="flex flex-1">
        <aside className="w-64 shrink-0 border-r border-border p-4">
          <h2 className="text-lg font-semibold">Sidebar</h2>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

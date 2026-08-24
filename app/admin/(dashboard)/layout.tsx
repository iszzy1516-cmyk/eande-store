import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-cream text-cocoa">
      <Sidebar />
      <main className="flex-1 overflow-x-auto p-6 md:p-10">{children}</main>
    </div>
  );
}

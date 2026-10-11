import Sidebar from "@/components/admin/Sidebar";
import AdminGate from "@/components/admin/AdminGate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is enforced on every /api/admin route; AdminGate redirects any
  // logged-out visitor to login before any admin UI renders.
  return (
    <AdminGate>
      <div className="flex min-h-screen bg-cream text-cocoa">
        <Sidebar />
        <main className="flex-1 overflow-x-auto p-6 md:p-10">{children}</main>
      </div>
    </AdminGate>
  );
}

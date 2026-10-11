import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is enforced server-side on every /api/admin route and surfaced to
  // the UI via the apiFetch 401 -> /admin/login redirect. The middleware
  // adds a redirect for the server deployment.
  return (
    <div className="flex min-h-screen bg-cream text-cocoa">
      <Sidebar />
      <main className="flex-1 overflow-x-auto p-6 md:p-10">{children}</main>
    </div>
  );
}

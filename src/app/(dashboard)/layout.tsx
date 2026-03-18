import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-50 p-4">
        <h2 className="mb-4 text-lg font-bold">Fretefy</h2>
        <nav className="space-y-2">
          <Link href="/drivers" className="block rounded p-2 hover:bg-gray-200">
            Drivers
          </Link>
          <Link href="/vehicles" className="block rounded p-2 hover:bg-gray-200">
            Vehicles
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
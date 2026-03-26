"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: GridIcon },
  { href: "/clients", label: "Clients", icon: UsersIcon },
  { href: "/engineers", label: "Engineers", icon: WrenchIcon },
  { href: "/admin", label: "Admin", icon: ShieldIcon },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: LayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-dark-bg text-white">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-dark-border bg-dark-card">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-dark-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-wyre-600">
            <span className="text-sm font-bold text-white">W</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">WYRE</p>
            <p className="text-xs text-gray-400">AI Impact Tracker</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-wyre-600/10 text-wyre-400"
                    : "text-gray-400 hover:bg-dark-hover hover:text-white"
                }`}
              >
                <item.icon active={isActive} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-dark-border px-6 py-4">
          <p className="text-xs text-gray-500">WYRE Technology</p>
          <p className="text-xs text-gray-600">v1.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

// ---- Simple SVG Icons ----

function GridIcon({ active }: { active: boolean }) {
  const color = active ? "#598dff" : "currentColor";
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function UsersIcon({ active }: { active: boolean }) {
  const color = active ? "#598dff" : "currentColor";
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function WrenchIcon({ active }: { active: boolean }) {
  const color = active ? "#598dff" : "currentColor";
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function ShieldIcon({ active }: { active: boolean }) {
  const color = active ? "#598dff" : "currentColor";
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

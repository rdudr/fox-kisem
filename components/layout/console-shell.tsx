"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";
import { Building2, FileSpreadsheet, LayoutDashboard, MapPinned } from "lucide-react";
import { useEffect, useState } from "react";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/company", label: "Company", icon: Building2 },
  { href: "/zones", label: "Plant Main Input", icon: MapPinned },
  { href: "/areas", label: "MCC/PCC", icon: MapPinned },
  { href: "/machines", label: "Motor Load", icon: FileSpreadsheet },
];

export function ConsoleShell({
  user,
  children,
}: {
  user: { id?: string; displayName?: string; username?: string; email?: string; name?: string | null; role?: string } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/dashboard";
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(15,23,42,1),_#020617)] text-slate-100">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 flex-col gap-6 lg:flex">
          <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4 backdrop-blur-md flex flex-col items-center text-center">
            <img src="/iitgnlogo.png" alt="IITGN Logo" className="h-16 mb-3" />
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">Fox Kisem</div>
            <p className="mt-2 text-xs text-slate-400">by Kisem IITGN</p>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm transition-colors",
                    active
                      ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-50"
                      : "text-slate-300 hover:border-white/10 hover:bg-white/5",
                  )}
                >
                  <Icon className="size-4 opacity-80" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Signed in</p>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isOnline ? "bg-green-400" : "bg-amber-400"
                )} />
                <span className={cn("text-[10px] font-medium", isOnline ? "text-green-300" : "text-amber-300")}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-50">{user?.displayName ?? user?.name ?? user?.email ?? "User"}</p>
              <p className="text-xs text-slate-500">
                {user?.username ?? user?.email ?? user?.id} · <span className={cn(user?.role === "Offline" || !isOnline ? "text-amber-300" : "text-cyan-300/90")}>{user?.role || (isOnline ? "Server" : "Offline")}</span>
              </p>
              {!isOnline && (
                <p className="text-xs text-amber-300/80 mt-1">⚠ Working offline - changes will sync when online</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="lg:hidden">
                <select
                  className="h-9 rounded-md border border-white/10 bg-slate-950/60 px-2 text-xs text-slate-100"
                  value={pathname}
                  onChange={(e) => {
                    window.location.href = e.target.value;
                  }}
                >
                  {nav.map((n) => (
                    <option key={n.href} value={n.href}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
              <LogoutButton />
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

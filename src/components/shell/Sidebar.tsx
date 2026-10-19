"use client";

import { BarChart3, CheckSquare, KanbanSquare, LayoutDashboard, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui";
import { reference } from "@/lib/store";
import { cn } from "@/lib/utils";

export const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill="var(--primary)" />
        <path d="M8 20 14 7l6 13h-3.2l-1-2.4h-3.6l-1 2.4H8Zm5.1-5h1.8L14 12.6 13.1 15Z" fill="#fff" />
      </svg>
      Apex Finance
    </span>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-text transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Sidebar"
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/dashboard" className="text-white">
            <Logo />
          </Link>
          <button type="button" className="btn btn-ghost btn-icon btn-sm text-sidebar-text lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-2" aria-label="Primary">
          <ul className="space-y-0.5">
            {navigation.map((item) => {
              const current = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link href={item.href} className="nav-item" aria-current={current ? "page" : undefined} onClick={onClose}>
                    <item.icon size={18} className={current ? "text-white" : "text-sidebar-muted"} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={reference.currentUser.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{reference.currentUser.name}</p>
              <p className="truncate text-xs text-sidebar-muted">{reference.currentUser.title}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

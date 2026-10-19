"use client";

import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Kbd, Popover, priorityBadge } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { fmtTime, relativeDay } from "@/lib/format";
import { reference, useStore } from "@/lib/store";
import { applyTheme, useTheme } from "@/lib/theme";
import { dayDiff } from "@/lib/today";
import { navigation } from "./Sidebar";

function ThemeToggle() {
  const theme = useTheme();
  const toggle = () => applyTheme(theme === "dark" ? "light" : "dark");
  return (
    <button type="button" className="btn btn-ghost btn-icon" onClick={toggle} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const pathname = usePathname();
  const toast = useToast();
  const tasks = useStore((s) => s.tasks);
  const clients = useStore((s) => s.clients);
  const section = navigation.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
  const due = tasks
    .filter((t) => !t.done && dayDiff(new Date(t.dueAt)) <= 1)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 6);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur md:px-6">
      <button type="button" className="btn btn-ghost btn-icon lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu size={18} />
      </button>
      <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-muted sm:flex">
        <Link href="/dashboard" className="hover:text-text">
          Apex Finance
        </Link>
        {section && (
          <>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-text">{section.label}</span>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onSearch}
          className="btn btn-secondary hidden h-9 w-64 justify-between pl-3 pr-2 font-normal text-muted sm:flex"
        >
          <span className="flex items-center gap-2">
            <Search size={16} />
            Search clients, deals…
          </span>
          <Kbd>⌘K</Kbd>
        </button>
        <button type="button" onClick={onSearch} className="btn btn-ghost btn-icon sm:hidden" aria-label="Search">
          <Search size={18} />
        </button>

        <Popover
          width="w-80"
          trigger={({ toggle, open }) => (
            <button type="button" className="btn btn-ghost btn-icon relative" onClick={toggle} aria-expanded={open} aria-label={`Notifications, ${due.length} tasks due`}>
              <Bell size={18} />
              {due.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />}
            </button>
          )}
        >
          <div className="px-2.5 py-2">
            <p className="font-medium">Due soon</p>
            <p className="text-xs text-muted">{due.length} open tasks due by tomorrow</p>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {due.map((t) => (
              <li key={t.id}>
                <Link href="/tasks" className="menu-item items-start">
                  <span className={priorityBadge[t.priority]}>{t.priority}</span>
                  <span className="min-w-0">
                    <span className="block truncate">{t.title}</span>
                    <span className="block text-xs text-muted">
                      {relativeDay(t.dueAt)}, {fmtTime(t.dueAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {due.length === 0 && <li className="px-2.5 py-3 text-muted">Nothing due. Nice.</li>}
          </ul>
        </Popover>

        <ThemeToggle />

        <Popover
          width="w-56"
          trigger={({ toggle, open }) => (
            <button type="button" className="ml-1 rounded-full" onClick={toggle} aria-expanded={open}>
              <Avatar name={reference.currentUser.name} size="sm" />
              <span className="sr-only">Account menu</span>
            </button>
          )}
        >
          {(close) => (
            <>
              <div className="px-2.5 py-2">
                <p className="font-medium">{reference.currentUser.name}</p>
                <p className="truncate text-xs text-muted">{reference.currentUser.email}</p>
              </div>
              <Link href="/settings" className="menu-item" onClick={close}>
                Settings
              </Link>
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  close();
                  toast({ title: "Signed out", description: `${clients.length} clients are safe with us. This is a demo, so you are still in.` });
                }}
              >
                Sign out
              </button>
            </>
          )}
        </Popover>
      </div>
    </header>
  );
}

"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import { CommandPalette } from "./CommandPalette";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-7 w-48" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
      <div className="skeleton h-80" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Persisted state is read after mount so server and first client render match.
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ToastProvider>
      {/* Sidebar, top bar and pages read the URL, which must sit inside Suspense for prerendering. */}
      <div className="flex min-h-dvh">
        <Suspense fallback={<div className="hidden w-64 bg-sidebar lg:block" />}>
          <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense fallback={<div className="h-16 border-b border-border" />}>
            <Topbar onMenu={() => setMenuOpen(true)} onSearch={() => setSearchOpen(true)} />
          </Suspense>
          <main id="main" className="flex-1 px-4 py-6 md:px-6 lg:px-8">
            <Suspense fallback={<Skeleton />}>{hydrated ? children : <Skeleton />}</Suspense>
          </main>
        </div>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </ToastProvider>
  );
}

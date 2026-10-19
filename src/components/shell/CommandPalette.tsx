"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Kbd } from "@/components/ui";
import { fmtCompact } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { navigation } from "./Sidebar";

interface Item {
  id: string;
  group: "Pages" | "Clients" | "Deals";
  label: string;
  hint?: string;
  href: string;
  avatar?: string;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const clients = useStore((s) => s.clients);
  const deals = useStore((s) => s.deals);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    if (!open && el.open) el.close();
  }, [open]);

  // Reset when the palette closes so the next open starts clean.
  function close() {
    setQuery("");
    setActive(0);
    onClose();
  }

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const pages: Item[] = navigation.map((n) => ({ id: n.href, group: "Pages", label: n.label, href: n.href }));
    const clientItems: Item[] = clients.map((c) => ({
      id: c.id,
      group: "Clients",
      label: c.company ? `${c.company} · ${c.name}` : c.name,
      hint: `${c.segment} · ${fmtCompact(c.aum)}`,
      href: `/clients/${c.id}`,
      avatar: c.company ?? c.name,
    }));
    const dealItems: Item[] = deals
      .filter((d) => d.stage !== "Won" && d.stage !== "Lost")
      .map((d) => ({ id: d.id, group: "Deals", label: d.title, hint: `${d.stage} · ${fmtCompact(d.value)}`, href: `/pipeline?deal=${d.id}` }));
    const all = [...pages, ...clientItems, ...dealItems];
    if (!q) return [...pages, ...clientItems.slice(0, 5)];
    return all.filter((i) => `${i.label} ${i.hint ?? ""}`.toLowerCase().includes(q)).slice(0, 12);
  }, [query, clients, deals]);

  function go(item: Item) {
    close();
    router.push(item.href);
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog mt-[10vh] max-w-xl"
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      aria-label="Search"
    >
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search size={18} className="text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(items.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" && items[active]) {
              go(items[active]);
            }
          }}
          placeholder="Search clients, deals, pages…"
          className="h-12 flex-1 bg-transparent outline-none placeholder:text-faint"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          aria-activedescendant={items[active] ? `palette-${items[active].id}` : undefined}
        />
        <Kbd>Esc</Kbd>
      </div>
      <ul id="palette-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
        {items.length === 0 && <li className="px-3 py-6 text-center text-muted">No matches for “{query}”.</li>}
        {items.map((item, i) => {
          const showGroup = i === 0 || items[i - 1]!.group !== item.group;
          return (
            <li key={item.id} role="presentation">
              {showGroup && <p className="px-3 pb-1 pt-2 text-[0.6875rem] font-medium uppercase tracking-wide text-faint">{item.group}</p>}
              <button
                id={`palette-${item.id}`}
                role="option"
                aria-selected={i === active}
                type="button"
                className={cn("menu-item justify-between", i === active && "bg-surface-2")}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item)}
              >
                <span className="flex min-w-0 items-center gap-3">
                  {item.avatar && <Avatar name={item.avatar} size="sm" />}
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  {item.hint}
                  {i === active && <ArrowRight size={14} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </dialog>
  );
}

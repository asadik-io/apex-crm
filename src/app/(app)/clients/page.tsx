"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Download, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ClientForm } from "@/components/clients/ClientForm";
import { Avatar, EmptyState, PageHeader, statusBadge } from "@/components/ui";
import { fmtCurrency, fmtDate, relativeDay } from "@/lib/format";
import { advisorById, reference, useStore } from "@/lib/store";
import type { Client } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "name" | "segment" | "status" | "aum" | "lastContact" | "advisor";
type Sort = { key: SortKey; dir: 1 | -1 };
const PAGE = 10;

function SortHeader({
  k,
  sort,
  onToggle,
  children,
  className,
}: {
  k: SortKey;
  sort: Sort;
  onToggle: (k: SortKey) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const active = sort.key === k;
  return (
    <th className={className} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onToggle(k)} className="inline-flex items-center gap-1 hover:text-text">
        {children}
        {active ? sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUpDown size={12} className="text-faint" />}
      </button>
    </th>
  );
}

function csv(rows: Client[]) {
  const head = ["Name", "Company", "Email", "Segment", "Status", "AUM", "Advisor", "Last contact"];
  const lines = rows.map((c) =>
    [c.name, c.company ?? "", c.email, c.segment, c.status, c.aum, advisorById[c.advisorId]?.name ?? "", fmtDate(c.lastContact)]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [head.join(","), ...lines].join("\n");
}

export default function ClientsPage() {
  const router = useRouter();
  const clients = useStore((s) => s.clients);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [segment, setSegment] = useState("All");
  const [advisor, setAdvisor] = useState("All");
  const [sort, setSort] = useState<Sort>({ key: "aum", dir: -1 });
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = clients.filter(
      (c) =>
        (status === "All" || c.status === status) &&
        (segment === "All" || c.segment === segment) &&
        (advisor === "All" || c.advisorId === advisor) &&
        (!q || `${c.name} ${c.company ?? ""} ${c.email} ${c.location}`.toLowerCase().includes(q)),
    );
    const value = (c: Client) =>
      sort.key === "advisor" ? advisorById[c.advisorId]?.name ?? "" : sort.key === "name" ? c.company ?? c.name : c[sort.key];
    return rows.sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * sort.dir;
    });
  }, [clients, query, status, segment, advisor, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE, current * PAGE);
  const filtering = query || status !== "All" || segment !== "All" || advisor !== "All";

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "aum" || key === "lastContact" ? -1 : 1 }));
  }
  function exportCsv() {
    const blob = new Blob([csv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "clients.csv" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${clients.length} clients across ${reference.advisors.length} advisors`}
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={exportCsv}>
              <Download size={16} />
              Export CSV
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
              <Plus size={16} />
              Add client
            </button>
          </>
        }
      />

      <div className="card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-56 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-9"
              placeholder="Search by name, company, email or city"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              aria-label="Search clients"
            />
          </div>
          <select className="select w-auto" value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} aria-label="Filter by status">
            {["All", "Active", "Prospect", "At risk", "Churned"].map((s) => (
              <option key={s}>{s === "All" ? "All statuses" : s}</option>
            ))}
          </select>
          <select className="select w-auto" value={segment} onChange={(e) => (setSegment(e.target.value), setPage(1))} aria-label="Filter by segment">
            {["All", "Private", "Premier", "Core"].map((s) => (
              <option key={s}>{s === "All" ? "All segments" : s}</option>
            ))}
          </select>
          <select className="select w-auto" value={advisor} onChange={(e) => (setAdvisor(e.target.value), setPage(1))} aria-label="Filter by advisor">
            <option value="All">All advisors</option>
            {reference.advisors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {filtering && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setQuery("");
                setStatus("All");
                setSegment("All");
                setAdvisor("All");
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<Users size={28} />} title="No clients match" description="Try a different search or clear the filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <SortHeader k="name" sort={sort} onToggle={toggleSort}>
                    Client
                  </SortHeader>
                  <SortHeader k="segment" sort={sort} onToggle={toggleSort}>
                    Segment
                  </SortHeader>
                  <SortHeader k="status" sort={sort} onToggle={toggleSort}>
                    Status
                  </SortHeader>
                  <SortHeader k="aum" sort={sort} onToggle={toggleSort} className="text-right">
                    AUM
                  </SortHeader>
                  <SortHeader k="advisor" sort={sort} onToggle={toggleSort}>
                    Advisor
                  </SortHeader>
                  <SortHeader k="lastContact" sort={sort} onToggle={toggleSort}>
                    Last contact
                  </SortHeader>
                  <th>Next review</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id} className="is-link" onClick={() => router.push(`/clients/${c.id}`)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={c.company ?? c.name} size="sm" />
                        <div className="min-w-0">
                          <Link href={`/clients/${c.id}`} className="block truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                            {c.company ?? c.name}
                          </Link>
                          <span className="block truncate text-xs text-muted">{c.company ? c.name : c.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{c.segment}</td>
                    <td>
                      <span className={statusBadge[c.status]}>
                        <i />
                        {c.status}
                      </span>
                    </td>
                    <td className="num text-right font-medium">{fmtCurrency(c.aum)}</td>
                    <td>
                      <span className="flex items-center gap-2">
                        <Avatar name={advisorById[c.advisorId]?.name ?? ""} size="sm" />
                        {advisorById[c.advisorId]?.name}
                      </span>
                    </td>
                    <td className={cn("whitespace-nowrap", c.status === "At risk" && "text-warning")}>{relativeDay(c.lastContact)}</td>
                    <td className="whitespace-nowrap text-muted">{fmtDate(c.nextReview, "short")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted">
          <span className="num">
            Showing {filtered.length === 0 ? 0 : (current - 1) * PAGE + 1}–{Math.min(current * PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-secondary btn-sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
              Previous
            </button>
            <span className="num px-2">
              {current} / {pages}
            </span>
            <button type="button" className="btn btn-secondary btn-sm" disabled={current === pages} onClick={() => setPage(current + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>

      {adding && <ClientForm open={adding} onClose={() => setAdding(false)} onSaved={(c) => router.push(`/clients/${c.id}`)} />}
    </>
  );
}

"use client";

import { ArrowLeft, Briefcase, FileText, Mail, MapPin, Pencil, Phone, Plus, StickyNote } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Donut, Legend, chartColors } from "@/components/charts";
import { ClientForm } from "@/components/clients/ClientForm";
import { Avatar, EmptyState, Tabs, stageTone, statusBadge } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { fmtCompact, fmtCurrency, fmtDate, fmtPercent, relativeDay, signed } from "@/lib/format";
import { advisorById, reference, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Tab = "overview" | "accounts" | "deals" | "activity" | "notes" | "documents";

export default function ClientPage() {
  const { id } = useParams<{ id: string }>();
  // Select raw arrays; derived lists are memoised so selectors stay referentially stable.
  const allClients = useStore((s) => s.clients);
  const allDeals = useStore((s) => s.deals);
  const allActivities = useStore((s) => s.activities);
  const allNotes = useStore((s) => s.notes);
  const addNote = useStore((s) => s.addNote);
  const client = useMemo(() => allClients.find((c) => c.id === id), [allClients, id]);
  const deals = useMemo(() => allDeals.filter((d) => d.clientId === id), [allDeals, id]);
  const activities = useMemo(() => allActivities.filter((a) => a.clientId === id), [allActivities, id]);
  const notes = useMemo(() => allNotes.filter((n) => n.clientId === id), [allNotes, id]);
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const accounts = useMemo(() => reference.accounts.filter((a) => a.clientId === id), [id]);
  const documents = useMemo(() => reference.documents.filter((d) => d.clientId === id), [id]);
  const allocation = useMemo(() => {
    const byType = new Map<string, number>();
    accounts.forEach((a) => byType.set(a.type, (byType.get(a.type) ?? 0) + Math.max(0, a.balance)));
    return [...byType.entries()].map(([name, value], i) => ({ name, value, color: chartColors[i % chartColors.length]! }));
  }, [accounts]);

  if (!client) {
    return (
      <EmptyState
        title="Client not found"
        description="It may have been removed, or the link is wrong."
        action={
          <Link href="/clients" className="btn btn-secondary">
            Back to clients
          </Link>
        }
      />
    );
  }

  const advisor = advisorById[client.advisorId];
  const openDeals = deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost");
  const ytd = accounts.length ? accounts.reduce((s, a) => s + a.ytd * a.balance, 0) / Math.max(1, accounts.reduce((s, a) => s + a.balance, 0)) : 0;

  function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    addNote(client!.id, draft.trim());
    setDraft("");
    toast({ title: "Note added", variant: "success" });
  }

  return (
    <>
      <Link href="/clients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft size={16} />
        All clients
      </Link>

      <div className="card mb-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar name={client.company ?? client.name} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{client.company ?? client.name}</h1>
                <span className={statusBadge[client.status]}>
                  <i />
                  {client.status}
                </span>
                <span className="badge badge-primary">{client.segment}</span>
                <span className="badge">{client.risk}</span>
              </div>
              <p className="mt-1 text-muted">
                {client.company ? `${client.name} · ` : ""}
                {client.type} client since {fmtDate(client.since, "medium")}
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-2">
                <li className="flex items-center gap-1.5">
                  <Mail size={14} className="text-faint" />
                  <a href={`mailto:${client.email}`} className="hover:underline">
                    {client.email}
                  </a>
                </li>
                <li className="flex items-center gap-1.5">
                  <Phone size={14} className="text-faint" />
                  {client.phone}
                </li>
                <li className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-faint" />
                  {client.location}
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/pipeline" className="btn btn-secondary">
              <Briefcase size={16} />
              New deal
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
              <Pencil size={16} />
              Edit
            </button>
          </div>
        </div>
        <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Assets under management", fmtCurrency(client.aum)],
            ["YTD performance", signed(ytd)],
            ["Open pipeline", openDeals.length ? fmtCompact(openDeals.reduce((s, d) => s + d.value, 0)) : "—"],
            ["Advisor", advisor?.name ?? "—"],
            ["Next review", fmtDate(client.nextReview)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className={cn("num mt-0.5 font-semibold", label === "YTD performance" && (ytd >= 0 ? "text-success" : "text-danger"))}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "accounts", label: "Accounts", count: accounts.length },
          { id: "deals", label: "Deals", count: deals.length },
          { id: "activity", label: "Activity", count: activities.length },
          { id: "notes", label: "Notes", count: notes.length },
          { id: "documents", label: "Documents", count: documents.length },
        ]}
      />

      <div className="mt-4">
        {tab === "overview" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <section className="card p-5">
              <h2 className="font-semibold">Allocation</h2>
              <p className="mb-2 text-xs text-muted">By account type</p>
              {allocation.length ? (
                <>
                  <Donut data={allocation} total={fmtCompact(client.aum)} label="total" />
                  <Legend items={allocation} format={fmtCurrency} />
                </>
              ) : (
                <p className="py-10 text-center text-muted">No accounts yet.</p>
              )}
            </section>
            <section className="card lg:col-span-2">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-semibold">Recent activity</h2>
              </div>
              <ul className="divide-y divide-border">
                {activities.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                    <Avatar name={advisorById[a.actorId]?.name ?? "A"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{a.title}</p>
                      {a.detail && <p className="text-xs text-muted">{a.detail}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-faint">{relativeDay(a.at)}</span>
                  </li>
                ))}
              </ul>
              {client.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
                  <span className="text-xs text-muted">Tags</span>
                  {client.tags.map((t) => (
                    <span key={t} className="badge">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === "accounts" && (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Number</th>
                  <th>Opened</th>
                  <th className="text-right">YTD</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium">{a.name}</td>
                    <td>{a.type}</td>
                    <td className="num text-muted">{a.number}</td>
                    <td className="text-muted">{fmtDate(a.openedAt)}</td>
                    <td className={cn("num text-right", a.ytd >= 0 ? "text-success" : "text-danger")}>{signed(a.ytd, fmtPercent)}</td>
                    <td className="num text-right font-medium">{fmtCurrency(a.balance)}</td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted">
                      No accounts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "deals" && (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Deal</th>
                  <th>Stage</th>
                  <th>Owner</th>
                  <th>Close date</th>
                  <th className="text-right">Probability</th>
                  <th className="text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link href={`/pipeline?deal=${d.id}`} className="font-medium hover:underline">
                        {d.title}
                      </Link>
                    </td>
                    <td>
                      <span className="badge">
                        <i className={stageTone[d.stage]} />
                        {d.stage}
                      </span>
                    </td>
                    <td>{advisorById[d.ownerId]?.name}</td>
                    <td className="text-muted">{fmtDate(d.closeDate)}</td>
                    <td className="num text-right">{d.probability}%</td>
                    <td className="num text-right font-medium">{fmtCurrency(d.value)}</td>
                  </tr>
                ))}
                {deals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted">
                      No deals yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "activity" && (
          <ol className="card divide-y divide-border">
            {activities.map((a) => (
              <li key={a.id} className="flex items-start gap-4 px-5 py-4">
                <div className="w-24 shrink-0 text-xs text-muted">
                  <p>{fmtDate(a.at, "short")}</p>
                  <p>{relativeDay(a.at)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.title}</p>
                  {a.detail && <p className="text-muted">{a.detail}</p>}
                  <p className="mt-1 text-xs text-faint">by {advisorById[a.actorId]?.name}</p>
                </div>
                <span className="badge capitalize">{a.kind}</span>
              </li>
            ))}
          </ol>
        )}

        {tab === "notes" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <form onSubmit={submitNote} className="card p-5 lg:col-span-1">
              <label htmlFor="note" className="label">
                New note
              </label>
              <textarea id="note" className="textarea" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="What did you learn on the last call?" />
              <button type="submit" className="btn btn-primary mt-3" disabled={!draft.trim()}>
                <Plus size={16} />
                Add note
              </button>
            </form>
            <ul className="space-y-3 lg:col-span-2">
              {notes.map((n) => (
                <li key={n.id} className="card p-4">
                  <p>{n.body}</p>
                  <p className="mt-2 text-xs text-muted">
                    {advisorById[n.authorId]?.name} · {fmtDate(n.at)}
                  </p>
                </li>
              ))}
              {notes.length === 0 && <EmptyState icon={<StickyNote size={28} />} title="No notes yet" description="Notes are private to your team." />}
            </ul>
          </div>
        )}

        {tab === "documents" && (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Kind</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="flex items-center gap-2 font-medium">
                        <FileText size={16} className="text-faint" />
                        {d.name}
                      </span>
                    </td>
                    <td>{d.kind}</td>
                    <td className="num text-muted">{d.size}</td>
                    <td className="text-muted">{fmtDate(d.uploadedAt)}</td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-muted">
                      No documents yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <ClientForm open={editing} onClose={() => setEditing(false)} client={client} />}
    </>
  );
}

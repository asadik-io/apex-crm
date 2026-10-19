"use client";

import { ArrowUpRight, Briefcase, CheckSquare, Plus, UserPlus, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AreaTrend, Bars } from "@/components/charts";
import { ClientForm } from "@/components/clients/ClientForm";
import { Avatar, PageHeader, Stat, priorityBadge, statusBadge } from "@/components/ui";
import { fmtCompact, fmtCurrency, fmtDate, fmtTime, relativeDay } from "@/lib/format";
import { advisorById, reference, useStore } from "@/lib/store";
import { TODAY, dayDiff } from "@/lib/today";
import { STAGES } from "@/lib/types";

export default function DashboardPage() {
  const clients = useStore((s) => s.clients);
  const deals = useStore((s) => s.deals);
  const tasks = useStore((s) => s.tasks);
  const activities = useStore((s) => s.activities);
  const toggleTask = useStore((s) => s.toggleTask);
  const [adding, setAdding] = useState(false);

  const stats = useMemo(() => {
    const aum = clients.filter((c) => c.status !== "Churned").reduce((s, c) => s + c.aum, 0);
    const monthly = reference.monthly;
    const aumDelta = monthly[11]!.aum / monthly[10]!.aum - 1;
    const open = deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost");
    const pipeline = open.reduce((s, d) => s + d.value, 0);
    const weighted = open.reduce((s, d) => s + (d.value * d.probability) / 100, 0);
    const dueToday = tasks.filter((t) => !t.done && dayDiff(new Date(t.dueAt)) <= 0).length;
    return { aum, aumDelta, pipeline, weighted, openCount: open.length, newClients: monthly[11]!.newClients, newDelta: monthly[11]!.newClients / monthly[10]!.newClients - 1, dueToday };
  }, [clients, deals, tasks]);

  const byStage = useMemo(
    () =>
      STAGES.filter((s) => s !== "Lost").map((stage) => ({
        stage,
        value: deals.filter((d) => d.stage === stage).reduce((s, d) => s + d.value, 0),
        count: deals.filter((d) => d.stage === stage).length,
      })),
    [deals],
  );

  const upcoming = useMemo(
    () => tasks.filter((t) => !t.done && dayDiff(new Date(t.dueAt)) >= -7).sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 6),
    [tasks],
  );
  const topClients = useMemo(() => [...clients].filter((c) => c.status === "Active").sort((a, b) => b.aum - a.aum).slice(0, 6), [clients]);
  const recent = activities.slice(0, 7);
  const clientName = (id?: string) => clients.find((c) => c.id === id)?.company ?? clients.find((c) => c.id === id)?.name ?? "";

  return (
    <>
      <PageHeader
        title={`Good morning, ${reference.currentUser.name.split(" ")[0]}`}
        description={fmtDate(TODAY, "long")}
        actions={
          <>
            <Link href="/pipeline" className="btn btn-secondary">
              <Briefcase size={16} />
              New deal
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
              <Plus size={16} />
              Add client
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Assets under management" value={fmtCompact(stats.aum)} delta={stats.aumDelta} icon={<Wallet size={18} />} />
        <Stat label="Open pipeline" value={fmtCompact(stats.pipeline)} deltaLabel={`${stats.openCount} deals, ${fmtCompact(stats.weighted)} weighted`} icon={<Briefcase size={18} />} />
        <Stat label="New clients this month" value={String(stats.newClients)} delta={stats.newDelta} icon={<UserPlus size={18} />} />
        <Stat label="Tasks due today" value={String(stats.dueToday)} icon={<CheckSquare size={18} />} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2" aria-labelledby="aum-heading">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 id="aum-heading" className="font-semibold">
                Assets under management
              </h2>
              <p className="text-xs text-muted">Firm total, last 12 months</p>
            </div>
            <span className="badge badge-success num">+{(stats.aumDelta * 100).toFixed(1)}% this month</span>
          </div>
          <AreaTrend data={reference.monthly} dataKey="aum" name="AUM" />
        </section>

        <section className="card p-5" aria-labelledby="stage-heading">
          <div className="mb-4">
            <h2 id="stage-heading" className="font-semibold">
              Pipeline by stage
            </h2>
            <p className="text-xs text-muted">Deal value in each stage</p>
          </div>
          <Bars data={byStage} xKey="stage" bars={[{ key: "value", name: "Value", color: "var(--chart-1)" }]} height={232} />
          <ul className="mt-3 grid grid-cols-5 gap-1 text-center text-xs text-muted">
            {byStage.map((s) => (
              <li key={s.stage}>
                <span className="num block font-medium text-text">{s.count}</span>
                {s.stage}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="card" aria-labelledby="tasks-heading">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 id="tasks-heading" className="font-semibold">
              Upcoming tasks
            </h2>
            <Link href="/tasks" className="flex items-center gap-1 text-xs font-medium text-primary">
              All tasks <ArrowUpRight size={14} />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {upcoming.map((t) => (
              <li key={t.id} className="flex items-start gap-3 px-5 py-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={t.done} onChange={() => toggleTask(t.id)} aria-label={`Mark "${t.title}" done`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{t.title}</p>
                  <p className="text-xs text-muted">
                    {relativeDay(t.dueAt)}, {fmtTime(t.dueAt)}
                  </p>
                </div>
                <span className={priorityBadge[t.priority]}>{t.priority}</span>
              </li>
            ))}
            {upcoming.length === 0 && <li className="px-5 py-8 text-center text-muted">All caught up.</li>}
          </ul>
        </section>

        <section className="card" aria-labelledby="activity-heading">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 id="activity-heading" className="font-semibold">
              Recent activity
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                <Avatar name={advisorById[a.actorId]?.name ?? "A"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{a.title}</span>
                    <span className="text-muted"> · </span>
                    <Link href={`/clients/${a.clientId}`} className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
                      {clientName(a.clientId)}
                    </Link>
                  </p>
                  {a.detail && <p className="truncate text-xs text-muted">{a.detail}</p>}
                </div>
                <span className="shrink-0 text-xs text-faint">{relativeDay(a.at)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="top-heading">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 id="top-heading" className="font-semibold">
              Top clients
            </h2>
            <Link href="/clients" className="flex items-center gap-1 text-xs font-medium text-primary">
              All clients <ArrowUpRight size={14} />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {topClients.map((c) => (
              <li key={c.id}>
                <Link href={`/clients/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2">
                  <Avatar name={c.company ?? c.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.company ?? c.name}</p>
                    <p className="text-xs text-muted">{c.segment}</p>
                  </div>
                  <span className={statusBadge[c.status]}>{c.status}</span>
                  <span className="num w-20 text-right text-sm font-medium">{fmtCurrency(c.aum)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {adding && <ClientForm open={adding} onClose={() => setAdding(false)} />}
    </>
  );
}

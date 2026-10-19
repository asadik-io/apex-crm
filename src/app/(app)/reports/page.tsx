"use client";

import { Download } from "lucide-react";
import { useMemo } from "react";
import { Bars, Donut, Legend, chartColors } from "@/components/charts";
import { Avatar, PageHeader } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { fmtCompact, fmtCurrency, fmtNumber } from "@/lib/format";
import { reference, useStore } from "@/lib/store";

export default function ReportsPage() {
  const clients = useStore((s) => s.clients);
  const deals = useStore((s) => s.deals);
  const toast = useToast();

  const bySegment = useMemo(
    () =>
      (["Private", "Premier", "Core"] as const).map((seg, i) => ({
        name: seg,
        value: clients.filter((c) => c.segment === seg && c.status !== "Churned").reduce((s, c) => s + c.aum, 0),
        color: chartColors[i]!,
      })),
    [clients],
  );
  const byProduct = useMemo(() => {
    const map = new Map<string, number>();
    deals.filter((d) => d.stage !== "Lost").forEach((d) => map.set(d.product, (map.get(d.product) ?? 0) + d.value));
    return [...map.entries()].map(([product, value]) => ({ product, value })).sort((a, b) => b.value - a.value);
  }, [deals]);
  const leaderboard = useMemo(
    () =>
      reference.advisors
        .map((a) => {
          const own = clients.filter((c) => c.advisorId === a.id && c.status !== "Churned");
          const openDeals = deals.filter((d) => d.ownerId === a.id && d.stage !== "Won" && d.stage !== "Lost");
          return {
            advisor: a,
            clients: own.length,
            aum: own.reduce((s, c) => s + c.aum, 0),
            open: openDeals.reduce((s, d) => s + d.value, 0),
            won: deals.filter((d) => d.ownerId === a.id && d.stage === "Won").reduce((s, d) => s + d.value, 0),
          };
        })
        .sort((a, b) => b.aum - a.aum),
    [clients, deals],
  );
  const totalAum = bySegment.reduce((s, x) => s + x.value, 0);

  function exportCsv() {
    const rows = [["Advisor", "Clients", "AUM", "Open pipeline", "Won"], ...leaderboard.map((r) => [r.advisor.name, r.clients, r.aum, r.open, r.won])];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: "advisor-leaderboard.csv" }).click();
    URL.revokeObjectURL(url);
    toast({ title: "Export ready", description: "advisor-leaderboard.csv", variant: "success" });
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Last 12 months, all advisors"
        actions={
          <button type="button" className="btn btn-secondary" onClick={exportCsv}>
            <Download size={16} />
            Export leaderboard
          </button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2" aria-labelledby="rev-heading">
          <h2 id="rev-heading" className="font-semibold">
            Revenue
          </h2>
          <p className="mb-4 text-xs text-muted">Advisory fees and lending income by month</p>
          <Bars data={reference.monthly} xKey="month" bars={[{ key: "revenue", name: "Revenue", color: "var(--chart-1)" }]} />
        </section>
        <section className="card p-5" aria-labelledby="seg-heading">
          <h2 id="seg-heading" className="font-semibold">
            AUM by segment
          </h2>
          <p className="mb-2 text-xs text-muted">Active and prospective clients</p>
          <Donut data={bySegment} total={fmtCompact(totalAum)} label="total AUM" />
          <Legend items={bySegment} format={fmtCompact} />
        </section>
        <section className="card p-5" aria-labelledby="new-heading">
          <h2 id="new-heading" className="font-semibold">
            New clients
          </h2>
          <p className="mb-4 text-xs text-muted">Onboarded per month</p>
          <Bars data={reference.monthly} xKey="month" bars={[{ key: "newClients", name: "New clients", color: "var(--chart-3)" }]} format={fmtNumber} height={220} />
        </section>
        <section className="card p-5 xl:col-span-2" aria-labelledby="prod-heading">
          <h2 id="prod-heading" className="font-semibold">
            Pipeline by product
          </h2>
          <p className="mb-4 text-xs text-muted">Open and won deal value</p>
          <Bars data={byProduct} xKey="product" layout="vertical" bars={[{ key: "value", name: "Value", color: "var(--chart-2)" }]} height={220} />
        </section>
      </div>

      <section className="card mt-4 overflow-x-auto" aria-labelledby="lead-heading">
        <h2 id="lead-heading" className="border-b border-border px-5 py-4 font-semibold">
          Advisor leaderboard
        </h2>
        <table className="table">
          <thead>
            <tr>
              <th>Advisor</th>
              <th className="text-right">Clients</th>
              <th className="text-right">AUM</th>
              <th className="text-right">Open pipeline</th>
              <th className="text-right">Won</th>
              <th>Share of AUM</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((r) => (
              <tr key={r.advisor.id}>
                <td>
                  <span className="flex items-center gap-3">
                    <Avatar name={r.advisor.name} size="sm" />
                    <span>
                      <span className="block font-medium">{r.advisor.name}</span>
                      <span className="block text-xs text-muted">{r.advisor.title}</span>
                    </span>
                  </span>
                </td>
                <td className="num text-right">{r.clients}</td>
                <td className="num text-right font-medium">{fmtCurrency(r.aum)}</td>
                <td className="num text-right">{fmtCurrency(r.open)}</td>
                <td className="num text-right text-success">{fmtCurrency(r.won)}</td>
                <td className="w-48">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${totalAum ? (r.aum / totalAum) * 100 : 0}%` }} />
                    </div>
                    <span className="num w-10 text-right text-xs text-muted">{totalAum ? Math.round((r.aum / totalAum) * 100) : 0}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

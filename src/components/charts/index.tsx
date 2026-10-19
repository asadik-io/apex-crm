"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtCompact, fmtCurrency, fmtNumber } from "@/lib/format";

type Formatter = (value: number) => string;

function Tip({
  active,
  payload,
  label,
  format = fmtCurrency,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; payload?: { color?: string } }[];
  label?: string;
  format?: Formatter;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-pop">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.payload?.color ?? p.color }} />
          <span className="text-muted">{p.name}</span>
          <span className="num ml-auto pl-4 font-medium">{format(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

const axis = { fontSize: 11, fill: "var(--muted)" } as const;

export function AreaTrend({ data, dataKey, name, height = 260, format = fmtCompact }: { data: Record<string, unknown>[]; dataKey: string; name: string; height?: number; format?: Formatter }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v: number) => format(v)} width={56} domain={["auto", "auto"]} />
        <Tooltip content={<Tip format={fmtCurrency} />} cursor={{ stroke: "var(--border-strong)" }} />
        <Area type="monotone" dataKey={dataKey} name={name} stroke="var(--chart-1)" strokeWidth={2} fill={`url(#grad-${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Bars({
  data,
  xKey,
  bars,
  height = 260,
  format = fmtCompact,
  tooltipFormat,
  layout = "horizontal",
}: {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; name: string; color: string; stack?: string }[];
  height?: number;
  format?: Formatter;
  tooltipFormat?: Formatter;
  layout?: "horizontal" | "vertical";
}) {
  const vertical = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={vertical ? 8 : 18}>
        <CartesianGrid vertical={vertical} horizontal={!vertical} stroke="var(--chart-grid)" />
        {vertical ? (
          <>
            <XAxis type="number" tick={axis} axisLine={false} tickLine={false} tickFormatter={(v: number) => format(v)} />
            <YAxis type="category" dataKey={xKey} tick={axis} axisLine={false} tickLine={false} width={96} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={axis} axisLine={false} tickLine={false} />
            <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v: number) => format(v)} width={48} />
          </>
        )}
        <Tooltip content={<Tip format={tooltipFormat ?? (format === fmtCompact ? fmtCurrency : format)} />} cursor={{ fill: "var(--surface-2)" }} />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} stackId={b.stack} radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={36} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, total, label, height = 220 }: { data: { name: string; value: number; color: string }[]; total: string; label: string; height?: number }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="92%" paddingAngle={2} stroke="none">
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<Tip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="num text-lg font-semibold">{total}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

export function Legend({ items, format = fmtNumber }: { items: { name: string; value: number; color: string }[]; format?: Formatter }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((i) => (
        <li key={i.name} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          <span className="text-text-2">{i.name}</span>
          <span className="num ml-auto font-medium">{format(i.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];

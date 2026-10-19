import { dayDiff } from "./today";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const currencyCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const number = new Intl.NumberFormat("en-US");
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });

export const fmtCurrency = (n: number) => currency.format(n);
export const fmtCompact = (n: number) => currencyCompact.format(n);
export const fmtNumber = (n: number) => number.format(n);
export const fmtPercent = (ratio: number) => percent.format(ratio);

export function fmtDate(date: Date | string, style: "short" | "medium" | "long" = "medium") {
  const d = typeof date === "string" ? new Date(date) : date;
  if (style === "short") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (style === "long") return d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** "Today", "Tomorrow", "In 3 days", "Yesterday", "4 days ago". */
export function relativeDay(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = dayDiff(d);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff < -1 && diff > -7) return `${-diff} days ago`;
  return fmtDate(d, "short");
}

export function signed(n: number, formatter: (n: number) => string = fmtPercent) {
  return `${n > 0 ? "+" : ""}${formatter(n)}`;
}

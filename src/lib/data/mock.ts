import { daysFromToday } from "@/lib/today";
import type {
  Account,
  Activity,
  Advisor,
  Client,
  ClientStatus,
  Deal,
  Document,
  Note,
  Product,
  RiskProfile,
  Segment,
  Stage,
  Task,
  TaskType,
} from "@/lib/types";

// Deterministic generator so every visitor sees the same believable book of
// business. Change the seed to get a different one.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261019);
const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!;
const between = (min: number, max: number) => min + rand() * (max - min);
const int = (min: number, max: number) => Math.floor(between(min, max + 1));
const weighted = <T,>(entries: [T, number][]) => {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1]![0];
};
const iso = (d: Date) => d.toISOString();
const round = (n: number, step: number) => Math.round(n / step) * step;

export const advisors: Advisor[] = [
  { id: "u1", name: "Maya Chen", title: "Senior Advisor", email: "maya.chen@apexfinance.com" },
  { id: "u2", name: "Daniel Okafor", title: "Advisor", email: "daniel.okafor@apexfinance.com" },
  { id: "u3", name: "Priya Natarajan", title: "Advisor", email: "priya.natarajan@apexfinance.com" },
  { id: "u4", name: "Lucas Moreau", title: "Associate", email: "lucas.moreau@apexfinance.com" },
  { id: "u5", name: "Sofia Reyes", title: "Partner", email: "sofia.reyes@apexfinance.com" },
];
export const currentUser = advisors[0]!;

const people = [
  "Eleanor Whitfield", "Marcus Bellamy", "Hannah Okoro", "Victor Alvarez", "Grace Lindqvist", "Tobias Hart",
  "Amara Osei", "Julian Reyes", "Naomi Feldman", "Oliver Brandt", "Isabel Moreno", "Theodore Ashby",
  "Leila Haddad", "Samuel Ngata", "Charlotte Vance", "Rafael Duarte", "Imogen Clarke", "Kenji Watanabe",
  "Beatrice Nolan", "Adrian Kowalski", "Farah Siddiqui", "Henry Castellano", "Zoe Marchetti", "Elias Berg",
  "Rosa Delgado", "Nathaniel Price", "Yuki Tanaka", "Clara Bergström", "Omar Haddad", "Vivian Okafor",
  "Felix Lindgren", "Amelia Rourke", "Dmitri Volkov", "Sienna Patel", "Gabriel Fontaine", "Harriet Doyle",
];
const businesses = [
  ["Northwind Logistics", "Priya Raman"], ["Harbor & Finch Architects", "Daniel Finch"], ["Bluegrass Dental Group", "Dr. Alan Pryce"],
  ["Solstice Robotics", "Mei-Lin Zhao"], ["Red Cedar Vineyards", "Thomas Keane"], ["Pinnacle Orthopaedics", "Dr. Sara Lindahl"],
  ["Meridian Freight", "Carlos Vega"], ["Oakline Property Partners", "Judith Mbeki"], ["Fathom Analytics", "Ravi Iyer"],
  ["Cobalt Brewing Co.", "Erin Walsh"], ["Lumen Pediatrics", "Dr. Noah Adeyemi"], ["Stonebridge Law", "Margaret Hale"],
];
const cities = [
  "San Francisco, CA", "Austin, TX", "Seattle, WA", "Chicago, IL", "Boston, MA", "Denver, CO", "New York, NY",
  "Portland, OR", "Miami, FL", "Minneapolis, MN", "Nashville, TN", "San Diego, CA", "Atlanta, GA", "Phoenix, AZ",
];
const tagPool = ["Retirement", "Estate", "Tax planning", "Mortgage", "Business owner", "Referral", "High growth", "Succession", "Philanthropy"];
const risks: RiskProfile[] = ["Conservative", "Balanced", "Growth", "Aggressive"];

function email(name: string, domain = "example.com") {
  return `${name.toLowerCase().replace(/^dr\.\s*/, "").replace(/[^a-z\s]/g, "").trim().replace(/\s+/g, ".")}@${domain}`;
}
function phone() {
  return `(${int(201, 989)}) ${int(200, 999)}-${String(int(0, 9999)).padStart(4, "0")}`;
}
function segmentFor(aum: number): Segment {
  return aum >= 5_000_000 ? "Private" : aum >= 1_000_000 ? "Premier" : "Core";
}

export const clients: Client[] = [];
export const accounts: Account[] = [];
let accountSeq = 1;

function addClient(name: string, type: Client["type"], company?: string) {
  const id = `c${clients.length + 1}`;
  const status = weighted<ClientStatus>([["Active", 66], ["Prospect", 14], ["At risk", 12], ["Churned", 8]]);
  const aumBase = weighted([[between(120_000, 900_000), 45], [between(1_000_000, 4_800_000), 40], [between(5_000_000, 28_000_000), 15]]);
  const aum = status === "Prospect" ? round(aumBase * 0.15, 5_000) : round(aumBase, 10_000);
  const advisor = pick(advisors);
  const sinceYear = int(2014, 2025);
  const lastContact = daysFromToday(status === "Active" ? -int(0, 21) : status === "At risk" ? -int(30, 75) : -int(5, 50), int(9, 17), pick([0, 15, 30, 45]));
  const nextReview = daysFromToday(int(3, 95), int(9, 16), pick([0, 30]));
  const tags = Array.from(new Set([pick(tagPool), rand() > 0.5 ? pick(tagPool) : null].filter(Boolean) as string[]));
  if (type === "Business" && !tags.includes("Business owner")) tags.unshift("Business owner");

  const client: Client = {
    id,
    name,
    type,
    company,
    email: email(name, type === "Business" ? company!.toLowerCase().replace(/[^a-z]/g, "") + ".com" : undefined),
    phone: phone(),
    location: pick(cities),
    segment: segmentFor(aum),
    status,
    risk: pick(risks),
    advisorId: advisor.id,
    aum,
    since: iso(new Date(sinceYear, int(0, 11), int(1, 28))),
    lastContact: iso(lastContact),
    nextReview: iso(nextReview),
    tags: tags.slice(0, 3),
  };
  clients.push(client);

  // Accounts split the AUM so figures reconcile.
  const count = status === "Prospect" ? int(0, 1) : int(1, 4);
  const weights = Array.from({ length: count }, () => between(0.5, 2));
  const total = weights.reduce((s, w) => s + w, 0);
  const typesIndividual: Account["type"][] = ["Brokerage", "Retirement", "Trust", "Savings", "Mortgage"];
  const typesBusiness: Account["type"][] = ["Brokerage", "Business loan", "Savings", "Retirement"];
  weights.forEach((w, i) => {
    const t = pick(type === "Business" ? typesBusiness : typesIndividual);
    accounts.push({
      id: `a${accountSeq++}`,
      clientId: id,
      type: t,
      name: t === "Retirement" ? "401(k) Rollover" : t === "Trust" ? "Family Trust" : t === "Brokerage" ? "Managed Portfolio" : t,
      number: `••••${int(1000, 9999)}`,
      balance: i === count - 1 ? aum - accounts.filter((a) => a.clientId === id).reduce((s, a) => s + a.balance, 0) : round((aum * w) / total, 1000),
      ytd: t === "Mortgage" || t === "Business loan" ? -between(0.01, 0.04) : between(-0.06, 0.19),
      openedAt: iso(new Date(sinceYear + int(0, 3), int(0, 11), int(1, 28))),
    });
  });
}

// Interleave individuals and businesses so lists look natural.
people.forEach((name, i) => {
  addClient(name, "Individual");
  if (i % 3 === 2 && businesses[(i - 2) / 3]) {
    const [company, contact] = businesses[(i - 2) / 3]!;
    addClient(contact!, "Business", company);
  }
});

const products: Product[] = ["Portfolio management", "Retirement plan", "Mortgage", "Business loan", "Estate planning", "Insurance"];
const probabilityByStage: Record<Stage, number> = { Lead: 15, Qualified: 35, Proposal: 55, Negotiation: 75, Won: 100, Lost: 0 };
function dealValue(product: Product) {
  switch (product) {
    case "Portfolio management": return round(between(150_000, 4_500_000), 25_000);
    case "Retirement plan": return round(between(60_000, 900_000), 10_000);
    case "Mortgage": return round(between(320_000, 1_400_000), 10_000);
    case "Business loan": return round(between(150_000, 3_200_000), 25_000);
    case "Estate planning": return round(between(12_000, 65_000), 1_000);
    case "Insurance": return round(between(6_000, 48_000), 500);
  }
}

export const deals: Deal[] = [];
const dealCandidates = clients.filter((c) => c.status !== "Churned");
for (let i = 0; i < 30; i++) {
  const client = dealCandidates[(i * 7) % dealCandidates.length]!;
  const product = client.type === "Business" ? pick<Product>(["Business loan", "Portfolio management", "Retirement plan", "Insurance"]) : pick(products);
  const stage = client.status === "Prospect"
    ? weighted<Stage>([["Lead", 50], ["Qualified", 35], ["Proposal", 15]])
    : weighted<Stage>([["Lead", 10], ["Qualified", 22], ["Proposal", 26], ["Negotiation", 20], ["Won", 14], ["Lost", 8]]);
  const created = daysFromToday(-int(5, 120), int(9, 17));
  deals.push({
    id: `d${i + 1}`,
    title: `${product} · ${client.company ?? client.name.split(" ").slice(-1)[0]}`,
    clientId: client.id,
    product,
    value: dealValue(product),
    probability: probabilityByStage[stage],
    stage,
    ownerId: client.advisorId,
    closeDate: iso(daysFromToday(stage === "Won" || stage === "Lost" ? -int(1, 40) : int(5, 95), 17)),
    createdAt: iso(created),
    notes: rand() > 0.6 ? pick([
      "Waiting on updated financial statements before the proposal review.",
      "Spouse wants to join the next call; schedule for an evening slot.",
      "Competing offer from their current bank; emphasise the fee structure.",
      "Needs a decision before the quarter closes for tax reasons.",
    ]) : undefined,
  });
}

const taskTitles: Record<TaskType, string[]> = {
  Call: ["Follow up on proposal", "Quarterly check-in call", "Discuss rebalancing options", "Confirm beneficiary changes"],
  Meeting: ["Annual portfolio review", "Estate planning session", "Mortgage pre-approval meeting", "Onboarding meeting"],
  Review: ["Review risk questionnaire", "Review loan application", "Quarterly performance review", "Compliance file review"],
  Document: ["Collect KYC documents", "Send signed advisory agreement", "Upload tax statements", "Prepare proposal deck"],
  Email: ["Send performance report", "Share market outlook note", "Introduce lending specialist", "Send meeting recap"],
};
export const tasks: Task[] = [];
for (let i = 0; i < 36; i++) {
  const type = pick(Object.keys(taskTitles) as TaskType[]);
  const client = clients[(i * 5) % clients.length]!;
  const due = daysFromToday(int(-6, 21), pick([9, 10, 11, 13, 14, 15, 16]), pick([0, 30]));
  const past = due.getTime() < daysFromToday(0).getTime();
  tasks.push({
    id: `t${i + 1}`,
    title: `${pick(taskTitles[type])} · ${client.company ?? client.name}`,
    type,
    priority: weighted([["High", 25], ["Medium", 50], ["Low", 25]]),
    clientId: client.id,
    dealId: deals.find((d) => d.clientId === client.id)?.id,
    assigneeId: client.advisorId,
    dueAt: iso(due),
    done: past ? rand() > 0.35 : rand() > 0.9,
  });
}

const activityTemplates: [Activity["kind"], string, string][] = [
  ["call", "Call with {name}", "Discussed rebalancing toward fixed income ahead of the review."],
  ["meeting", "Annual review meeting", "Walked through performance, fees and the updated financial plan."],
  ["email", "Sent performance report", "Q3 report with commentary on sector allocation."],
  ["note", "Note added", "Prefers morning calls. Daughter starting university next fall."],
  ["deal", "Deal moved to Proposal", "Portfolio management proposal shared for review."],
  ["document", "Document uploaded", "Signed advisory agreement filed."],
  ["task", "Task completed", "KYC documents collected and verified."],
];
export const activities: Activity[] = [];
clients.forEach((client, ci) => {
  const n = client.status === "Churned" ? 1 : int(2, 5);
  for (let i = 0; i < n; i++) {
    const [kind, title, detail] = pick(activityTemplates);
    activities.push({
      id: `act${ci}_${i}`,
      clientId: client.id,
      kind,
      title: title.replace("{name}", client.name.split(" ")[0]!),
      detail,
      actorId: rand() > 0.3 ? client.advisorId : pick(advisors).id,
      at: iso(daysFromToday(-int(0, 120), int(8, 18), pick([0, 15, 30, 45]))),
    });
  }
});
activities.sort((a, b) => b.at.localeCompare(a.at));

export const notes: Note[] = clients.slice(0, 26).map((client, i) => ({
  id: `n${i + 1}`,
  clientId: client.id,
  body: pick([
    "Wants to increase monthly contributions once the mortgage closes.",
    "Interested in ESG screens for the equity sleeve. Send the fact sheet.",
    "Travelling in November; avoid scheduling the review then.",
    "Considering gifting to grandchildren; coordinate with their accountant.",
    "Asked for a consolidated statement across both trusts.",
  ]),
  authorId: client.advisorId,
  at: iso(daysFromToday(-int(1, 60), int(9, 17))),
}));

export const documents: Document[] = clients.slice(0, 40).flatMap((client, i) => {
  const count = int(1, 3);
  return Array.from({ length: count }, (_, j) => ({
    id: `doc${i}_${j}`,
    clientId: client.id,
    name: pick(["Advisory agreement.pdf", "Risk questionnaire.pdf", "2025 tax statements.xlsx", "ID verification.png", "Trust deed.pdf", "Loan application.pdf"]),
    kind: pick<Document["kind"]>(["PDF", "Spreadsheet", "Image", "Contract"]),
    size: `${int(120, 4800)} KB`,
    uploadedAt: iso(daysFromToday(-int(2, 400), int(9, 17))),
  }));
});

/** Monthly firm-level series for the dashboard, ending this month. */
export const monthly = Array.from({ length: 12 }, (_, i) => {
  const d = daysFromToday(0);
  d.setMonth(d.getMonth() - (11 - i), 1);
  const growth = 1 + i * 0.021 + Math.sin(i / 2) * 0.012;
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }),
    aum: round(228_000_000 * growth, 100_000),
    revenue: round(1_480_000 * growth * between(0.96, 1.05), 1_000),
    newClients: int(2, 9),
  };
});

"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical, Plus, Search, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";
import { Avatar, Dialog, Field, PageHeader, Progress, stageTone } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { fmtCompact, fmtCurrency, fmtDate, relativeDay } from "@/lib/format";
import { advisorById, reference, useStore } from "@/lib/store";
import { daysFromToday } from "@/lib/today";
import { STAGES, type Deal, type Product, type Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

const products: Product[] = ["Portfolio management", "Retirement plan", "Mortgage", "Business loan", "Estate planning", "Insurance"];

function DealCard({ deal, clientName, onOpen, overlay = false }: { deal: Deal; clientName: string; onOpen?: () => void; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id, disabled: overlay });
  const owner = advisorById[deal.ownerId];
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("card group relative p-3 transition-shadow", isDragging && "opacity-40", overlay && "rotate-1 shadow-pop")}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="-ml-1 mt-0.5 cursor-grab rounded text-faint opacity-0 transition-opacity hover:text-muted focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
          aria-label={`Drag ${deal.title}`}
          {...listeners}
          {...attributes}
        >
          <GripVertical size={16} />
        </button>
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{deal.title}</p>
          <p className="truncate text-xs text-muted">{clientName}</p>
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="num text-sm font-semibold">{fmtCurrency(deal.value)}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Calendar size={12} />
          {fmtDate(deal.closeDate, "short")}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Progress value={deal.probability} label={`${deal.probability}% probability`} className="flex-1" tone={deal.stage === "Lost" ? "danger" : deal.stage === "Won" ? "success" : "primary"} />
        <span className="num w-8 text-right text-xs text-muted">{deal.probability}%</span>
        {owner && <Avatar name={owner.name} size="sm" className="!h-6 !w-6 text-[0.625rem]" />}
      </div>
    </div>
  );
}

function Column({ stage, deals, clientName, onOpen }: { stage: Stage; deals: Deal[]; clientName: (id: string) => string; onOpen: (d: Deal) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((s, d) => s + d.value, 0);
  return (
    <section
      ref={setNodeRef}
      aria-label={`${stage}, ${deals.length} deals`}
      className={cn("flex w-72 shrink-0 flex-col rounded-card border border-transparent bg-surface-2/60 transition-colors", isOver && "border-primary bg-primary-soft/40")}
    >
      <header className="flex items-center justify-between px-3 pb-2 pt-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className={cn("h-2 w-2 rounded-full", stageTone[stage])} />
          {stage}
          <span className="num text-xs font-normal text-muted">{deals.length}</span>
        </h2>
        <span className="num text-xs text-muted">{fmtCompact(total)}</span>
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} clientName={clientName(d.clientId)} onOpen={() => onOpen(d)} />
        ))}
        {deals.length === 0 && <p className="rounded-ctl border border-dashed border-border-strong py-6 text-center text-xs text-faint">Drop deals here</p>}
      </div>
    </section>
  );
}

function NewDeal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const clients = useStore((s) => s.clients);
  const addDeal = useStore((s) => s.addDeal);
  const toast = useToast();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [product, setProduct] = useState<Product>("Portfolio management");
  const [value, setValue] = useState("250000");
  const [stage, setStage] = useState<Stage>("Lead");
  const [closeDate, setCloseDate] = useState(daysFromToday(45).toISOString().slice(0, 10));
  const [ownerId, setOwnerId] = useState(reference.currentUser.id);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(value.replace(/[^0-9.]/g, ""));
    if (!clientId) return setError("Choose a client.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter a value above zero.");
    const client = clients.find((c) => c.id === clientId)!;
    addDeal({ title: `${product} · ${client.company ?? client.name.split(" ").slice(-1)[0]}`, clientId, product, value: amount, stage, ownerId, closeDate: new Date(closeDate).toISOString() });
    toast({ title: "Deal created", description: `${product} for ${client.company ?? client.name}`, variant: "success" });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New deal"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="deal-form" className="btn btn-primary">
            Create deal
          </button>
        </>
      }
    >
      <form id="deal-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Client" htmlFor="deal-client">
          <select id="deal-client" className="select" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company ?? c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Product" htmlFor="deal-product">
          <select id="deal-product" className="select" value={product} onChange={(e) => setProduct(e.target.value as Product)}>
            {products.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Value (USD)" htmlFor="deal-value" error={error}>
          <input id="deal-value" className="input num" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={!!error} />
        </Field>
        <Field label="Stage" htmlFor="deal-stage">
          <select id="deal-stage" className="select" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Expected close" htmlFor="deal-close">
          <input id="deal-close" type="date" className="input" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
        </Field>
        <Field label="Owner" htmlFor="deal-owner">
          <select id="deal-owner" className="select" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            {reference.advisors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Dialog>
  );
}

function Board() {
  const router = useRouter();
  const params = useSearchParams();
  const deals = useStore((s) => s.deals);
  const clients = useStore((s) => s.clients);
  const moveDeal = useStore((s) => s.moveDeal);
  const updateDeal = useStore((s) => s.updateDeal);
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState("All");
  const [active, setActive] = useState<Deal | null>(null);
  const [creating, setCreating] = useState(false);
  const openId = params.get("deal");
  const openDeal = deals.find((d) => d.id === openId) ?? null;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const clientName = useCallback(
    (id: string) => {
      const c = clients.find((x) => x.id === id);
      return c ? (c.company ?? c.name) : "Unknown client";
    },
    [clients],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deals.filter((d) => (owner === "All" || d.ownerId === owner) && (!q || `${d.title} ${clientName(d.clientId)}`.toLowerCase().includes(q)));
  }, [deals, owner, query, clientName]);

  const open = visible.filter((d) => d.stage !== "Won" && d.stage !== "Lost");
  const totals = {
    open: open.reduce((s, d) => s + d.value, 0),
    weighted: open.reduce((s, d) => s + (d.value * d.probability) / 100, 0),
    won: visible.filter((d) => d.stage === "Won").reduce((s, d) => s + d.value, 0),
  };

  function onDragStart(e: DragStartEvent) {
    setActive(deals.find((d) => d.id === e.active.id) ?? null);
  }
  function onDragEnd(e: DragEndEvent) {
    setActive(null);
    const deal = deals.find((d) => d.id === e.active.id);
    const target = e.over?.id as Stage | undefined;
    if (!deal || !target || !STAGES.includes(target) || deal.stage === target) return;
    moveDeal(deal.id, target);
    toast({ title: `Moved to ${target}`, description: deal.title, variant: "success" });
  }
  function setOpen(deal: Deal | null) {
    router.replace(deal ? `/pipeline?deal=${deal.id}` : "/pipeline", { scroll: false });
  }

  return (
    <>
      <PageHeader
        title="Pipeline"
        description={`${fmtCompact(totals.open)} open across ${open.length} deals, ${fmtCompact(totals.weighted)} weighted`}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} />
            New deal
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search deals" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search deals" />
        </div>
        <select className="select w-auto" value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Filter by owner">
          <option value="All">All owners</option>
          {reference.advisors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <span className="badge badge-success ml-auto">
          <Trophy size={12} />
          Won: {fmtCompact(totals.won)}
        </span>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
          {STAGES.map((stage) => (
            <Column key={stage} stage={stage} deals={visible.filter((d) => d.stage === stage)} clientName={clientName} onOpen={setOpen} />
          ))}
        </div>
        <DragOverlay>{active && <DealCard deal={active} clientName={clientName(active.clientId)} overlay />}</DragOverlay>
      </DndContext>

      {openDeal && (
        <Dialog open sheet onClose={() => setOpen(null)} title={openDeal.title} description={clientName(openDeal.clientId)}>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-muted">Value</dt>
              <dd className="num font-semibold">{fmtCurrency(openDeal.value)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Probability</dt>
              <dd className="num font-semibold">{openDeal.probability}%</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Expected close</dt>
              <dd className="font-semibold">
                {fmtDate(openDeal.closeDate)} <span className="text-xs font-normal text-muted">({relativeDay(openDeal.closeDate)})</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Owner</dt>
              <dd className="font-semibold">{advisorById[openDeal.ownerId]?.name}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <label htmlFor="stage-select" className="label">
              Stage
            </label>
            <select
              id="stage-select"
              className="select"
              value={openDeal.stage}
              onChange={(e) => {
                moveDeal(openDeal.id, e.target.value as Stage);
                toast({ title: `Moved to ${e.target.value}`, variant: "success" });
              }}
            >
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="mt-5">
            <label htmlFor="deal-notes" className="label">
              Notes
            </label>
            <textarea id="deal-notes" className="textarea" defaultValue={openDeal.notes ?? ""} onBlur={(e) => updateDeal(openDeal.id, { notes: e.target.value })} placeholder="Context for the next conversation" />
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <Link href={`/clients/${openDeal.clientId}`} className="btn btn-secondary">
              Open client
            </Link>
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => (moveDeal(openDeal.id, "Lost"), toast({ title: "Marked as lost" }))}>
                Lost
              </button>
              <button type="button" className="btn btn-primary" onClick={() => (moveDeal(openDeal.id, "Won"), toast({ title: "Deal won", variant: "success" }))}>
                <Trophy size={16} />
                Won
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {creating && <NewDeal open={creating} onClose={() => setCreating(false)} />}
    </>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={null}>
      <Board />
    </Suspense>
  );
}

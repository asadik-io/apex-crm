"use client";

import { CheckSquare, FileText, Mail, Phone, Plus, Trash2, Video } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, Dialog, EmptyState, Field, PageHeader, Progress, priorityBadge } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { fmtDate, fmtTime, relativeDay } from "@/lib/format";
import { advisorById, reference, useStore } from "@/lib/store";
import { dayDiff, daysFromToday } from "@/lib/today";
import type { Priority, Task, TaskType } from "@/lib/types";
import { cn } from "@/lib/utils";

const typeIcon: Record<TaskType, React.ReactNode> = {
  Call: <Phone size={14} />,
  Meeting: <Video size={14} />,
  Review: <CheckSquare size={14} />,
  Document: <FileText size={14} />,
  Email: <Mail size={14} />,
};
const types: TaskType[] = ["Call", "Meeting", "Review", "Document", "Email"];
const priorities: Priority[] = ["High", "Medium", "Low"];

function group(task: Task) {
  const diff = dayDiff(new Date(task.dueAt));
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return "This week";
  return "Later";
}
const groupOrder = ["Overdue", "Today", "Tomorrow", "This week", "Later"];

function NewTask({ open, onClose }: { open: boolean; onClose: () => void }) {
  const clients = useStore((s) => s.clients);
  const addTask = useStore((s) => s.addTask);
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("Call");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [clientId, setClientId] = useState("");
  const [due, setDue] = useState(daysFromToday(1, 10).toISOString().slice(0, 16));
  const [assigneeId, setAssigneeId] = useState(reference.currentUser.id);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Give the task a title.");
    addTask({ title: title.trim(), type, priority, clientId: clientId || undefined, assigneeId, dueAt: new Date(due).toISOString() });
    toast({ title: "Task added", description: title.trim(), variant: "success" });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New task"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="task-form" className="btn btn-primary">
            Add task
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Title" htmlFor="task-title" error={error}>
            <input id="task-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus aria-invalid={!!error} placeholder="Call about the quarterly review" />
          </Field>
        </div>
        <Field label="Type" htmlFor="task-type">
          <select id="task-type" className="select" value={type} onChange={(e) => setType(e.target.value as TaskType)}>
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority" htmlFor="task-priority">
          <select id="task-priority" className="select" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {priorities.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Client (optional)" htmlFor="task-client">
          <select id="task-client" className="select" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company ?? c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Due" htmlFor="task-due">
          <input id="task-due" type="datetime-local" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Assignee" htmlFor="task-assignee">
          <select id="task-assignee" className="select" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
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

export default function TasksPage() {
  const tasks = useStore((s) => s.tasks);
  const clients = useStore((s) => s.clients);
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const [scope, setScope] = useState<"mine" | "all">("all");
  const [type, setType] = useState("All");
  const [showDone, setShowDone] = useState(false);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () =>
      tasks
        .filter((t) => (scope === "all" || t.assigneeId === reference.currentUser.id) && (type === "All" || t.type === type) && (showDone || !t.done))
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    [tasks, scope, type, showDone],
  );
  const groups = groupOrder.map((g) => ({ name: g, items: filtered.filter((t) => !t.done && group(t) === g) })).filter((g) => g.items.length);
  const done = filtered.filter((t) => t.done);
  const weekTotal = tasks.filter((t) => dayDiff(new Date(t.dueAt)) >= -7 && dayDiff(new Date(t.dueAt)) <= 7);
  const weekDone = weekTotal.filter((t) => t.done).length;
  const clientName = (id?: string) => {
    const c = clients.find((x) => x.id === id);
    return c ? (c.company ?? c.name) : null;
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        description={`${tasks.filter((t) => !t.done).length} open, ${tasks.filter((t) => !t.done && dayDiff(new Date(t.dueAt)) < 0).length} overdue`}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} />
            New task
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Assignee" className="flex rounded-ctl border border-border-strong p-0.5">
              {(["all", "mine"] as const).map((s) => (
                <button key={s} type="button" aria-pressed={scope === s} onClick={() => setScope(s)} className={cn("rounded-[6px] px-3 py-1.5 text-sm font-medium", scope === s ? "bg-surface-3 text-text" : "text-muted hover:text-text")}>
                  {s === "all" ? "Everyone" : "Assigned to me"}
                </button>
              ))}
            </div>
            <select className="select w-auto" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
              <option>All</option>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <label className="ml-auto flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
              Show completed
            </label>
          </div>

          {groups.length === 0 && done.length === 0 && (
            <EmptyState icon={<CheckSquare size={28} />} title="Nothing here" description="Every task that matches these filters is done." />
          )}

          {groups.map((g) => (
            <section key={g.name} aria-labelledby={`g-${g.name}`} className="card">
              <h2 id={`g-${g.name}`} className={cn("flex items-center justify-between border-b border-border px-4 py-2.5 text-sm font-semibold", g.name === "Overdue" && "text-danger")}>
                {g.name}
                <span className="num text-xs font-normal text-muted">{g.items.length}</span>
              </h2>
              <ul className="divide-y divide-border">
                {g.items.map((t) => (
                  <TaskRow key={t.id} task={t} clientName={clientName(t.clientId)} onToggle={() => toggleTask(t.id)} onDelete={() => deleteTask(t.id)} />
                ))}
              </ul>
            </section>
          ))}

          {showDone && done.length > 0 && (
            <section className="card" aria-labelledby="g-done">
              <h2 id="g-done" className="flex items-center justify-between border-b border-border px-4 py-2.5 text-sm font-semibold text-muted">
                Completed
                <span className="num text-xs font-normal">{done.length}</span>
              </h2>
              <ul className="divide-y divide-border">
                {done.map((t) => (
                  <TaskRow key={t.id} task={t} clientName={clientName(t.clientId)} onToggle={() => toggleTask(t.id)} onDelete={() => deleteTask(t.id)} />
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold">This week</h2>
            <p className="num mt-2 text-2xl font-semibold">
              {weekDone}
              <span className="text-base font-normal text-muted"> / {weekTotal.length} done</span>
            </p>
            <Progress value={weekTotal.length ? (weekDone / weekTotal.length) * 100 : 0} label="Tasks completed this week" className="mt-3" tone="success" />
          </div>
          <div className="card p-5">
            <h2 className="font-semibold">By type</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {types.map((t) => {
                const n = tasks.filter((x) => !x.done && x.type === t).length;
                return (
                  <li key={t} className="flex items-center gap-2">
                    <span className="text-faint">{typeIcon[t]}</span>
                    <span className="text-text-2">{t}</span>
                    <span className="num ml-auto font-medium">{n}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>

      {creating && <NewTask open={creating} onClose={() => setCreating(false)} />}
    </>
  );
}

function TaskRow({ task, clientName, onToggle, onDelete }: { task: Task; clientName: string | null; onToggle: () => void; onDelete: () => void }) {
  const overdue = !task.done && dayDiff(new Date(task.dueAt)) < 0;
  return (
    <li className="group flex items-center gap-3 px-4 py-3">
      <input type="checkbox" className="h-4 w-4 accent-primary" checked={task.done} onChange={onToggle} aria-label={`Mark "${task.title}" ${task.done ? "not done" : "done"}`} />
      <span className="text-faint" title={task.type} aria-hidden="true">
        {typeIcon[task.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", task.done && "text-muted line-through")}>{task.title}</p>
        <p className="text-xs text-muted">
          {clientName && task.clientId && (
            <>
              <Link href={`/clients/${task.clientId}`} className="hover:underline">
                {clientName}
              </Link>
              {" · "}
            </>
          )}
          <span className={cn(overdue && "text-danger")}>
            {relativeDay(task.dueAt)}, {fmtTime(task.dueAt)}
          </span>
          <span className="text-faint"> · {fmtDate(task.dueAt, "short")}</span>
        </p>
      </div>
      <span className={priorityBadge[task.priority]}>{task.priority}</span>
      <Avatar name={advisorById[task.assigneeId]?.name ?? ""} size="sm" />
      <button type="button" className="btn btn-ghost btn-icon btn-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100" onClick={onDelete} aria-label={`Delete "${task.title}"`}>
        <Trash2 size={14} />
      </button>
    </li>
  );
}

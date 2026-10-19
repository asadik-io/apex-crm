"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as seed from "@/lib/data/mock";
import type { Activity, Client, Deal, Note, Stage, Task } from "@/lib/types";

const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

interface Data {
  clients: Client[];
  deals: Deal[];
  tasks: Task[];
  activities: Activity[];
  notes: Note[];
}

interface State extends Data {
  hydrated: boolean;
  addClient: (input: Omit<Client, "id" | "since" | "lastContact" | "nextReview" | "tags"> & { tags?: string[] }) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  addDeal: (input: Omit<Deal, "id" | "createdAt" | "probability">) => Deal;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  moveDeal: (id: string, stage: Stage) => void;
  addTask: (input: Omit<Task, "id" | "done">) => Task;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addNote: (clientId: string, body: string) => void;
  resetDemo: () => void;
}

const probabilityByStage: Record<Stage, number> = { Lead: 15, Qualified: 35, Proposal: 55, Negotiation: 75, Won: 100, Lost: 0 };

const initial = (): Data => ({
  clients: seed.clients,
  deals: seed.deals,
  tasks: seed.tasks,
  activities: seed.activities,
  notes: seed.notes,
});

const now = () => new Date().toISOString();

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),
      hydrated: false,

      addClient(input) {
        const client: Client = {
          ...input,
          id: uid("c"),
          since: now(),
          lastContact: now(),
          nextReview: new Date(Date.now() + 30 * 86_400_000).toISOString(),
          tags: input.tags ?? [],
        };
        const activity: Activity = {
          id: uid("act"),
          clientId: client.id,
          kind: "note",
          title: "Client created",
          detail: `${client.name} added as ${client.status.toLowerCase()}.`,
          actorId: seed.currentUser.id,
          at: now(),
        };
        set((s) => ({ clients: [client, ...s.clients], activities: [activity, ...s.activities] }));
        return client;
      },

      updateClient(id, patch) {
        set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      },

      addDeal(input) {
        const deal: Deal = { ...input, id: uid("d"), createdAt: now(), probability: probabilityByStage[input.stage] };
        set((s) => ({ deals: [deal, ...s.deals] }));
        return deal;
      },

      updateDeal(id, patch) {
        set((s) => ({ deals: s.deals.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
      },

      moveDeal(id, stage) {
        const deal = get().deals.find((d) => d.id === id);
        if (!deal || deal.stage === stage) return;
        const activity: Activity = {
          id: uid("act"),
          clientId: deal.clientId,
          kind: "deal",
          title: `Deal moved to ${stage}`,
          detail: deal.title,
          actorId: seed.currentUser.id,
          at: now(),
        };
        set((s) => ({
          deals: s.deals.map((d) => (d.id === id ? { ...d, stage, probability: probabilityByStage[stage] } : d)),
          activities: [activity, ...s.activities],
        }));
      },

      addTask(input) {
        const task: Task = { ...input, id: uid("t"), done: false };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },

      toggleTask(id) {
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
      },

      deleteTask(id) {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },

      addNote(clientId, body) {
        const note: Note = { id: uid("n"), clientId, body, authorId: seed.currentUser.id, at: now() };
        const activity: Activity = {
          id: uid("act"),
          clientId,
          kind: "note",
          title: "Note added",
          detail: body.length > 90 ? `${body.slice(0, 90)}…` : body,
          actorId: seed.currentUser.id,
          at: now(),
        };
        set((s) => ({ notes: [note, ...s.notes], activities: [activity, ...s.activities] }));
      },

      resetDemo() {
        set({ ...initial() });
      },
    }),
    {
      name: "apex-crm-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ clients: s.clients, deals: s.deals, tasks: s.tasks, activities: s.activities, notes: s.notes }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Static reference data that never changes at runtime. */
export const reference = {
  advisors: seed.advisors,
  currentUser: seed.currentUser,
  accounts: seed.accounts,
  documents: seed.documents,
  monthly: seed.monthly,
};

export const advisorById = Object.fromEntries(seed.advisors.map((a) => [a.id, a]));

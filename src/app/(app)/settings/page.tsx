"use client";

import { useState } from "react";
import { Avatar, Field, PageHeader, Switch, Tabs } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { fmtDate } from "@/lib/format";
import { reference, useStore } from "@/lib/store";
import { applyTheme, useThemePreference, type ThemePreference as Theme } from "@/lib/theme";
import { TODAY } from "@/lib/today";
import { cn } from "@/lib/utils";

type Tab = "profile" | "notifications" | "appearance" | "team" | "data";

export default function SettingsPage() {
  const toast = useToast();
  const resetDemo = useStore((s) => s.resetDemo);
  const [tab, setTab] = useState<Tab>("profile");
  const [notify, setNotify] = useState({ tasks: true, deals: true, digest: false, mentions: true });
  const theme = useThemePreference();

  return (
    <>
      <PageHeader title="Settings" description="Your profile, notifications and workspace preferences" />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "profile", label: "Profile" },
          { id: "notifications", label: "Notifications" },
          { id: "appearance", label: "Appearance" },
          { id: "team", label: "Team", count: reference.advisors.length },
          { id: "data", label: "Data" },
        ]}
      />

      <div className="mt-6 max-w-2xl">
        {tab === "profile" && (
          <form
            className="card grid gap-5 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              toast({ title: "Profile saved", variant: "success" });
            }}
          >
            <div className="flex items-center gap-4">
              <Avatar name={reference.currentUser.name} size="lg" />
              <div>
                <p className="font-medium">{reference.currentUser.name}</p>
                <p className="text-muted">{reference.currentUser.title}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="p-name">
                <input id="p-name" className="input" defaultValue={reference.currentUser.name} />
              </Field>
              <Field label="Title" htmlFor="p-title">
                <input id="p-title" className="input" defaultValue={reference.currentUser.title} />
              </Field>
              <Field label="Email" htmlFor="p-email">
                <input id="p-email" type="email" className="input" defaultValue={reference.currentUser.email} />
              </Field>
              <Field label="Time zone" htmlFor="p-tz">
                <select id="p-tz" className="select" defaultValue="America/Los_Angeles">
                  <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
                  <option value="America/New_York">Eastern (New York)</option>
                  <option value="Europe/London">London</option>
                </select>
              </Field>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary">
                Save changes
              </button>
            </div>
          </form>
        )}

        {tab === "notifications" && (
          <div className="card divide-y divide-border px-6 py-2">
            <Switch label="Task reminders" description="30 minutes before a task is due" checked={notify.tasks} onChange={(v) => setNotify({ ...notify, tasks: v })} />
            <Switch label="Deal updates" description="When a deal you own changes stage" checked={notify.deals} onChange={(v) => setNotify({ ...notify, deals: v })} />
            <Switch label="Mentions" description="When a teammate mentions you in a note" checked={notify.mentions} onChange={(v) => setNotify({ ...notify, mentions: v })} />
            <Switch label="Weekly digest" description="Pipeline and AUM summary every Monday" checked={notify.digest} onChange={(v) => setNotify({ ...notify, digest: v })} />
          </div>
        )}

        {tab === "appearance" && (
          <div className="card p-6">
            <p className="font-medium">Theme</p>
            <p className="mb-4 text-muted">Applies to this browser.</p>
            <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
              {(["light", "dark", "system"] as Theme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={theme === t}
                  onClick={() => applyTheme(t)}
                  className={cn("rounded-card border p-3 text-left transition-colors", theme === t ? "border-primary bg-primary-soft/50" : "border-border hover:border-border-strong")}
                >
                  <div className={cn("mb-3 h-16 rounded-ctl border border-border", t === "dark" ? "bg-[#0b1220]" : t === "light" ? "bg-white" : "bg-gradient-to-r from-white to-[#0b1220]")} />
                  <span className="font-medium capitalize">{t}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "team" && (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Title</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {reference.advisors.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="flex items-center gap-3 font-medium">
                        <Avatar name={a.name} size="sm" />
                        {a.name}
                      </span>
                    </td>
                    <td>{a.title}</td>
                    <td className="text-muted">{a.email}</td>
                    <td>
                      <span className="badge">{a.title === "Partner" ? "Admin" : "Member"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "data" && (
          <div className="card p-6">
            <p className="font-medium">Demo data</p>
            <p className="mt-1 text-muted">
              This workspace runs entirely in your browser. Clients, deals, tasks and notes you change are saved locally. The calendar is anchored to {fmtDate(TODAY, "long")} so dates stay consistent.
            </p>
            <button
              type="button"
              className="btn btn-secondary mt-4"
              onClick={() => {
                resetDemo();
                toast({ title: "Demo data reset", description: "Back to the original book of business." });
              }}
            >
              Reset demo data
            </button>
          </div>
        )}
      </div>
    </>
  );
}

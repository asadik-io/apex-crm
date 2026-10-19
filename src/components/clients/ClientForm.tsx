"use client";

import { useState } from "react";
import { Dialog, Field } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { reference, useStore } from "@/lib/store";
import type { Client, ClientStatus, ClientType, RiskProfile, Segment } from "@/lib/types";

const segments: Segment[] = ["Private", "Premier", "Core"];
const statuses: ClientStatus[] = ["Active", "Prospect", "At risk", "Churned"];
const risks: RiskProfile[] = ["Conservative", "Balanced", "Growth", "Aggressive"];

type Values = {
  name: string;
  type: ClientType;
  company: string;
  email: string;
  phone: string;
  location: string;
  segment: Segment;
  status: ClientStatus;
  risk: RiskProfile;
  advisorId: string;
  aum: string;
};

const empty: Values = {
  name: "",
  type: "Individual",
  company: "",
  email: "",
  phone: "",
  location: "",
  segment: "Core",
  status: "Prospect",
  risk: "Balanced",
  advisorId: reference.currentUser.id,
  aum: "",
};

export function ClientForm({
  open,
  onClose,
  client,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client;
  onSaved?: (client: Client) => void;
}) {
  const addClient = useStore((s) => s.addClient);
  const updateClient = useStore((s) => s.updateClient);
  const toast = useToast();
  const [values, setValues] = useState<Values>(() =>
    client
      ? { ...empty, ...client, company: client.company ?? "", aum: String(client.aum) }
      : empty,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  // Segment follows the firm's AUM thresholds; it stays editable afterwards.
  const setAum = (e: React.ChangeEvent<HTMLInputElement>) => {
    const aum = Number(e.target.value.replace(/[^0-9.]/g, ""));
    const segment: Segment = aum >= 5_000_000 ? "Private" : aum >= 1_000_000 ? "Premier" : "Core";
    setValues((v) => ({ ...v, aum: e.target.value, segment }));
  };

  function validate() {
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "Name is required.";
    if (values.type === "Business" && !values.company.trim()) next.company = "Company is required for business clients.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Enter a valid email address.";
    const aum = Number(values.aum.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(aum) || aum < 0) next.aum = "Enter an amount of 0 or more.";
    setErrors(next);
    return Object.keys(next).length === 0 ? aum : null;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const aum = validate();
    if (aum === null) return;
    const payload = {
      name: values.name.trim(),
      type: values.type,
      company: values.type === "Business" ? values.company.trim() : undefined,
      email: values.email.trim(),
      phone: values.phone.trim(),
      location: values.location.trim(),
      segment: values.segment,
      status: values.status,
      risk: values.risk,
      advisorId: values.advisorId,
      aum,
    };
    if (client) {
      updateClient(client.id, payload);
      toast({ title: "Client updated", description: payload.name, variant: "success" });
      onSaved?.({ ...client, ...payload });
    } else {
      const created = addClient(payload);
      toast({ title: "Client added", description: `${created.name} is now a ${created.status.toLowerCase()}.`, variant: "success" });
      onSaved?.(created);
    }
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={client ? "Edit client" : "Add client"}
      description={client ? undefined : "Create a client record. You can add accounts and deals afterwards."}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="client-form" className="btn btn-primary">
            {client ? "Save changes" : "Add client"}
          </button>
        </>
      }
    >
      <form id="client-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Client type" htmlFor="type">
          <select id="type" className="select" value={values.type} onChange={set("type")}>
            <option>Individual</option>
            <option>Business</option>
          </select>
        </Field>
        <Field label={values.type === "Business" ? "Primary contact" : "Full name"} htmlFor="name" error={errors.name}>
          <input id="name" className="input" value={values.name} onChange={set("name")} aria-invalid={!!errors.name} autoFocus />
        </Field>
        {values.type === "Business" && (
          <Field label="Company" htmlFor="company" error={errors.company}>
            <input id="company" className="input" value={values.company} onChange={set("company")} aria-invalid={!!errors.company} />
          </Field>
        )}
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input id="email" type="email" className="input" value={values.email} onChange={set("email")} aria-invalid={!!errors.email} />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <input id="phone" className="input" value={values.phone} onChange={set("phone")} placeholder="(555) 010-0199" />
        </Field>
        <Field label="Location" htmlFor="location">
          <input id="location" className="input" value={values.location} onChange={set("location")} placeholder="City, ST" />
        </Field>
        <Field label="Assets under management" htmlFor="aum" error={errors.aum} hint="USD">
          <input id="aum" inputMode="decimal" className="input num" value={values.aum} onChange={setAum} aria-invalid={!!errors.aum} placeholder="250000" />
        </Field>
        <Field label="Segment" htmlFor="segment">
          <select id="segment" className="select" value={values.segment} onChange={set("segment")}>
            {segments.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Status" htmlFor="status">
          <select id="status" className="select" value={values.status} onChange={set("status")}>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Risk profile" htmlFor="risk">
          <select id="risk" className="select" value={values.risk} onChange={set("risk")}>
            {risks.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Advisor" htmlFor="advisor">
          <select id="advisor" className="select" value={values.advisorId} onChange={set("advisorId")}>
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

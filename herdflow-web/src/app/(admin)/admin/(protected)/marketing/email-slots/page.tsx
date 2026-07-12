"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Select, Input } from "@/components/admin/Field";

type SponsorOption = { id: string; companyName: string; status: string };
type CreativeOption = { id: string; headline: string | null; sponsorId: string };
type SlotRow = {
  id: string;
  slotType: string;
  weekStart: string;
  fee: string;
  status: string;
  sponsor: { companyName: string } | null;
  creative: { headline: string | null; imageUrl: string } | null;
  invoice: { number: string; status: string } | null;
};

const SLOT_LABELS: Record<string, string> = {
  THURSDAY_PRICE_EMAIL: "Thursday Price Email",
  PRICE_PUSH_NOTIFICATION: "Price Push Notification",
};

function nextMondays(count: number): string[] {
  const mondays: string[] = [];
  const d = new Date();
  const day = d.getDay();
  const diffToMonday = day === 0 ? 1 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + (day === 1 ? 0 : diffToMonday));
  for (let i = 0; i < count; i++) {
    mondays.push(new Date(d).toISOString().slice(0, 10));
    d.setDate(d.getDate() + 7);
  }
  return mondays;
}

export default function EmailSlotsPage() {
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [sponsors, setSponsors] = useState<SponsorOption[]>([]);
  const [creatives, setCreatives] = useState<CreativeOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [assignWeek, setAssignWeek] = useState(nextMondays(1)[0]);
  const [assignSlotType, setAssignSlotType] = useState("THURSDAY_PRICE_EMAIL");
  const [assignSponsor, setAssignSponsor] = useState("");
  const [assignCreative, setAssignCreative] = useState("");
  const [assignFee, setAssignFee] = useState("4500");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/marketing/email-slots").then((r) => r.json()),
      fetch("/api/admin/marketing").then((r) => r.json()),
      fetch("/api/admin/marketing/creatives").then((r) => r.json()),
    ])
      .then(([slotData, sponsorData, creativeData]) => {
        setSlots(slotData.slots || []);
        setSponsors((sponsorData.sponsors || []).filter((s: SponsorOption) => s.status === "ACTIVE"));
        setCreatives(
          (creativeData.creatives || []).map((c: any) => ({
            id: c.id,
            headline: c.headline,
            sponsorId: c.sponsorId,
          })),
        );
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function assign() {
    if (!assignSponsor) {
      toast.error("Please select a sponsor.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/marketing/email-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsorId: assignSponsor,
          slotType: assignSlotType,
          weekStart: assignWeek,
          creativeId: assignCreative || undefined,
          fee: Number(assignFee),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to assign slot.");
        return;
      }
      toast.success("Slot assigned.");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function generateInvoice(slot: SlotRow) {
    const res = await fetch(`/api/admin/marketing/email-slots/${slot.id}/generate-invoice`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to generate invoice.");
      return;
    }
    toast.success(`Invoice ${data.invoice.number} created.`);
    load();
  }

  const availableCreatives = creatives.filter((c) => c.sponsorId === assignSponsor);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-navy-600">Email &amp; Push Slots</h1>
        <p className="mt-1 text-sm text-navy-400">
          Book weekly sponsor slots for the Thursday price email and price push notifications.
        </p>
      </div>

      <Card>
        <CardHeader title="Assign a Slot" />
        <div className="grid gap-4 p-4 sm:grid-cols-5">
          <Select label="Week Starting (Monday)" value={assignWeek} onChange={(e) => setAssignWeek(e.target.value)}>
            {nextMondays(12).map((m) => (
              <option key={m} value={m}>
                {new Date(m).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
              </option>
            ))}
          </Select>
          <Select label="Slot" value={assignSlotType} onChange={(e) => setAssignSlotType(e.target.value)}>
            <option value="THURSDAY_PRICE_EMAIL">Thursday Price Email</option>
            <option value="PRICE_PUSH_NOTIFICATION">Price Push Notification</option>
          </Select>
          <Select label="Sponsor" value={assignSponsor} onChange={(e) => setAssignSponsor(e.target.value)}>
            <option value="">— Select —</option>
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.companyName}
              </option>
            ))}
          </Select>
          <Select label="Creative (optional)" value={assignCreative} onChange={(e) => setAssignCreative(e.target.value)}>
            <option value="">— None —</option>
            {availableCreatives.map((c) => (
              <option key={c.id} value={c.id}>
                {c.headline || c.id}
              </option>
            ))}
          </Select>
          <Input label="Fee (R)" type="number" value={assignFee} onChange={(e) => setAssignFee(e.target.value)} />
        </div>
        <div className="flex justify-end p-4 pt-0">
          <Button onClick={assign} loading={saving}>
            Assign Slot
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Booked Slots" />
        <Table>
          <Thead>
            <Tr>
              <Th>Week</Th>
              <Th>Slot</Th>
              <Th>Sponsor</Th>
              <Th>Creative</Th>
              <Th align="right">Fee</Th>
              <Th>Invoice</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <TableEmptyRow colSpan={7} message="Loading…" />
            ) : slots.length === 0 ? (
              <TableEmptyRow colSpan={7} message="No slots booked yet." />
            ) : (
              slots.map((s) => (
                <Tr key={s.id}>
                  <Td>{new Date(s.weekStart).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</Td>
                  <Td>{SLOT_LABELS[s.slotType] ?? s.slotType}</Td>
                  <Td className="font-semibold text-navy-600">{s.sponsor?.companyName ?? "—"}</Td>
                  <Td>{s.creative?.headline ?? "—"}</Td>
                  <Td align="right">R{Number(s.fee).toFixed(2)}</Td>
                  <Td>
                    {s.invoice ? (
                      <Link href="/admin/marketing/invoices" className="text-navy-600 hover:underline">
                        <Badge variant={s.invoice.status === "PAID" ? "success" : "warning"}>{s.invoice.number}</Badge>
                      </Link>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    {!s.invoice && (
                      <Button size="sm" variant="secondary" onClick={() => generateInvoice(s)}>
                        Generate Invoice
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}

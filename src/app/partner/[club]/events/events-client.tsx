"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/utils";
import { addTier, createEvent, publishEvent } from "./actions";

export interface EventListItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  startsAt: string;
  tiers: { id: string; name: string; price: number; capacity: number; sold: number }[];
}

export function EventsClient({
  clubId,
  events,
}: {
  clubId: string;
  events: EventListItem[];
}) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [openTiers, setOpenTiers] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState({
    name: "",
    startsAt: "",
    description: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    const result = await createEvent({
      clubId,
      name: draft.name,
      startsAt: draft.startsAt,
      description: draft.description || undefined,
      publish: false,
    });
    setBusy(false);
    if (result.ok) {
      setCreating(false);
      setDraft({ name: "", startsAt: "", description: "" });
      setOpenTiers(result.eventId);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  async function toggle(eventId: string, publish: boolean) {
    await publishEvent(clubId, eventId, publish);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "+ New event"}
        </Button>
      </div>

      {creating && (
        <div className="mb-6 grid gap-2 rounded-md border border-line bg-night-raised p-4 sm:grid-cols-3">
          <Input
            placeholder="Event name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <Input
            type="datetime-local"
            value={draft.startsAt}
            onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
          />
          <Button onClick={create} disabled={busy || !draft.name || !draft.startsAt}>
            {busy ? "Creating…" : "Create draft"}
          </Button>
          <textarea
            rows={3}
            className="w-full rounded-sm border border-line bg-night px-3 py-2 text-sm sm:col-span-3"
            placeholder="Description (optional)"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          {error && (
            <p role="alert" className="text-sm text-danger sm:col-span-3">
              {error}
            </p>
          )}
        </div>
      )}

      <ul className="space-y-3">
        {events.map((e) => (
          <li
            key={e.id}
            className="rounded-md border border-line bg-night-raised p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-semibold">
                  {e.name}{" "}
                  <Badge variant={e.status === "published" ? "drop" : "default"}>
                    {e.status}
                  </Badge>
                </p>
                <p className="text-xs text-moon-dim">
                  {new Date(e.startsAt).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setOpenTiers(openTiers === e.id ? null : e.id)
                  }
                >
                  {openTiers === e.id ? "Close tiers" : "Tiers"}
                </Button>
                <Button
                  size="sm"
                  variant={e.status === "published" ? "ghost" : "primary"}
                  onClick={() => toggle(e.id, e.status !== "published")}
                >
                  {e.status === "published" ? "Unpublish" : "Publish"}
                </Button>
              </div>
            </div>

            {openTiers === e.id && (
              <div className="mt-4">
                <ul className="mb-3 space-y-1 text-sm">
                  {e.tiers.map((t) => (
                    <li
                      key={t.id}
                      className="flex justify-between rounded-sm bg-night px-3 py-2"
                    >
                      <span>{t.name}</span>
                      <span className="tnum text-moon-dim">
                        {formatPaise(t.price)} · {t.sold}/{t.capacity} sold
                      </span>
                    </li>
                  ))}
                  {e.tiers.length === 0 && (
                    <li className="text-sm text-moon-dim">No tiers yet.</li>
                  )}
                </ul>
                <TierForm clubId={clubId} eventId={e.id} />
              </div>
            )}
          </li>
        ))}
        {events.length === 0 && (
          <li className="rounded-md border border-line bg-night-raised p-6 text-center text-sm text-moon-dim">
            No events yet. Create one and add ticket tiers.
          </li>
        )}
      </ul>
    </div>
  );
}

function TierForm({ clubId, eventId }: { clubId: string; eventId: string }) {
  const router = useRouter();
  const [name, setName] = React.useState("Early bird");
  const [price, setPrice] = React.useState(999);
  const [capacity, setCapacity] = React.useState(100);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    const result = await addTier({
      clubId,
      eventId,
      name,
      price: price * 100,
      capacity,
    });
    setBusy(false);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-4">
      <Input placeholder="Tier name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        type="number"
        placeholder="₹"
        value={price}
        onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
      />
      <Input
        type="number"
        placeholder="Capacity"
        value={capacity}
        onChange={(e) => setCapacity(Math.max(1, Number(e.target.value)))}
      />
      <Button size="sm" disabled={busy || !name} onClick={add}>
        {busy ? "Adding…" : "Add tier"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger sm:col-span-4">
          {error}
        </p>
      )}
    </div>
  );
}

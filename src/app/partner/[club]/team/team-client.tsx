"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { inviteMember, removeMember } from "./actions";

interface Member {
  id: string;
  role: string;
  name: string;
  email: string;
  isSelf: boolean;
}

export function TeamClient({ clubId, members }: { clubId: string; members: Member[] }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"manager" | "door_staff" | "finance">("door_staff");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function invite() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await inviteMember({ clubId, email, role });
    setBusy(false);
    if (result.ok) {
      setNotice("Added to team");
      setEmail("");
      router.refresh();
    } else setError(result.error);
  }

  async function remove(id: string) {
    await removeMember(clubId, id);
    router.refresh();
  }

  return (
    <div>
      <div className="rounded-md border border-line bg-night-raised p-4">
        <h2 className="font-display font-semibold">Invite a teammate</h2>
        <p className="mt-1 text-xs text-moon-dim">
          They must already have a ThirtyML account. Manager can do everything
          except payouts and team; Door staff sees bookings and runs check-in;
          Finance sees payouts.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Input
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="h-10 rounded-sm border border-line bg-night px-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
          >
            <option value="manager">Manager</option>
            <option value="door_staff">Door staff</option>
            <option value="finance">Finance</option>
          </select>
          <Button disabled={busy || !email} onClick={invite}>
            {busy ? "Inviting…" : "Add"}
          </Button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
        {notice && <p className="mt-2 text-sm text-drop">{notice}</p>}
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-moon-dim">
              <th className="px-4 py-2 font-normal">Name</th>
              <th className="px-4 py-2 font-normal">Email</th>
              <th className="px-4 py-2 font-normal">Role</th>
              <th className="px-4 py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{m.name}</td>
                <td className="px-4 py-3 text-moon-dim">{m.email}</td>
                <td className="px-4 py-3">
                  <Badge>{m.role.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {m.role !== "owner" && (
                    <button
                      className="text-xs text-danger hover:underline"
                      onClick={() => remove(m.id)}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

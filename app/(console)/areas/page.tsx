"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Zone = { id: string; name: string };
type Area = { id: string; name: string; zone: Zone; createdAt: string };

export default function AreasPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [areaName, setAreaName] = useState("");

  const load = async () => {
    const [zRes, aRes] = await Promise.all([fetch("/api/zones"), fetch("/api/areas")]);
    const [zData, aData] = await Promise.all([zRes.json(), aRes.json()]);
    setZones(zData.zones ?? []);
    setAreas(aData.areas ?? []);
    if (!zoneId && zData.zones?.[0]?.id) setZoneId(zData.zones[0].id);
  };

  React.useEffect(() => {
    void load();
  }, []);

  async function addArea() {
    const r = await fetch("/api/areas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zoneId, name: areaName }) });
    if (!r.ok) return toast.error("Area save failed");
    setAreaName(""); await load(); toast.success("Area added");
  }

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle>Add area tag</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">
        <div><Label>Zone</Label><select className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select></div>
        <div><Label>Area name</Label><Input value={areaName} onChange={(e) => setAreaName(e.target.value)} /></div>
        <div className="flex items-end gap-2"><Button onClick={() => void addArea()}>Add area</Button><Button variant="secondary" onClick={() => void load()}>Refresh</Button></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Areas created</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr><th className="text-left px-2 py-1">Zone</th><th className="text-left px-2 py-1">Area</th><th className="text-left px-2 py-1">Time</th></tr></thead><tbody>
          {areas.map((a) => <tr key={a.id} className="border-t border-white/5"><td className="px-2 py-1">{a.zone?.name}</td><td className="px-2 py-1">{a.name}</td><td className="px-2 py-1">{new Date(a.createdAt || Date.now()).toLocaleString()}</td></tr>)}
        </tbody></table></div>
      </CardContent></Card>
    </div>
  );
}

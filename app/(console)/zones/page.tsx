"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Zone = { id: string; name: string; consumption: number; createdAt: string; pqName?: string; description?: string };

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [form, setForm] = useState({
    name: "", consumption: "",
    v1: "", v2: "", v3: "",
    uhtd1: "", uhtd2: "", uhtd3: "",
    i1: "", i2: "", i3: "",
    ihtd1: "", ihtd2: "", ihtd3: "",
    pqName: "", description: ""
  });

  const load = async () => {
    const r = await fetch("/api/zones");
    const d = await r.json();
    setZones(d.zones ?? []);
  };

  React.useEffect(() => {
    void load();
  }, []);

  async function addZone() {
    const payload = {
      name: form.name,
      consumption: Number(form.consumption || 0),
      v1: form.v1 ? Number(form.v1) : undefined,
      v2: form.v2 ? Number(form.v2) : undefined,
      v3: form.v3 ? Number(form.v3) : undefined,
      uhtd1: form.uhtd1 ? Number(form.uhtd1) : undefined,
      uhtd2: form.uhtd2 ? Number(form.uhtd2) : undefined,
      uhtd3: form.uhtd3 ? Number(form.uhtd3) : undefined,
      i1: form.i1 ? Number(form.i1) : undefined,
      i2: form.i2 ? Number(form.i2) : undefined,
      i3: form.i3 ? Number(form.i3) : undefined,
      ihtd1: form.ihtd1 ? Number(form.ihtd1) : undefined,
      ihtd2: form.ihtd2 ? Number(form.ihtd2) : undefined,
      ihtd3: form.ihtd3 ? Number(form.ihtd3) : undefined,
      pqName: form.pqName || undefined,
      description: form.description || undefined,
    };
    
    const r = await fetch("/api/zones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) return toast.error("Zone save failed");
    
    setForm({
      name: "", consumption: "",
      v1: "", v2: "", v3: "",
      uhtd1: "", uhtd2: "", uhtd3: "",
      i1: "", i2: "", i3: "",
      ihtd1: "", ihtd2: "", ihtd3: "",
      pqName: "", description: ""
    });
    await load(); 
    toast.success("Zone added");
  }

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle>Add zone tag</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div><Label>Zone name</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
          <div><Label>Total Consumption</Label><Input type="number" value={form.consumption} onChange={(e) => setForm({...form, consumption: e.target.value})} /></div>
          <div><Label>PQ NAME</Label><select className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2" value={form.pqName} onChange={(e) => setForm({...form, pqName: e.target.value})}><option value="">Select...</option><option value="Hioki">Hioki</option><option value="ALM36">ALM36</option><option value="ALM31">ALM31</option><option value="ALM45">ALM45</option></select></div>
        </div>
        
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6 pt-2 border-t border-white/5">
          <div><Label>V1</Label><Input type="number" value={form.v1} onChange={(e) => setForm({...form, v1: e.target.value})} /></div>
          <div><Label>V2</Label><Input type="number" value={form.v2} onChange={(e) => setForm({...form, v2: e.target.value})} /></div>
          <div><Label>V3</Label><Input type="number" value={form.v3} onChange={(e) => setForm({...form, v3: e.target.value})} /></div>
          <div><Label>Uhtd1</Label><Input type="number" value={form.uhtd1} onChange={(e) => setForm({...form, uhtd1: e.target.value})} /></div>
          <div><Label>Uhtd2</Label><Input type="number" value={form.uhtd2} onChange={(e) => setForm({...form, uhtd2: e.target.value})} /></div>
          <div><Label>Uhtd3</Label><Input type="number" value={form.uhtd3} onChange={(e) => setForm({...form, uhtd3: e.target.value})} /></div>
          
          <div><Label>I1</Label><Input type="number" value={form.i1} onChange={(e) => setForm({...form, i1: e.target.value})} /></div>
          <div><Label>I2</Label><Input type="number" value={form.i2} onChange={(e) => setForm({...form, i2: e.target.value})} /></div>
          <div><Label>I3</Label><Input type="number" value={form.i3} onChange={(e) => setForm({...form, i3: e.target.value})} /></div>
          <div><Label>Ihtd1</Label><Input type="number" value={form.ihtd1} onChange={(e) => setForm({...form, ihtd1: e.target.value})} /></div>
          <div><Label>Ihtd2</Label><Input type="number" value={form.ihtd2} onChange={(e) => setForm({...form, ihtd2: e.target.value})} /></div>
          <div><Label>Ihtd3</Label><Input type="number" value={form.ihtd3} onChange={(e) => setForm({...form, ihtd3: e.target.value})} /></div>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea className="h-20" placeholder="Add additional info..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
        </div>

        <div className="flex items-end gap-2 pt-2"><Button onClick={() => void addZone()}>Add zone</Button><Button variant="secondary" onClick={() => void load()}>Refresh</Button></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Zones created</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr><th className="text-left px-2 py-1">Zone</th><th className="text-left px-2 py-1">PQ Name</th><th className="text-left px-2 py-1">Consumption</th><th className="text-left px-2 py-1">Time</th></tr></thead><tbody>
          {zones.map((z) => <tr key={z.id} className="border-t border-white/5"><td className="px-2 py-1">{z.name}</td><td className="px-2 py-1">{z.pqName || "N/A"}</td><td className="px-2 py-1">{z.consumption}</td><td className="px-2 py-1">{new Date(z.createdAt || Date.now()).toLocaleString()}</td></tr>)}
        </tbody></table></div>
      </CardContent></Card>
    </div>
  );
}

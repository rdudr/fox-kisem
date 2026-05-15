"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

export default function PlantMainInputPage() {
  const [form, setForm] = useState({
    name: "",
    pqName: "", recordingNameId: "",
    v1: "", v2: "", v3: "",
    uthd1: "", uthd2: "", uthd3: "",
    i1: "", i2: "", i3: "",
    ithd1: "", ithd2: "", ithd3: "",
    pf: "", kvarD: "", kvarQ: "", kvarLeadLag: "Lead",
    description: ""
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [totalPower, setTotalPower] = useState(0);

  const [expanded, setExpanded] = useState<string | null>(null);

  const zones = useAppStore((state) => state.zones);
  const addZoneAction = useAppStore((state) => state.addZone);
  const updateZoneAction = useAppStore((state) => state.updateZone);

  // Real-time calculation of Total Power
  useEffect(() => {
    const v1 = Number(form.v1) || 0;
    const v2 = Number(form.v2) || 0;
    const v3 = Number(form.v3) || 0;
    const i1 = Number(form.i1) || 0;
    const i2 = Number(form.i2) || 0;
    const i3 = Number(form.i3) || 0;
    const pf = Number(form.pf) || 0;

    let avgV = 0;
    let avgI = 0;
    
    const vCount = (form.v1 ? 1 : 0) + (form.v2 ? 1 : 0) + (form.v3 ? 1 : 0);
    const iCount = (form.i1 ? 1 : 0) + (form.i2 ? 1 : 0) + (form.i3 ? 1 : 0);
    
    if (vCount > 0) avgV = (v1 + v2 + v3) / vCount;
    if (iCount > 0) avgI = (i1 + i2 + i3) / iCount;

    if (avgV > 0 && avgI > 0 && pf > 0) {
      const power = (1.732 * avgV * avgI * pf) / 1000;
      setTotalPower(Number(power.toFixed(2)));
    } else {
      setTotalPower(0);
    }
  }, [form.v1, form.v2, form.v3, form.i1, form.i2, form.i3, form.pf]);

  async function addZone() {
    if (!form.name) return toast.error("Name is required");

    const payload = {
      id: crypto.randomUUID(),
      name: form.name,
      v1: form.v1 ? Number(form.v1) : undefined,
      v2: form.v2 ? Number(form.v2) : undefined,
      v3: form.v3 ? Number(form.v3) : undefined,
      uthd1: form.uthd1 ? Number(form.uthd1) : undefined,
      uthd2: form.uthd2 ? Number(form.uthd2) : undefined,
      uthd3: form.uthd3 ? Number(form.uthd3) : undefined,
      i1: form.i1 ? Number(form.i1) : undefined,
      i2: form.i2 ? Number(form.i2) : undefined,
      i3: form.i3 ? Number(form.i3) : undefined,
      ithd1: form.ithd1 ? Number(form.ithd1) : undefined,
      ithd2: form.ithd2 ? Number(form.ithd2) : undefined,
      ithd3: form.ithd3 ? Number(form.ithd3) : undefined,
      pf: form.pf ? Number(form.pf) : undefined,
      kvarD: form.kvarD ? Number(form.kvarD) : undefined,
      kvarQ: form.kvarQ ? Number(form.kvarQ) : undefined,
      kvarLeadLag: form.kvarLeadLag,
      totalPower: totalPower,
      pqName: form.pqName || undefined,
      recordingNameId: form.recordingNameId || undefined,
      description: form.description || undefined,
      createdAt: new Date().toISOString(),
    };
    
    if (editingId) {
      updateZoneAction(editingId, payload);
      toast.success("Plant Main Input updated locally");
    } else {
      addZoneAction(payload);
      toast.success("Plant Main Input added locally");
    }
    
    setEditingId(null);
    
    setForm({
      name: "",
      pqName: "", recordingNameId: "",
      v1: "", v2: "", v3: "",
      uthd1: "", uthd2: "", uthd3: "",
      i1: "", i2: "", i3: "",
      ithd1: "", ithd2: "", ithd3: "",
      pf: "", kvarD: "", kvarQ: "", kvarLeadLag: "Lead",
      description: ""
    });
    setTotalPower(0);
  }

  function handleEdit(z: any) {
    setEditingId(z.id);
    setForm({
      name: z.name || "",
      pqName: z.pqName || "",
      recordingNameId: z.recordingNameId || "",
      v1: z.v1?.toString() || "", v2: z.v2?.toString() || "", v3: z.v3?.toString() || "",
      uthd1: z.uthd1?.toString() || "", uthd2: z.uthd2?.toString() || "", uthd3: z.uthd3?.toString() || "",
      i1: z.i1?.toString() || "", i2: z.i2?.toString() || "", i3: z.i3?.toString() || "",
      ithd1: z.ithd1?.toString() || "", ithd2: z.ithd2?.toString() || "", ithd3: z.ithd3?.toString() || "",
      pf: z.pf?.toString() || "",
      kvarD: z.kvarD?.toString() || "", kvarQ: z.kvarQ?.toString() || "", kvarLeadLag: z.kvarLeadLag || "Lead",
      description: z.description || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancel() {
    setEditingId(null);
    setForm({
      name: "",
      pqName: "", recordingNameId: "",
      v1: "", v2: "", v3: "",
      uthd1: "", uthd2: "", uthd3: "",
      i1: "", i2: "", i3: "",
      ithd1: "", ithd2: "", ithd3: "",
      pf: "", kvarD: "", kvarQ: "", kvarLeadLag: "Lead",
      description: ""
    });
  }

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle>Add Plant Main Input</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
          <div><Label>PQ NAME</Label><select className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2" value={form.pqName} onChange={(e) => setForm({...form, pqName: e.target.value})}><option value="">Select...</option><option value="Hioki">Hioki</option><option value="ALM36">ALM36</option><option value="ALM31">ALM31</option><option value="ALM45">ALM45</option><option value="LM20">LM20</option></select></div>
          <div><Label>Recording Name ID</Label><Input value={form.recordingNameId} onChange={(e) => setForm({...form, recordingNameId: e.target.value})} /></div>
        </div>
        
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6 pt-2 border-t border-white/5">
          <div><Label>V1</Label><Input type="number" value={form.v1} onChange={(e) => setForm({...form, v1: e.target.value})} /></div>
          <div><Label>V2</Label><Input type="number" value={form.v2} onChange={(e) => setForm({...form, v2: e.target.value})} /></div>
          <div><Label>V3</Label><Input type="number" value={form.v3} onChange={(e) => setForm({...form, v3: e.target.value})} /></div>
          <div><Label>Uthd1</Label><Input type="number" value={form.uthd1} onChange={(e) => setForm({...form, uthd1: e.target.value})} /></div>
          <div><Label>Uthd2</Label><Input type="number" value={form.uthd2} onChange={(e) => setForm({...form, uthd2: e.target.value})} /></div>
          <div><Label>Uthd3</Label><Input type="number" value={form.uthd3} onChange={(e) => setForm({...form, uthd3: e.target.value})} /></div>
          
          <div><Label>I1</Label><Input type="number" value={form.i1} onChange={(e) => setForm({...form, i1: e.target.value})} /></div>
          <div><Label>I2</Label><Input type="number" value={form.i2} onChange={(e) => setForm({...form, i2: e.target.value})} /></div>
          <div><Label>I3</Label><Input type="number" value={form.i3} onChange={(e) => setForm({...form, i3: e.target.value})} /></div>
          <div><Label>Ithd1</Label><Input type="number" value={form.ithd1} onChange={(e) => setForm({...form, ithd1: e.target.value})} /></div>
          <div><Label>Ithd2</Label><Input type="number" value={form.ithd2} onChange={(e) => setForm({...form, ithd2: e.target.value})} /></div>
          <div><Label>Ithd3</Label><Input type="number" value={form.ithd3} onChange={(e) => setForm({...form, ithd3: e.target.value})} /></div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 pt-2 border-t border-white/5">
          <div><Label>Power Factor (PF)</Label><Input type="number" step="0.001" value={form.pf} onChange={(e) => setForm({...form, pf: e.target.value})} /></div>
          <div><Label>KVAr (D)</Label><Input type="number" value={form.kvarD} onChange={(e) => setForm({...form, kvarD: e.target.value})} /></div>
          <div><Label>KVAr (Q)</Label><Input type="number" value={form.kvarQ} onChange={(e) => setForm({...form, kvarQ: e.target.value})} /></div>
          <div>
            <Label>KVAr Style</Label>
            <div className="flex gap-2 mt-1">
              <Button type="button" variant={form.kvarLeadLag === "Lead" ? "default" : "secondary"} className="flex-1 h-9" onClick={() => setForm({...form, kvarLeadLag: "Lead"})}>Lead</Button>
              <Button type="button" variant={form.kvarLeadLag === "Lag" ? "default" : "secondary"} className="flex-1 h-9" onClick={() => setForm({...form, kvarLeadLag: "Lag"})}>Lag</Button>
            </div>
          </div>
          <div>
            <Label>Total Power (Real-time)</Label>
            <div className="h-9 flex items-center px-3 bg-slate-900 border border-white/10 rounded-md text-cyan-400 font-bold">
              {totalPower} kW
            </div>
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea className="h-20" placeholder="Add additional info..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
        </div>

        <div className="flex items-end gap-2 pt-2">
          <Button onClick={() => void addZone()}>{editingId ? "Update Entry" : "Add Entry"}</Button>
          {editingId && <Button variant="secondary" onClick={handleCancel}>Cancel</Button>}
        </div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Plant Main Inputs recorded</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr><th className="text-left px-2 py-1">Name</th><th className="text-left px-2 py-1">PQ Name</th><th className="text-left px-2 py-1">Total Power</th><th className="text-left px-2 py-1">Time</th></tr></thead><tbody>
          {zones.map((z) => (
            <React.Fragment key={z.id}>
              <tr className="border-t border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => setExpanded(expanded === z.id ? null : z.id)}>
                <td className="px-2 py-2">{z.name}</td>
                <td className="px-2 py-2">{z.pqName || "N/A"}</td>
                <td className="px-2 py-2 text-cyan-400 font-bold">{z.totalPower || 0} kW</td>
                <td className="px-2 py-2 text-[10px] text-slate-500">{new Date(z.createdAt || Date.now()).toLocaleString()}</td>
              </tr>
              {expanded === z.id && (
                <tr className="bg-slate-900/50"><td colSpan={5} className="px-4 py-3">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-slate-300">
                    <div><span className="block text-[10px] uppercase text-slate-500">V1 / V2 / V3</span>{(z as any).v1 ?? "-"}{(z as any).v2 !== undefined ? ` / ${(z as any).v2}` : ""}{(z as any).v3 !== undefined ? ` / ${(z as any).v3}` : ""}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">Uthd 1 / 2 / 3</span>{(z as any).uthd1 ?? "-"}{(z as any).uthd2 !== undefined ? ` / ${(z as any).uthd2}` : ""}{(z as any).uthd3 !== undefined ? ` / ${(z as any).uthd3}` : ""}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">I1 / I2 / I3</span>{(z as any).i1 ?? "-"}{(z as any).i2 !== undefined ? ` / ${(z as any).i2}` : ""}{(z as any).i3 !== undefined ? ` / ${(z as any).i3}` : ""}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">Ithd 1 / 2 / 3</span>{(z as any).ithd1 ?? "-"}{(z as any).ithd2 !== undefined ? ` / ${(z as any).ithd2}` : ""}{(z as any).ithd3 !== undefined ? ` / ${(z as any).ithd3}` : ""}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">Power Factor</span>{(z as any).pf ?? "-"}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">KVAr (D) / KVAr (Q)</span>{(z as any).kvarD ?? "-"} / {(z as any).kvarQ ?? "-"}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">KVAr Lead/Lag</span>{(z as any).kvarLeadLag ?? "-"}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">Recording Name ID</span>{(z as any).recordingNameId || "N/A"}</div>
                    <div className="col-span-2"><span className="block text-[10px] uppercase text-slate-500">Description</span>{z.description || "N/A"}</div>
                    <div className="col-span-full pt-2 flex justify-end">
                      <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(z); }}>Edit</Button>
                    </div>
                  </div>
                </td></tr>
              )}
            </React.Fragment>
          ))}
        </tbody></table></div>
      </CardContent></Card>
    </div>
  );
}

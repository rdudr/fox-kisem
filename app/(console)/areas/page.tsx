"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

export default function MccPccPage() {
  
  const [form, setForm] = useState({
    zoneId: "", name: "",
    v1: "", v2: "", v3: "",
    uhtd1: "", uhtd2: "", uhtd3: "",
    i1: "", i2: "", i3: "",
    ihtd1: "", ihtd2: "", ihtd3: "",
    pf: "", kvarD: "", kvarQ: "", kvarLeadLag: "Lead",
    pqName: "", description: ""
  });
  
  const [totalPower, setTotalPower] = useState(0);

  const [expanded, setExpanded] = useState<string | null>(null);

  const zones = useAppStore((state) => state.zones);
  const areas = useAppStore((state) => state.areas);
  const addAreaAction = useAppStore((state) => state.addArea);

  useEffect(() => {
    if (!form.zoneId && zones.length > 0) {
      setForm(prev => ({ ...prev, zoneId: zones[0].id }));
    }
  }, [zones]);

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

  async function addMccPcc() {
    if (!form.zoneId) return toast.error("Select a Plant Main Input first");
    if (!form.name) return toast.error("MCC/PCC name required");

    const payload = {
      id: crypto.randomUUID(),
      zoneId: form.zoneId,
      name: form.name,
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
      pf: form.pf ? Number(form.pf) : undefined,
      kvarD: form.kvarD ? Number(form.kvarD) : undefined,
      kvarQ: form.kvarQ ? Number(form.kvarQ) : undefined,
      kvarLeadLag: form.kvarLeadLag,
      totalPower: totalPower,
      pqName: form.pqName || undefined,
      description: form.description || undefined,
      createdAt: new Date().toISOString(),
    };
    
    addAreaAction(payload);
    
    setForm(prev => ({
      ...prev,
      name: "",
      v1: "", v2: "", v3: "",
      uhtd1: "", uhtd2: "", uhtd3: "",
      i1: "", i2: "", i3: "",
      ihtd1: "", ihtd2: "", ihtd3: "",
      pf: "", kvarD: "", kvarQ: "", kvarLeadLag: "Lead",
      pqName: "", description: ""
    }));
    setTotalPower(0);
    toast.success("MCC/PCC added locally");
  }

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle>Add MCC/PCC</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div><Label>Plant Main Input</Label><select className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2" value={form.zoneId} onChange={(e) => setForm({...form, zoneId: e.target.value})}>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select></div>
          <div><Label>MCC/PCC Name</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
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

        <div className="flex items-end gap-2 pt-2"><Button onClick={() => void addMccPcc()}>Add Entry</Button></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>MCC/PCC recorded</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr><th className="text-left px-2 py-1">Plant Input</th><th className="text-left px-2 py-1">MCC/PCC Name</th><th className="text-left px-2 py-1">PQ Name</th><th className="text-left px-2 py-1">Total Power</th><th className="text-left px-2 py-1">Time</th></tr></thead><tbody>
          {areas.map((a) => (
            <React.Fragment key={a.id}>
              <tr className="border-t border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                <td className="px-2 py-2">{zones.find(z => z.id === a.zoneId)?.name || "Unknown"}</td>
                <td className="px-2 py-2">{a.name}</td>
                <td className="px-2 py-2">{a.pqName || "N/A"}</td>
                <td className="px-2 py-2 text-cyan-400 font-bold">{a.totalPower || 0} kW</td>
                <td className="px-2 py-2 text-[10px] text-slate-500">{new Date(a.createdAt || Date.now()).toLocaleString()}</td>
              </tr>
              {expanded === a.id && (
                <tr className="bg-slate-900/50"><td colSpan={5} className="px-4 py-3">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-slate-300">
                    <div><span className="block text-[10px] uppercase text-slate-500">V1 / V2 / V3</span>{(a as any).v1 ?? "-"}{(a as any).v2 !== undefined ? ` / ${(a as any).v2}` : ""}{(a as any).v3 !== undefined ? ` / ${(a as any).v3}` : ""}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">Uhtd 1 / 2 / 3</span>{(a as any).uhtd1 ?? "-"}{(a as any).uhtd2 !== undefined ? ` / ${(a as any).uhtd2}` : ""}{(a as any).uhtd3 !== undefined ? ` / ${(a as any).uhtd3}` : ""}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">I1 / I2 / I3</span>{(a as any).i1 ?? "-"}{(a as any).i2 !== undefined ? ` / ${(a as any).i2}` : ""}{(a as any).i3 !== undefined ? ` / ${(a as any).i3}` : ""}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">Ihtd 1 / 2 / 3</span>{(a as any).ihtd1 ?? "-"}{(a as any).ihtd2 !== undefined ? ` / ${(a as any).ihtd2}` : ""}{(a as any).ihtd3 !== undefined ? ` / ${(a as any).ihtd3}` : ""}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">Power Factor</span>{(a as any).pf ?? "-"}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">KVAr (D) / KVAr (Q)</span>{(a as any).kvarD ?? "-"} / {(a as any).kvarQ ?? "-"}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">KVAr Lead/Lag</span>{(a as any).kvarLeadLag ?? "-"}</div>
                    <div className="col-span-2"><span className="block text-[10px] uppercase text-slate-500">Description</span>{a.description || "N/A"}</div>
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

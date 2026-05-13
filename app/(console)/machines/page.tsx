"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { StarterType } from "@prisma/client";

export default function MotorLoadPage() {
  
  const [entry, setEntry] = useState({
    areaId: "",
    machineTag: "",
    starterType: "",
    ratedKw: "",
    ratedHp: "",
    voltage: "",
    current: "",
    kva: "",
    pf: "",
    kvar: "",
    measuredKw: "",
    description: "",
  });

  const zones = useAppStore((state) => state.zones);
  const areas = useAppStore((state) => state.areas);
  const entries = useAppStore((state) => state.entries);
  const addEntryAction = useAppStore((state) => state.addEntry);

  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!entry.areaId && areas.length > 0) {
      setEntry(prev => ({ ...prev, areaId: areas[0].id }));
    }
  }, [areas]);

  // Auto-calculate Rated HP when Rated kW changes
  useEffect(() => {
    if (entry.ratedKw) {
      const kw = Number(entry.ratedKw);
      if (!isNaN(kw)) {
        const hp = (kw * 1.34102).toFixed(2);
        setEntry(prev => ({ ...prev, ratedHp: hp }));
      }
    }
  }, [entry.ratedKw]);

  // Real-time calculation logic
  const v = Number(entry.voltage || 0);
  const i = Number(entry.current || 0);
  const pf = Number(entry.pf || 0);
  const mKw = Number(entry.measuredKw || 0);
  const rKw = Number(entry.ratedKw || 1); // fallback 1 to avoid div0

  const calculatedPower = (1.732 * v * i * pf) / 1000;
  const loadFactor = entry.ratedKw ? mKw / Number(entry.ratedKw) : 0;
  const isCritical = loadFactor > 1.3;

  async function addEntry() {
    if (!entry.areaId) return toast.error("Select MCC/PCC first");
    if (!entry.machineTag) return toast.error("Machine tag required");
    if (!entry.ratedKw) return toast.error("Rated kW required");

    const payload = {
      id: crypto.randomUUID(),
      areaId: entry.areaId,
      machineTag: entry.machineTag,
      starterType: entry.starterType as StarterType || "DOL",
      ratedKw: Number(entry.ratedKw),
      ratedHp: entry.ratedHp ? Number(entry.ratedHp) : undefined,
      voltage: entry.voltage ? Number(entry.voltage) : undefined,
      current: entry.current ? Number(entry.current) : undefined,
      kva: entry.kva ? Number(entry.kva) : undefined,
      pf: entry.pf ? Number(entry.pf) : undefined,
      kvar: entry.kvar ? Number(entry.kvar) : undefined,
      measuredKw: Number(entry.measuredKw),
      calculatedPower: calculatedPower,
      loadFactor: loadFactor,
      description: entry.description || undefined,
      createdAt: new Date().toISOString(),
      createdById: "local-user",
    };
    
    addEntryAction(payload);
    
    // Clear the input fields but keep the selected Area
    setEntry(prev => ({
      ...prev,
      machineTag: "",
      starterType: "",
      ratedKw: "",
      ratedHp: "",
      voltage: "",
      current: "",
      kva: "",
      pf: "",
      kvar: "",
      measuredKw: "",
      description: "",
    }));
    
    toast.success("Motor Load added locally");
  }

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle>Add Motor Load details</CardTitle></CardHeader><CardContent className="space-y-4">
        
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div><Label>MCC/PCC</Label><select className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2" value={entry.areaId} onChange={(e) => setEntry({ ...entry, areaId: e.target.value })}><option value="" disabled>Select MCC/PCC...</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.name} ({zones.find(z => z.id === a.zoneId)?.name || "Unknown"})</option>)}</select></div>
          <div><Label>Machine tag</Label><Input value={entry.machineTag} onChange={(e) => setEntry({ ...entry, machineTag: e.target.value })} /></div>
          <div><Label>Starter</Label><select className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2" value={entry.starterType} onChange={(e) => setEntry({ ...entry, starterType: e.target.value })}><option value="" disabled>Select starter...</option><option value="VFD">VFD</option><option value="SD">SD</option><option value="DOL">DOL</option></select></div>
          <div><Label>Rated kW</Label><Input type="number" value={entry.ratedKw} onChange={(e) => setEntry({ ...entry, ratedKw: e.target.value })} /></div>
          <div><Label>Rated HP</Label><Input type="number" value={entry.ratedHp} onChange={(e) => setEntry({ ...entry, ratedHp: e.target.value })} /></div>
          <div><Label>Voltage</Label><Input type="number" value={entry.voltage} onChange={(e) => setEntry({ ...entry, voltage: e.target.value })} /></div>
          <div><Label>Current</Label><Input type="number" value={entry.current} onChange={(e) => setEntry({ ...entry, current: e.target.value })} /></div>
          <div><Label>KVA</Label><Input type="number" value={entry.kva} onChange={(e) => setEntry({ ...entry, kva: e.target.value })} /></div>
          <div><Label>Power Factor (PF)</Label><Input type="number" step="0.001" value={entry.pf} onChange={(e) => setEntry({ ...entry, pf: e.target.value })} /></div>
          <div><Label>KVAr</Label><Input type="number" value={entry.kvar} onChange={(e) => setEntry({ ...entry, kvar: e.target.value })} /></div>
          <div><Label>Measured kW</Label><Input type="number" value={entry.measuredKw} onChange={(e) => setEntry({ ...entry, measuredKw: e.target.value })} /></div>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea className="h-20" placeholder="Add additional info..." value={entry.description} onChange={(e) => setEntry({ ...entry, description: e.target.value })} />
        </div>

        {/* Real-time Calculation Panel */}
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex gap-8">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Calculated Power (kW)</div>
            <div className="text-2xl text-cyan-400 font-bold">{calculatedPower.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Load Factor</div>
            <div className={cn("text-2xl font-bold transition-colors", isCritical ? "text-red-500" : "text-emerald-400")}>
              {loadFactor.toFixed(3)}
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2"><Button onClick={() => void addEntry()}>Add Motor Load</Button></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Motor Loads recorded</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr>
          <th className="text-left px-2 py-1">Plant/MCC/PCC</th>
          <th className="text-left px-2 py-1">Machine</th>
          <th className="text-left px-2 py-1">Rated kW</th>
          <th className="text-left px-2 py-1">Meas. kW</th>
          <th className="text-left px-2 py-1">Calc. Pwr</th>
          <th className="text-left px-2 py-1">Load Factor</th>
          <th className="text-left px-2 py-1">Time</th>
        </tr></thead><tbody>
          {entries.map((e) => {
            const area = areas.find(a => a.id === e.areaId);
            const zone = zones.find(z => z.id === area?.zoneId);
            return (
            <React.Fragment key={e.id}>
              <tr className="border-t border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                <td className="px-2 py-2"><span className="block">{area?.name || "Unknown"}</span><span className="text-[10px] text-slate-500">{zone?.name || "Unknown"}</span></td>
                <td className="px-2 py-2 font-mono">{e.machineTag}</td>
                <td className="px-2 py-2">{e.ratedKw}</td>
                <td className="px-2 py-2">{e.measuredKw}</td>
                <td className="px-2 py-2 text-cyan-400">{e.calculatedPower.toFixed(2)}</td>
                <td className={cn("px-2 py-2 font-bold", e.loadFactor > 1.3 ? "text-red-500" : "text-emerald-400")}>{e.loadFactor.toFixed(3)}</td>
                <td className="px-2 py-2 text-[10px] text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
              </tr>
              {expanded === e.id && (
                <tr className="bg-slate-900/50"><td colSpan={7} className="px-4 py-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-300">
                    <div><span className="block text-[10px] uppercase text-slate-500">Starter</span>{e.starterType}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">HP</span>{e.ratedHp ?? "N/A"}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">Voltage</span>{e.voltage ?? "N/A"}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">Current</span>{e.current ?? "N/A"}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">KVA</span>{e.kva ?? "N/A"}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">PF</span>{e.pf ?? "N/A"}</div>
                    <div><span className="block text-[10px] uppercase text-slate-500">KVAr</span>{e.kvar ?? "N/A"}</div>
                    <div className="col-span-2"><span className="block text-[10px] uppercase text-slate-500">Description</span>{e.description ?? "N/A"}</div>
                  </div>
                </td></tr>
              )}
            </React.Fragment>
            );
          })}
        </tbody></table></div>
      </CardContent></Card>
    </div>
  );
}

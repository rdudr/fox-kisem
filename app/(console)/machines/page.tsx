"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Zone = { id: string; name: string };
type Area = { id: string; name: string; zone: Zone };
type EntryRow = { 
  id: string; area: Area; machineTag: string; starterType: string; 
  calculatedPower: number; loadFactor: number; createdAt: string; 
  ratedKw: number; ratedHp?: number; voltage?: number; current?: number; 
  kva?: number; pf?: number; kvar?: number; measuredKw: number;
};

export default function MachinesPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  
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
  });

  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    const [aRes, eRes] = await Promise.all([fetch("/api/areas"), fetch("/api/machines")]);
    const aData = await aRes.json();
    const eData = await eRes.json();
    setAreas(aData.areas ?? []);
    setEntries(eData.entries ?? []);
  };

  React.useEffect(() => {
    void load();
  }, []);

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
    const payload = {
      ...entry,
      ratedKw: Number(entry.ratedKw),
      ratedHp: entry.ratedHp ? Number(entry.ratedHp) : undefined,
      voltage: entry.voltage ? Number(entry.voltage) : undefined,
      current: entry.current ? Number(entry.current) : undefined,
      kva: entry.kva ? Number(entry.kva) : undefined,
      pf: entry.pf ? Number(entry.pf) : undefined,
      kvar: entry.kvar ? Number(entry.kvar) : undefined,
      measuredKw: Number(entry.measuredKw),
    };
    const r = await fetch("/api/machines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) return toast.error("Entry save failed");
    
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
    }));
    
    await load(); 
    toast.success("Entry added");
  }

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle>Add machine details</CardTitle></CardHeader><CardContent className="space-y-4">
        
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div><Label>Area</Label><select className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2" value={entry.areaId} onChange={(e) => setEntry({ ...entry, areaId: e.target.value })}><option value="" disabled>Select Area...</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.name} (Zone: {a.zone?.name})</option>)}</select></div>
          <div><Label>Machine tag</Label><Input value={entry.machineTag} onChange={(e) => setEntry({ ...entry, machineTag: e.target.value })} /></div>
          <div><Label>Starter</Label><select className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2" value={entry.starterType} onChange={(e) => setEntry({ ...entry, starterType: e.target.value })}><option value="" disabled>Select starter...</option><option value="VFD">VFD</option><option value="SD">SD</option><option value="DOL">DOL</option></select></div>
          <div><Label>Rated kW</Label><Input type="number" value={entry.ratedKw} onChange={(e) => setEntry({ ...entry, ratedKw: e.target.value })} /></div>
          <div><Label>Rated HP</Label><Input type="number" value={entry.ratedHp} onChange={(e) => setEntry({ ...entry, ratedHp: e.target.value })} /></div>
          <div><Label>Voltage (V1)</Label><Input type="number" value={entry.voltage} onChange={(e) => setEntry({ ...entry, voltage: e.target.value })} /></div>
          <div><Label>Current (I1)</Label><Input type="number" value={entry.current} onChange={(e) => setEntry({ ...entry, current: e.target.value })} /></div>
          <div><Label>KVA</Label><Input type="number" value={entry.kva} onChange={(e) => setEntry({ ...entry, kva: e.target.value })} /></div>
          <div><Label>PF</Label><Input type="number" value={entry.pf} onChange={(e) => setEntry({ ...entry, pf: e.target.value })} /></div>
          <div><Label>KVAr</Label><Input type="number" value={entry.kvar} onChange={(e) => setEntry({ ...entry, kvar: e.target.value })} /></div>
          <div><Label>Measured kW</Label><Input type="number" value={entry.measuredKw} onChange={(e) => setEntry({ ...entry, measuredKw: e.target.value })} /></div>
        </div>

        {/* Real-time Calculation Panel */}
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex gap-8">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Calculated Power</div>
            <div className="text-2xl text-cyan-400 font-bold">{calculatedPower.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Load Factor</div>
            <div className={cn("text-2xl font-bold transition-colors", isCritical ? "text-red-500" : "text-emerald-400")}>
              {loadFactor.toFixed(3)}
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2"><Button onClick={() => void addEntry()}>Add machine entry</Button><Button variant="secondary" onClick={() => void load()}>Refresh</Button></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Machine entries</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr>
          <th className="text-left px-2 py-1">Area/Zone</th>
          <th className="text-left px-2 py-1">Machine</th>
          <th className="text-left px-2 py-1">Rated kW</th>
          <th className="text-left px-2 py-1">Meas. kW</th>
          <th className="text-left px-2 py-1">Calc. Pwr</th>
          <th className="text-left px-2 py-1">Load Factor</th>
          <th className="text-left px-2 py-1">Time</th>
        </tr></thead><tbody>
          {entries.map((e) => (
            <React.Fragment key={e.id}>
              <tr className="border-t border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                <td className="px-2 py-2"><span className="block">{e.area?.name}</span><span className="text-[10px] text-slate-500">{e.area?.zone?.name}</span></td>
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

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
import { useAuthStore } from "@/lib/auth-store";
import { StarterType } from "@prisma/client";
import { Camera, Image as ImageIcon } from "lucide-react";
import { capturePhotoFromDevice, savePhotoLocally, getFormattedDate, sanitizeName } from "@/lib/photo-capture";

export default function MotorLoadPage() {
  const [form, setForm] = useState({
    zoneId: "",
    pccId: "",
    mccId: "",
    machineTag: "",
    starterType: "",
    vfdFrequency: "",
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // Local state for photo capture
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(null);

  const zones = useAppStore((state) => state.zones);
  const areas = useAppStore((state) => state.areas);
  const entries = useAppStore((state) => state.entries);
  const addEntryAction = useAppStore((state) => state.addEntry);
  const updateEntryAction = useAppStore((state) => state.updateEntry);
  const deleteEntryAction = useAppStore((state) => state.deleteEntry);

  const pccPanels = areas.filter(a => a.type === "PCC");
  const mccPanels = areas.filter(a => a.type === "MCC");

  // Dropdown lists filtered by selected Zone
  const filteredPccPanels = pccPanels.filter(p => p.zoneId === form.zoneId);
  const filteredMccPanels = mccPanels.filter(m => m.zoneId === form.zoneId && (!form.pccId || m.pccId === form.pccId));

  // Initialize selected zone
  useEffect(() => {
    if (!form.zoneId && zones.length > 0) {
      setForm(prev => ({ ...prev, zoneId: zones[0].id }));
    }
  }, [zones]);

  // Adjust child panel selection when Zone changes
  useEffect(() => {
    if (form.zoneId) {
      const pccsInZone = pccPanels.filter(p => p.zoneId === form.zoneId);
      if (pccsInZone.length > 0) {
        const isCurrentPccInZone = pccsInZone.some(p => p.id === form.pccId);
        if (!isCurrentPccInZone) {
          setForm(prev => ({ ...prev, pccId: pccsInZone[0].id, mccId: "" }));
        }
      } else {
        setForm(prev => ({ ...prev, pccId: "", mccId: "" }));
      }
    }
  }, [form.zoneId, areas]);

  // Adjust MCC list/selection when parent PCC changes
  useEffect(() => {
    if (form.pccId) {
      const mccsForPcc = mccPanels.filter(m => m.pccId === form.pccId);
      if (mccsForPcc.length > 0) {
        const isCurrentMccValid = mccsForPcc.some(m => m.id === form.mccId);
        if (!isCurrentMccValid) {
          setForm(prev => ({ ...prev, mccId: mccsForPcc[0].id }));
        }
      } else {
        setForm(prev => ({ ...prev, mccId: "" }));
      }
    } else {
      setForm(prev => ({ ...prev, mccId: "" }));
    }
  }, [form.pccId, areas]);

  // Auto-calculate Rated HP when Rated kW changes
  useEffect(() => {
    if (form.ratedKw) {
      const kw = Number(form.ratedKw);
      if (!isNaN(kw)) {
        const hp = (kw * 1.34102).toFixed(2);
        setForm(prev => ({ ...prev, ratedHp: hp }));
      }
    }
  }, [form.ratedKw]);

  // Real-time calculation logic
  const v = Number(form.voltage || 0);
  const i = Number(form.current || 0);
  const pf = Number(form.pf || 0);
  const mKw = Number(form.measuredKw || 0);

  const calculatedPower = (1.732 * v * i * pf) / 1000;
  const loadFactor = form.ratedKw ? mKw / Number(form.ratedKw) : 0;
  const isCritical = loadFactor > 1.3;

  async function handleCapturePhoto() {
    try {
      const base64 = await capturePhotoFromDevice();
      setCapturedPhoto(base64);
      toast.success("Photo captured successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to capture photo");
    }
  }

  async function addEntry() {
    // Direct parent panel can be MCC (if selected) or PCC (if MCC not selected)
    const directParentAreaId = form.mccId || form.pccId;

    if (!directParentAreaId) return toast.error("Select a PCC or MCC Panel first");
    if (!form.machineTag) return toast.error("Machine tag required");
    if (!form.ratedKw) return toast.error("Rated kW required");

    let savedPath = existingPhotoPath;

    // Save photo if captured
    if (capturedPhoto && capturedPhoto.startsWith("data:")) {
      try {
        const cleanMachine = sanitizeName(form.machineTag) || "motor";
        
        const parentPcc = pccPanels.find(p => p.id === form.pccId);
        const cleanPccName = parentPcc ? sanitizeName(parentPcc.name) : "none";
        
        const parentMcc = mccPanels.find(m => m.id === form.mccId);
        const cleanMccName = parentMcc ? sanitizeName(parentMcc.name) : "none";
        
        const dateStr = getFormattedDate();

        // Path format: motorx_pccname_mccname_ddmm.jpg
        const fileName = `${cleanMachine}_${cleanPccName}_${cleanMccName}_${dateStr}`;
        savedPath = await savePhotoLocally(capturedPhoto, fileName);
      } catch (photoErr: any) {
        toast.error("Failed to save photo locally: " + photoErr.message);
        return;
      }
    }

    const payload = {
      id: editingId || crypto.randomUUID(),
      areaId: directParentAreaId,
      machineTag: form.machineTag,
      starterType: form.starterType as StarterType || "DOL",
      vfdFrequency: form.starterType === "VFD" && form.vfdFrequency ? Number(form.vfdFrequency) : undefined,
      ratedKw: Number(form.ratedKw),
      ratedHp: form.ratedHp ? Number(form.ratedHp) : undefined,
      voltage: form.voltage ? Number(form.voltage) : undefined,
      current: form.current ? Number(form.current) : undefined,
      kva: form.kva ? Number(form.kva) : undefined,
      pf: form.pf ? Number(form.pf) : undefined,
      kvar: form.kvar ? Number(form.kvar) : undefined,
      measuredKw: Number(form.measuredKw),
      calculatedPower: calculatedPower,
      loadFactor: loadFactor,
      photoPath: savedPath || undefined,
      description: form.description || undefined,
      recordedBy: editingId
        ? (entries.find(e => e.id === editingId)?.recordedBy || useAuthStore.getState().displayName || "Unknown")
        : (useAuthStore.getState().displayName || "Unknown"),
      createdAt: editingId
        ? (entries.find(e => e.id === editingId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
      createdById: "local-user",
    };
    
    if (editingId) {
      updateEntryAction(editingId, payload);
      toast.success("Motor Load updated locally");
    } else {
      addEntryAction(payload);
      toast.success("Motor Load added locally");
    }
    
    resetForm();
  }

  function resetForm() {
    setEditingId(null);
    setForm(prev => ({
      ...prev,
      machineTag: "",
      starterType: "",
      vfdFrequency: "",
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
    setCapturedPhoto(null);
    setExistingPhotoPath(null);
  }

  function handleEdit(e: any) {
    setEditingId(e.id);
    const parentArea = areas.find(a => a.id === e.areaId);
    
    let zId = "";
    let pId = "";
    let mId = "";

    if (parentArea) {
      zId = parentArea.zoneId || "";
      if (parentArea.type === "MCC") {
        mId = parentArea.id;
        pId = parentArea.pccId || "";
      } else {
        mId = "";
        pId = parentArea.id;
      }
    }

    setForm({
      zoneId: zId,
      pccId: pId,
      mccId: mId,
      machineTag: e.machineTag || "",
      starterType: e.starterType || "",
      vfdFrequency: e.vfdFrequency?.toString() || "",
      ratedKw: e.ratedKw?.toString() || "",
      ratedHp: e.ratedHp?.toString() || "",
      voltage: e.voltage?.toString() || "",
      current: e.current?.toString() || "",
      kva: e.kva?.toString() || "",
      pf: e.pf?.toString() || "",
      kvar: e.kvar?.toString() || "",
      measuredKw: e.measuredKw?.toString() || "",
      description: e.description || "",
    });

    setExistingPhotoPath(e.photoPath || null);
    setCapturedPhoto(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id: string) {
    if (confirm("Delete this motor load entry?")) {
      deleteEntryAction(id);
      toast.success("Motor Load deleted");
      if (editingId === id) resetForm();
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Motor Load details" : "Add Motor Load details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Plant Main Input</Label>
              <select 
                className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2 text-sm" 
                value={form.zoneId} 
                onChange={(e) => setForm({ ...form, zoneId: e.target.value, pccId: "", mccId: "" })}
              >
                <option value="" disabled>Select Plant Input...</option>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            
            <div>
              <Label>PCC Panel</Label>
              <select 
                className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2 text-sm" 
                value={form.pccId} 
                onChange={(e) => setForm({ ...form, pccId: e.target.value, mccId: "" })}
              >
                <option value="" disabled>Select PCC...</option>
                {filteredPccPanels.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <Label>MCC Panel</Label>
              <select 
                className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2 text-sm" 
                value={form.mccId} 
                onChange={(e) => setForm({ ...form, mccId: e.target.value })}
              >
                <option value="">None (Fed directly from PCC)</option>
                {filteredMccPanels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div>
              <Label>Machine tag</Label>
              <Input value={form.machineTag} onChange={(e) => setForm({ ...form, machineTag: e.target.value })} placeholder="e.g. Motor-1" />
            </div>
            
            <div>
              <Label>Starter</Label>
              <select 
                className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2 text-sm" 
                value={form.starterType} 
                onChange={(e) => setForm({ ...form, starterType: e.target.value })}
              >
                <option value="" disabled>Select starter...</option>
                <option value="VFD">VFD</option>
                <option value="SD">SD</option>
                <option value="DOL">DOL</option>
              </select>
            </div>

            {form.starterType === "VFD" && (
              <div>
                <Label>VFD Frequency (Hz)</Label>
                <Input type="number" value={form.vfdFrequency} onChange={(e) => setForm({ ...form, vfdFrequency: e.target.value })} />
              </div>
            )}
            
            <div><Label>Rated kW</Label><Input type="number" value={form.ratedKw} onChange={(e) => setForm({ ...form, ratedKw: e.target.value })} /></div>
            <div><Label>Rated HP</Label><Input type="number" value={form.ratedHp} onChange={(e) => setForm({ ...form, ratedHp: e.target.value })} /></div>
            <div><Label>Voltage</Label><Input type="number" value={form.voltage} onChange={(e) => setForm({ ...form, voltage: e.target.value })} /></div>
            <div><Label>Current</Label><Input type="number" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} /></div>
            <div><Label>KVA</Label><Input type="number" value={form.kva} onChange={(e) => setForm({ ...form, kva: e.target.value })} /></div>
            <div><Label>Power Factor (PF)</Label><Input type="number" step="0.001" value={form.pf} onChange={(e) => setForm({ ...form, pf: e.target.value })} /></div>
            <div><Label>KVAr</Label><Input type="number" value={form.kvar} onChange={(e) => setForm({ ...form, kvar: e.target.value })} /></div>
            <div><Label>Measured kW</Label><Input type="number" value={form.measuredKw} onChange={(e) => setForm({ ...form, measuredKw: e.target.value })} /></div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-white/5">
            <div>
              <Label>Description</Label>
              <Textarea className="h-24" placeholder="Add additional info..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Machine Photo (Saved locally on device)</Label>
              <div className="mt-1 flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={handleCapturePhoto} className="flex-1 gap-2 h-9 text-xs">
                    <Camera className="size-4" />
                    Capture Photo
                  </Button>
                  {(capturedPhoto || existingPhotoPath) && (
                    <Button type="button" variant="ghost" onClick={() => { setCapturedPhoto(null); setExistingPhotoPath(null); }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3">
                      Clear
                    </Button>
                  )}
                </div>
                {capturedPhoto && (
                  <div className="relative border border-cyan-500/30 rounded-lg p-2 bg-slate-900 flex items-center gap-3">
                    <img src={capturedPhoto} alt="Preview" className="h-12 w-16 object-cover rounded bg-black" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-emerald-400 font-medium">New photo captured</p>
                      <p className="text-[9px] text-slate-500 truncate">Will save on submit</p>
                    </div>
                  </div>
                )}
                {!capturedPhoto && existingPhotoPath && (
                  <div className="border border-white/10 rounded-lg p-2 bg-slate-900 flex items-center gap-3">
                    <div className="h-12 w-16 rounded bg-slate-950 flex items-center justify-center text-slate-500 border border-white/5">
                      <ImageIcon className="size-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-cyan-300 font-medium">Saved photo path:</p>
                      <p className="text-[9px] text-slate-400 truncate font-mono" title={existingPhotoPath}>{existingPhotoPath}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
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

          <div className="flex items-end gap-2">
            <Button onClick={() => void addEntry()}>{editingId ? "Update Entry" : "Add Motor Load"}</Button>
            {editingId && <Button variant="secondary" onClick={resetForm}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motor Loads Recorded</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-white/10">
                    <th className="text-left px-2 py-2">Plant / Panel</th>
                    <th className="text-left px-2 py-2">Machine</th>
                    <th className="text-left px-2 py-2">Rated kW</th>
                    <th className="text-left px-2 py-2">Meas. kW</th>
                    <th className="text-left px-2 py-2">Calc. Pwr</th>
                    <th className="text-left px-2 py-2">Load Factor</th>
                    <th className="text-left px-2 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const area = areas.find(a => a.id === e.areaId);
                    const zone = zones.find(z => z.id === area?.zoneId);
                    
                    let panelHierarchy = "N/A";
                    if (area) {
                      if (area.type === "MCC") {
                        const parentPcc = areas.find(p => p.id === area.pccId);
                        panelHierarchy = `${parentPcc ? parentPcc.name : "Direct PCC"} → ${area.name}`;
                      } else {
                        panelHierarchy = `${area.name} (Direct)`;
                      }
                    }

                    return (
                      <React.Fragment key={e.id}>
                        <tr 
                          className="border-t border-white/5 hover:bg-white/5 cursor-pointer" 
                          onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                        >
                          <td className="px-2 py-3">
                            <span className="block font-medium text-slate-200">{panelHierarchy}</span>
                            <span className="text-[10px] text-slate-500">{zone?.name || "Unknown Zone"}</span>
                          </td>
                          <td className="px-2 py-3 font-mono font-bold text-cyan-300">{e.machineTag}</td>
                          <td className="px-2 py-3 text-slate-300">{e.ratedKw}</td>
                          <td className="px-2 py-3 text-slate-300">{e.measuredKw}</td>
                          <td className="px-2 py-3 text-cyan-400">{Number(e.calculatedPower ?? 0).toFixed(2)} kW</td>
                          <td className={cn("px-2 py-3 font-bold", (e.loadFactor ?? 0) > 1.3 ? "text-red-500" : "text-emerald-400")}>
                            {Number(e.loadFactor ?? 0).toFixed(3)}
                          </td>
                          <td className="px-2 py-3 text-[10px] text-slate-500">
                            {new Date(e.createdAt).toLocaleString("en-IN")}
                          </td>
                        </tr>
                        {expanded === e.id && (
                          <tr className="bg-slate-900/50">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-300">
                                <div><span className="block text-[10px] uppercase text-slate-500">Starter</span>{e.starterType}</div>
                                {e.starterType === "VFD" && <div><span className="block text-[10px] uppercase text-slate-500">VFD Frequency</span>{e.vfdFrequency ?? "N/A"} Hz</div>}
                                <div><span className="block text-[10px] uppercase text-slate-500">HP</span>{e.ratedHp ?? "N/A"}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">Voltage</span>{e.voltage ?? "N/A"}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">Current</span>{e.current ?? "N/A"}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">KVA</span>{e.kva ?? "N/A"}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">PF</span>{e.pf ?? "N/A"}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">KVAr</span>{e.kvar ?? "N/A"}</div>
                                <div className="col-span-2">
                                  <span className="block text-[10px] uppercase text-slate-500">Photo Path</span>
                                  <span className="text-[10px] font-mono break-all text-slate-400">{e.photoPath || "No photo captured"}</span>
                                </div>
                                <div className="col-span-2"><span className="block text-[10px] uppercase text-slate-500">Description</span>{e.description ?? "N/A"}</div>
                                <div className="col-span-full pt-4 flex justify-end gap-2">
                                  <Button variant="secondary" size="sm" onClick={(ev) => { ev.stopPropagation(); handleEdit(e); }}>Edit</Button>
                                  <Button variant="destructive" size="sm" onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}>Delete</Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No motor load entries recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

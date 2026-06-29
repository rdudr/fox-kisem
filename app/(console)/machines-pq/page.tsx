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

export default function MotorLoadPQPage() {
  const [form, setForm] = useState({
    zoneId: "",
    pccId: "",
    mccId: "",
    machineTag: "",
    starterType: "",
    vfdFrequency: "",
    ratedKw: "",
    ratedHp: "",
    measuredKw: "",
    description: "",
    // PQ fields
    pqName: "",
    recordingNameId: "",
    v1: "", v2: "", v3: "",
    uthd1: "", uthd2: "", uthd3: "",
    i1: "", i2: "", i3: "",
    ithd1: "", ithd2: "", ithd3: "",
    pf: "",
    kvarD: "",
    kvarQ: "",
    kvarLeadLag: "Lag",
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
  const v1 = Number(form.v1 || 0);
  const v2 = Number(form.v2 || 0);
  const v3 = Number(form.v3 || 0);
  const i1 = Number(form.i1 || 0);
  const i2 = Number(form.i2 || 0);
  const i3 = Number(form.i3 || 0);
  const pf = Number(form.pf || 0);
  const mKw = Number(form.measuredKw || 0);

  let avgV = 0;
  let avgI = 0;
  const vCount = (form.v1 ? 1 : 0) + (form.v2 ? 1 : 0) + (form.v3 ? 1 : 0);
  const iCount = (form.i1 ? 1 : 0) + (form.i2 ? 1 : 0) + (form.i3 ? 1 : 0);

  if (vCount > 0) avgV = (v1 + v2 + v3) / vCount;
  if (iCount > 0) avgI = (i1 + i2 + i3) / iCount;

  const calculatedPower = avgV > 0 && avgI > 0 && pf > 0 ? (1.732 * avgV * avgI * pf) / 1000 : 0;
  const loadFactor = form.ratedKw ? mKw / Number(form.ratedKw) : 0;
  const isCritical = loadFactor > 1.3;

  const pqEntries = entries.filter(e => e.entryType === "PQ");

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

        // Path format: pq_motorx_pccname_mccname_ddmm.jpg
        const fileName = `pq_${cleanMachine}_${cleanPccName}_${cleanMccName}_${dateStr}`;
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
      voltage: avgV || undefined,
      current: avgI || undefined,
      kva: avgV && avgI ? (1.732 * avgV * avgI) / 1000 : undefined,
      pf: form.pf ? Number(form.pf) : undefined,
      kvar: form.kvarD ? Number(form.kvarD) : undefined, // fallback to kvarD
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
      
      // PQ fields
      entryType: "PQ" as const,
      pqName: form.pqName || undefined,
      recordingNameId: form.recordingNameId || undefined,
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
      kvarD: form.kvarD ? Number(form.kvarD) : undefined,
      kvarQ: form.kvarQ ? Number(form.kvarQ) : undefined,
      kvarLeadLag: form.kvarLeadLag,
    };
    
    if (editingId) {
      updateEntryAction(editingId, payload);
      toast.success("Motor Load PQ updated locally");
    } else {
      addEntryAction(payload);
      toast.success("Motor Load PQ added locally");
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
      measuredKw: "",
      description: "",
      pqName: "",
      recordingNameId: "",
      v1: "", v2: "", v3: "",
      uthd1: "", uthd2: "", uthd3: "",
      i1: "", i2: "", i3: "",
      ithd1: "", ithd2: "", ithd3: "",
      pf: "",
      kvarD: "",
      kvarQ: "",
      kvarLeadLag: "Lag",
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
      measuredKw: e.measuredKw?.toString() || "",
      description: e.description || "",
      pqName: e.pqName || "",
      recordingNameId: e.recordingNameId || "",
      v1: e.v1?.toString() || "",
      v2: e.v2?.toString() || "",
      v3: e.v3?.toString() || "",
      uthd1: e.uthd1?.toString() || "",
      uthd2: e.uthd2?.toString() || "",
      uthd3: e.uthd3?.toString() || "",
      i1: e.i1?.toString() || "",
      i2: e.i2?.toString() || "",
      i3: e.i3?.toString() || "",
      ithd1: e.ithd1?.toString() || "",
      ithd2: e.ithd2?.toString() || "",
      ithd3: e.ithd3?.toString() || "",
      pf: e.pf?.toString() || "",
      kvarD: e.kvarD?.toString() || "",
      kvarQ: e.kvarQ?.toString() || "",
      kvarLeadLag: e.kvarLeadLag || "Lag",
    });

    setExistingPhotoPath(e.photoPath || null);
    setCapturedPhoto(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id: string) {
    if (confirm("Delete this motor load PQ entry?")) {
      deleteEntryAction(id);
      toast.success("Motor Load PQ deleted");
      if (editingId === id) resetForm();
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Motor Load PQ details" : "Add Motor Load PQ details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-white/5">
            <div>
              <Label>Machine Tag / Name</Label>
              <Input value={form.machineTag} onChange={(e) => setForm({ ...form, machineTag: e.target.value })} placeholder="e.g. PQ-Motor-1" />
            </div>
            <div>
              <Label>PQ Name</Label>
              <select 
                className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2 text-sm" 
                value={form.pqName} 
                onChange={(e) => setForm({...form, pqName: e.target.value})}
              >
                <option value="">Select...</option>
                <option value="Hioki">Hioki</option>
                <option value="ALM36">ALM36</option>
                <option value="ALM31">ALM31</option>
                <option value="ALM45">ALM45</option>
                <option value="LM20">LM20</option>
              </select>
            </div>
            <div>
              <Label>Recording ID</Label>
              <Input value={form.recordingNameId} onChange={(e) => setForm({ ...form, recordingNameId: e.target.value })} placeholder="e.g. REC002" />
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
          </div>

          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6 pt-2 border-t border-white/5">
            <div><Label>V1</Label><Input type="number" value={form.v1} onChange={(e) => setForm({...form, v1: e.target.value})} /></div>
            <div><Label>V2</Label><Input type="number" value={form.v2} onChange={(e) => setForm({...form, v2: e.target.value})} /></div>
            <div><Label>V3</Label><Input type="number" value={form.v3} onChange={(e) => setForm({...form, v3: e.target.value})} /></div>
            <div><Label>Uthd1 (%)</Label><Input type="number" value={form.uthd1} onChange={(e) => setForm({...form, uthd1: e.target.value})} /></div>
            <div><Label>Uthd2 (%)</Label><Input type="number" value={form.uthd2} onChange={(e) => setForm({...form, uthd2: e.target.value})} /></div>
            <div><Label>Uthd3 (%)</Label><Input type="number" value={form.uthd3} onChange={(e) => setForm({...form, uthd3: e.target.value})} /></div>
            
            <div><Label>I1</Label><Input type="number" value={form.i1} onChange={(e) => setForm({...form, i1: e.target.value})} /></div>
            <div><Label>I2</Label><Input type="number" value={form.i2} onChange={(e) => setForm({...form, i2: e.target.value})} /></div>
            <div><Label>I3</Label><Input type="number" value={form.i3} onChange={(e) => setForm({...form, i3: e.target.value})} /></div>
            <div><Label>Ithd1 (%)</Label><Input type="number" value={form.ithd1} onChange={(e) => setForm({...form, ithd1: e.target.value})} /></div>
            <div><Label>Ithd2 (%)</Label><Input type="number" value={form.ithd2} onChange={(e) => setForm({...form, ithd2: e.target.value})} /></div>
            <div><Label>Ithd3 (%)</Label><Input type="number" value={form.ithd3} onChange={(e) => setForm({...form, ithd3: e.target.value})} /></div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 pt-2 border-t border-white/5">
            <div><Label>Power Factor (PF)</Label><Input type="number" step="0.001" value={form.pf} onChange={(e) => setForm({...form, pf: e.target.value})} /></div>
            <div><Label>KVAr (D)</Label><Input type="number" value={form.kvarD} onChange={(e) => setForm({...form, kvarD: e.target.value})} /></div>
            <div><Label>KVAr (Q)</Label><Input type="number" value={form.kvarQ} onChange={(e) => setForm({...form, kvarQ: e.target.value})} /></div>
            <div>
              <Label>KVAr Style</Label>
              <div className="flex gap-2 mt-1">
                <Button type="button" variant={form.kvarLeadLag === "Lead" ? "default" : "secondary"} className="flex-1 h-9 text-xs" onClick={() => setForm({...form, kvarLeadLag: "Lead"})}>Lead</Button>
                <Button type="button" variant={form.kvarLeadLag === "Lag" ? "default" : "secondary"} className="flex-1 h-9 text-xs" onClick={() => setForm({...form, kvarLeadLag: "Lag"})}>Lag</Button>
              </div>
            </div>
            {form.starterType === "VFD" && (
              <div>
                <Label>VFD Frequency (Hz)</Label>
                <Input type="number" value={form.vfdFrequency} onChange={(e) => setForm({ ...form, vfdFrequency: e.target.value })} />
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-white/5">
            <div><Label>Rated kW</Label><Input type="number" value={form.ratedKw} onChange={(e) => setForm({ ...form, ratedKw: e.target.value })} /></div>
            <div><Label>Rated HP</Label><Input type="number" value={form.ratedHp} onChange={(e) => setForm({ ...form, ratedHp: e.target.value })} /></div>
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
            <Button onClick={() => void addEntry()}>{editingId ? "Update Entry" : "Add Motor Load PQ"}</Button>
            {editingId && <Button variant="secondary" onClick={resetForm}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motor Load PQ Records</CardTitle>
        </CardHeader>
        <CardContent>
          {pqEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-white/10">
                    <th className="text-left px-2 py-2">Plant / Panel</th>
                    <th className="text-left px-2 py-2">Machine</th>
                    <th className="text-left px-2 py-2">PQ Name</th>
                    <th className="text-left px-2 py-2">Rated kW</th>
                    <th className="text-left px-2 py-2">Meas. kW</th>
                    <th className="text-left px-2 py-2">Calc. Pwr</th>
                    <th className="text-left px-2 py-2">Load Factor</th>
                    <th className="text-left px-2 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {pqEntries.map((e) => {
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
                          <td className="px-2 py-3 text-slate-300">{e.pqName || "N/A"}</td>
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
                            <td colSpan={8} className="px-4 py-3">
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-slate-300">
                                <div><span className="block text-[10px] uppercase text-slate-500">Starter</span>{e.starterType}</div>
                                {e.starterType === "VFD" && <div><span className="block text-[10px] uppercase text-slate-500">VFD Frequency</span>{e.vfdFrequency ?? "N/A"} Hz</div>}
                                <div><span className="block text-[10px] uppercase text-slate-500">HP</span>{e.ratedHp ?? "N/A"}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">Recording ID</span>{e.recordingNameId || "N/A"}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">V1 / V2 / V3</span>{e.v1 ?? "-"}{e.v2 !== undefined ? ` / ${e.v2}` : ""}{e.v3 !== undefined ? ` / ${e.v3}` : ""}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">Uthd 1 / 2 / 3</span>{e.uthd1 ?? "-"}{e.uthd2 !== undefined ? ` / ${e.uthd2}` : ""}{e.uthd3 !== undefined ? ` / ${e.uthd3}` : ""}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">I1 / I2 / I3</span>{e.i1 ?? "-"}{e.i2 !== undefined ? ` / ${e.i2}` : ""}{e.i3 !== undefined ? ` / ${e.i3}` : ""}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">Ithd 1 / 2 / 3</span>{e.ithd1 ?? "-"}{e.ithd2 !== undefined ? ` / ${e.ithd2}` : ""}{e.ithd3 !== undefined ? ` / ${e.ithd3}` : ""}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">PF</span>{e.pf ?? "N/A"}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">KVAr (D) / KVAr (Q)</span>{e.kvarD ?? "-"} / {e.kvarQ ?? "-"}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">KVAr Style</span>{e.kvarLeadLag ?? "N/A"}</div>
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
            <p className="text-slate-400 text-sm">No motor load PQ entries recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

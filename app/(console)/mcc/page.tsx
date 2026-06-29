"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { Camera, Image as ImageIcon } from "lucide-react";
import { capturePhotoFromDevice, savePhotoLocally, getFormattedDate, sanitizeName } from "@/lib/photo-capture";

export default function MccPage() {
  const [form, setForm] = useState({
    zoneId: "", pccId: "", name: "",
    pqName: "", recordingNameId: "",
    v1: "", v2: "", v3: "",
    uthd1: "", uthd2: "", uthd3: "",
    i1: "", i2: "", i3: "",
    ithd1: "", ithd2: "", ithd3: "",
    pf: "", kvarD: "", kvarQ: "", kvarLeadLag: "Lag",
    description: ""
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [totalPower, setTotalPower] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // Local state for photo capturing
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(null);

  const zones = useAppStore((state) => state.zones);
  const areas = useAppStore((state) => state.areas);
  const addAreaAction = useAppStore((state) => state.addArea);
  const updateAreaAction = useAppStore((state) => state.updateArea);
  const deleteAreaAction = useAppStore((state) => state.deleteArea);

  const mccPanels = areas.filter(a => a.type === "MCC");
  const pccPanels = areas.filter(a => a.type === "PCC");

  // Filter PCC panels belonging to the selected Zone
  const filteredPccPanels = pccPanels.filter(p => p.zoneId === form.zoneId);

  useEffect(() => {
    if (!form.zoneId && zones.length > 0) {
      setForm(prev => ({ ...prev, zoneId: zones[0].id }));
    }
  }, [zones]);

  // When Zone changes, optionally auto-select or reset selected PCC panel
  useEffect(() => {
    if (form.zoneId) {
      const pccsInZone = pccPanels.filter(p => p.zoneId === form.zoneId);
      if (pccsInZone.length > 0) {
        // If current selected PCC is not in this zone, reset or select first
        const isCurrentPccInZone = pccsInZone.some(p => p.id === form.pccId);
        if (!isCurrentPccInZone) {
          setForm(prev => ({ ...prev, pccId: pccsInZone[0].id }));
        }
      } else {
        setForm(prev => ({ ...prev, pccId: "" }));
      }
    }
  }, [form.zoneId, areas]);

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

  async function handleCapturePhoto() {
    try {
      const base64 = await capturePhotoFromDevice();
      setCapturedPhoto(base64);
      toast.success("Photo captured successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to capture photo");
    }
  }

  async function addMcc() {
    if (!form.zoneId) return toast.error("Select a Plant Main Input first");
    if (!form.name) return toast.error("MCC panel name required");

    let savedPath = existingPhotoPath;

    // Save photo if captured/changed
    if (capturedPhoto && capturedPhoto.startsWith("data:")) {
      try {
        const cleanMccName = sanitizeName(form.name) || "mcc";
        const parentPcc = pccPanels.find(p => p.id === form.pccId);
        const cleanPccName = parentPcc ? sanitizeName(parentPcc.name) : "none";
        const dateStr = getFormattedDate();
        
        // Name format: mccname_pccname_ddmm
        const fileName = `${cleanMccName}_${cleanPccName}_${dateStr}`;
        savedPath = await savePhotoLocally(capturedPhoto, fileName);
      } catch (photoErr: any) {
        toast.error("Failed to save photo locally: " + photoErr.message);
        return;
      }
    }

    const payload = {
      id: editingId || crypto.randomUUID(),
      zoneId: form.zoneId,
      pccId: form.pccId || null,
      name: form.name,
      type: "MCC" as const,
      photoPath: savedPath || undefined,
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
      recordedBy: editingId
        ? (areas.find(a => a.id === editingId)?.recordedBy || useAuthStore.getState().displayName || "Unknown")
        : (useAuthStore.getState().displayName || "Unknown"),
      createdAt: editingId
        ? (areas.find(a => a.id === editingId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
    };
    
    if (editingId) {
      updateAreaAction(editingId, payload);
      toast.success("MCC Panel updated locally");
    } else {
      addAreaAction(payload);
      toast.success("MCC Panel added locally");
    }
    
    resetForm();
  }

  function resetForm() {
    setEditingId(null);
    setForm(prev => ({
      ...prev,
      name: "",
      pccId: "",
      pqName: "", recordingNameId: "",
      v1: "", v2: "", v3: "",
      uthd1: "", uthd2: "", uthd3: "",
      i1: "", i2: "", i3: "",
      ithd1: "", ithd2: "", ithd3: "",
      pf: "", kvarD: "", kvarQ: "", kvarLeadLag: "Lag",
      description: ""
    }));
    setCapturedPhoto(null);
    setExistingPhotoPath(null);
    setTotalPower(0);
  }

  function handleEdit(a: any) {
    setEditingId(a.id);
    setForm({
      zoneId: a.zoneId || "",
      pccId: a.pccId || "",
      name: a.name || "",
      pqName: a.pqName || "",
      recordingNameId: a.recordingNameId || "",
      v1: a.v1?.toString() || "", v2: a.v2?.toString() || "", v3: a.v3?.toString() || "",
      uthd1: a.uthd1?.toString() || "", uthd2: a.uthd2?.toString() || "", uthd3: a.uthd3?.toString() || "",
      i1: a.i1?.toString() || "", i2: a.i2?.toString() || "", i3: a.i3?.toString() || "",
      ithd1: a.ithd1?.toString() || "", ithd2: a.ithd2?.toString() || "", ithd3: a.ithd3?.toString() || "",
      pf: a.pf?.toString() || "",
      kvarD: a.kvarD?.toString() || "", kvarQ: a.kvarQ?.toString() || "", kvarLeadLag: a.kvarLeadLag || "Lag",
      description: a.description || ""
    });
    setExistingPhotoPath(a.photoPath || null);
    setCapturedPhoto(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this MCC Panel? All connected motor load data will also be deleted.")) {
      deleteAreaAction(id);
      toast.success("MCC Panel deleted");
      if (editingId === id) resetForm();
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit MCC Panel" : "Add MCC Panel"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            <div>
              <Label>Plant Main Input</Label>
              <select 
                className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2 text-sm" 
                value={form.zoneId} 
                onChange={(e) => setForm({...form, zoneId: e.target.value})}
              >
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Parent PCC Panel</Label>
              <select 
                className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2 text-sm" 
                value={form.pccId} 
                onChange={(e) => setForm({...form, pccId: e.target.value})}
              >
                <option value="">None (Fed directly)</option>
                {filteredPccPanels.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <Label>MCC Panel Name</Label>
              <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. MCC-1" />
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
              <Input value={form.recordingNameId} onChange={(e) => setForm({...form, recordingNameId: e.target.value})} placeholder="e.g. REC001" />
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
            <div>
              <Label>Total Power (Real-time)</Label>
              <div className="h-9 flex items-center px-3 bg-slate-900 border border-white/10 rounded-md text-cyan-400 font-bold text-sm">
                {totalPower} kW
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-white/5">
            <div>
              <Label>Description</Label>
              <Textarea className="h-24" placeholder="Add additional info..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
            </div>
            <div>
              <Label>Panel Photo (Saved locally on device)</Label>
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

          <div className="flex items-end gap-2 pt-2">
            <Button onClick={() => void addMcc()}>{editingId ? "Update Entry" : "Add Entry"}</Button>
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MCC Panels Recorded</CardTitle>
        </CardHeader>
        <CardContent>
          {mccPanels.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-white/10">
                    <th className="text-left px-2 py-2">Plant Input</th>
                    <th className="text-left px-2 py-2">Parent PCC</th>
                    <th className="text-left px-2 py-2">MCC Name</th>
                    <th className="text-left px-2 py-2">PQ Name</th>
                    <th className="text-left px-2 py-2">Total Power</th>
                    <th className="text-left px-2 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {mccPanels.map((a) => (
                    <React.Fragment key={a.id}>
                      <tr 
                        className="border-t border-white/5 hover:bg-white/5 cursor-pointer" 
                        onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                      >
                        <td className="px-2 py-3">{zones.find(z => z.id === a.zoneId)?.name || "Unknown"}</td>
                        <td className="px-2 py-3 text-cyan-300">{pccPanels.find(p => p.id === a.pccId)?.name || "Direct Feed"}</td>
                        <td className="px-2 py-3 font-semibold text-slate-200">{a.name}</td>
                        <td className="px-2 py-3 text-slate-300">{a.pqName || "N/A"}</td>
                        <td className="px-2 py-3 text-cyan-400 font-bold">{a.totalPower || 0} kW</td>
                        <td className="px-2 py-3 text-[10px] text-slate-500">
                          {new Date(a.createdAt || Date.now()).toLocaleString("en-IN")}
                        </td>
                      </tr>
                      {expanded === a.id && (
                        <tr className="bg-slate-900/50">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-slate-300">
                              <div><span className="block text-[10px] uppercase text-slate-500">V1 / V2 / V3</span>{a.v1 ?? "-"}{a.v2 !== undefined ? ` / ${a.v2}` : ""}{a.v3 !== undefined ? ` / ${a.v3}` : ""}</div>
                              <div><span className="block text-[10px] uppercase text-slate-500">Uthd 1 / 2 / 3</span>{a.uthd1 ?? "-"}{a.uthd2 !== undefined ? ` / ${a.uthd2}` : ""}{a.uthd3 !== undefined ? ` / ${a.uthd3}` : ""}</div>
                              <div><span className="block text-[10px] uppercase text-slate-500">I1 / I2 / I3</span>{a.i1 ?? "-"}{a.i2 !== undefined ? ` / ${a.i2}` : ""}{a.i3 !== undefined ? ` / ${a.i3}` : ""}</div>
                              <div><span className="block text-[10px] uppercase text-slate-500">Ithd 1 / 2 / 3</span>{a.ithd1 ?? "-"}{a.ithd2 !== undefined ? ` / ${a.ithd2}` : ""}{a.ithd3 !== undefined ? ` / ${a.ithd3}` : ""}</div>
                              <div><span className="block text-[10px] uppercase text-slate-500">Power Factor</span>{a.pf ?? "-"}</div>
                              <div><span className="block text-[10px] uppercase text-slate-500">KVAr (D) / KVAr (Q)</span>{a.kvarD ?? "-"} / {a.kvarQ ?? "-"}</div>
                              <div><span className="block text-[10px] uppercase text-slate-500">KVAr Style</span>{a.kvarLeadLag ?? "-"}</div>
                              <div><span className="block text-[10px] uppercase text-slate-500">Recording ID</span>{a.recordingNameId || "N/A"}</div>
                              <div className="col-span-2">
                                <span className="block text-[10px] uppercase text-slate-500">Photo Path</span>
                                <span className="text-[10px] font-mono break-all text-slate-400">{a.photoPath || "No photo captured"}</span>
                              </div>
                              <div className="col-span-2"><span className="block text-[10px] uppercase text-slate-500">Description</span>{a.description || "N/A"}</div>
                              <div className="col-span-full pt-2 flex justify-end gap-2">
                                <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(a); }}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}>Delete</Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No MCC panels recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

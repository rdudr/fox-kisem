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

export default function ApfcPage() {
  const [form, setForm] = useState({
    zoneId: "",
    areaId: "", // Combined PCC / MCC
    stage: "",
    ratedCapacitorValue: "",
    voltage: "",
    iR: "",
    iY: "",
    iB: "",
    remark: "",
    description: ""
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // Local state for photo capture
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(null);

  const zones = useAppStore((state) => state.zones);
  const areas = useAppStore((state) => state.areas); // Combined PCC/MCC
  const apfcs = useAppStore((state) => state.apfcs || []);
  const addApfcAction = useAppStore((state) => state.addApfc);
  const updateApfcAction = useAppStore((state) => state.updateApfc);
  const deleteApfcAction = useAppStore((state) => state.deleteApfc);

  // Initialize selected zone
  useEffect(() => {
    if (!form.zoneId && zones.length > 0) {
      setForm(prev => ({ ...prev, zoneId: zones[0].id }));
    }
  }, [zones]);

  // Filter panels belonging to the selected Zone
  const filteredPanels = areas.filter(a => a.zoneId === form.zoneId);

  // When Zone changes, optionally auto-select or reset selected panel
  useEffect(() => {
    if (form.zoneId) {
      const panelsInZone = areas.filter(a => a.zoneId === form.zoneId);
      if (panelsInZone.length > 0) {
        const isCurrentPanelValid = panelsInZone.some(a => a.id === form.areaId);
        if (!isCurrentPanelValid) {
          setForm(prev => ({ ...prev, areaId: panelsInZone[0].id }));
        }
      } else {
        setForm(prev => ({ ...prev, areaId: "" }));
      }
    }
  }, [form.zoneId, areas]);

  async function handleCapturePhoto() {
    try {
      const base64 = await capturePhotoFromDevice();
      setCapturedPhoto(base64);
      toast.success("Photo captured successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to capture photo");
    }
  }

  async function handleAddApfc() {
    if (!form.stage) return toast.error("Stage is required");

    let savedPath = existingPhotoPath;

    // Save photo if captured
    if (capturedPhoto && capturedPhoto.startsWith("data:")) {
      try {
        const cleanStage = sanitizeName(form.stage) || "stage";
        
        const parentPanel = areas.find(a => a.id === form.areaId);
        const parentZone = zones.find(z => z.id === form.zoneId);
        const locationLabel = parentPanel ? parentPanel.name : (parentZone ? parentZone.name : "direct");
        const cleanLocation = sanitizeName(locationLabel) || "location";
        
        const dateStr = getFormattedDate();

        // Path format: apfc_stage_location_ddmm.jpg
        const fileName = `apfc_${cleanStage}_${cleanLocation}_${dateStr}`;
        savedPath = await savePhotoLocally(capturedPhoto, fileName);
      } catch (photoErr: any) {
        toast.error("Failed to save photo locally: " + photoErr.message);
        return;
      }
    }

    const payload = {
      id: editingId || crypto.randomUUID(),
      zoneId: form.zoneId || undefined,
      areaId: form.areaId || undefined,
      stage: form.stage ? Number(form.stage) : undefined,
      ratedCapacitorValue: form.ratedCapacitorValue ? Number(form.ratedCapacitorValue) : undefined,
      voltage: form.voltage ? Number(form.voltage) : undefined,
      iR: form.iR ? Number(form.iR) : undefined,
      iY: form.iY ? Number(form.iY) : undefined,
      iB: form.iB ? Number(form.iB) : undefined,
      remark: form.remark || undefined,
      photoPath: savedPath || undefined,
      description: form.description || undefined,
      recordedBy: editingId
        ? (apfcs.find(a => a.id === editingId)?.recordedBy || useAuthStore.getState().displayName || "Unknown")
        : (useAuthStore.getState().displayName || "Unknown"),
      createdAt: editingId
        ? (apfcs.find(a => a.id === editingId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
    };

    if (editingId) {
      updateApfcAction(editingId, payload);
      toast.success("APFC entry updated locally");
    } else {
      addApfcAction(payload);
      toast.success("APFC entry added locally");
    }

    resetForm();
  }

  function resetForm() {
    setEditingId(null);
    setForm(prev => ({
      ...prev,
      stage: "",
      ratedCapacitorValue: "",
      voltage: "",
      iR: "", iY: "", iB: "",
      remark: "", description: ""
    }));
    setCapturedPhoto(null);
    setExistingPhotoPath(null);
  }

  function handleEdit(a: any) {
    setEditingId(a.id);
    setForm({
      zoneId: a.zoneId || "",
      areaId: a.areaId || "",
      stage: a.stage?.toString() || "",
      ratedCapacitorValue: a.ratedCapacitorValue?.toString() || "",
      voltage: a.voltage?.toString() || "",
      iR: a.iR?.toString() || "",
      iY: a.iY?.toString() || "",
      iB: a.iB?.toString() || "",
      remark: a.remark || "",
      description: a.description || ""
    });
    setExistingPhotoPath(a.photoPath || null);
    setCapturedPhoto(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id: string) {
    if (confirm("Delete this APFC entry?")) {
      deleteApfcAction(id);
      toast.success("APFC entry deleted");
      if (editingId === id) resetForm();
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit APFC Details" : "Add APFC Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Plant Main Input</Label>
              <select 
                className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2 text-sm" 
                value={form.zoneId} 
                onChange={(e) => setForm({...form, zoneId: e.target.value, areaId: ""})}
              >
                <option value="" disabled>Select Plant Input...</option>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            
            <div>
              <Label>Panel (PCC / MCC Combined)</Label>
              <select 
                className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2 text-sm" 
                value={form.areaId} 
                onChange={(e) => setForm({...form, areaId: e.target.value})}
              >
                <option value="">None (Connected directly to Main Feeder)</option>
                {filteredPanels.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.type}] {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Stage</Label>
              <Input type="number" value={form.stage} onChange={(e) => setForm({...form, stage: e.target.value})} placeholder="e.g. 1" />
            </div>
            <div>
              <Label>Rated Capacitor Value (kVAr)</Label>
              <Input type="number" value={form.ratedCapacitorValue} onChange={(e) => setForm({...form, ratedCapacitorValue: e.target.value})} />
            </div>
            <div>
              <Label>Voltage</Label>
              <Input type="number" value={form.voltage} onChange={(e) => setForm({...form, voltage: e.target.value})} />
            </div>
            <div>
              <Label>Remark</Label>
              <select 
                className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2 text-sm"
                value={form.remark} 
                onChange={(e) => setForm({...form, remark: e.target.value})}
              >
                <option value="">Select...</option>
                <option value="OK">OK</option>
                <option value="Not OK">Not OK</option>
                <option value="Derate">Derate</option>
                <option value="MCB off">MCB off</option>
                <option value="NOT posible">NOT posible</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 pt-2 border-t border-white/5">
            <div>
              <Label>I-R</Label>
              <Input type="number" value={form.iR} onChange={(e) => setForm({...form, iR: e.target.value})} />
            </div>
            <div>
              <Label>I-Y</Label>
              <Input type="number" value={form.iY} onChange={(e) => setForm({...form, iY: e.target.value})} />
            </div>
            <div>
              <Label>I-B</Label>
              <Input type="number" value={form.iB} onChange={(e) => setForm({...form, iB: e.target.value})} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-white/5">
            <div>
              <Label>Description</Label>
              <Textarea className="h-24" placeholder="Add additional info..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
            </div>
            <div>
              <Label>APFC Photo (Saved locally on device)</Label>
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
            <Button onClick={() => void handleAddApfc()}>{editingId ? "Update Entry" : "Add Entry"}</Button>
            {editingId && <Button variant="secondary" onClick={resetForm}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>APFC Entries Recorded</CardTitle>
        </CardHeader>
        <CardContent>
          {apfcs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-white/10">
                    <th className="text-left px-2 py-2">Location</th>
                    <th className="text-left px-2 py-2">Stage</th>
                    <th className="text-left px-2 py-2">Rated Capacitor</th>
                    <th className="text-left px-2 py-2">Voltage</th>
                    <th className="text-left px-2 py-2">Remark</th>
                    <th className="text-left px-2 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {apfcs.map((a) => {
                    const zone = zones.find(z => z.id === a.zoneId);
                    const panel = areas.find(p => p.id === a.areaId);
                    
                    let locationLabel = "N/A";
                    if (zone) {
                      locationLabel = zone.name;
                      if (panel) {
                        locationLabel += ` → [${panel.type}] ${panel.name}`;
                      } else {
                        locationLabel += " (Direct Main)";
                      }
                    }

                    return (
                      <React.Fragment key={a.id}>
                        <tr 
                          className="border-t border-white/5 hover:bg-white/5 cursor-pointer" 
                          onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                        >
                          <td className="px-2 py-3">
                            <span className="block font-medium text-slate-200">{locationLabel}</span>
                          </td>
                          <td className="px-2 py-3 font-bold text-cyan-300">Stage {a.stage || "N/A"}</td>
                          <td className="px-2 py-3 text-slate-300">{a.ratedCapacitorValue ?? "N/A"} kVAr</td>
                          <td className="px-2 py-3 text-slate-300">{a.voltage ?? "N/A"} V</td>
                          <td className="px-2 py-3 text-slate-300">{a.remark || "N/A"}</td>
                          <td className="px-2 py-3 text-[10px] text-slate-500">
                            {new Date(a.createdAt || Date.now()).toLocaleString("en-IN")}
                          </td>
                        </tr>
                        {expanded === a.id && (
                          <tr className="bg-slate-900/50">
                            <td colSpan={6} className="px-4 py-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-300">
                                <div><span className="block text-[10px] uppercase text-slate-500">I-R</span>{a.iR ?? "-"}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">I-Y</span>{a.iY ?? "-"}</div>
                                <div><span className="block text-[10px] uppercase text-slate-500">I-B</span>{a.iB ?? "-"}</div>
                                <div className="col-span-2">
                                  <span className="block text-[10px] uppercase text-slate-500">Photo Path</span>
                                  <span className="text-[10px] font-mono break-all text-slate-400">{a.photoPath || "No photo captured"}</span>
                                </div>
                                <div className="col-span-full"><span className="block text-[10px] uppercase text-slate-500">Description</span>{a.description || "N/A"}</div>
                                <div className="col-span-full pt-2 flex justify-end gap-2">
                                  <Button variant="secondary" size="sm" onClick={(ev) => { ev.stopPropagation(); handleEdit(a); }}>Edit</Button>
                                  <Button variant="destructive" size="sm" onClick={(ev) => { ev.stopPropagation(); handleDelete(a.id); }}>Delete</Button>
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
            <p className="text-slate-400 text-sm">No APFC entries recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

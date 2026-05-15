"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

export default function ApfcPage() {
  const [form, setForm] = useState({
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

  const apfcs = useAppStore((state) => state.apfcs || []);
  const addApfcAction = useAppStore((state) => state.addApfc);
  const updateApfcAction = useAppStore((state) => state.updateApfc);

  async function handleAddApfc() {
    if (!form.stage) return toast.error("Stage is required");

    const payload = {
      id: crypto.randomUUID(),
      stage: form.stage ? Number(form.stage) : undefined,
      ratedCapacitorValue: form.ratedCapacitorValue ? Number(form.ratedCapacitorValue) : undefined,
      voltage: form.voltage ? Number(form.voltage) : undefined,
      iR: form.iR ? Number(form.iR) : undefined,
      iY: form.iY ? Number(form.iY) : undefined,
      iB: form.iB ? Number(form.iB) : undefined,
      remark: form.remark || undefined,
      description: form.description || undefined,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      updateApfcAction(editingId, payload);
      toast.success("APFC entry updated locally");
    } else {
      addApfcAction(payload);
      toast.success("APFC entry added locally");
    }

    setEditingId(null);
    setForm({
      stage: "",
      ratedCapacitorValue: "",
      voltage: "",
      iR: "", iY: "", iB: "",
      remark: "", description: ""
    });
  }

  function handleEdit(a: any) {
    setEditingId(a.id);
    setForm({
      stage: a.stage?.toString() || "",
      ratedCapacitorValue: a.ratedCapacitorValue?.toString() || "",
      voltage: a.voltage?.toString() || "",
      iR: a.iR?.toString() || "",
      iY: a.iY?.toString() || "",
      iB: a.iB?.toString() || "",
      remark: a.remark || "",
      description: a.description || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancel() {
    setEditingId(null);
    setForm({
      stage: "",
      ratedCapacitorValue: "",
      voltage: "",
      iR: "", iY: "", iB: "",
      remark: "", description: ""
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add APFC Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Stage</Label>
              <Input type="number" value={form.stage} onChange={(e) => setForm({...form, stage: e.target.value})} />
            </div>
            <div>
              <Label>Rated Capacitor Value</Label>
              <Input type="number" value={form.ratedCapacitorValue} onChange={(e) => setForm({...form, ratedCapacitorValue: e.target.value})} />
            </div>
            <div>
              <Label>Voltage</Label>
              <Input type="number" value={form.voltage} onChange={(e) => setForm({...form, voltage: e.target.value})} />
            </div>
            <div>
              <Label>Remark</Label>
              <select 
                className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2"
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

          <div>
            <Label>Description</Label>
            <Textarea className="h-20" placeholder="Add additional info..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
          </div>

          <div className="flex items-end gap-2 pt-2">
            <Button onClick={() => void handleAddApfc()}>{editingId ? "Update Entry" : "Add Entry"}</Button>
            {editingId && <Button variant="secondary" onClick={handleCancel}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>APFC Entries Recorded</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left px-2 py-1">Stage</th>
                  <th className="text-left px-2 py-1">Rated Capacitor</th>
                  <th className="text-left px-2 py-1">Voltage</th>
                  <th className="text-left px-2 py-1">Remark</th>
                  <th className="text-left px-2 py-1">Time</th>
                </tr>
              </thead>
              <tbody>
                {apfcs.map((a) => (
                  <React.Fragment key={a.id}>
                    <tr 
                      className="border-t border-white/5 hover:bg-white/5 cursor-pointer" 
                      onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                    >
                      <td className="px-2 py-2 font-bold">{a.stage || "N/A"}</td>
                      <td className="px-2 py-2">{a.ratedCapacitorValue ?? "N/A"}</td>
                      <td className="px-2 py-2">{a.voltage ?? "N/A"}</td>
                      <td className="px-2 py-2">{a.remark || "N/A"}</td>
                      <td className="px-2 py-2 text-[10px] text-slate-500">
                        {new Date(a.createdAt || Date.now()).toLocaleString()}
                      </td>
                    </tr>
                    {expanded === a.id && (
                      <tr className="bg-slate-900/50">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-300">
                            <div><span className="block text-[10px] uppercase text-slate-500">I-R</span>{a.iR ?? "-"}</div>
                            <div><span className="block text-[10px] uppercase text-slate-500">I-Y</span>{a.iY ?? "-"}</div>
                            <div><span className="block text-[10px] uppercase text-slate-500">I-B</span>{a.iB ?? "-"}</div>
                            <div className="col-span-full"><span className="block text-[10px] uppercase text-slate-500">Description</span>{a.description || "N/A"}</div>
                            <div className="col-span-full pt-2 flex justify-end">
                              <Button variant="secondary" size="sm" onClick={(ev) => { ev.stopPropagation(); handleEdit(a); }}>Edit</Button>
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
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppStore, EnergySource } from "@/lib/store";
import { Zap, Sun, Wind, BatteryCharging, ChevronDown, ChevronUp } from "lucide-react";

export default function CompanyPage() {
  const [loading, setLoading] = useState(false);
  const profile = useAppStore((state) => state.profile);
  const setProfile = useAppStore((state) => state.setProfile);
  const energySources = useAppStore((state) => state.energySources);
  const setEnergySources = useAppStore((state) => state.setEnergySources);

  const [form, setForm] = useState({
    companyName: "",
    area: "",
    district: "",
    state: "",
    pincode: "",
  });

  const [sources, setLocalSources] = useState<any[]>([]);
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({ 0: true });

  // Sync form with store
  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName,
        area: profile.area,
        district: profile.district,
        state: profile.state,
        pincode: profile.pincode,
      });
    }
  }, [profile]);

  // Sync sources with store or default to 1 source
  useEffect(() => {
    if (energySources && energySources.length > 0) {
      setLocalSources(
        energySources.map((s) => ({
          id: s.id,
          name: s.name || "",
          sourceType: s.sourceType || "Main Grid",
          pqName: s.pqName || "",
          recordingNameId: s.recordingNameId || "",
          v1: s.v1?.toString() || "",
          v2: s.v2?.toString() || "",
          v3: s.v3?.toString() || "",
          uthd1: s.uthd1?.toString() || "",
          uthd2: s.uthd2?.toString() || "",
          uthd3: s.uthd3?.toString() || "",
          i1: s.i1?.toString() || "",
          i2: s.i2?.toString() || "",
          i3: s.i3?.toString() || "",
          ithd1: s.ithd1?.toString() || "",
          ithd2: s.ithd2?.toString() || "",
          ithd3: s.ithd3?.toString() || "",
          pf: s.pf?.toString() || "",
          kvarD: s.kvarD?.toString() || "",
          kvarQ: s.kvarQ?.toString() || "",
          kvarLeadLag: s.kvarLeadLag || "Lag",
          totalPower: s.totalPower || 0,
          createdAt: s.createdAt || null,
        }))
      );
    } else {
      setLocalSources([
        {
          id: crypto.randomUUID(),
          name: "Main Feeder",
          sourceType: "Main Grid",
          pqName: "",
          recordingNameId: "",
          v1: "", v2: "", v3: "",
          uthd1: "", uthd2: "", uthd3: "",
          i1: "", i2: "", i3: "",
          ithd1: "", ithd2: "", ithd3: "",
          pf: "", kvarD: "", kvarQ: "", kvarLeadLag: "Lag",
          totalPower: 0,
        },
      ]);
    }
  }, [energySources]);

  // Real-time calculation of Total Power for a source
  const calculateSourcePower = (s: any) => {
    const v1 = Number(s.v1) || 0;
    const v2 = Number(s.v2) || 0;
    const v3 = Number(s.v3) || 0;
    const i1 = Number(s.i1) || 0;
    const i2 = Number(s.i2) || 0;
    const i3 = Number(s.i3) || 0;
    const pf = Number(s.pf) || 0;

    let avgV = 0;
    let avgI = 0;

    const vCount = (s.v1 ? 1 : 0) + (s.v2 ? 1 : 0) + (s.v3 ? 1 : 0);
    const iCount = (s.i1 ? 1 : 0) + (s.i2 ? 1 : 0) + (s.i3 ? 1 : 0);

    if (vCount > 0) avgV = (v1 + v2 + v3) / vCount;
    if (iCount > 0) avgI = (i1 + i2 + i3) / iCount;

    if (avgV > 0 && avgI > 0 && pf > 0) {
      return Number(((1.732 * avgV * avgI * pf) / 1000).toFixed(2));
    }
    return 0;
  };

  const handleSourceChange = (index: number, field: string, value: any) => {
    const updated = [...sources];
    updated[index] = { ...updated[index], [field]: value };
    updated[index].totalPower = calculateSourcePower(updated[index]);
    setLocalSources(updated);
  };

  const toggleExpand = (index: number) => {
    setExpandedSources((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Calculations for summary card
  const calculatedOverallConsumption = sources.reduce((acc, s) => acc + (s.totalPower || 0), 0);

  async function save() {
    if (!form.companyName || !form.area) {
      return toast.error("Company name and Zone are mandatory details.");
    }
    setLoading(true);
    try {
      // Save Profile
      setProfile({
        id: profile?.id || crypto.randomUUID(),
        ...form,
        overallConsumption: calculatedOverallConsumption,
        updatedAt: new Date().toISOString(),
      });

      // Format and Save Energy Sources
      const formattedSources = sources.map((s) => ({
        id: s.id,
        name: s.name || `Source ${s.id.slice(0, 4)}`,
        sourceType: s.sourceType,
        pqName: s.pqName || null,
        recordingNameId: s.recordingNameId || null,
        v1: s.v1 ? Number(s.v1) : null,
        v2: s.v2 ? Number(s.v2) : null,
        v3: s.v3 ? Number(s.v3) : null,
        uthd1: s.uthd1 ? Number(s.uthd1) : null,
        uthd2: s.uthd2 ? Number(s.uthd2) : null,
        uthd3: s.uthd3 ? Number(s.uthd3) : null,
        i1: s.i1 ? Number(s.i1) : null,
        i2: s.i2 ? Number(s.i2) : null,
        i3: s.i3 ? Number(s.i3) : null,
        ithd1: s.ithd1 ? Number(s.ithd1) : null,
        ithd2: s.ithd2 ? Number(s.ithd2) : null,
        ithd3: s.ithd3 ? Number(s.ithd3) : null,
        pf: s.pf ? Number(s.pf) : null,
        kvarD: s.kvarD ? Number(s.kvarD) : null,
        kvarQ: s.kvarQ ? Number(s.kvarQ) : null,
        kvarLeadLag: s.kvarLeadLag || "Lag",
        totalPower: s.totalPower || 0,
        createdAt: s.createdAt || new Date().toISOString(),
      }));

      setEnergySources(formattedSources);
      toast.success("Company profile and energy sources saved locally");
    } catch (err: any) {
      toast.error(err.message || "Failed to save details");
    } finally {
      setLoading(false);
    }
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "Solar":
        return <Sun className="size-4 text-amber-400" />;
      case "Wind":
        return <Wind className="size-4 text-cyan-400" />;
      default:
        return <Zap className="size-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-950/40 border-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Company Setup</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Company name <span className="text-red-500">*</span></Label>
            <Input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          </div>
          <div>
            <Label>Zone <span className="text-red-500">*</span></Label>
            <Input required value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          </div>
          <div>
            <Label>District</Label>
            <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          </div>
          <div>
            <Label>State</Label>
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div>
            <Label>Pincode</Label>
            <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          </div>
          <div>
            <Label>Overall Consumption (kW)</Label>
            <div className="h-9 flex items-center px-3 bg-slate-900/60 border border-white/10 rounded-md text-cyan-400 font-mono font-bold">
              {calculatedOverallConsumption.toFixed(2)} kW
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Calculated from the sum of all energy sources below.</p>
          </div>
        </CardContent>
      </Card>

      {/* Energy Sources Management Card */}
      <Card className="bg-slate-950/40 border-white/10 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-white/5">
          <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <BatteryCharging className="size-5 text-cyan-400" />
            Energy Sources Setup
          </CardTitle>
          <div className="w-44">
            <select
              className="h-8 w-full rounded-md border border-white/10 bg-slate-900 px-2 text-xs text-slate-200"
              value={sources.length}
              onChange={(e) => {
                const count = parseInt(e.target.value, 10);
                let updated = [...sources];
                if (count > sources.length) {
                  for (let i = sources.length; i < count; i++) {
                    updated.push({
                      id: crypto.randomUUID(),
                      name: `Energy Source ${i + 1}`,
                      sourceType: "Main Grid",
                      pqName: "",
                      recordingNameId: "",
                      v1: "", v2: "", v3: "",
                      uthd1: "", uthd2: "", uthd3: "",
                      i1: "", i2: "", i3: "",
                      ithd1: "", ithd2: "", ithd3: "",
                      pf: "", kvarD: "", kvarQ: "", kvarLeadLag: "Lag",
                      totalPower: 0,
                    });
                  }
                  // expand newly added sources
                  const nextExp = { ...expandedSources };
                  for (let i = sources.length; i < count; i++) {
                    nextExp[i] = true;
                  }
                  setExpandedSources(nextExp);
                } else if (count < sources.length) {
                  updated = updated.slice(0, count);
                }
                setLocalSources(updated);
              }}
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} Source{i > 0 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {sources.map((src, index) => (
            <div key={src.id} className="border border-white/10 rounded-lg overflow-hidden bg-slate-950/20">
              <button
                type="button"
                onClick={() => toggleExpand(index)}
                className="w-full flex items-center justify-between p-3 bg-slate-900/40 border-b border-white/5 hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {getSourceIcon(src.sourceType)}
                  <span className="text-xs font-bold text-slate-200">
                    Source #{index + 1}: {src.name || `Source ${index + 1}`}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">({src.sourceType})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {src.totalPower || 0} kW
                  </span>
                  {expandedSources[index] ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
                </div>
              </button>

              {expandedSources[index] && (
                <div className="p-4 space-y-4 bg-slate-950/5">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <Label>Source Name</Label>
                      <Input
                        value={src.name}
                        onChange={(e) => handleSourceChange(index, "name", e.target.value)}
                        placeholder="e.g. Main Transformer 1"
                      />
                    </div>
                    <div>
                      <Label>Source Type</Label>
                      <select
                        className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2 text-sm text-slate-200"
                        value={src.sourceType}
                        onChange={(e) => handleSourceChange(index, "sourceType", e.target.value)}
                      >
                        <option value="Main Grid">Main Grid</option>
                        <option value="Solar">Renewable Energy → Solar</option>
                        <option value="Wind">Renewable Energy → Wind</option>
                      </select>
                    </div>
                    <div>
                      <Label>PQ Name</Label>
                      <select
                        className="h-9 w-full rounded-md border border-white/10 bg-slate-950/50 px-2 text-sm text-slate-200"
                        value={src.pqName}
                        onChange={(e) => handleSourceChange(index, "pqName", e.target.value)}
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
                      <Input
                        value={src.recordingNameId}
                        onChange={(e) => handleSourceChange(index, "recordingNameId", e.target.value)}
                        placeholder="e.g. REC001"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6 pt-2 border-t border-white/5">
                    <div>
                      <Label>V1</Label>
                      <Input
                        type="number"
                        value={src.v1}
                        onChange={(e) => handleSourceChange(index, "v1", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>V2</Label>
                      <Input
                        type="number"
                        value={src.v2}
                        onChange={(e) => handleSourceChange(index, "v2", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>V3</Label>
                      <Input
                        type="number"
                        value={src.v3}
                        onChange={(e) => handleSourceChange(index, "v3", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Uthd1 (%)</Label>
                      <Input
                        type="number"
                        value={src.uthd1}
                        onChange={(e) => handleSourceChange(index, "uthd1", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Uthd2 (%)</Label>
                      <Input
                        type="number"
                        value={src.uthd2}
                        onChange={(e) => handleSourceChange(index, "uthd2", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Uthd3 (%)</Label>
                      <Input
                        type="number"
                        value={src.uthd3}
                        onChange={(e) => handleSourceChange(index, "uthd3", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>I1</Label>
                      <Input
                        type="number"
                        value={src.i1}
                        onChange={(e) => handleSourceChange(index, "i1", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>I2</Label>
                      <Input
                        type="number"
                        value={src.i2}
                        onChange={(e) => handleSourceChange(index, "i2", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>I3</Label>
                      <Input
                        type="number"
                        value={src.i3}
                        onChange={(e) => handleSourceChange(index, "i3", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Ithd1 (%)</Label>
                      <Input
                        type="number"
                        value={src.ithd1}
                        onChange={(e) => handleSourceChange(index, "ithd1", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Ithd2 (%)</Label>
                      <Input
                        type="number"
                        value={src.ithd2}
                        onChange={(e) => handleSourceChange(index, "ithd2", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Ithd3 (%)</Label>
                      <Input
                        type="number"
                        value={src.ithd3}
                        onChange={(e) => handleSourceChange(index, "ithd3", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 pt-2 border-t border-white/5">
                    <div>
                      <Label>Power Factor (PF)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={src.pf}
                        onChange={(e) => handleSourceChange(index, "pf", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>KVAr (D)</Label>
                      <Input
                        type="number"
                        value={src.kvarD}
                        onChange={(e) => handleSourceChange(index, "kvarD", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>KVAr (Q)</Label>
                      <Input
                        type="number"
                        value={src.kvarQ}
                        onChange={(e) => handleSourceChange(index, "kvarQ", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>KVAr Style</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          type="button"
                          variant={src.kvarLeadLag === "Lead" ? "default" : "secondary"}
                          className="flex-1 h-9 text-xs"
                          onClick={() => handleSourceChange(index, "kvarLeadLag", "Lead")}
                        >
                          Lead
                        </Button>
                        <Button
                          type="button"
                          variant={src.kvarLeadLag === "Lag" ? "default" : "secondary"}
                          className="flex-1 h-9 text-xs"
                          onClick={() => handleSourceChange(index, "kvarLeadLag", "Lag")}
                        >
                          Lag
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Total Power</Label>
                      <div className="h-9 flex items-center px-3 bg-slate-900 border border-white/10 rounded-md text-cyan-400 font-bold text-sm">
                        {src.totalPower || 0} kW
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Additive Naming Visualizer */}
          <div className="mt-6 p-4 rounded-xl border border-cyan-500/20 bg-slate-950/60 backdrop-blur-md">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 mb-2">Total Grid Consumption Calculation</h4>
            <div className="space-y-2 text-sm text-slate-300">
              {sources.map((s, idx) => (
                <div key={s.id || idx} className="flex justify-between border-b border-white/5 pb-1">
                  <span className="capitalize">{s.name || `Source ${idx + 1}`} ({s.sourceType}):</span>
                  <span className="font-mono font-bold text-slate-200">{(s.totalPower || 0).toFixed(2)} kW</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-base font-bold text-cyan-300">
                <span>Total Grid Consumption:</span>
                <span className="font-mono">{calculatedOverallConsumption.toFixed(2)} kW</span>
              </div>
              <div className="mt-3 p-3 bg-slate-900/60 rounded-lg text-xs text-slate-400 font-mono space-y-1">
                <div className="text-cyan-400 font-bold">Breakdown & Formula:</div>
                <div className="leading-relaxed">
                  {sources.length > 0
                    ? sources.map((s, idx) => `${s.name || `Source ${idx + 1}`} (${s.totalPower || 0} kW)`).join(" + ")
                    : "0 kW"}
                  {" = "}<span className="font-bold text-cyan-300">{calculatedOverallConsumption.toFixed(2)} kW</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button size="lg" className="w-full md:w-auto" onClick={() => void save()} disabled={loading}>
          {loading ? "Saving..." : "Save Company & Energy Sources"}
        </Button>
      </div>
    </div>
  );
}

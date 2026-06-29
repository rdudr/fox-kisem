"use client";

import { useAppStore } from "@/lib/store";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardExportBtn } from "@/components/dashboard/export-btn";
import React, { useState } from "react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from "recharts";
import { Info, X, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const COLORS = ["#22d3ee", "#fbbf24", "#34d399", "#818cf8", "#f43f5e", "#a78bfa", "#f472b6"];
const STATUS_COLORS = {
  underload: "#ef4444", // red-500
  normal: "#10b981",    // emerald-500
  overload: "#f59e0b"   // amber-500
};

export default function DashboardPage() {
  const profile = useAppStore((s) => s.profile);
  const zones   = useAppStore((s) => s.zones);
  const areas   = useAppStore((s) => s.areas);
  const entries = useAppStore((s) => s.entries);
  const energySources = useAppStore((s) => s.energySources || []);

  // Modal State
  const [modalCategory, setModalCategory] = useState<"underload" | "overload" | null>(null);

  const totalPower = entries.reduce((acc, e) => acc + (e.calculatedPower ?? 0), 0);

  const calculatedOverallConsumption = energySources.reduce((acc, s) => acc + (s.totalPower || 0), 0);

  const maxEquipment = entries.reduce<typeof entries[0] | null>(
    (m, e) => (!m || (e.calculatedPower ?? 0) > (m.calculatedPower ?? 0) ? e : m),
    null
  );

  const areaTotals = areas.map((a) => ({
    name: a.name,
    total: entries
      .filter((e) => e.areaId === a.id)
      .reduce((acc, e) => acc + (e.calculatedPower ?? 0), 0),
  }));
  
  const maxArea = areaTotals.reduce<typeof areaTotals[0] | null>(
    (m, a) => (!m || a.total > m.total ? a : m),
    null
  );

  // Group items by recordedBy to show contribution breakdown
  const contributions: Record<string, { zones: number; areas: number; entries: number; totalPower: number }> = {};

  zones.forEach((z) => {
    const creator = z.recordedBy || "Unknown";
    if (!contributions[creator]) contributions[creator] = { zones: 0, areas: 0, entries: 0, totalPower: 0 };
    contributions[creator].zones++;
  });

  areas.forEach((a) => {
    const creator = a.recordedBy || "Unknown";
    if (!contributions[creator]) contributions[creator] = { zones: 0, areas: 0, entries: 0, totalPower: 0 };
    contributions[creator].areas++;
  });

  entries.forEach((e) => {
    const creator = e.recordedBy || "Unknown";
    if (!contributions[creator]) contributions[creator] = { zones: 0, areas: 0, entries: 0, totalPower: 0 };
    contributions[creator].entries++;
    contributions[creator].totalPower += e.calculatedPower ?? 0;
  });

  const contributorsList = Object.entries(contributions).map(([name, stats]) => ({
    name,
    ...stats,
  }));

  // Chart 1: Plant Main Input (Zones) Power Distribution
  const zoneChartData = zones.map((z) => ({
    name: z.name,
    value: z.totalPower || 0
  })).filter(d => d.value > 0);

  // Chart 2: PCC Panel Power Distribution
  const pccChartData = areas
    .filter(a => a.type === "PCC")
    .map((a) => ({
      name: a.name,
      value: a.totalPower || 0
    })).filter(d => d.value > 0);

  // Chart 3: MCC Panel Power Distribution
  const mccChartData = areas
    .filter(a => a.type === "MCC")
    .map((a) => ({
      name: a.name,
      value: a.totalPower || 0
    })).filter(d => d.value > 0);

  // Motor Load Status Calculation
  // Underload: Load Factor < 0.4 (40%)
  // Overload: Load Factor > 1.0 (100%)
  const motorUnderloaded = entries.filter(e => e.loadFactor < 0.4);
  const motorOverloaded = entries.filter(e => e.loadFactor > 1.0);
  const motorNormal = entries.filter(e => e.loadFactor >= 0.4 && e.loadFactor <= 1.0);

  const motorStatusChartData = [
    { name: "Underloaded (<40%)", value: motorUnderloaded.length, type: "underload" },
    { name: "Normal (40%-100%)", value: motorNormal.length, type: "normal" },
    { name: "Overloaded (>100%)", value: motorOverloaded.length, type: "overload" }
  ].filter(d => d.value > 0);

  // Modal List Data Resolved
  const modalListData = (modalCategory === "underload" ? motorUnderloaded : motorOverloaded).map(e => {
    const parentArea = areas.find(a => a.id === e.areaId);
    const parentZone = zones.find(z => z.id === parentArea?.zoneId);
    let areaLabel = parentArea ? parentArea.name : "N/A";
    if (parentArea?.type === "MCC") {
      const parentPcc = areas.find(p => p.id === parentArea.pccId);
      areaLabel = `${parentPcc ? parentPcc.name : "PCC"} → ${parentArea.name}`;
    }
    return {
      id: e.id,
      machineTag: e.machineTag,
      panelName: areaLabel,
      zoneName: parentZone ? parentZone.name : "Unknown",
      ratedKw: e.ratedKw,
      measuredKw: e.measuredKw,
      loadFactor: e.loadFactor
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">Operational Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time overview of your industrial power data.</p>
        </div>
        <DashboardExportBtn hasCompany={!!profile?.companyName} />
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Company" value={profile?.companyName ?? "Not set"} />
        <KpiCard label="Overall Consumption" value={`${calculatedOverallConsumption.toFixed(2)} kW`} />
        <KpiCard label="Plant Main Inputs" value={String(zones.length)} />
        <KpiCard label="Motor Loads" value={String(entries.length)} />
        <KpiCard label="Total power" value={`${totalPower.toFixed(2)} kW`} />
      </section>

      {/* Visualizations Grid */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Plant Main Input Pie */}
        <Card className="bg-slate-950/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-slate-400 font-semibold">Plant Main Inputs Power (kW)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {zoneChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={zoneChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {zoneChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} 
                    itemStyle={{ color: "#fff" }}
                    formatter={(value: any) => [`${Number(value).toFixed(2)} kW`]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No active Plant Main Input data recorded.</p>
            )}
          </CardContent>
        </Card>

        {/* PCC Panel Pie */}
        <Card className="bg-slate-950/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-slate-400 font-semibold">PCC Panels Power (kW)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {pccChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pccChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pccChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} 
                    itemStyle={{ color: "#fff" }}
                    formatter={(value: any) => [`${Number(value).toFixed(2)} kW`]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No active PCC Panel data recorded.</p>
            )}
          </CardContent>
        </Card>

        {/* MCC Panel Pie */}
        <Card className="bg-slate-950/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-slate-400 font-semibold">MCC Panels Power (kW)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {mccChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mccChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {mccChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} 
                    itemStyle={{ color: "#fff" }}
                    formatter={(value: any) => [`${Number(value).toFixed(2)} kW`]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No active MCC Panel data recorded.</p>
            )}
          </CardContent>
        </Card>

        {/* Motor Load Load-Factor Status */}
        <Card className="bg-slate-950/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-slate-400 font-semibold">Motor Load Loading Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-between">
            {entries.length > 0 ? (
              <>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={motorStatusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {motorStatusChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={STATUS_COLORS[entry.type as keyof typeof STATUS_COLORS]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} 
                        itemStyle={{ color: "#fff" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Underload and Overload Interactive Cards */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button 
                    onClick={() => motorUnderloaded.length > 0 && setModalCategory("underload")}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-colors flex items-center justify-between",
                      motorUnderloaded.length > 0 
                        ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-300"
                        : "bg-slate-900/50 border-white/5 text-slate-500 cursor-not-allowed"
                    )}
                    disabled={motorUnderloaded.length === 0}
                  >
                    <div>
                      <span className="block text-[10px] uppercase font-semibold">Underloaded</span>
                      <span className="text-lg font-bold">{motorUnderloaded.length}</span>
                    </div>
                    {motorUnderloaded.length > 0 && <Info className="size-4 opacity-75" />}
                  </button>

                  <button 
                    onClick={() => motorOverloaded.length > 0 && setModalCategory("overload")}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-colors flex items-center justify-between",
                      motorOverloaded.length > 0 
                        ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-300"
                        : "bg-slate-900/50 border-white/5 text-slate-500 cursor-not-allowed"
                    )}
                    disabled={motorOverloaded.length === 0}
                  >
                    <div>
                      <span className="block text-[10px] uppercase font-semibold">Overloaded</span>
                      <span className="text-lg font-bold">{motorOverloaded.length}</span>
                    </div>
                    {motorOverloaded.length > 0 && <Info className="size-4 opacity-75" />}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 m-auto">No motor load data recorded.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Interactive Modal to show details list */}
      {modalCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-950/40">
              <div className="flex items-center gap-2">
                {modalCategory === "underload" ? (
                  <Zap className="size-5 text-red-400" />
                ) : (
                  <AlertTriangle className="size-5 text-amber-400" />
                )}
                <h3 className="font-semibold text-slate-100 uppercase tracking-wide text-sm">
                  {modalCategory === "underload" ? "Underloaded Motors (< 40% LF)" : "Overloaded Motors (> 100% LF)"} ({modalListData.length})
                </h3>
              </div>
              <button 
                onClick={() => setModalCategory(null)} 
                className="text-slate-400 hover:text-slate-200 p-1 hover:bg-white/5 rounded-md"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950/30">
              {modalListData.length > 0 ? (
                modalListData.map(item => (
                  <div key={item.id} className="p-3 bg-slate-900/50 border border-white/5 rounded-lg flex items-center justify-between hover:border-white/10 transition-colors">
                    <div>
                      <p className="font-bold text-cyan-300 font-mono">{item.machineTag}</p>
                      <p className="text-[10px] text-slate-400">Panel: {item.panelName}</p>
                      <p className="text-[9px] text-slate-500">Plant Input: {item.zoneName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-200 font-semibold">{item.measuredKw} kW / {item.ratedKw} kW</p>
                      <p className={cn(
                        "text-[10px] font-bold mt-0.5",
                        modalCategory === "underload" ? "text-red-400" : "text-amber-400"
                      )}>
                        Load Factor: {item.loadFactor.toFixed(3)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No motors in this category.</p>
              )}
            </div>
            
            <div className="p-3 border-t border-white/10 bg-slate-950/40 flex justify-end">
              <Button size="sm" onClick={() => setModalCategory(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Max power equipment</CardTitle></CardHeader>
          <CardContent>
            {maxEquipment ? (
              <>
                <p className="text-slate-200">{maxEquipment.machineTag}</p>
                <p className="text-xs text-slate-400 mb-1">
                  Zone: {zones.find(z => z.id === areas.find(a => a.id === maxEquipment.areaId)?.zoneId)?.name || "N/A"} —{" "}
                  Area: {areas.find(a => a.id === maxEquipment.areaId)?.name || "N/A"}
                </p>
                <p className="text-2xl font-semibold text-cyan-300">{Number(maxEquipment.calculatedPower ?? 0).toFixed(2)} kW</p>
              </>
            ) : <p className="text-slate-400">No entries yet</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Max power area</CardTitle></CardHeader>
          <CardContent>
            {maxArea ? (
              <>
                <p className="text-slate-200">{maxArea.name}</p>
                <p className="text-2xl font-semibold text-cyan-300">{maxArea.total.toFixed(2)} kW</p>
              </>
            ) : <p className="text-slate-400">No areas yet</p>}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Data Contribution by Engineer</CardTitle>
        </CardHeader>
        <CardContent>
          {contributorsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="text-left py-2 font-medium">Engineer</th>
                    <th className="text-center py-2 font-medium">Zones (Plant Inputs)</th>
                    <th className="text-center py-2 font-medium">Areas (MCC/PCC)</th>
                    <th className="text-center py-2 font-medium">Motor Loads</th>
                    <th className="text-right py-2 font-medium">Power Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {contributorsList.map((c) => (
                    <tr key={c.name} className="border-t border-white/5 hover:bg-white/5">
                      <td className="py-3 font-semibold text-slate-100">{c.name}</td>
                      <td className="text-center py-3">{c.zones}</td>
                      <td className="text-center py-3">{c.areas}</td>
                      <td className="text-center py-3">{c.entries}</td>
                      <td className="text-right py-3 text-cyan-400 font-mono font-semibold">
                        {c.totalPower.toFixed(2)} kW
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No data recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

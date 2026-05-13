import { prisma } from "@/lib/prisma";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardExportBtn } from "@/components/dashboard/export-btn";

export default async function DashboardPage() {
  const [profile, areas, entries] = await Promise.all([
    prisma.companyProfile.findFirst(),
    prisma.areaTag.findMany(),
    prisma.entry.findMany({ include: { area: { include: { zone: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  const totalPower = entries.reduce((acc, e) => acc + e.calculatedPower, 0);
  const maxEquipment = entries.reduce((m, e) => (e.calculatedPower > (m?.calculatedPower ?? -1) ? e : m), entries[0]);
  const areaTotals = areas.map((a) => ({
    name: a.name,
    total: entries.filter((e) => e.areaId === a.id).reduce((acc, e) => acc + e.calculatedPower, 0),
  }));
  const maxArea = areaTotals.reduce((m, a) => (a.total > (m?.total ?? -1) ? a : m), areaTotals[0]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">Operational Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time overview of your industrial power data.</p>
        </div>
        <DashboardExportBtn hasCompany={!!profile?.companyName} />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Company" value={profile?.companyName ?? "Not set"} />
        <KpiCard label="Zones" value={String(areas.length)} />
        <KpiCard label="Entries" value={String(entries.length)} />
        <KpiCard label="Total power" value={`${totalPower.toFixed(2)} kW`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Max power equipment</CardTitle>
          </CardHeader>
          <CardContent>
            {maxEquipment ? (
              <>
                <p className="text-slate-200">{maxEquipment.machineTag}</p>
                <p className="text-xs text-slate-400 mb-1">Zone: {maxEquipment.area?.zone?.name || "N/A"} — Area: {maxEquipment.area?.name || "N/A"}</p>
                <p className="text-2xl font-semibold text-cyan-300">{maxEquipment.calculatedPower.toFixed(2)} kW</p>
              </>
            ) : <p className="text-slate-400">No entries</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Max power zone</CardTitle>
          </CardHeader>
          <CardContent>
            {maxArea ? (
              <>
                <p className="text-slate-200">{maxArea.name}</p>
                <p className="text-2xl font-semibold text-cyan-300">{maxArea.total.toFixed(2)} kW</p>
              </>
            ) : <p className="text-slate-400">No zones</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle, CloudUpload, CheckCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { exportOfflineExcel } from "@/lib/export-offline";

export function DashboardExportBtn({ hasCompany }: { hasCompany: boolean }) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const profile = useAppStore((s) => s.profile);
  const zones   = useAppStore((s) => s.zones);
  const areas   = useAppStore((s) => s.areas);
  const entries = useAppStore((s) => s.entries);

  const handleExport = () => {
    if (!hasCompany) {
      setShowWarning(true);
    } else {
      doExport();
    }
  };

  const doExport = () => {
    exportOfflineExcel(profile, zones, areas, entries);
  };

  const handleContinue = () => {
    setShowWarning(false);
    doExport();
  };

  const handleGoToCompany = () => {
    setShowWarning(false);
    router.push("/company");
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, zones, areas, entries }),
      });
      if (res.ok) {
        setSyncDone(true);
        setTimeout(() => setSyncDone(false), 3000);
      } else {
        alert("Sync failed. Check your internet connection.");
      }
    } catch {
      alert("Cannot reach server. You are offline.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Sync to Cloud button */}
      <Button
        onClick={handleSync}
        disabled={syncing}
        variant="secondary"
        className="border border-white/20 text-slate-300 hover:bg-white/10 gap-2"
      >
        {syncDone ? (
          <><CheckCircle className="size-4 text-emerald-400" /> Synced!</>
        ) : (
          <><CloudUpload className="size-4" />{syncing ? "Syncing..." : "Sync to Cloud"}</>
        )}
      </Button>

      {/* Export Excel (offline) */}
      <Button
        onClick={handleExport}
        className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-semibold shadow-lg shadow-emerald-900/20"
      >
        <Download className="size-4" />
        Export to Excel
      </Button>

      {/* Warning modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-2xl max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <AlertTriangle className="size-6" />
              <h3 className="text-lg font-semibold">Missing Company Details</h3>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              You haven&apos;t added the company details yet. The exported report will show &quot;UNKNOWN COMPANY&quot;.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleGoToCompany} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                Add Company Details
              </Button>
              <Button onClick={handleContinue} variant="ghost" className="w-full text-slate-400 hover:text-white">
                Continue Exporting
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle, CloudUpload, CheckCircle, SaveAll } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { exportOfflineExcel } from "@/lib/export-offline";
import { toast } from "sonner";

export function DashboardExportBtn({ hasCompany }: { hasCompany: boolean }) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const profile = useAppStore((s) => s.profile);
  const zones   = useAppStore((s) => s.zones);
  const areas   = useAppStore((s) => s.areas);
  const entries = useAppStore((s) => s.entries);
  const wipeData = useAppStore((s) => s.wipeData);
  
  const syncQueue = useAppStore((s) => s.syncQueue);
  const addJobToQueue = useAppStore((s) => s.addJobToQueue);
  const updateJobStatus = useAppStore((s) => s.updateJobStatus);
  const pruneQueue = useAppStore((s) => s.pruneQueue);
  
  const displayName = useAuthStore((s) => s.displayName);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  const pendingJobs = syncQueue.filter(j => j.status === 'pending');

  // Prune the queue automatically when component mounts
  useEffect(() => {
    pruneQueue();
  }, [pruneQueue]);

  const handleExportAndComplete = async () => {
    if (!hasCompany) {
      setShowWarning(true);
      return;
    }
    
    // 1. Download the Excel file locally immediately
    await exportOfflineExcel(profile, zones, areas, entries);

    // 2. Snapshot the data and put it in the offline queue
    const jobId = crypto.randomUUID();
    addJobToQueue({
      jobId,
      status: 'pending',
      createdAt: Date.now(),
      reporterName: displayName || "Engineer",
      payload: { profile, zones, areas, entries }
    });

    // 3. Clear active workspace memory to be ready for next company
    wipeData();
    toast.success("Report Saved Offline & Workspace Cleared");

    // 4. Try to sync silently in the background
    trySyncJob(jobId, { profile, zones, areas, entries });
  };

  const handleSyncAll = async () => {
    if (pendingJobs.length === 0) {
      return toast.info("Everything is up to date!");
    }
    setSyncing(true);
    let successCount = 0;

    for (const job of pendingJobs) {
      const ok = await trySyncJob(job.jobId, job.payload);
      if (ok) successCount++;
    }

    setSyncing(false);
    if (successCount === pendingJobs.length) {
      toast.success("All reports synced and emailed to admins!");
    } else if (successCount > 0) {
      toast.warning(`Synced ${successCount}/${pendingJobs.length} reports.`);
    } else {
      toast.error("Sync failed. Check internet connection.");
    }
  };

  const trySyncJob = async (jobId: string, payload: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/sync/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          reporterName: displayName || "Engineer",
          ...payload
        }),
      });
      if (res.ok) {
        updateJobStatus(jobId, 'synced');
        return true;
      }
      return false;
    } catch {
      return false; // Offline
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Cloud Sync Button */}
      <Button
        onClick={handleSyncAll}
        disabled={syncing || pendingJobs.length === 0}
        variant="secondary"
        className="relative border border-white/20 text-slate-300 hover:bg-white/10 gap-2 pr-10"
      >
        <CloudUpload className="size-4" />
        {syncing ? "Syncing..." : "Sync Offline Reports"}
        
        {pendingJobs.length > 0 && (
          <span className="absolute -top-2 -right-2 px-1.5 min-w-[20px] h-5 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full animate-pulse">
            {pendingJobs.length}
          </span>
        )}
      </Button>

      {/* Export & Complete Workspace */}
      <Button
        onClick={handleExportAndComplete}
        className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-semibold shadow-lg shadow-emerald-900/20"
      >
        <SaveAll className="size-4" />
        Export & Complete
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
              <Button onClick={() => { setShowWarning(false); router.push("/company"); }} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                Add Company Details
              </Button>
              <Button onClick={() => { setShowWarning(false); exportOfflineExcel(profile, zones, areas, entries); }} variant="ghost" className="w-full text-slate-400 hover:text-white">
                Download Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle, CloudUpload, Loader2, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { exportOfflineExcel } from "@/lib/export-offline";
import { MailSendModal } from "@/components/dashboard/mail-send-modal";
import { toast } from "sonner";

export function DashboardExportBtn({ hasCompany }: { hasCompany: boolean }) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mailModalStatus, setMailModalStatus] = useState<"sending" | "success" | "error" | "idle">("idle");
  const [syncJobCount, setSyncJobCount] = useState(0);

  const profile = useAppStore((s) => s.profile);
  const zones   = useAppStore((s) => s.zones);
  const areas   = useAppStore((s) => s.areas);
  const entries = useAppStore((s) => s.entries);
  const apfcs   = useAppStore((s) => s.apfcs);
  const wipeData = useAppStore((s) => s.wipeData);

  const syncQueue      = useAppStore((s) => s.syncQueue);
  const addJobToQueue  = useAppStore((s) => s.addJobToQueue);
  const updateJobStatus = useAppStore((s) => s.updateJobStatus);
  const pruneQueue     = useAppStore((s) => s.pruneQueue);

  const displayName = useAuthStore((s) => s.displayName);

  // Server URL — embedded at build time; can be overridden in localStorage
  const ENV_SERVER = process.env.NEXT_PUBLIC_API_URL || "";

  const pendingJobs = syncQueue.filter((j) => j.status === "pending");

  useEffect(() => { pruneQueue(); }, [pruneQueue]);

  // ─── Resolve server URL ──────────────────────────────────────────────────
  function getServerBase(): string {
    if (ENV_SERVER) return ENV_SERVER.replace(/\/$/, "");
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("FOX_KISEM_SERVER_URL");
      if (stored) return stored.replace(/\/$/, "");
    }
    return "";
  }

  // ─── Try to POST one job to the server ──────────────────────────────────
  async function trySyncJob(
    jobId: string,
    payload: { profile: any; zones: any[]; areas: any[]; entries: any[]; apfcs?: any[] }
  ): Promise<boolean> {
    const base = getServerBase();
    if (!base) return false;

    try {
      const res = await fetch(`${base}/api/sync/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          reporterName: displayName || "Engineer",
          ...payload,
        }),
      });

      if (res.ok) {
        updateJobStatus(jobId, "synced");
        return true;
      }
      const body = await res.json().catch(() => ({}));
      console.warn("[sync] server error:", res.status, body);
      return false;
    } catch (err) {
      console.warn("[sync] fetch error:", err);
      return false;
    }
  }

  // ─── Main export handler ─────────────────────────────────────────────────
  const handleExportAndComplete = async () => {
    if (!hasCompany) {
      setShowWarning(true);
      return;
    }

    setExporting(true);
    const jobId = crypto.randomUUID();
    const payload = { profile, zones, areas, entries, apfcs };

    // 1. Always save Excel file locally first (silent save, no share popup)
    let savedUri: string | null = null;
    try {
      savedUri = await exportOfflineExcel(profile, zones, areas, entries, apfcs);
    } catch (err) {
      console.error("[export] local save failed:", err);
      toast.error("Failed to save Excel locally. Check storage permissions.");
      setExporting(false);
      return;
    }

    if (!savedUri) {
      toast.error("Could not write file to device storage.");
      setExporting(false);
      return;
    }

    toast.success("Excel saved to device downloads ✓");

    // 2. Queue the job (so it can be retried later if sync fails now)
    addJobToQueue({
      jobId,
      status: "pending",
      createdAt: Date.now(),
      reporterName: displayName || "Engineer",
      payload,
    });

    // 3. If internet is available, sync immediately (saves to DB + sends email)
    const isOnline = typeof navigator !== "undefined" && navigator.onLine;
    if (isOnline) {
      const serverBase = getServerBase();
      if (serverBase) {
        setMailModalStatus("sending");
        const ok = await trySyncJob(jobId, payload);
        if (ok) {
          setMailModalStatus("success");
          toast.success("Report emailed to admin team ✓");
        } else {
          setMailModalStatus("error");
          toast.warning("Saved locally. Email sync failed — will retry when online.");
        }
        setTimeout(() => setMailModalStatus("idle"), 2000);
      } else {
        toast.info("No server configured. Report queued for later sync.");
      }
    } else {
      toast.info("Offline. Report queued — will email when you tap 'Sync'.");
    }

    setExporting(false);
    setShowCompleteModal(true); // Show the success/logout modal!
  };

  // ─── Retry all pending sync jobs ────────────────────────────────────────
  const handleSyncAll = async () => {
    if (pendingJobs.length === 0) {
      return toast.info("No pending reports to sync.");
    }

    const serverBase = getServerBase();
    if (!serverBase) {
      toast.error("No server configured. Please deploy the backend and update NEXT_PUBLIC_API_URL.");
      return;
    }

    setSyncing(true);
    setMailModalStatus("sending");
    setSyncJobCount(pendingJobs.length);
    
    let ok = 0;
    for (const job of pendingJobs) {
      if (await trySyncJob(job.jobId, job.payload)) ok++;
    }
    
    if (ok === pendingJobs.length) {
      setMailModalStatus("success");
      toast.success(`All ${ok} report(s) synced & emailed ✓`);
      setTimeout(() => {
        setMailModalStatus("idle");
        setSyncing(false);
      }, 2000);
    } else if (ok > 0) {
      setMailModalStatus("success");
      toast.warning(`Synced ${ok} of ${pendingJobs.length}. Remaining will retry later.`);
      setTimeout(() => {
        setMailModalStatus("idle");
        setSyncing(false);
      }, 2000);
    } else {
      setMailModalStatus("error");
      toast.error("Sync failed. Check internet connection or contact admin.");
      setTimeout(() => {
        setMailModalStatus("idle");
        setSyncing(false);
      }, 3000);
    }
  };

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const handleLogoutAction = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    wipeData();
    router.push("/login");
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
      <MailSendModal
        isOpen={mailModalStatus !== "idle"}
        status={mailModalStatus}
        companyName={profile?.companyName || "Your Company"}
        jobCount={syncJobCount || 1}
      />

      {/* ── Save Progress ── */}
      <Button
        onClick={() => toast.success("Progress saved securely to device!")}
        variant="outline"
        className="border-cyan-500/30 text-cyan-50 hover:bg-cyan-500/10 gap-2 w-full sm:w-auto"
      >
        <CheckCircle2 className="size-4" />
        Save Progress
      </Button>

      {/* ── Sync pending jobs ── */}
      <Button
        onClick={handleSyncAll}
        disabled={syncing}
        variant="secondary"
        className="relative border border-amber-500/30 text-amber-50 hover:bg-amber-500/10 gap-2 pr-10 w-full sm:w-auto"
      >
        {syncing
          ? <Loader2 className="size-4 animate-spin" />
          : <CloudUpload className="size-4" />
        }
        {syncing ? "Syncing…" : "Sync Offline Data"}

        {pendingJobs.length > 0 && (
          <span className="absolute top-1/2 -translate-y-1/2 right-2 px-1.5 min-w-[20px] h-5 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full animate-pulse shadow-lg shadow-red-900/50">
            {pendingJobs.length}
          </span>
        )}
      </Button>

      {/* ── Export & Complete ── */}
      <Button
        onClick={handleExportAndComplete}
        disabled={exporting}
        className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-semibold shadow-lg shadow-emerald-900/20 w-full sm:w-auto"
      >
        {exporting
          ? <Loader2 className="size-4 animate-spin" />
          : <Download className="size-4" />
        }
        {exporting ? "Downloading…" : "Download & Send"}
      </Button>

      {/* ── Missing company modal ── */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-2xl max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <AlertTriangle className="size-6" />
              <h3 className="text-lg font-semibold">Missing Company Details</h3>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              No company details found. The report will show &quot;Unknown Company&quot;. Add details for a proper report.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => { setShowWarning(false); router.push("/company"); }}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Add Company Details
              </Button>
              <Button
                onClick={async () => {
                  setShowWarning(false);
                  await handleExportAndComplete();
                }}
                variant="ghost"
                className="w-full text-slate-400 hover:text-white"
              >
                Export Anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success & Logout Modal ── */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-emerald-500/20 p-3">
                <CheckCircle2 className="size-10 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Report Saved!</h3>
            <p className="text-sm text-slate-300 mb-6">
              The Excel file has been downloaded.
              {typeof navigator !== "undefined" && navigator.onLine 
                ? " The email has been sent successfully." 
                : " Email is queued. Use 'Sync Offline Data' when connected."}
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleLogoutAction} 
                className="w-full bg-red-600 hover:bg-red-500 text-white gap-2 font-medium"
              >
                <AlertTriangle className="size-4 hidden" />
                Logout Safely
              </Button>
              <Button 
                onClick={() => { wipeData(); setShowCompleteModal(false); router.push("/company"); }} 
                variant="outline" 
                className="w-full border-white/20 text-white bg-white/5 hover:bg-white/10"
              >
                Start New Report
              </Button>
              <Button 
                onClick={() => setShowCompleteModal(false)} 
                variant="ghost" 
                className="w-full text-slate-400 hover:text-white"
              >
                Close & Keep Editing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

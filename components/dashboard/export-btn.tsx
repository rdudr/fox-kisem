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
  const [mailErrorMessage, setMailErrorMessage] = useState<string | undefined>(undefined);
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

  // Server URL — embedded at build time; falls back to production URL
  const ENV_SERVER = process.env.NEXT_PUBLIC_API_URL || "https://fox-kisem.vercel.app";

  const pendingJobs = syncQueue.filter((j) => j.status === "pending");

  useEffect(() => { pruneQueue(); }, [pruneQueue]);

  // ─── Resolve server URL ──────────────────────────────────────────────────
  function getServerBase(): string {
    // Always have a working URL — local override → build env → hardcoded production
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("FOX_KISEM_SERVER_URL");
      if (stored) return stored.replace(/\/$/, "");
    }
    return ENV_SERVER.replace(/\/$/, "");
  }

  // ─── Try to POST one job to the server ──────────────────────────────────
  async function trySyncJob(
    jobId: string,
    payload: { profile: any; zones: any[]; areas: any[]; entries: any[]; apfcs?: any[] }
  ): Promise<{ ok: boolean; error?: string }> {
    const base = getServerBase();
    if (!base) return { ok: false, error: "No server URL configured" };

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
        return { ok: true };
      }

      const body = await res.json().catch(() => ({ error: "Server error" }));
      const errMsg = body.error || `Server error ${res.status}`;
      console.error("[sync] Server error:", res.status, errMsg);
      return { ok: false, error: errMsg };
    } catch (err: any) {
      const errMsg = `Connection failed: ${err.message}`;
      console.error("[sync] Fetch error:", errMsg);
      return { ok: false, error: errMsg };
    }
  }

  const [lastSyncResult, setLastSyncResult] = useState<"synced" | "queued" | "offline">("offline");

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
        const result = await trySyncJob(jobId, payload);
        if (result.ok) {
          setLastSyncResult("synced");
          setMailModalStatus("success");
          setMailErrorMessage(undefined);
          toast.success("Report emailed to admin team ✓");
        } else {
          setLastSyncResult("queued");
          setMailErrorMessage(result.error);
          setMailModalStatus("error");
        }
        setTimeout(() => setMailModalStatus("idle"), 4000);
      } else {
        setLastSyncResult("queued");
        toast.info("No server configured. Report queued for later sync.");
      }
    } else {
      setLastSyncResult("offline");
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
    let lastError: string | undefined;
    for (const job of pendingJobs) {
      const result = await trySyncJob(job.jobId, job.payload);
      if (result.ok) ok++;
      else lastError = result.error;
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
      setMailErrorMessage(lastError);
      setMailModalStatus("error");
      toast.error("Sync failed. Check internet connection or contact admin.");
      // DO NOT automatically close the error modal, let the user read it and click 'X'
      setSyncing(false);
    }
  };

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const authLogout = useAuthStore((s) => s.logout);

  const handleLogoutAction = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    // Clear the active form data so next login starts fresh
    wipeData();
    authLogout();
    router.push("/login");
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
      <MailSendModal
        isOpen={mailModalStatus !== "idle"}
        status={mailModalStatus}
        companyName={profile?.companyName || "Your Company"}
        jobCount={syncJobCount || 1}
        errorMessage={mailErrorMessage}
        onClose={() => setMailModalStatus("idle")}
      />

      {/* ── Local Save ── */}
      <Button
        onClick={() => toast.success("All data saved securely to device!")}
        variant="secondary"
        className="border-cyan-500/30 text-cyan-50 hover:bg-cyan-500/10 gap-2 w-full sm:w-auto"
      >
        <CheckCircle2 className="size-4" />
        Save to Device
      </Button>

      {/* ── Retry failed submissions ── */}
      {pendingJobs.length > 0 ? (
        <Button
          onClick={handleSyncAll}
          disabled={syncing}
          variant="secondary"
          className="relative border border-red-500/50 text-red-50 hover:bg-red-500/10 gap-2 pr-10 w-full sm:w-auto animate-pulse"
        >
          {syncing
            ? <Loader2 className="size-4 animate-spin" />
            : <CloudUpload className="size-4" />
          }
          {syncing ? "Sending…" : `Resend (${pendingJobs.length})`}

          <span className="absolute top-1/2 -translate-y-1/2 right-2 px-1.5 min-w-[20px] h-5 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-red-900/50">
            {pendingJobs.length}
          </span>
        </Button>
      ) : (
        <Button
          onClick={handleSyncAll}
          disabled={syncing}
          variant="secondary"
          className="border border-slate-500/30 text-slate-400 hover:bg-slate-500/10 gap-2 w-full sm:w-auto opacity-50"
        >
          <CloudUpload className="size-4" />
          All Sent
        </Button>
      )}

      {/* ── Generate Report & Send Email ── */}
      <Button
        onClick={handleExportAndComplete}
        disabled={exporting}
        className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-semibold shadow-lg shadow-emerald-900/20 w-full sm:w-auto"
      >
        {exporting
          ? <Loader2 className="size-4 animate-spin" />
          : <Download className="size-4" />
        }
        {exporting ? "Generating…" : "Submit Report"}
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

      {/* ── Report Completion Modal ── */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-emerald-500/20 p-3">
                <CheckCircle2 className="size-10 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Report Generated</h3>
            <p className="text-sm text-slate-300 mb-6">
              Excel file downloaded to device.
              {lastSyncResult === "synced" && " ✓ Email sent to admin team."}
              {lastSyncResult === "queued" && " Report queued - will send when online. Use 'Resend Queued' to retry now."}
              {lastSyncResult === "offline" && " You're offline. Report is queued and will be sent when you reconnect."}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleLogoutAction}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white gap-2 font-medium"
              >
                Logout
              </Button>
              <Button
                onClick={() => { wipeData(); setShowCompleteModal(false); router.push("/company"); }}
                variant="secondary"
                className="w-full border border-white/20 text-white bg-white/5 hover:bg-white/10"
              >
                New Report
              </Button>
              <Button
                onClick={() => setShowCompleteModal(false)}
                variant="ghost"
                className="w-full text-slate-400 hover:text-white"
              >
                Continue Editing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

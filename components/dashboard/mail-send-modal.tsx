"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MailSendModalProps {
  isOpen: boolean;
  status: "sending" | "success" | "error" | "idle";
  companyName?: string;
  jobCount?: number;
  errorMessage?: string;
}

export function MailSendModal({
  isOpen,
  status,
  companyName = "Your Company",
  jobCount = 1,
  errorMessage,
}: MailSendModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300",
        isOpen ? "bg-black/60 backdrop-blur-sm" : "bg-black/0 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-8 transition-all duration-300 transform",
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* ── Sending State ── */}
        {status === "sending" && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Mail className="w-8 h-8 text-cyan-400 animate-bounce" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-50 mb-1">
                Sending Report
              </h3>
              <p className="text-sm text-slate-400">
                {jobCount === 1
                  ? `Emailing ${companyName}...`
                  : `Syncing ${jobCount} report${jobCount > 1 ? "s" : ""}...`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs text-slate-400">Processing</span>
            </div>
          </div>
        )}

        {/* ── Success State ── */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-50 mb-1">
                Successfully Sent!
              </h3>
              <p className="text-sm text-slate-400">
                {jobCount === 1
                  ? `Report for ${companyName} emailed`
                  : `${jobCount} report${jobCount > 1 ? "s" : ""} synced`}
              </p>
              <p className="text-xs text-emerald-400/80 mt-2">
                ✓ Admin team will receive the data shortly
              </p>
            </div>
          </div>
        )}

        {/* ── Error State ── */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-red-500/20 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-50 mb-1">
                Sync Failed
              </h3>
              <p className="text-sm text-slate-400 mb-3">
                {errorMessage || "Unable to sync report. Please try again."}
              </p>
              <p className="text-xs text-amber-300">
                ⚠ Report saved locally. Tap 'Sync Offline Reports' to retry.
              </p>
            </div>
          </div>
        )}

        {/* ── Idle State (hidden but keeping structure) ── */}
        {status === "idle" && null}
      </div>
    </div>
  );
}

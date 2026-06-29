"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, AlertTriangle, FileText, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const profile = useAppStore((s) => s.profile);
  const zones = useAppStore((s) => s.zones);
  const areas = useAppStore((s) => s.areas);
  const entries = useAppStore((s) => s.entries);
  const apfcs = useAppStore((s) => s.apfcs);
  const wipeData = useAppStore((s) => s.wipeData);
  const authLogout = useAuthStore((s) => s.logout);

  // Has unsaved progress?
  const hasProgress =
    !!profile?.companyName ||
    zones.length > 0 ||
    areas.length > 0 ||
    entries.length > 0 ||
    (apfcs?.length ?? 0) > 0;

  const lastUpdated = profile?.updatedAt
    ? new Date(profile.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : null;

  const doServerLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // offline - no worries
    }
  };

  const handleLogoutClick = () => {
    // If there's saved progress, ask the user what to do
    if (hasProgress) {
      setShowConfirm(true);
    } else {
      logoutPreservingData();
    }
  };

  // Preserve data — user can come back and continue
  const logoutPreservingData = async () => {
    setIsLoggingOut(true);
    await doServerLogout();
    authLogout();
    setIsLoggingOut(false);
    setShowConfirm(false);
    router.push("/login");
  };

  // Wipe data — start fresh next time
  const logoutWipingData = async () => {
    setIsLoggingOut(true);
    await doServerLogout();
    wipeData();
    authLogout();
    setIsLoggingOut(false);
    setShowConfirm(false);
    router.push("/login");
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleLogoutClick}
        disabled={isLoggingOut}
        className="gap-1.5 border border-white/10 hover:bg-red-500/10 hover:text-red-400"
      >
        <LogOut className="size-4" />
        {isLoggingOut ? "..." : "Log out"}
      </Button>

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <AlertTriangle className="size-6" />
              <h3 className="text-lg font-semibold text-white">Saved Progress Found</h3>
            </div>

            <p className="text-sm text-slate-300 mb-2">
              You have unsaved work. What would you like to do?
            </p>

            {profile?.companyName && (
              <div className="rounded-lg border border-white/10 bg-slate-950/50 p-3 mb-4 text-xs">
                <div className="text-slate-400">Company:</div>
                <div className="text-cyan-300 font-medium mb-2">{profile.companyName}</div>
                {lastUpdated && (
                  <>
                    <div className="text-slate-400">Last updated:</div>
                    <div className="text-slate-200">{lastUpdated}</div>
                  </>
                )}
                <div className="mt-2 text-slate-500">
                  {entries.length} motor load entries, {zones.length} zones, {areas.filter(a => a.type === "PCC").length} PCC panels, {areas.filter(a => a.type === "MCC").length} MCC panels
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={logoutPreservingData}
                disabled={isLoggingOut}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white gap-2 font-medium"
              >
                <FileText className="size-4" />
                Logout & Continue Later
              </Button>
              <Button
                onClick={logoutWipingData}
                disabled={isLoggingOut}
                variant="secondary"
                className="w-full border border-red-500/30 text-red-300 hover:bg-red-500/10 gap-2"
              >
                <PlusCircle className="size-4" />
                Logout & Start New Report
              </Button>
              <Button
                onClick={() => setShowConfirm(false)}
                disabled={isLoggingOut}
                variant="ghost"
                className="w-full text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Try to clear server session if online
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // offline - no worries
      }
    } finally {
      // Clear offline session & redirect
      router.push("/login");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isLoggingOut}
        className="gap-1.5"
      >
        <LogOut className="size-4" />
        Log out
      </Button>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-slate-50 mb-2">Sign out?</h3>
            <p className="text-sm text-slate-400 mb-6">
              You'll be returned to the login screen. Any unsaved offline data will be preserved.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="ghost"
                className="flex-1 text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await handleLogout();
                }}
                disabled={isLoggingOut}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white"
              >
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

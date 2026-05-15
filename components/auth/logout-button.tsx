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
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="gap-1.5 border border-white/10 hover:bg-red-500/10 hover:text-red-400"
    >
      <LogOut className="size-4" />
      {isLoggingOut ? "..." : "Log out"}
    </Button>
  );
}

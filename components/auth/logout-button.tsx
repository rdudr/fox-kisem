"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";

export function LogoutButton() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        // Clear offline session
        logout();
        // Also clear server session if online
        try { await fetch("/api/auth/logout", { method: "POST" }); } catch { /* offline */ }
        router.push("/login");
      }}
    >
      Log out
    </Button>
  );
}

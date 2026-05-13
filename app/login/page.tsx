"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect immediately
  if (typeof window !== "undefined" && isAuthenticated()) {
    router.replace("/dashboard");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Try offline login first
      const offlineOk = login(username, password);
      if (offlineOk) {
        toast.success("Signed in (offline)");
        router.push("/dashboard");
        return;
      }

      // Fallback: try server login if online
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          toast.success("Signed in");
          router.push(data.redirect || "/dashboard");
          return;
        }
      } catch {
        // Offline — server unreachable, already tried offline above
      }

      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.15),_transparent_55%),#020617] px-4 py-10">
      <Card className="w-full max-w-md border-white/10 bg-slate-950/60 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <CardHeader className="flex flex-col items-center text-center">
          <img src="/iitgnlogo.png" alt="IITGN Logo" className="h-20 mb-4" />
          <CardTitle className="text-2xl">Fox</CardTitle>
          <CardDescription>by Kisem IITGN — Excel data feed tool login.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Username / ID</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Works offline. Use your assigned ID and password.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

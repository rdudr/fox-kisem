"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  const [isOnline, setIsOnline] = useState(true);

  // Detect online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connected to internet");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.info("Device is offline - Using offline mode");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // If already authenticated, redirect immediately
  if (typeof window !== "undefined" && isAuthenticated()) {
    router.replace("/company");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      // If online, try server login FIRST (for real authentication)
      if (isOnline) {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            // Server login successful - also update offline store for offline fallback
            login(username, password);
            toast.success("Signed in");
            router.push(data.redirect || "/company");
            return;
          } else {
            // Server rejected credentials - don't try offline
            toast.error(data.error || "Invalid credentials");
            setLoading(false);
            return;
          }
        } catch (err) {
          // Network error while online - fall through to offline mode
          toast.warning("Network error - trying offline mode");
        }
      }

      // Offline mode: try offline credentials
      const offlineOk = login(username, password);
      if (offlineOk) {
        toast.success(`Signed in (offline mode)${!isOnline ? " - No internet connection" : ""}`);
        router.push("/company");
        return;
      }

      toast.error("Invalid credentials - username or password incorrect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.15),_transparent_55%),#020617] px-4 py-10">
      <Card className="w-full max-w-md border-white/10 bg-slate-950/60 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <CardHeader className="flex flex-col items-center text-center">
          <img src="/iitgnlogo.png" alt="IITGN Logo" className="h-20 mb-4" />
          <CardTitle className="text-2xl">Fox Kisem</CardTitle>
          <CardDescription>by Kisem IITGN — Excel data feed tool login.</CardDescription>
          {!isOnline && (
            <div className="mt-3 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded text-xs text-amber-200">
              ⚠️ Offline Mode - Limited to pre-defined credentials
            </div>
          )}
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
                placeholder={isOnline ? "Enter your server credentials" : "ABHAY, RAHULPATEL, etc."}
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
            <p className="text-[10px] leading-relaxed text-slate-400">
              {isOnline 
                ? "✓ Online - Using server authentication" 
                : "⚠ Offline - Using local credentials"}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

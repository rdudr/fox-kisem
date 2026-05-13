"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

export default function CompanyPage() {
  const [loading, setLoading] = useState(false);
  const profile = useAppStore((state) => state.profile);
  const setProfile = useAppStore((state) => state.setProfile);
  
  const [form, setForm] = useState({
    companyName: "",
    area: "",
    district: "",
    state: "",
    pincode: "",
    overallConsumption: "",
  });

  // Sync form with store
  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName,
        area: profile.area,
        district: profile.district,
        state: profile.state,
        pincode: profile.pincode,
        overallConsumption: String(profile.overallConsumption),
      });
    }
  }, [profile]);

  async function save() {
    if (!form.companyName || !form.area) {
      return toast.error("Company name and Zone are mandatory details.");
    }
    setLoading(true);
    try {
      setProfile({
        id: profile?.id || crypto.randomUUID(),
        ...form,
        overallConsumption: Number(form.overallConsumption || 0),
        updatedAt: new Date().toISOString(),
      });
      toast.success("Company profile saved locally");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Company setup</CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div><Label>Company name <span className="text-red-500">*</span></Label><Input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
        <div><Label>Zone <span className="text-red-500">*</span></Label><Input required value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div>
        <div><Label>District</Label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></div>
        <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
        <div><Label>Pincode</Label><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
        <div><Label>Overall consumption</Label><Input type="number" value={form.overallConsumption} onChange={(e) => setForm({ ...form, overallConsumption: e.target.value })} /></div>
        <div className="md:col-span-2"><Button onClick={() => void save()} disabled={loading}>{loading ? "Saving..." : "Save company"}</Button></div>
      </CardContent>
    </Card>
  );
}

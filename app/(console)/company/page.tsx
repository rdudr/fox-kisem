"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CompanyPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    area: "",
    district: "",
    state: "",
    pincode: "",
    overallConsumption: "",
  });

  useEffect(() => {
    void fetch("/api/company")
      .then((r) => r.json())
      .then((d) => {
        if (!d.profile) return;
        setForm({
          companyName: d.profile.companyName,
          area: d.profile.area,
          district: d.profile.district,
          state: d.profile.state,
          pincode: d.profile.pincode,
          overallConsumption: String(d.profile.overallConsumption),
        });
      });
  }, []);

  async function save() {
    if (!form.companyName || !form.area) {
      return toast.error("Company name and Zone are mandatory details.");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          overallConsumption: Number(form.overallConsumption || 0),
        }),
      });
      if (!res.ok) return toast.error("Failed to save");
      toast.success("Company profile saved");
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

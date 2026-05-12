"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function CsvPage() {
  const [exporting, setExporting] = useState(false);

  async function exportCsv() {
    setExporting(true);
    const res = await fetch("/api/csv/export");
    if (!res.ok) {
      toast.error("Export failed");
      setExporting(false);
      return;
    }
    const disposition = res.headers.get("content-disposition");
    let filename = "data_feed.xlsx";
    if (disposition && disposition.indexOf("filename=") !== -1) {
      const match = disposition.match(/filename="(.+)"/);
      if (match && match.length === 2) {
        filename = match[1];
      }
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started");
    setExporting(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">CSV export</h1>
        <p className="text-sm text-slate-400">Exports company + area + sub-machine + calculations + reporter + export time.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Report export</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button size="sm" type="button" onClick={() => void exportCsv()} disabled={exporting}>
            Export CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

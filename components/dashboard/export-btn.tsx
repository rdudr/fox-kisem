"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle } from "lucide-react";

export function DashboardExportBtn({ hasCompany }: { hasCompany: boolean }) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);

  const handleExport = () => {
    if (!hasCompany) {
      setShowWarning(true);
    } else {
      window.location.href = "/api/csv/export";
    }
  };

  const handleContinue = () => {
    setShowWarning(false);
    window.location.href = "/api/csv/export";
  };

  const handleGoToCompany = () => {
    setShowWarning(false);
    router.push("/company");
  };

  return (
    <>
      <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-semibold shadow-lg shadow-emerald-900/20">
        <Download className="size-4" />
        Export to Excel
      </Button>

      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-2xl max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <AlertTriangle className="size-6" />
              <h3 className="text-lg font-semibold">Missing Company Details</h3>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              You haven't added the company details yet. The exported report will show "UNKNOWN COMPANY".
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleGoToCompany} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                Add Company Details
              </Button>
              <Button onClick={handleContinue} variant="ghost" className="w-full text-slate-400 hover:text-white">
                Continue Exporting
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

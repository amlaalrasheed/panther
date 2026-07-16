"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, FileText } from "lucide-react";

export function ReportExportForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [paid, setPaid] = useState("ALL");

  function download(format: "xlsx" | "pdf") {
    const params = new URLSearchParams({ format, paid });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.open(`/api/reports/export?${params.toString()}`, "_blank");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="from">From Date</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="to">To Date</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Payment</Label>
        <Select
          value={paid}
          onValueChange={(v) => setPaid(v ?? "ALL")}
          items={{ ALL: "All", paid: "Paid", unpaid: "Not Paid" }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Not Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" onClick={() => download("xlsx")}>
          <FileSpreadsheet className="size-4" />
          Export Excel
        </Button>
        <Button variant="outline" onClick={() => download("pdf")}>
          <FileText className="size-4" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}

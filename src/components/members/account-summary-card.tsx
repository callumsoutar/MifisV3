import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabaseBrowserClient";

interface AccountSummaryCardProps {
  memberId: string;
}

export function AccountSummaryCard({ memberId }: AccountSummaryCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    balance: number;
    openInvoices: number;
    totalOutstanding: number;
    lastUpdated: string;
  } | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        // Fetch all invoices for the member
        const { data: invoices, error: invErr } = await supabase
          .from("invoices")
          .select("id, total_amount, status, due_date, created_at")
          .eq("user_id", memberId);
        if (invErr) {
          console.error("[AccountSummaryCard] Supabase invoices error:", invErr);
          setError(invErr.message || "Failed to load invoices");
          setLoading(false);
          return;
        }
        const invoiceIds = invoices?.map(inv => inv.id) ?? [];
        let payments: any[] = [];
        if (invoiceIds.length > 0) {
          const { data: paymentData, error: payErr } = await supabase
            .from("payments")
            .select("id, amount, created_at, invoice_id")
            .in("invoice_id", invoiceIds);
          if (payErr) {
            console.error("[AccountSummaryCard] Supabase payments error:", payErr);
            setError(payErr.message || "Failed to load payments");
            setLoading(false);
            return;
          }
          payments = paymentData ?? [];
        }
        const totalInvoices = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
        const totalPayments = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const openInvoices = invoices?.filter(inv => inv.status !== "paid" && inv.status !== "cancelled").length || 0;
        const totalOutstanding = invoices?.filter(inv => inv.status !== "paid" && inv.status !== "cancelled").reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
        setSummary({
          balance: totalInvoices - totalPayments,
          openInvoices,
          totalOutstanding,
          lastUpdated: new Date().toLocaleString(),
        });
      } catch (err) {
        console.error("[AccountSummaryCard] Failed to load account summary:", err);
        setError("Failed to load account summary");
      } finally {
        setLoading(false);
      }
    };
    if (memberId) fetchSummary();
  }, [memberId]);

  if (loading) {
    return <Card className="p-6"><Skeleton className="h-16 w-full" /></Card>;
  }
  if (error || !summary) {
    return <Card className="p-6 text-center text-red-500">{error || "No data"}</Card>;
  }
  return (
    <Card className="p-6 flex flex-col gap-4 bg-slate-50">
      <div className="font-semibold text-lg mb-2">Account Summary</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-100 p-4 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Current Balance</div>
          <div className={
            summary.balance < 0
              ? "text-red-600 text-2xl font-bold"
              : "text-green-600 text-2xl font-bold"
          }>
            ${Math.abs(summary.balance).toFixed(2)}
            {summary.balance < 0 ? <span className="ml-1 text-xs font-semibold">DR</span> : <span className="ml-1 text-xs font-semibold">CR</span>}
          </div>
        </div>
        <div className="rounded-lg bg-slate-100 p-4 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Open Invoices</div>
          <div className="text-xl font-bold">{summary.openInvoices}</div>
        </div>
        <div className="rounded-lg bg-slate-100 p-4 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Total Outstanding</div>
          <div className="text-xl font-bold">${summary.totalOutstanding.toFixed(2)}</div>
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-2">Last updated: {summary.lastUpdated}</div>
    </Card>
  );
} 
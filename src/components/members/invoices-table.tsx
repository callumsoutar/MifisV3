import { useEffect, useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabaseBrowserClient";
import Link from "next/link";

interface InvoicesTableProps {
  memberId: string;
}

export function InvoicesTable({ memberId }: InvoicesTableProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("invoices")
          .select("id, invoice_number, status, created_at, due_date, total_amount")
          .eq("user_id", memberId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setInvoices(data || []);
      } catch (err) {
        setError("Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };
    if (memberId) fetchInvoices();
  }, [memberId]);

  if (loading) {
    return <div className="mt-8"><Skeleton className="h-32 w-full" /></div>;
  }
  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }
  return (
    <div className="mt-8">
      <div className="font-semibold text-lg mb-2">Account History</div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono">{inv.invoice_number || inv.id.slice(0, 8)}</TableCell>
                <TableCell>
                  <Badge variant={
                    inv.status === "paid"
                      ? "default"
                      : inv.status === "overdue"
                      ? "destructive"
                      : inv.status === "pending"
                      ? "secondary"
                      : "outline"
                  }>
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "-"}</TableCell>
                <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "-"}</TableCell>
                <TableCell className="text-right">${inv.total_amount?.toFixed(2) ?? "-"}</TableCell>
                <TableCell>
                  <Link href={`/invoicing/view/${inv.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 
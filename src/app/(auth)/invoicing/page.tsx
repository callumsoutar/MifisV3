"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowserClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, ChevronRight } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { UserRole, canViewFinancials } from "@/lib/permissions";
import { InvoicingSkeleton } from "@/components/invoicing/invoicing-skeleton";
import { InvoiceStatusBadge } from "@/components/invoicing/invoice-status-badge";
import type { Invoice, InvoiceStatus } from "@/types/invoicing";

type InvoiceListItem = {
  id: string;
  invoice_number: string;
  member_id: string;
  member_name: string;
  total_amount: number;
  status: InvoiceStatus;
  due_date: string;
  created_at: string;
};

const statusFilters = ["All", "Draft", "Pending", "Paid", "Overdue", "Cancelled"];

export default function InvoicingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalPending: 0,
    totalOverdue: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        
        // Get current user and their role
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        // Get user's organization and role
        const { data: userOrgRows, error: userOrgError } = await supabase
          .from('user_organizations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (userOrgError || !userOrgRows || userOrgRows.length === 0) {
          router.replace('/create-organization');
          return;
        }

        const orgId = userOrgRows[0].organization_id;
        const role = userOrgRows[0].role as UserRole;
        setUserRole(role);

        // Check if user can view financials
        if (!canViewFinancials(role)) {
          setError('You do not have permission to view invoices');
          setLoading(false);
          return;
        }

        // Fetch invoices with member details
        const { data: invoiceData, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            *,
            member:users(
              first_name,
              last_name
            )
          `)
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        if (invoicesError) {
          console.error('Error fetching invoices:', invoicesError);
          setError('Failed to load invoices');
          setLoading(false);
          return;
        }

        const formattedInvoices: InvoiceListItem[] = (invoiceData || []).map(invoice => ({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          member_id: invoice.member_id,
          member_name: `${invoice.member.first_name} ${invoice.member.last_name}`,
          total_amount: invoice.total_amount,
          status: invoice.status as InvoiceStatus,
          due_date: invoice.due_date,
          created_at: invoice.created_at
        }));

        setInvoices(formattedInvoices);
        setFilteredInvoices(formattedInvoices);

        // Calculate stats
        const stats = {
          totalInvoices: formattedInvoices.length,
          totalPending: formattedInvoices.filter(i => i.status === 'pending').length,
          totalOverdue: formattedInvoices.filter(i => i.status === 'overdue').length,
          totalRevenue: formattedInvoices
            .filter(i => i.status === 'paid')
            .reduce((sum, invoice) => sum + invoice.total_amount, 0)
        };
        setStats(stats);

      } catch (err) {
        console.error('Error in loadData:', err);
        setError('An error occurred while loading invoices');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  useEffect(() => {
    let result = invoices;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(query) ||
        invoice.member_name.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "All") {
      result = result.filter(invoice => 
        invoice.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    setFilteredInvoices(result);
  }, [searchQuery, statusFilter, invoices]);

  const handleRowClick = (invoiceId: string) => {
    router.push(`/invoicing/view/${invoiceId}`);
  };

  if (loading) {
    return (
      <section className="flex-1 p-10 bg-gradient-to-br from-white via-sky-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <InvoicingSkeleton />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex-1 p-10 bg-gradient-to-br from-white via-sky-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <p>{error}</p>
          </Alert>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 p-10 bg-gradient-to-br from-white via-sky-50 to-purple-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoicing</h1>
            <p className="text-gray-600">Manage your flight school's invoices and payments</p>
          </div>
          <Button
            onClick={() => router.push('/invoicing/new')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Total Invoices</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalInvoices}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Pending</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalPending}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Overdue</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalOverdue}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-indigo-600">${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mt-8">
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Invoices Table */}
        <div className="mt-4 bg-white rounded-xl shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow 
                  key={invoice.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleRowClick(invoice.id)}
                >
                  <TableCell className="font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>{invoice.member_name}</TableCell>
                  <TableCell>${invoice.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
} 
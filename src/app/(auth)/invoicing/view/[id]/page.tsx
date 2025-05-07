"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowserClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
  Send,
  Download,
  ArrowLeft,
  Printer,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceStatusBadge } from "@/components/invoicing/invoice-status-badge";
import { OrganizationCard } from "@/components/invoicing/organization-card";
import { PaymentHistoryCard } from "@/components/invoicing/payment-history-card";
import { InvoiceItemsTable } from "@/components/invoicing/invoice-items-table";
import { InvoiceSummaryCard } from "@/components/invoicing/invoice-summary-card";

type PaymentMethod = "cash" | "credit_card" | "bank_transfer" | "direct_debit" | "cheque" | "other";

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  profile_image_url?: string;
  phone?: string;
}

interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  contact_email?: string;
  address?: string;
}

interface Aircraft {
  id: string;
  registration: string;
  type: string;
}

interface Instructor {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  aircraft?: Aircraft;
  instructor?: Instructor;
}

interface InvoiceItem {
  id: string;
  quantity: number;
  rate: number;
  description: string;
  chargeable: {
    name: string;
    description: string | null;
  };
}

interface Payment {
  id: string;
  amount: number;
  created_at: string;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  transaction: {
    user: {
      first_name: string | null;
      last_name: string | null;
    };
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  created_at: string;
  due_date: string;
  total_amount: number;
  member: User;
  organization: Organization;
  booking?: Booking;
  items: InvoiceItem[];
  payments: Payment[];
}

function InvoiceDetailsHeader({ invoice }: { invoice: any }) {
  return (
    <div className="flex flex-row gap-8">
      <div>
        <div className="text-xs text-gray-500">Invoice Number</div>
        <div className="font-semibold text-gray-900">{invoice.invoice_number}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">Issue Date</div>
        <div className="font-semibold text-gray-900">{invoice.created_at ? format(new Date(invoice.created_at), 'PPP') : '-'}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">Due Date</div>
        <div className="font-semibold text-gray-900">{invoice.due_date ? format(new Date(invoice.due_date), 'PPP') : '-'}</div>
      </div>
    </div>
  );
}

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const supabase = createClient();
        
        // Get current user and their organization
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        // Get user's organization
        const { data: userOrgRows, error: userOrgError } = await supabase
          .from('user_organizations')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (userOrgError || !userOrgRows || userOrgRows.length === 0) {
          router.replace('/create-organization');
          return;
        }

        const orgId = userOrgRows[0].organization_id;
        
        // Fetch invoice with organization check
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            *,
            member:users (
              id,
              first_name,
              last_name,
              email,
              profile_image_url,
              phone
            ),
            organization:organizations (
              id,
              name,
              logo_url,
              contact_email,
              contact_phone,
              address
            ),
            booking:bookings (
              id,
              start_time,
              end_time,
              aircraft:aircraft (
                id,
                registration,
                type
              ),
              instructor:users!bookings_instructor_id_fkey (
                id,
                first_name,
                last_name
              )
            ),
            items:invoice_items (
              id,
              quantity,
              rate,
              description,
              chargeable:chargeables (
                id,
                name,
                description
              )
            ),
            payments:payments (
              id,
              amount,
              payment_method,
              payment_reference,
              created_at,
              transaction:transactions (
                id,
                user:users (
                  id,
                  first_name,
                  last_name
                )
              )
            )
          `)
          .eq('id', params.id)
          .eq('organization_id', orgId)
          .single();

        if (invoiceError) {
          console.error('Error fetching invoice:', invoiceError);
          setError('Failed to load invoice');
          return;
        }

        if (!invoiceData) {
          setError('Invoice not found or you do not have permission to view it');
          return;
        }

        setInvoice(invoiceData);
        setEditInvoice(invoiceData);
      } catch (err) {
        console.error('Error in loadInvoice:', err);
        setError('An error occurred while loading the invoice');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadInvoice();
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-gradient-to-br from-white via-sky-50 to-purple-50">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="space-y-4">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex-1 p-8 bg-gradient-to-br from-white via-sky-50 to-purple-50">
        <div className="max-w-5xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              {error || "Invoice not found"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const itemsForTotals = editMode && editInvoice ? editInvoice.items : invoice.items;
  const subtotal = itemsForTotals.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = (invoice.total_amount ?? subtotal) - totalPaid;

  const canEdit = invoice && (invoice.status === 'draft' || invoice.status === 'pending');

  const handleEditClick = () => {
    if (canEdit) setEditMode(true);
  };

  const handleFieldChange = (field: keyof Invoice, value: any) => {
    if (!editInvoice) return;
    setEditInvoice({ ...editInvoice, [field]: value });
  };

  const handleItemChange = (idx: number, field: keyof InvoiceItem, value: any) => {
    if (!editInvoice) return;
    const items = [...editInvoice.items];
    items[idx] = { ...items[idx], [field]: value };
    setEditInvoice({ ...editInvoice, items });
  };

  const handleSave = async () => {
    if (!editInvoice) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          due_date: editInvoice.due_date,
          items: editInvoice.items.map(({ id, quantity, rate, description }) => ({ id, quantity, rate, description })),
        }),
      });
      if (!res.ok) throw new Error('Failed to save changes');
      setEditMode(false);
      // Reload invoice
      const updated = await res.json();
      setInvoice(updated.invoice);
      setEditInvoice(updated.invoice);
    } catch (err) {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-8 bg-gradient-to-br from-white via-sky-50 to-purple-50">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice #{invoice.invoice_number}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            {invoice.status === 'draft' && (
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Send Invoice
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditClick} disabled={!canEdit}>Edit Invoice</DropdownMenuItem>
                <DropdownMenuItem>Duplicate Invoice</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Delete Invoice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8 w-full max-w-3xl mx-auto">
          {/* Main Invoice Card */}
          <div className="w-full space-y-8 min-h-[520px]">
            {/* Organization & Member Details */}
            <Card className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between">
                  <OrganizationCard organization={invoice.organization} />
                  <div className="text-right">
                    <div className="flex items-center gap-3 justify-end">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {invoice.member.first_name} {invoice.member.last_name}
                        </h3>
                        {invoice.member.email && (
                          <div className="text-sm text-gray-500">{invoice.member.email}</div>
                        )}
                        {invoice.member.phone && (
                          <div className="text-sm text-gray-500">{invoice.member.phone}</div>
                        )}
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={invoice.member.profile_image_url}
                          alt={`${invoice.member.first_name} ${invoice.member.last_name}`}
                        />
                        <AvatarFallback>
                          {invoice.member.first_name?.[0]}
                          {invoice.member.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>
                <InvoiceDetailsHeader invoice={invoice} />
              </div>
            </Card>

            {/* Invoice Details */}
            <Card className="p-8 shadow-lg rounded-2xl">
              <div className="space-y-8">
                {/* Invoice Items Table - editable if in editMode */}
                {editMode ? (
                  <table className="w-full text-sm mb-2">
                    <thead>
                      <tr className="pb-2">
                        <th className="text-left pb-2">Description</th>
                        <th className="pb-2">Quantity</th>
                        <th className="pb-2">Unit Price</th>
                        <th className="pb-2">Amount</th>
                      </tr>
                      <tr><td colSpan={4}><div className="border-b" /></td></tr>
                    </thead>
                    <tbody className="mt-2">
                      {editInvoice?.items.map((item, idx) => (
                        <tr key={item.id} className="border-b last:border-b-0 py-4 align-middle">
                          <td>
                            <input
                              className="border rounded px-2 py-1 w-full"
                              value={item.description}
                              onChange={e => handleItemChange(idx, 'description', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="border rounded px-2 py-1 w-16 text-right"
                              value={item.quantity}
                              min={1}
                              onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="border rounded px-2 py-1 w-24 text-right"
                              value={item.rate}
                              min={0}
                              step={0.01}
                              onChange={e => handleItemChange(idx, 'rate', Number(e.target.value))}
                            />
                          </td>
                          <td className="text-right">${(item as any).total_amount?.toFixed(2) ?? (item.quantity * item.rate).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="pb-2">
                        <th className="text-left pb-2">Item</th>
                        <th className="pb-2 text-center">Quantity</th>
                        <th className="pb-2 text-right">Unit Price</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                      <tr><td colSpan={4}><div className="border-b" /></td></tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, idx) => (
                        <tr key={item.id} className={"border-b last:border-b-0 align-middle" + (idx === 0 ? " mt-4" : "")}>
                          <td className="font-medium py-4">
                            {item.chargeable?.name}
                            {item.chargeable?.description && (
                              <div className="text-xs text-gray-500 mt-1">{item.chargeable.description}</div>
                            )}
                          </td>
                          <td className="text-center py-4">{item.quantity}</td>
                          <td className="text-right py-4">${item.rate.toFixed(2)}</td>
                          <td className="text-right py-4">${(item as any).total_amount?.toFixed(2) ?? (item.quantity * item.rate).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Separator */}
                <div className="border-t my-6" />

                {/* Totals Table */}
                <div className="flex justify-end">
                  <table className="text-sm w-80">
                    <tbody>
                      <tr>
                        <td className="text-gray-500 py-1">Subtotal</td>
                        <td className="text-right font-medium py-1">${(invoice as any).subtotal?.toFixed(2) ?? subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-500 py-1">Tax</td>
                        <td className="text-right font-medium py-1">${(invoice as any).tax_amount?.toFixed(2) ?? '0.00'}</td>
                      </tr>
                      {/* Separator above Invoice Total */}
                      <tr>
                        <td colSpan={2} className="pt-2"><div className="border-t" /></td>
                      </tr>
                      <tr>
                        <td className="font-semibold py-2 text-base">Invoice Total</td>
                        <td className="text-right font-bold py-2 text-base">${invoice.total_amount?.toFixed(2) ?? subtotal.toFixed(2)}</td>
                      </tr>
                      {/* Separator above Total Paid/Balance Due */}
                      <tr>
                        <td colSpan={2} className="pt-2"><div className="border-t" /></td>
                      </tr>
                      <tr>
                        <td className="text-gray-500 py-1">Total Paid</td>
                        <td className="text-right text-green-600 font-medium py-1">${totalPaid.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold py-2 text-lg">Balance Due</td>
                        <td className="text-right font-bold py-2 text-lg text-red-600">${balance.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Save/Cancel Buttons */}
                {editMode && (
                  <div className="flex gap-2 justify-end mt-4">
                    <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                  </div>
                )}

                {/* Payment History - now inside the invoice details card */}
                <div className="mt-10">
                  <PaymentHistoryCard
                    payments={invoice.payments}
                    balance={balance}
                    onRecordPayment={() => {
                      // TODO: Implement payment recording
                      console.log('Record payment');
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* Related Booking */}
            {invoice.booking && (
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Related Booking</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Aircraft</p>
                      <p className="font-medium">
                        {invoice.booking.aircraft?.registration} ({invoice.booking.aircraft?.type})
                      </p>
                    </div>
                    {invoice.booking.instructor && (
                      <div>
                        <p className="text-sm text-gray-500">Instructor</p>
                        <p className="font-medium">
                          {invoice.booking.instructor.first_name} {invoice.booking.instructor.last_name}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Start Time</p>
                      <p className="font-medium">
                        {format(new Date(invoice.booking.start_time), 'PPp')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">End Time</p>
                      <p className="font-medium">
                        {format(new Date(invoice.booking.end_time), 'PPp')}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
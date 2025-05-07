"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Search, X } from "lucide-react";
import { AsyncSearchDropdown } from "@/components/ui/async-search-dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabaseBrowserClient";

interface Chargeable {
  id: string;
  name: string;
  description?: string;
  type?: string;
  rate?: number;
}

const CHARGEABLE_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  aircraft_rental: { label: 'Aircraft', emoji: '✈️' },
  instructor_fee: { label: 'Instructor', emoji: '🧑‍🏫' },
  membership_fee: { label: 'Membership', emoji: '🪪' },
  landing_fee: { label: 'Landing', emoji: '🛬' },
  facility_rental: { label: 'Facility', emoji: '🏢' },
  product_sale: { label: 'Product', emoji: '🛒' },
  service_fee: { label: 'Service', emoji: '🛠️' },
  other: { label: 'Other', emoji: '🔖' },
};

export default function CreateInvoicePage() {
  const router = useRouter();
  const supabase = createClient();
  // Placeholder state
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [invoiceDate] = useState("2025-02-05"); // Example default
  const [dueDate, setDueDate] = useState("2025-06-01");
  const [reference, setReference] = useState("");
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  // Async search for members
  const handleMemberSearch = async (query: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, profile_image_url")
      .ilike("first_name", `%${query}%`)
      .or(`last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);
    if (error) return [];
    return (data || []).map((user) => ({
      ...user,
      label: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
    }));
  };

  // Async search for line items (chargeables)
  const handleLineItemSearch = async (query: string): Promise<Chargeable[]> => {
    const { data, error } = await supabase
      .from("chargeables")
      .select("id, name, description, type, rate")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10);
    console.log("Chargeables search:", { query, data, error });
    if (error) return [];
    return data || [];
  };

  // Add line item to table
  const handleAddLineItem = (item: any) => {
    if (lineItems.some((li) => li.id === item.id)) return;
    setLineItems([
      ...lineItems,
      {
        ...item,
        quantity: 1,
        unit_price: item.rate || 0,
      },
    ]);
  };

  // Remove line item
  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter((li) => li.id !== id));
  };

  // Update quantity or unit price
  const handleLineItemChange = (id: string, field: "quantity" | "unit_price", value: number) => {
    setLineItems((prev) =>
      prev.map((li) =>
        li.id === id ? { ...li, [field]: value } : li
      )
    );
  };

  // Calculate summary
  React.useEffect(() => {
    const sub = lineItems.reduce((sum, li) => sum + (li.quantity * li.unit_price), 0);
    const taxVal = sub * 0.15;
    setSubtotal(sub);
    setTax(taxVal);
    setTotal(sub + taxVal);
  }, [lineItems]);

  // Add this function inside your component
  const handleCreateInvoice = async () => {
    if (!selectedMember || lineItems.length === 0) return;
    // Get org id from session
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("Could not get logged in user");
      return;
    }
    // Fetch user's org id (assuming user is only in one org, or get from context if multi-org)
    const { data: orgData, error: orgError } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();
    if (orgError || !orgData) {
      alert("Could not get organization id for user");
      return;
    }
    const organization_id = orgData.organization_id;
    // Build payload
    const payload = {
      organization_id,
      user_id: selectedMember.id,
      due_date: dueDate,
      reference,
      notes: "", // or your notes state if you add it
      items: lineItems.map(item => ({
        chargeable_id: item.id,
        description: item.description || item.name,
        quantity: item.quantity,
        rate: item.unit_price,
        amount: item.quantity * item.unit_price,
        tax_rate: 0.15,
        tax_amount: item.quantity * item.unit_price * 0.15,
        total_amount: item.quantity * item.unit_price * 1.15,
      })),
    };

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        // Redirect or show success
        router.push(`/invoicing/view/${data.invoice.id}`);
      } else {
        alert(data.error || "Failed to create invoice");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-purple-50">
      <div className="max-w-6xl mx-auto w-full px-8 py-8">
        {/* Sticky Invoice Bar */}
        <div className="sticky top-16 z-20 bg-white/80 border-b flex items-center justify-between px-8 py-4" style={{marginLeft: '-2rem', marginRight: '-2rem'}}>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <span className="sr-only">Back</span>
              &#8592;
            </Button>
            <h1 className="text-2xl font-bold">New Invoice</h1>
            <span className="ml-2 px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 font-medium">DRAFT</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}>Cancel</Button>
            <Button
              disabled={!selectedMember || lineItems.length === 0}
              onClick={handleCreateInvoice}
            >
              Create Invoice
            </Button>
          </div>
        </div>
        <div className="flex flex-1 gap-8 pt-8">
          {/* Left column */}
          <div className="flex-1 space-y-6">
            {/* Invoice Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-1">Invoice Details</h2>
              <p className="text-sm text-gray-500 mb-4">Create a new invoice for a member or flight</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Member</label>
                  <AsyncSearchDropdown
                    placeholder="Search members..."
                    onSearch={handleMemberSearch}
                    onSelect={setSelectedMember}
                    value={selectedMember}
                    renderOption={(user) => (
                      <div className="flex flex-col">
                        <span className="font-medium">{user.label}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Invoice Date</label>
                  <Input value={invoiceDate} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reference (Optional)</label>
                  <Input placeholder="e.g., Flight Training, Membership" value={reference} onChange={e => setReference(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>
            </Card>
            {/* Line Items */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-1">Line Items</h2>
              <p className="text-sm text-gray-500 mb-4">Add items to your invoice</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left font-medium">Item</th>
                      <th className="px-4 py-2 text-left font-medium">Quantity</th>
                      <th className="px-4 py-2 text-left font-medium">Unit Price</th>
                      <th className="px-4 py-2 text-left font-medium">Subtotal</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="pl-0 pr-3 py-2 align-top w-full" colSpan={5} style={{ textAlign: 'left' }}>
                        <AsyncSearchDropdown
                          placeholder="Search for items to add..."
                          onSearch={handleLineItemSearch}
                          onSelect={handleAddLineItem}
                          value={null}
                          inputClassName="w-full"
                          popoverWidth="w-[460px]"
                          renderOption={(item: Chargeable) => {
                            const typeInfo = CHARGEABLE_TYPE_LABELS[item.type || 'other'] || CHARGEABLE_TYPE_LABELS.other;
                            return (
                              <div className="flex flex-col gap-1 py-2 px-2 w-full">
                                <div className="flex items-center w-full">
                                  <span className="font-semibold text-base flex-1 text-left">{item.name}</span>
                                  <span className="font-bold text-base text-right min-w-[80px]">${item.rate?.toFixed(2)}</span>
                                </div>
                                {item.description && (
                                  <span className="text-xs text-gray-500 text-left">{item.description}</span>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-700 flex items-center gap-1">
                                    <span>{typeInfo.emoji}</span>
                                    <span>{typeInfo.label}</span>
                                  </span>
                                </div>
                              </div>
                            );
                          }}
                        />
                      </td>
                    </tr>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-4 py-2 align-middle">
                          <div className="font-semibold">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-2 align-middle">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => handleLineItemChange(item.id, "quantity", Math.max(1, Number(e.target.value)))}
                            className="w-16 border rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          />
                        </td>
                        <td className="px-4 py-2 align-middle">
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-1">$</span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={item.unit_price}
                              onChange={e => handleLineItemChange(item.id, "unit_price", Math.max(0, Number(e.target.value)))}
                              className="w-20 border rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2 align-middle text-right font-semibold">${(item.quantity * item.unit_price).toFixed(2)}</td>
                        <td className="px-2 py-2 align-middle text-center">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-red-500 p-1"
                            onClick={() => handleRemoveLineItem(item.id)}
                            aria-label="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mt-4">
                  <div className="space-y-1 text-right">
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-500">Subtotal:</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-500">Tax (15%):</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-8 text-base font-semibold">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          {/* Right column */}
          <div className="w-[320px]">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (15%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 
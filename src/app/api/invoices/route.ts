import { NextRequest, NextResponse } from "next/server";
import { createInvoiceSchema } from "@/types/invoicing";
import { createClient } from "@/lib/supabaseServerClient";
import { z } from "zod";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  // Debug: Log incoming payload
  console.log("[API] /api/invoices - Incoming payload:", JSON.stringify(body, null, 2));

  // 1. Validate input
  const parse = createInvoiceSchema.safeParse(body);
  if (!parse.success) {
    console.error("[API] /api/invoices - Validation error:", parse.error);
    return NextResponse.json({ error: "Invalid data", details: parse.error }, { status: 400 });
  }
  const { organization_id, user_id, due_date, reference, notes, items } = parse.data;

  // 2. Generate invoice number using Supabase function
  const { data: invoiceNumber, error: invoiceNumberError } = await supabase.rpc("generate_invoice_number", { org_id: organization_id });
  if (invoiceNumberError || !invoiceNumber) {
    console.error("[API] /api/invoices - Invoice number generation error:", invoiceNumberError);
    return NextResponse.json({ error: "Failed to generate invoice number", details: invoiceNumberError }, { status: 500 });
  }

  // 3. Insert invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert([{
      organization_id,
      user_id,
      invoice_number: invoiceNumber,
      status: "draft",
      subtotal: items.reduce((sum, i) => sum + i.amount, 0),
      tax_rate: items[0]?.tax_rate ?? 0.15,
      tax_amount: items.reduce((sum, i) => sum + i.tax_amount, 0),
      total_amount: items.reduce((sum, i) => sum + i.total_amount, 0),
      issue_date: new Date().toISOString().slice(0, 10),
      due_date,
      reference,
      notes,
    }])
    .select()
    .single();

  if (invoiceError || !invoice) {
    console.error("[API] /api/invoices - Invoice insert error:", invoiceError);
    return NextResponse.json({ error: "Failed to create invoice", details: invoiceError }, { status: 500 });
  }

  // 4. Insert invoice items
  const invoiceItems = items.map(item => ({
    invoice_id: invoice.id,
    chargeable_id: item.chargeable_id,
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.amount,
    tax_rate: item.tax_rate,
    tax_amount: item.tax_amount,
    total_amount: item.total_amount,
  }));

  const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems);
  if (itemsError) {
    console.error("[API] /api/invoices - Invoice items insert error:", itemsError);
    // Optionally: Rollback invoice creation if possible
    return NextResponse.json({ error: "Failed to create invoice items", details: itemsError }, { status: 500 });
  }

  // 5. Finalize invoice (set status to 'pending')
  const { data: finalizedInvoice, error: finalizeError } = await supabase
    .from("invoices")
    .update({ status: "pending" })
    .eq("id", invoice.id)
    .select()
    .single();
  if (finalizeError || !finalizedInvoice) {
    console.error("[API] /api/invoices - Invoice finalize error:", finalizeError);
    return NextResponse.json({ error: "Failed to finalize invoice", details: finalizeError }, { status: 500 });
  }

  // 6. Create transaction for finalized invoice
  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert([{
      organization_id: finalizedInvoice.organization_id,
      user_id: finalizedInvoice.user_id,
      type: "debit",
      status: "completed",
      amount: -finalizedInvoice.total_amount,
      description: `Invoice charge for ${finalizedInvoice.invoice_number}`,
      reference_number: finalizedInvoice.invoice_number,
      metadata: { invoice_id: finalizedInvoice.id }
    }])
    .select()
    .single();
  if (transactionError || !transaction) {
    console.error("[API] /api/invoices - Transaction insert error:", transactionError);
    return NextResponse.json({ error: "Failed to create transaction for invoice", details: transactionError }, { status: 500 });
  }

  // 7. Return the created invoice and transaction
  console.log("[API] /api/invoices - Invoice and transaction created successfully:", finalizedInvoice, transaction);
  return NextResponse.json({ invoice: finalizedInvoice, invoice_number: invoiceNumber, transaction });
}

// PATCH /api/invoices/[id]
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  const body = await req.json();

  // Validate minimal patch schema
  const patchSchema = z.object({
    due_date: z.string().optional(),
    items: z.array(z.object({
      id: z.string().uuid(),
      quantity: z.number().min(1),
      rate: z.number().min(0),
      description: z.string(),
    })).optional(),
  });
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error }, { status: 400 });
  }

  // Fetch invoice
  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: false })
    .eq("id", id)
    .single();
  if (fetchError || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (!(invoice.status === "draft" || invoice.status === "pending")) {
    return NextResponse.json({ error: "Invoice cannot be edited in this status" }, { status: 400 });
  }

  // Update invoice
  let total_amount = invoice.total_amount;
  if (body.items) {
    // Update invoice_items
    for (const item of body.items) {
      await supabase
        .from("invoice_items")
        .update({
          quantity: item.quantity,
          rate: item.rate,
          description: item.description,
        })
        .eq("id", item.id);
    }
    // Recalculate total
    total_amount = body.items.reduce((sum: number, item: any) => sum + item.quantity * item.rate, 0);
  }
  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      due_date: body.due_date ?? invoice.due_date,
      total_amount,
    })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: "Failed to update invoice", details: updateError }, { status: 500 });
  }

  // If total changed, append a new transaction
  if (total_amount !== invoice.total_amount) {
    await supabase.from("transactions").insert({
      member_id: invoice.user_id,
      date: new Date().toISOString(),
      type: "debit",
      amount: total_amount - invoice.total_amount,
      reference: `invoice:${id}:edit`,
    });
  }

  // Return updated invoice
  const { data: updatedInvoice, error: fetchUpdatedError } = await supabase
    .from("invoices")
    .select(`
      *,
      member:users (
        id, first_name, last_name, email, profile_image_url
      ),
      organization:organizations (
        id, name, logo_url, contact_email, contact_phone, address
      ),
      booking:bookings (
        id, start_time, end_time,
        aircraft:aircraft (id, registration, type),
        instructor:users!bookings_instructor_id_fkey (id, first_name, last_name)
      ),
      items:invoice_items (
        id, quantity, rate, description, chargeable:chargeables (id, name, description)
      ),
      payments:payments (
        id, amount, payment_method, payment_reference, created_at,
        transaction:transactions (id, user:users (id, first_name, last_name))
      )
    `)
    .eq("id", id)
    .single();
  if (fetchUpdatedError) {
    return NextResponse.json({ error: "Failed to fetch updated invoice" }, { status: 500 });
  }
  return NextResponse.json({ invoice: updatedInvoice });
} 
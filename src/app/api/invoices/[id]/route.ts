import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServerClient";
import { z } from "zod";

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  const supabase = await createClient();
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

  let transaction = null;
  let newTotals = {
    subtotal: invoice.subtotal,
    tax_rate: invoice.tax_rate,
    tax_amount: invoice.tax_amount,
    total_amount: invoice.total_amount,
  };

  if (body.items) {
    // Use the invoice's tax_rate or default to 0.15
    const tax_rate = invoice.tax_rate ?? 0.15;
    // Update invoice_items and recalculate amounts
    let subtotal = 0;
    let tax_amount = 0;
    let total_amount = 0;
    for (const item of body.items) {
      const amount = item.quantity * item.rate;
      const item_tax_amount = amount * tax_rate;
      const total = amount + item_tax_amount;
      subtotal += amount;
      tax_amount += item_tax_amount;
      total_amount += total;
      await supabase
        .from("invoice_items")
        .update({
          quantity: item.quantity,
          rate: item.rate,
          description: item.description,
          amount,
          tax_rate,
          tax_amount: item_tax_amount,
          total_amount: total,
        })
        .eq("id", item.id);
    }
    newTotals = { subtotal, tax_rate, tax_amount, total_amount };
    // Update invoice with new totals
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        due_date: body.due_date ?? invoice.due_date,
        subtotal,
        tax_rate,
        tax_amount,
        total_amount,
      })
      .eq("id", id);
    if (updateError) {
      return NextResponse.json({ error: "Failed to update invoice", details: updateError }, { status: 500 });
    }
    // If total changed, append a new transaction
    const diff = total_amount - invoice.total_amount;
    if (diff !== 0) {
      const { data: newTransaction, error: transactionError } = await supabase
        .from("transactions")
        .insert([{
          organization_id: invoice.organization_id,
          user_id: invoice.user_id,
          type: diff < 0 ? "debit" : "credit",
          status: "completed",
          amount: Math.abs(diff),
          description: `Invoice edit for ${invoice.invoice_number}`,
          reference_number: invoice.invoice_number,
          metadata: { invoice_id: invoice.id, edit: true },
        }])
        .select()
        .single();
      if (transactionError) {
        return NextResponse.json({ error: "Failed to create transaction for invoice edit", details: transactionError }, { status: 500 });
      }
      transaction = newTransaction;
    }
  } else {
    // If only due_date is updated
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ due_date: body.due_date ?? invoice.due_date })
      .eq("id", id);
    if (updateError) {
      return NextResponse.json({ error: "Failed to update invoice", details: updateError }, { status: 500 });
    }
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
        id, quantity, rate, description, amount, tax_rate, tax_amount, total_amount, chargeable:chargeables (id, name, description)
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
  return NextResponse.json({ invoice: updatedInvoice, transaction });
} 
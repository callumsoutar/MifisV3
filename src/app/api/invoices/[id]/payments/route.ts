import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServerClient";
import { z } from "zod";

const paymentSchema = z.object({
  amount: z.number().positive(),
  payment_method: z.enum([
    "cash",
    "credit_card",
    "bank_transfer",
    "direct_debit",
    "cheque",
    "other",
    "account_credit"
  ]),
  payment_reference: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().optional(), // ISO date
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: invoiceId } = await context.params;
  const supabase = await createClient();
  const body = await req.json();
  const parse = paymentSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error }, { status: 400 });
  }
  const { amount, payment_method, payment_reference, notes, date } = parse.data;

  // Get user info securely
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  // Get the user's organization (assume single-org for now)
  const { data: orgData, error: orgError } = await supabase
    .from("user_organizations")
    .select("organization_id, role")
    .eq("user_id", userId)
    .single();
  if (orgError || !orgData) {
    return NextResponse.json({ error: "Could not determine user organization" }, { status: 403 });
  }
  const userOrgId = orgData.organization_id;
  const userRole = orgData.role;

  // Fetch invoice and ensure it belongs to the user's org
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();
  if (invoiceError || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (invoice.organization_id !== userOrgId) {
    return NextResponse.json({ error: "Forbidden: Invoice does not belong to your organization" }, { status: 403 });
  }
  if (!["owner", "admin", "instructor"].includes(userRole)) {
    return NextResponse.json({ error: "Forbidden: Insufficient role" }, { status: 403 });
  }

  // If payment method is account_credit, check and update balance
  let accountCreditUsed = false;
  if (payment_method === "account_credit") {
    const { data: account, error: accountError } = await supabase
      .from("account_balances")
      .select("*")
      .eq("organization_id", invoice.organization_id)
      .eq("user_id", invoice.user_id)
      .single();
    if (accountError || !account) {
      return NextResponse.json({ error: "No account credit available" }, { status: 400 });
    }
    if (account.balance < amount) {
      return NextResponse.json({ error: "Insufficient account credit" }, { status: 400 });
    }
    // Deduct credit
    const { error: updateCreditError } = await supabase
      .from("account_balances")
      .update({ balance: account.balance - amount })
      .eq("id", account.id);
    if (updateCreditError) {
      return NextResponse.json({ error: "Failed to update account credit" }, { status: 500 });
    }
    accountCreditUsed = true;
  }

  // Create transaction
  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert([
      {
        organization_id: invoice.organization_id,
        user_id: invoice.user_id,
        type: accountCreditUsed ? "credit" : "payment",
        status: "completed",
        amount,
        description: `Payment for invoice ${invoice.invoice_number}`,
        reference_number: invoice.invoice_number,
        metadata: {
          invoice_id: invoice.id,
          payment_method,
          payment_reference,
          notes,
          date,
        },
      },
    ])
    .select()
    .single();
  if (transactionError || !transaction) {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert([
      {
        organization_id: invoice.organization_id,
        invoice_id: invoice.id,
        transaction_id: transaction.id,
        amount,
        payment_method: payment_method === "account_credit" ? "other" : payment_method, // store as 'other' for now
        payment_reference: payment_reference ?? null,
        notes: notes ?? null,
        created_at: date ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();
  if (paymentError || !payment) {
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }

  // Update invoice paid/balance/status
  const newPaid = (invoice.paid ?? 0) + amount;
  const balanceDue = Math.max((invoice.total_amount ?? 0) - newPaid, 0);
  let newStatus = invoice.status;
  if (balanceDue === 0) {
    newStatus = "paid";
  } else if (invoice.status === "draft") {
    newStatus = "pending";
  }
  const { error: updateInvoiceError } = await supabase
    .from("invoices")
    .update({
      paid: newPaid,
      balance_due: balanceDue,
      status: newStatus,
      paid_date: balanceDue === 0 ? new Date().toISOString() : invoice.paid_date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id);
  if (updateInvoiceError) {
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }

  // Return updated invoice and payment history
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
      items:invoice_items (
        id, quantity, rate, description, amount, tax_rate, tax_amount, total_amount, chargeable:chargeables (id, name, description)
      ),
      payments:payments (
        id, amount, payment_method, payment_reference, created_at,
        transaction:transactions (id, user:users (id, first_name, last_name))
      )
    `)
    .eq("id", invoice.id)
    .single();
  if (fetchUpdatedError) {
    return NextResponse.json({ error: "Failed to fetch updated invoice" }, { status: 500 });
  }
  return NextResponse.json({ invoice: updatedInvoice, payment, transaction });
} 
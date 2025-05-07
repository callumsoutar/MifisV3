import type { Json } from './database'
import type { Tables } from './database'
// import type { Member } from './members' // Removed to resolve import conflict
import { z } from "zod";

export interface Chargeable extends Tables<'chargeables'> {
  organization: {
    id: string
    name: string
  }
  description: string | null // Match base type
}

export interface InvoiceItem extends Tables<'invoice_items'> {
  chargeable: Chargeable
  description: string // Match base type
}

export interface Invoice extends Tables<'invoices'> {
  member: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }
  organization: {
    id: string
    name: string
  }
  booking?: {
    id: string
    start_time: string
    end_time: string
    aircraft?: {
      id: string
      registration: string
      type: string
    }
    instructor?: {
      id: string | null
      first_name: string | null
      last_name: string | null
    }
  }
  items: InvoiceItem[]
  payments: Payment[]
}

export interface Payment extends Tables<'payments'> {
  invoice: {
    id: string
    invoice_number: string
    user: {
      id: string
      first_name: string | null
      last_name: string | null
      email: string
    }
  }
  transaction: Transaction
  payment_method: "other" | "cash" | "credit_card" | "bank_transfer" | "direct_debit" | "cheque" // Match base type
}

export interface Transaction extends Tables<'transactions'> {
  user: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }
  organization: {
    id: string
    name: string
  }
}

export interface AccountBalance extends Tables<'account_balances'> {
  user: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }
  organization: {
    id: string
    name: string
  }
  last_transaction?: Transaction
}

// Helper type for creating new invoices
export interface CreateInvoiceData {
  member_id: string
  organization_id: string
  due_date: string
  items: {
    chargeable_id: string
    quantity: number
    unit_price: number
    description?: string
  }[]
}

// Helper type for processing payments
export interface ProcessPaymentData {
  invoice_id: string
  amount: number
  payment_method: 'cash' | 'card' | 'bank_transfer'
  reference?: string
  notes?: string
}

// Helper type for processing refunds
export interface RefundPaymentData {
  payment_id: string
  amount: number
  reason: string
  notes?: string
}

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded'

export interface Organization {
  id: string
  name: string
  logo_url?: string
  contact_email: string
  contact_phone?: string
  address?: string
}

export interface Member {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  profile_image_url?: string
}

export interface Aircraft {
  id: string
  registration: string
  type: string
}

export interface Instructor {
  id: string
  first_name: string
  last_name: string
}

export interface Booking {
  id: string
  start_time: string
  end_time: string
  aircraft?: Aircraft
  instructor?: Instructor
}

export interface Chargeable {
  id: string
  name: string
  description: string | null
  unit_type: string
}

export interface InvoiceItem {
  id: string
  quantity: number
  unit_price: number
  description: string
  chargeable: Chargeable
}

export interface PaymentUser {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface Transaction {
  id: string
  user: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }
}

export interface Payment {
  id: string
  amount: number
  payment_method: "other" | "cash" | "credit_card" | "bank_transfer" | "direct_debit" | "cheque"
  reference?: string
  created_at: string
  transaction: Transaction
}

export interface Invoice {
  id: string
  invoice_number: string
  status: InvoiceStatus
  created_at: string
  due_date: string
  total_amount: number
  member: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }
  organization: {
    id: string
    name: string
  }
  booking?: {
    id: string
    start_time: string
    end_time: string
    aircraft?: {
      id: string
      registration: string
      type: string
    }
    instructor?: {
      id: string | null
      first_name: string | null
      last_name: string | null
    }
  }
  items: InvoiceItem[]
  payments: Payment[]
}

// Zod schema for invoice creation
export const createInvoiceSchema = z.object({
  organization_id: z.string().uuid(),
  user_id: z.string().uuid(),
  due_date: z.string(), // ISO date
  reference: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      chargeable_id: z.string().uuid(),
      description: z.string(),
      quantity: z.number().min(1),
      rate: z.number().min(0),
      amount: z.number().min(0),
      tax_rate: z.number().min(0),
      tax_amount: z.number().min(0),
      total_amount: z.number().min(0),
    })
  ).min(1)
}); 
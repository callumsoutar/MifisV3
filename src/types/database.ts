export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string
          phone: string | null
          date_of_birth: string | null
          license_number: string | null
          license_expiry: string | null
          medical_expiry: string | null
          date_of_last_flight: string | null
          profile_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          phone?: string | null
          date_of_birth?: string | null
          license_number?: string | null
          license_expiry?: string | null
          medical_expiry?: string | null
          date_of_last_flight?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          phone?: string | null
          date_of_birth?: string | null
          license_number?: string | null
          license_expiry?: string | null
          medical_expiry?: string | null
          date_of_last_flight?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_organizations: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          role?: string
          created_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          membership_type: 'flying_member' | 'non_flying_member' | 'staff_membership' | 'junior_member' | 'life_member'
          start_date: string
          expiry_date: string
          purchased_date: string
          fee_paid: boolean
          amount_paid: number | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          membership_type: 'flying_member' | 'non_flying_member' | 'staff_membership' | 'junior_member' | 'life_member'
          start_date: string
          expiry_date: string
          purchased_date?: string
          fee_paid?: boolean
          amount_paid?: number | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          membership_type?: 'flying_member' | 'non_flying_member' | 'staff_membership' | 'junior_member' | 'life_member'
          start_date?: string
          expiry_date?: string
          purchased_date?: string
          fee_paid?: boolean
          amount_paid?: number | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chargeables: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          type: 'aircraft_rental' | 'instructor_fee' | 'membership_fee' | 'landing_fee' | 'facility_rental' | 'product_sale' | 'service_fee' | 'other'
          rate: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          type: 'aircraft_rental' | 'instructor_fee' | 'membership_fee' | 'landing_fee' | 'facility_rental' | 'product_sale' | 'service_fee' | 'other'
          rate: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          type?: 'aircraft_rental' | 'instructor_fee' | 'membership_fee' | 'landing_fee' | 'facility_rental' | 'product_sale' | 'service_fee' | 'other'
          rate?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          booking_id: string | null
          invoice_number: string
          status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
          subtotal: number
          tax_rate: number
          tax_amount: number
          total_amount: number
          notes: string | null
          issue_date: string
          due_date: string
          paid_date: string | null
          payment_method: 'cash' | 'credit_card' | 'bank_transfer' | 'direct_debit' | 'cheque' | 'other' | null
          payment_reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          booking_id?: string | null
          invoice_number: string
          status?: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          notes?: string | null
          issue_date?: string
          due_date: string
          paid_date?: string | null
          payment_method?: 'cash' | 'credit_card' | 'bank_transfer' | 'direct_debit' | 'cheque' | 'other' | null
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          booking_id?: string | null
          invoice_number?: string
          status?: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          notes?: string | null
          issue_date?: string
          due_date?: string
          paid_date?: string | null
          payment_method?: 'cash' | 'credit_card' | 'bank_transfer' | 'direct_debit' | 'cheque' | 'other' | null
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          chargeable_id: string
          description: string
          quantity: number
          rate: number
          amount: number
          tax_rate: number
          tax_amount: number
          total_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          chargeable_id: string
          description: string
          quantity?: number
          rate: number
          amount: number
          tax_rate?: number
          tax_amount?: number
          total_amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          chargeable_id?: string
          description?: string
          quantity?: number
          rate?: number
          amount?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          organization_id: string
          invoice_id: string
          transaction_id: string
          amount: number
          payment_method: 'cash' | 'credit_card' | 'bank_transfer' | 'direct_debit' | 'cheque' | 'other'
          payment_reference: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          invoice_id: string
          transaction_id: string
          amount: number
          payment_method: 'cash' | 'credit_card' | 'bank_transfer' | 'direct_debit' | 'cheque' | 'other'
          payment_reference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          invoice_id?: string
          transaction_id?: string
          amount?: number
          payment_method?: 'cash' | 'credit_card' | 'bank_transfer' | 'direct_debit' | 'cheque' | 'other'
          payment_reference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          type: 'payment' | 'refund' | 'credit' | 'debit' | 'adjustment'
          status: 'pending' | 'completed' | 'failed' | 'reversed' | 'cancelled'
          amount: number
          description: string
          metadata: Json | null
          reference_number: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          type: 'payment' | 'refund' | 'credit' | 'debit' | 'adjustment'
          status?: 'pending' | 'completed' | 'failed' | 'reversed' | 'cancelled'
          amount: number
          description: string
          metadata?: Json | null
          reference_number?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          type?: 'payment' | 'refund' | 'credit' | 'debit' | 'adjustment'
          status?: 'pending' | 'completed' | 'failed' | 'reversed' | 'cancelled'
          amount?: number
          description?: string
          metadata?: Json | null
          reference_number?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      account_balances: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          balance: number
          last_transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          balance?: number
          last_transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          balance?: number
          last_transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      aircraft: {
        Row: {
          id: string
          registration: string
          type: string
          model: string
          manufacturer?: string | null
          total_hours: number
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          status: string
          hourly_rate?: number | null
          capacity?: number | null
          created_at: string
          updated_at: string
          current_tach: number
          current_hobbs: number
        }
        Insert: {
          id?: string
          registration: string
          type: string
          model: string
          manufacturer?: string | null
          total_hours?: number
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          status?: string
          hourly_rate?: number | null
          capacity?: number | null
          created_at?: string
          updated_at?: string
          current_tach?: number
          current_hobbs?: number
        }
        Update: {
          id?: string
          registration?: string
          type?: string
          model?: string
          manufacturer?: string | null
          total_hours?: number
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          status?: string
          hourly_rate?: number | null
          capacity?: number | null
          created_at?: string
          updated_at?: string
          current_tach?: number
          current_hobbs?: number
        }
      },
      aircraft_equipment: {
        Row: {
          id: string;
          aircraft_id: string;
          name: string;
          description?: string | null;
          due_at_hours?: number | null;
          due_at_date?: string | null;
          last_completed_hours?: number | null;
          last_completed_date?: string | null;
          created_at: string;
          updated_at: string;
        }
        Insert: {
          id?: string;
          aircraft_id: string;
          name: string;
          description?: string | null;
          due_at_hours?: number | null;
          due_at_date?: string | null;
          last_completed_hours?: number | null;
          last_completed_date?: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          aircraft_id?: string;
          name?: string;
          description?: string | null;
          due_at_hours?: number | null;
          due_at_date?: string | null;
          last_completed_hours?: number | null;
          last_completed_date?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      },
      aircraft_tech_log: {
        Row: {
          id: string;
          aircraft_id: string;
          entry_type: string;
          description: string;
          tach?: number | null;
          hobbs?: number | null;
          created_by?: string | null;
          created_at: string;
        }
        Insert: {
          id?: string;
          aircraft_id: string;
          entry_type: string;
          description: string;
          tach?: number | null;
          hobbs?: number | null;
          created_by?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          aircraft_id?: string;
          entry_type?: string;
          description?: string;
          tach?: number | null;
          hobbs?: number | null;
          created_by?: string | null;
          created_at?: string;
        }
      },
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'] 
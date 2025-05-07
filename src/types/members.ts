import type { Tables } from './database'

export interface Organization {
  role: string
  created_at: string
  organization: Tables<'organizations'>
}

export interface Membership extends Tables<'memberships'> {
  organization: {
    id: string
    name: string
    description: string | null
    logo_url: string | null
    contact_email: string | null
    contact_phone: string | null
    address: string | null
  }
  updated_by_user?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }
}

export type Member = Tables<'users'> & {
  organizations: Organization[]
  memberships?: Membership[]
} 
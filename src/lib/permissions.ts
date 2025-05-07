import { createClient } from "@/lib/supabaseBrowserClient";
import type { Database } from "@/types/database";

export type UserRole = 'owner' | 'admin' | 'instructor' | 'member' | 'student';

// Define which roles can access which tabs
export const TAB_ROLE_ACCESS: Record<string, UserRole[]> = {
  // Navigation items
  dashboard: ['owner', 'admin', 'instructor', 'member', 'student'],
  scheduler: ['owner', 'admin', 'instructor', 'member', 'student'],
  bookings: ['owner', 'admin', 'instructor', 'student'],
  aircraft: ['owner', 'admin', 'instructor', 'student'],
  members: ['owner', 'admin', 'instructor'],
  staff: ['owner', 'admin', 'instructor'],
  invoices: ['owner', 'admin', 'instructor', 'student'],
  training: ['owner', 'admin', 'instructor', 'member', 'student'],
  safety: ['owner', 'admin', 'instructor'],
  settings: ['owner', 'admin', 'instructor', 'member', 'student'],
  
  // Member profile tabs
  contact: ['owner', 'admin', 'instructor', 'member', 'student'],
  pilot: ['owner', 'admin', 'instructor'],
  memberships: ['owner', 'admin', 'instructor', 'member', 'student'],
  account: ['owner', 'admin', 'instructor', 'member', 'student'],
  flights: ['owner', 'admin', 'instructor', 'member', 'student'],
};

// Define role hierarchy
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'owner': 4,
  'admin': 3,
  'instructor': 2,
  'member': 1,
  'student': 0
};

// Helper function to check if a role is staff level
export function isStaffRole(role: UserRole): boolean {
  return ['owner', 'admin', 'instructor'].includes(role);
}

// Helper function to check if a role has sufficient privileges
export function hasRolePrivilege(userRole: UserRole | null, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export async function getUserRoleForOrg(userId: string, orgId: string): Promise<UserRole | null> {
  const supabase = createClient();
  
  console.log('[DEBUG] Fetching role with query:', {
    userId,
    orgId,
    table: 'user_organizations',
    columns: 'role'
  });

  const { data, error } = await supabase
    .from('user_organizations')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .single();

  if (error) {
    console.error('[ERROR] Error fetching user role:', error);
    return null;
  }

  if (!data) {
    console.log('[DEBUG] No role found for user in organization');
    return null;
  }

  console.log('[DEBUG] Found role:', data.role);
  return data.role as UserRole;
}

export function canAccessTab(tab: string, role: UserRole | null): boolean {
  console.log('[DEBUG] Checking tab access:', { tab, role, allowedRoles: TAB_ROLE_ACCESS[tab] });
  
  if (!role) return false;
  if (!TAB_ROLE_ACCESS[tab]) return false;
  
  return TAB_ROLE_ACCESS[tab].includes(role);
}

// Helper function to check if user can modify organization settings
export function canModifyOrgSettings(role: UserRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

// Helper function to check if user can manage staff
export function canManageStaff(role: UserRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

// Helper function to check if user can manage safety reports
export function canManageSafetyReports(role: UserRole | null): boolean {
  if (!role) return false;
  return isStaffRole(role);
}

// Helper function to check if user can manage training
export function canManageTraining(role: UserRole | null): boolean {
  return role === 'instructor' || role === 'admin' || role === 'owner';
}

// Helper function to check if user can view financial information
export function canViewFinancials(role: UserRole | null): boolean {
  return role === 'owner' || role === 'admin';
} 
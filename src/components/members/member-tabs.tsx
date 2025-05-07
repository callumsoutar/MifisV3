"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, MapPin, Plane, FileText, Clock, CreditCard, CalendarRange, Book, History, Award, Settings, CheckCircle2, XCircle } from "lucide-react";
import type { Member } from "@/types/members";
import { format, isWithinInterval } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabaseBrowserClient";
import { UserRole, getUserRoleForOrg, canAccessTab, isStaffRole } from "@/lib/permissions";
import { Alert } from "@/components/ui/alert";
import { MemberMemberships } from "@/components/members/member-memberships";
import { MemberAccountTab } from "./member-account-tab";

const allTabs = [
  { id: "contact", label: "Contact", icon: Mail },
  { id: "pilot", label: "Pilot Details", icon: Plane },
  { id: "memberships", label: "Memberships", icon: Award },
  { id: "account", label: "Account", icon: Settings },
  { id: "invoices", label: "Invoices", icon: CreditCard },
  { id: "flights", label: "Flight History", icon: History },
  { id: "bookings", label: "Bookings", icon: CalendarRange },
  { id: "training", label: "Training", icon: Book }
] as const;

const membershipTypeLabels = {
  flying_member: "Flying Member",
  non_flying_member: "Non-Flying Member",
  staff_membership: "Staff Member",
  junior_member: "Junior Member",
  life_member: "Life Member"
} as const;

interface MemberTabsProps {
  member: Member;
}

function isMembershipActive(startDate: string, expiryDate: string): boolean {
  const now = new Date();
  return isWithinInterval(now, {
    start: new Date(startDate),
    end: new Date(expiryDate)
  });
}

export function MemberTabs({ member }: MemberTabsProps) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Find the primary organization with proper null checks
  const primaryOrganization = member.organizations?.find(org => 
    org?.organization && org.organization.id
  );
  
  // Debug logging
  console.log('[DEBUG] MemberTabs Props:', {
    memberId: member.id,
    email: member.email,
    hasMemberships: Boolean(member.memberships),
    membershipCount: member.memberships?.length,
    membershipsArray: Array.isArray(member.memberships),
    organizations: member.organizations?.map(org => ({
      id: org?.organization?.id,
      name: org?.organization?.name,
      role: org?.role
    }))
  });

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        
        if (sessionError || !user) {
          console.log('[DEBUG] Session error:', sessionError);
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        // Get the viewing user's role from their own organization
        const { data: viewerOrg, error: viewerOrgError } = await supabase
          .from('user_organizations')
          .select('role, organization:organizations(id, name)')
          .eq('user_id', user.id)
          .single();

        if (viewerOrgError) {
          console.error('[ERROR] Failed to get viewer organization:', viewerOrgError);
          setError('Failed to load permissions');
          setLoading(false);
          return;
        }

        if (!viewerOrg || !viewerOrg.role) {
          console.error('[ERROR] No organization or role found for viewer');
          setError('You need to be part of an organization to view member details');
          setLoading(false);
          return;
        }

        console.log('[DEBUG] Viewer organization data:', {
          role: viewerOrg.role,
          organization: viewerOrg.organization
        });
        
        setUserRole(viewerOrg.role as UserRole);
        setLoading(false);
      } catch (err) {
        console.error('[ERROR] Failed to load user role:', err);
        setError('Failed to load user permissions');
        setLoading(false);
      }
    };

    loadUserRole();
  }, []);

  // Filter tabs based on user role
  const visibleTabs = allTabs.filter(tab => {
    const hasAccess = canAccessTab(tab.id, userRole);
    console.log('[DEBUG] Tab access check:', {
      tab: tab.id,
      role: userRole,
      hasAccess
    });
    return hasAccess;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <p>{error}</p>
      </Alert>
    );
  }

  if (!userRole) {
    return (
      <Alert variant="destructive">
        <p>You don't have permission to view this member's details</p>
      </Alert>
    );
  }

  return (
    <Tabs defaultValue="contact" className="w-full">
      <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-4">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Contact Information */}
      <TabsContent value="contact">
        <Card>
          <CardHeader className="text-xl font-semibold">Contact Information</CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-500" />
                <span>{member.email}</span>
              </div>
              {member.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <span>{member.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Pilot Details - Only visible to staff */}
      {canAccessTab('pilot', userRole) && (
        <TabsContent value="pilot">
          <Card>
            <CardHeader className="text-xl font-semibold">Pilot Details</CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.license_number && (
                  <div>
                    <h3 className="font-medium text-gray-700">License Number</h3>
                    <p>{member.license_number}</p>
                  </div>
                )}
                {member.license_expiry && (
                  <div>
                    <h3 className="font-medium text-gray-700">License Expiry</h3>
                    <p>{format(new Date(member.license_expiry), 'PPP')}</p>
                  </div>
                )}
                {member.medical_expiry && (
                  <div>
                    <h3 className="font-medium text-gray-700">Medical Expiry</h3>
                    <p>{format(new Date(member.medical_expiry), 'PPP')}</p>
                  </div>
                )}
                {member.date_of_last_flight && (
                  <div>
                    <h3 className="font-medium text-gray-700">Last Flight</h3>
                    <p>{format(new Date(member.date_of_last_flight), 'PPP')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* Memberships */}
      <TabsContent value="memberships">
        <MemberMemberships memberships={member.memberships} />
      </TabsContent>

      {/* Account Settings */}
      {canAccessTab('account', userRole) && (
        <TabsContent value="account">
          <MemberAccountTab memberId={member.id} />
        </TabsContent>
      )}

      {/* Invoices */}
      {canAccessTab('invoices', userRole) && (
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="text-xl font-semibold">Invoices</CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No invoices found
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* Flight History */}
      {canAccessTab('flights', userRole) && (
        <TabsContent value="flights">
          <Card>
            <CardHeader className="text-xl font-semibold">Flight History</CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No flight history available
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* Bookings */}
      {canAccessTab('bookings', userRole) && (
        <TabsContent value="bookings">
          <Card>
            <CardHeader className="text-xl font-semibold">Bookings</CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No bookings found
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* Training */}
      {canAccessTab('training', userRole) && (
        <TabsContent value="training">
          <Card>
            <CardHeader className="text-xl font-semibold">Training Records</CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No training records available
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
} 
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowserClient";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberProfileHeader } from "@/components/members/member-profile-header";
import { MemberTabs } from "@/components/members/member-tabs";
import type { Member } from "@/types/members";

export default function MemberViewPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMember = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        
        // First check if the user exists
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', params.id)
          .single();

        console.log('[DEBUG] User data:', {
          success: !userError,
          error: userError,
          userData: user,
          userId: params.id
        });

        if (userError) {
          console.error('Error fetching user:', userError);
          throw userError;
        }

        if (!user) {
          throw new Error('User not found');
        }

        // Fetch organizations and memberships in parallel
        const [orgResponse, membershipsResponse] = await Promise.all([
          // Fetch organization data
          supabase
            .from('user_organizations')
            .select(`
              id,
              role,
              created_at,
              organization:organizations(
                id,
                name,
                description,
                logo_url,
                contact_email,
                contact_phone,
                address
              )
            `)
            .eq('user_id', params.id),
          
          // Fetch memberships data
          supabase
            .from('memberships')
            .select(`
              *,
              organization:organizations(
                id,
                name,
                description,
                logo_url,
                contact_email,
                contact_phone,
                address
              ),
              updated_by_user:users!updated_by(
                id,
                first_name,
                last_name,
                email
              )
            `)
            .eq('user_id', params.id)
        ]);

        // Log detailed responses for debugging
        console.log('[DEBUG] Organizations Response:', {
          success: !orgResponse.error,
          error: orgResponse.error,
          count: orgResponse.data?.length,
          data: orgResponse.data?.map(org => ({
            role: org.role,
            created_at: org.created_at,
            organization: org.organization
          }))
        });

        // Direct SQL verification of memberships
        const { data: directSqlCheck } = await supabase
          .from('memberships')
          .select('id, user_id, organization_id, membership_type')
          .eq('user_id', params.id);
        
        console.log('[DEBUG] Direct SQL Check:', {
          found: Boolean(directSqlCheck && directSqlCheck.length > 0),
          records: directSqlCheck
        });

        console.log('[DEBUG] Memberships Response:', {
          success: !membershipsResponse.error,
          error: membershipsResponse.error,
          count: membershipsResponse.data?.length,
          data: membershipsResponse.data?.map(mem => ({
            id: mem.id,
            type: mem.membership_type,
            organization: mem.organization
          }))
        });

        if (orgResponse.error) {
          console.error('[ERROR] Error fetching organizations:', orgResponse.error);
          throw orgResponse.error;
        }

        if (membershipsResponse.error) {
          console.error('[ERROR] Error fetching memberships:', membershipsResponse.error);
          throw membershipsResponse.error;
        }

        // Combine all the data
        const memberData: Member = {
          ...user,
          organizations: (orgResponse.data || []).map(org => ({
            role: org.role,
            created_at: org.created_at,
            organization: org.organization || {
              id: 'unknown',
              name: 'Unknown Organization',
              description: null,
              logo_url: null,
              contact_email: null,
              contact_phone: null,
              address: null
            }
          })),
          memberships: (membershipsResponse.data || []).map(mem => ({
            ...mem,
            organization: mem.organization || {
              id: 'unknown',
              name: 'Unknown Organization',
              description: null,
              logo_url: null,
              contact_email: null,
              contact_phone: null,
              address: null
            }
          }))
        };

        console.log('[DEBUG] Final member data structure:', {
          id: memberData.id,
          email: memberData.email,
          organizationCount: memberData.organizations.length,
          membershipCount: memberData.memberships?.length,
          organizations: memberData.organizations.map(org => ({
            role: org.role,
            created_at: org.created_at,
            organization: org.organization
          }))
        });

        setMember(memberData);
      } catch (err) {
        console.error('Error loading member:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An error occurred while loading member data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadMember();
    } else {
      setError('No member ID provided');
      setLoading(false);
    }
  }, [params.id]);

  // Add debug output for render phase
  console.log('Render state:', { loading, error, hasMember: !!member, memberData: member });

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-gradient-to-br from-white via-sky-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start gap-6">
            <div className="w-full bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex-1 p-8 bg-gradient-to-br from-white via-sky-50 to-purple-50">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">
            {error || 'Member not found'}
          </h2>
          <p className="text-gray-600 mt-2">
            {error ? 'Please try again later.' : "The member you're looking for doesn't exist or has been removed."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-gradient-to-br from-white via-sky-50 to-purple-50">
      <div className="max-w-6xl mx-auto">
        <MemberProfileHeader member={member} />
        <MemberTabs member={member} />
      </div>
    </div>
  );
} 
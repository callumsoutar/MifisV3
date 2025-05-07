"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowserClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, UserPlus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { UserRole, canManageStaff, isStaffRole } from "@/lib/permissions";

type Member = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url: string | null;
  role: UserRole;
  status: string;
};

type UserOrganization = {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  };
  role: string;
  status: string;
};

const roles = ["All", "Owner", "Admin", "Instructor", "Member", "Student"];

export default function MembersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingInvites: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        
        // Get current user and their role
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        // Step 1: Fetch user_organizations for the user
        const { data: userOrgRows, error: userOrgError } = await supabase
          .from('user_organizations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);

        console.log('[DEBUG] userOrgRows:', userOrgRows, 'error:', userOrgError);

        if (userOrgError || !userOrgRows || userOrgRows.length === 0) {
          router.replace('/create-organization');
          return;
        }

        const orgId = userOrgRows[0].organization_id;
        const role = userOrgRows[0].role as UserRole;
        setUserRole(role);

        // Step 2: Fetch the organization by ID (no .single())
        const { data: orgRows, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId);

        console.log('[DEBUG] orgRows:', orgRows, 'error:', orgError);

        const org = orgRows && orgRows.length > 0 ? orgRows[0] : null;

        if (orgError) {
          setError('Failed to load organization data.');
          setLoading(false);
          return;
        }
        if (!org) {
          setError('Your organization record is missing or corrupted. Please contact your administrator.');
          setLoading(false);
          return;
        }

        // Only staff roles can view all members
        if (!isStaffRole(role)) {
          setError('You do not have permission to view members');
          setLoading(false);
          return;
        }

        // Fetch members for the organization with improved query
        const { data: orgMembers, error: membersError } = await supabase
          .from('user_organizations')
          .select(`
            user:users(
              id,
              email,
              first_name,
              last_name,
              profile_image_url
            ),
            role
          `)
          .eq('organization_id', orgId) as { data: UserOrganization[] | null, error: any };

        if (membersError) {
          console.error('Error fetching members:', membersError);
          setError('Failed to load members');
          setLoading(false);
          return;
        }

        const formattedMembers = (orgMembers || [])
          .filter((member): member is UserOrganization => !!member.user)
          .map(member => ({
            id: member.user.id,
            email: member.user.email,
            first_name: member.user.first_name || '',
            last_name: member.user.last_name || '',
            profile_image_url: member.user.profile_image_url,
            role: member.role as UserRole,
            status: 'active'
          }));

        setMembers(formattedMembers);
        setFilteredMembers(formattedMembers);
        setStats({
          totalMembers: formattedMembers.length,
          activeMembers: formattedMembers.filter(m => m.status === 'active').length,
          pendingInvites: (orgMembers || []).filter(m => m.status === 'pending').length
        });
      } catch (err) {
        console.error('Error in loadData:', err);
        setError('An error occurred while loading members');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  useEffect(() => {
    let result = members;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(member => 
        member.first_name?.toLowerCase().includes(query) ||
        member.last_name?.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
      );
    }
    
    // Apply role filter
    if (roleFilter !== "All") {
      result = result.filter(member => member.role === roleFilter.toLowerCase());
    }
    
    setFilteredMembers(result);
  }, [searchQuery, roleFilter, members]);

  const handleRowClick = (memberId: string) => {
    router.push(`/members/${memberId}`);
  };

  if (loading) {
    return (
      <section className="flex-1 p-10 bg-gradient-to-br from-white via-sky-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <p>Loading...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex-1 p-10 bg-gradient-to-br from-white via-sky-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <p>{error}</p>
          </Alert>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 p-10 bg-gradient-to-br from-white via-sky-50 to-purple-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-600">Manage your flight school's members and their roles</p>
          </div>
          {canManageStaff(userRole) && (
            <Button
              onClick={() => router.push('/members/invite')}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Total Members</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalMembers}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Active Members</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.activeMembers}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Pending Invites</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.pendingInvites}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mt-8">
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={roleFilter}
            onValueChange={setRoleFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Members Table */}
        <div className="mt-4 bg-white rounded-xl shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow 
                  key={member.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleRowClick(member.id)}
                >
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profile_image_url || undefined} alt={member.email} />
                      <AvatarFallback>
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {member.first_name} {member.last_name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-medium">
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="font-medium">
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
} 
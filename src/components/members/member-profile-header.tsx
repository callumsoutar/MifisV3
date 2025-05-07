"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Mail, 
  CalendarDays,
  FileText,
  CalendarRange,
  AlertTriangle,
  UserCog,
  ChevronDown,
  Phone,
  Plane,
  HeartPulse
} from "lucide-react";
import type { Member } from "@/types/members";
import { format } from "date-fns";

interface MemberProfileHeaderProps {
  member: Member;
}

export function MemberProfileHeader({ member }: MemberProfileHeaderProps) {
  const primaryOrganization = member.organizations?.[0];
  const role = primaryOrganization?.role || 'Member';
  const orgName = primaryOrganization?.organization?.name;

  return (
    <>
      <Card className="mb-4">
        <CardContent className="py-6 px-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={member.profile_image_url || undefined} alt={member.email} />
                <AvatarFallback className="text-xl">
                  {member.first_name?.[0]}{member.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {member.first_name} {member.last_name}
                  </h1>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {member.phone}
                    </div>
                  )}
                  {primaryOrganization?.created_at && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Member since {format(new Date(primaryOrganization.created_at), 'dd MMM yyyy')}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <UserCog className="h-4 w-4 mr-2" />
                  Edit Profile
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <UserCog className="h-4 w-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
        <Button variant="outline" size="sm">
          <CalendarRange className="h-4 w-4 mr-2" />
          New Booking
        </Button>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Occurrence
        </Button>
      </div>
    </>
  );
} 
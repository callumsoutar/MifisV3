import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import type { Member } from "@/types/members";

const membershipTypeLabels = {
  flying_member: "Flying Member",
  non_flying_member: "Non-Flying Member",
  staff_membership: "Staff Member",
  junior_member: "Junior Member",
  life_member: "Life Member"
} as const;

interface MemberMembershipsProps {
  memberships: Member["memberships"];
}

export function MemberMemberships({ memberships }: MemberMembershipsProps) {
  return (
    <Card>
      <CardHeader className="text-xl font-semibold">Memberships</CardHeader>
      <CardContent className="space-y-4">
        {memberships && memberships.length > 0 ? (
          memberships.map((membership) => (
            <div
              key={membership.id}
              className="p-4 border rounded-lg bg-white shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {membershipTypeLabels[membership.membership_type as keyof typeof membershipTypeLabels]}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {membership.organization?.name || 'Unknown Organization'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={membership.fee_paid ? "default" : "secondary"}>
                    {membership.fee_paid ? "Paid" : "Unpaid"}
                  </Badge>
                  {typeof membership.amount_paid === 'number' && (
                    <span className="text-xs text-gray-600 mt-1">
                      Amount Paid: ${membership.amount_paid.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Valid: {format(new Date(membership.start_date), 'PP')} -{' '}
                    {format(new Date(membership.expiry_date), 'PP')}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No memberships found for this member
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
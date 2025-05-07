import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types/bookings';
import Link from 'next/link';

function getInitials(user: User) {
  if (!user) return '';
  const first = user.first_name?.[0] || '';
  const last = user.last_name?.[0] || '';
  return (first + last).toUpperCase();
}

export function PeopleCard({ member, instructor }: { member: User; instructor?: User | null }) {
  return (
    <Card className="p-6 w-full">
      <h2 className="text-2xl font-bold mb-6 text-slate-900 tracking-tight">People</h2>
      <div className="flex flex-col gap-6">
        <Link
          href={`/members/${member.id}`}
          className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-200 shadow-sm transition hover:shadow-lg hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          tabIndex={0}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base font-semibold text-primary">Member</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">Student</span>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shadow-md">
              {member.profile_image_url ? (
                <AvatarImage src={member.profile_image_url} alt={member.first_name || ''} />
              ) : (
                <AvatarFallback>{getInitials(member)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="font-semibold text-lg text-slate-900 leading-tight">
                {member.first_name} {member.last_name}
              </div>
              <div className="text-xs text-slate-500">{member.email}</div>
            </div>
          </div>
        </Link>
        {instructor && (
          <Link
            href={`/members/${instructor.id}`}
            className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-200 shadow-sm transition hover:shadow-lg hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
            tabIndex={0}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base font-semibold text-indigo-700">Instructor</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">Staff</span>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 shadow-md">
                {instructor.profile_image_url ? (
                  <AvatarImage src={instructor.profile_image_url} alt={instructor.first_name || ''} />
                ) : (
                  <AvatarFallback>{getInitials(instructor)}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <div className="font-semibold text-lg text-slate-900 leading-tight">
                  {instructor.first_name} {instructor.last_name}
                </div>
                <div className="text-xs text-slate-500">{instructor.email}</div>
              </div>
            </div>
          </Link>
        )}
      </div>
    </Card>
  );
} 
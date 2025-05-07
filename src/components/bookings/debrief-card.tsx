import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Debrief } from '@/types/bookings';
import { format } from 'date-fns';

function getInitials(name?: string | null, fallback = '?') {
  if (!name) return fallback;
  return name.split(' ').map((n) => n[0]).join('').toUpperCase();
}

export function DebriefCard({ debriefs }: { debriefs?: Debrief[] }) {
  if (!debriefs || debriefs.length === 0) {
    return (
      <Card className="p-6 w-full">
        <h2 className="text-xl font-bold mb-4">Debrief</h2>
        <div className="text-gray-400 text-sm">No debriefs recorded for this booking.</div>
      </Card>
    );
  }
  return (
    <Card className="p-6 w-full">
      <h2 className="text-xl font-bold mb-4">Debrief</h2>
      <div className="space-y-6">
        {debriefs.map((debrief) => (
          <div key={debrief.id} className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
            <Avatar className="h-10 w-10 mt-1">
              {debrief.instructor?.profile_image_url ? (
                <AvatarImage src={debrief.instructor.profile_image_url} alt={debrief.instructor.first_name || ''} />
              ) : (
                <AvatarFallback>{getInitials(debrief.instructor?.first_name)}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">
                  {debrief.instructor?.first_name} {debrief.instructor?.last_name}
                </span>
                <span className="text-xs text-gray-400">
                  {format(new Date(debrief.created_at), 'PPpp')}
                </span>
              </div>
              <div className="text-gray-700 text-sm whitespace-pre-line">
                {debrief.comments}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 
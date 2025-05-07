"use client";
import { useState } from 'react';
import { BookingDetailsCard } from '@/components/bookings/booking-details-card';
import { PeopleCard } from '@/components/bookings/people-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingStages } from '@/components/bookings/booking-stages';
import { Booking } from '@/types/bookings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TabsInline } from './tabs-inline';
import { AuditLogsTable } from '@/components/audit-logs/audit-logs-table';
import { Pencil, LogOut, LogIn, Mail, XCircle, CalendarClock, Plane, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    unconfirmed: 'bg-yellow-100 text-yellow-900 border border-yellow-300',
    confirmed: 'bg-green-100 text-green-900 border border-green-300',
    briefing: 'bg-blue-100 text-blue-900 border border-blue-300',
    flying: 'bg-purple-100 text-purple-900 border border-purple-300',
    complete: 'bg-blue-900 text-white border border-blue-900',
    default: 'bg-gray-100 text-gray-700 border border-gray-300',
  };
  return (
    <span
      className={`inline-flex items-center px-4 py-1 text-base rounded-full font-bold shadow-md transition-colors duration-200 border ${colorMap[status] || colorMap.default}`}
      style={{ letterSpacing: '0.02em', minHeight: '2.25rem' }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const STAGES = [
  { key: 'briefing', label: 'Briefing' },
  { key: 'checkout', label: 'Check-out' },
  { key: 'debrief', label: 'Flying' },
  { key: 'checkin', label: 'Check-in' },
];
const STATUS_TO_STAGE_IDX: Record<string, number> = {
  unconfirmed: -1,
  confirmed: -1,
  briefing: 0,
  flying: 1,
  debrief: 2,
  checkin: 3,
  complete: 3,
};

export function ClientBookingView({ booking, title, detailsCardComponent }: { booking: any, title?: string, detailsCardComponent?: React.ReactNode }) {
  const [editMode, setEditMode] = useState(false);
  const handleEdit = () => setEditMode((prev) => !prev);
  const [tab, setTab] = useState('flight-details');
  const router = useRouter();

  // Determine which buttons to show based on booking status
  const showEditButton = booking.status !== 'flying' && booking.status !== 'complete';
  const showCheckOutButton = booking.status !== 'flying' && booking.status !== 'complete';
  const showCheckInButton = booking.status === 'flying';

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center">
      <div className="w-full max-w-6xl px-4 pt-8 pb-12 flex flex-col gap-8">
        {/* Breadcrumbs and Page Title, Status, and Tabs */}
        <div className="flex flex-col gap-1 mb-2">
          <div className="text-xs text-muted-foreground font-medium mb-3">
            Bookings / {title === 'Booking Details' ? 'Check Out' : title || 'View'}
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center">{title || 'Flight Booking Details'}</h1>
                <span className="ml-2"><StatusBadge status={booking.status} /></span>
                {booking.aircraft?.registration && (
                  <>
                    <span className="mx-2 text-slate-300 text-lg">|</span>
                    <a
                      href={`/aircraft/view/${booking.aircraft.id}`}
                      className="flex items-center gap-1 text-blue-600 underline hover:text-blue-800 transition-colors text-base font-medium cursor-pointer"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Plane className="w-4 h-4 inline-block text-blue-500" />
                      {booking.aircraft.registration}
                    </a>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="cursor-pointer p-2"><MoreVertical className="w-5 h-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[220px]">
                  <DropdownMenuItem className="cursor-pointer"><Mail className="w-4 h-4 mr-2" />Email Member</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer"><CalendarClock className="w-4 h-4 mr-2" />Reschedule</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-red-600"><XCircle className="w-4 h-4 mr-2" />Cancel Booking</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer"><Plane className="w-4 h-4 mr-2" />View Aircraft</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {showCheckOutButton && (
                <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" onClick={() => router.push(`/bookings/check-out/${booking.id}`)}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Check Flight Out
                </Button>
              )}
              {showCheckInButton && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white cursor-pointer" /* TODO: add onClick handler for check-in */>
                        <LogIn className="w-4 h-4 mr-2" />
                        Check Flight In
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Check this flight back in</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
        {/* Progress Stepper */}
        <div className="w-full">
          <BookingStages stages={STAGES} currentStage={STATUS_TO_STAGE_IDX[booking.status] ?? 0} status={booking.status} />
        </div>
        {/* Main Content Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mt-8">
          {/* Left: Booking Details and Training Progress */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {detailsCardComponent ? (
              // If a custom details card is provided, render it
              detailsCardComponent
            ) : (
              // Otherwise, render the default BookingDetailsCard always in editMode
              <BookingDetailsCard booking={booking} editMode={true} onEdit={() => {}} />
            )}
          </div>
          {/* Right: People */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <PeopleCard member={booking.member!} instructor={booking.instructor} />
          </div>
        </div>
        {/* Tabs below the main grid */}
        <div className="w-full max-w-6xl mx-auto mt-4">
          <TabsInline
            tabs={[
              { label: 'Flight Details', value: 'flight-details' },
              { label: 'Charges', value: 'charges' },
              { label: 'Instructor Comments', value: 'comments' },
              { label: 'History', value: 'history' },
            ]}
            value={tab}
            onChange={setTab}
          >
            {tab === 'flight-details' && (
              <div className="w-full text-muted-foreground">Flight Details tab content (coming soon).</div>
            )}
            {tab === 'charges' && (
              <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm p-6 mt-2">
                <div className="w-full text-muted-foreground">Charges tab coming soon.</div>
              </div>
            )}
            {tab === 'comments' && (
              <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm p-6 mt-2">
                <div className="font-semibold text-lg mb-4">Instructor Comments</div>
                {booking.instructor_comment ? (
                  <div className="bg-slate-50 rounded-lg p-4">
                    {booking.instructor && (
                      <div className="font-semibold text-primary mb-1">
                        {booking.instructor.first_name} {booking.instructor.last_name}
                      </div>
                    )}
                    <div className="text-base whitespace-pre-line">{booking.instructor_comment}</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-4 text-muted-foreground">
                    No instructor comments recorded for this booking.
                  </div>
                )}
              </div>
            )}
            {tab === 'history' && (
              <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm p-6 mt-2">
                <AuditLogsTable rowId={booking.id} tableName="bookings" />
              </div>
            )}
          </TabsInline>
        </div>
      </div>
    </div>
  );
} 
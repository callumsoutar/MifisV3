import { getBookingById } from './data';
import { BookingDetailsCard } from '@/components/bookings/booking-details-card';
import { PeopleCard } from '@/components/bookings/people-card';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { BookingStages } from '@/components/bookings/booking-stages';
import { Button } from '@/components/ui/button';

import { ClientBookingView } from '@/components/bookings/client-booking-view';

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
  { key: 'checkout', label: 'Checkout' },
  { key: 'debrief', label: 'Debrief' },
  { key: 'checkin', label: 'Checkin' },
];
const STATUS_TO_STAGE_IDX: Record<string, number> = {
  unconfirmed: 0,
  confirmed: 1,
  briefing: 0,
  checkout: 1,
  debrief: 2,
  checkin: 3,
  complete: 3,
};

export default async function BookingViewPage(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const booking = await getBookingById(id);
  if (!booking) {
    notFound();
  }

  return (
    <ClientBookingView booking={booking} />
  );
} 
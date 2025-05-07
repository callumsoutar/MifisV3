import { getBookingById } from '../../view/[id]/data';
import { notFound } from 'next/navigation';
import { CheckOutDetailsCard } from '@/components/bookings/check-out-details-card';
import { ClientBookingView } from '@/components/bookings/client-booking-view';

export default async function BookingCheckOutPage(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const booking = await getBookingById(id);
  if (!booking) {
    notFound();
  }

  return (
    <ClientBookingView
      booking={booking}
      title={booking.status === 'flying' ? 'Booking Details' : 'Check Flight Out'}
      detailsCardComponent={<CheckOutDetailsCard booking={booking} editMode={true} />}
    />
  );
} 
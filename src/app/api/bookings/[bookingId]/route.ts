import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabaseServerClient";
import type { Database } from "@/types/database";
import { hasRolePrivilege, isStaffRole } from "@/lib/permissions";
import { BookingDetails } from '@/types/bookings';

const BookingUpdateSchema = z.object({
  aircraft_id: z.string().uuid(),
  start_time: z.string(),
  end_time: z.string(),
  status: z.enum(["unconfirmed", "confirmed", "briefing", "flying", "complete"]),
  purpose: z.string().max(500),
  remarks: z.string().max(1000).nullable().optional(),
  flight_type_id: z.string().uuid().nullable().optional(),
  lesson_id: z.string().uuid().nullable().optional(),
  booking_type: z.enum(["flight", "groundwork", "maintenance", "other"]).nullable().optional(),
  briefing_completed: z.boolean().optional(),
  instructor_comment: z.string().nullable().optional(),
});

const BookingDetailsSchema = z.object({
  eta: z.string().datetime().nullable().optional(),
  passengers: z.string().max(1000).nullable().optional(),
  route: z.string().max(1000).nullable().optional(),
  equipment: z.any().nullable().optional(),
  remarks: z.string().max(1000).nullable().optional(),
  authorization_completed: z.boolean().optional(),
  overrideConflict: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ bookingId: string }> }) {
  const supabase = await createClient();
  const { bookingId } = await context.params;
  const body = await req.json();
  const parse = BookingUpdateSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error }, { status: 400 });
  }

  // Get user info
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  // Fetch booking and org
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Get user role for org
  const { data: orgData, error: orgError } = await supabase
    .from("user_organizations")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", booking.organization_id)
    .single();
  if (orgError || !orgData) {
    return NextResponse.json({ error: "Forbidden: Not a member of this organization" }, { status: 403 });
  }
  const userRole = orgData.role;
  if (!isStaffRole(userRole)) {
    return NextResponse.json({ error: "Forbidden: Insufficient role" }, { status: 403 });
  }

  // Validate foreign keys (aircraft, flight_type, lesson)
  const { aircraft_id, flight_type_id, lesson_id } = parse.data;
  const [aircraft, flightType, lesson] = await Promise.all([
    supabase.from("aircraft").select("id").eq("id", aircraft_id).eq("organization_id", booking.organization_id).single(),
    flight_type_id ? supabase.from("flight_types").select("id").eq("id", flight_type_id).eq("organization_id", booking.organization_id).single() : Promise.resolve({ data: null }),
    lesson_id ? supabase.from("lessons").select("id").eq("id", lesson_id).eq("organization_id", booking.organization_id).single() : Promise.resolve({ data: null }),
  ]);
  if (!aircraft.data) {
    return NextResponse.json({ error: "Invalid aircraft" }, { status: 400 });
  }
  if (flight_type_id && !flightType.data) {
    return NextResponse.json({ error: "Invalid flight type" }, { status: 400 });
  }
  if (lesson_id && !lesson.data) {
    return NextResponse.json({ error: "Invalid lesson" }, { status: 400 });
  }

  // Prevent updates to completed/cancelled bookings
  if (["complete", "cancelled"].includes(booking.status)) {
    return NextResponse.json({ error: "Cannot update completed or cancelled bookings" }, { status: 400 });
  }

  // Update booking
  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ ...parse.data, updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select()
    .maybeSingle();
  if (updateError) {
    // Handle exclusion constraint violation (double-booking)
    if (
      updateError.message &&
      updateError.message.toLowerCase().includes("exclusion constraint")
    ) {
      return NextResponse.json({ error: "This resource (aircraft, user, or instructor) is already booked for the selected time range." }, { status: 409 });
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ error: "No booking was updated. It may not exist or you may not have permission." }, { status: 404 });
  }
  return NextResponse.json({ booking: updated });
}

export async function GET(req: NextRequest, context: { params: Promise<{ bookingId: string }> }) {
  const supabase = await createClient();
  const { bookingId } = await context.params;

  // Get user info
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch booking_details for this booking
  const { data, error } = await supabase
    .from('booking_details')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ bookingDetails: null });
  }
  return NextResponse.json({ bookingDetails: data });
}

export async function POST(req: NextRequest, context: { params: Promise<{ bookingId: string }> }) {
  const supabase = await createClient();
  const { bookingId } = await context.params;
  const body = await req.json();

  // Get user info
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch booking to get org
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Get user role for org
  const { data: orgData, error: orgError } = await supabase
    .from("user_organizations")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", booking.organization_id)
    .single();
  if (orgError || !orgData) {
    return NextResponse.json({ error: "Forbidden: Not a member of this organization" }, { status: 403 });
  }
  const userRole = orgData.role;
  if (!isStaffRole(userRole)) {
    return NextResponse.json({ error: "Forbidden: Insufficient role" }, { status: 403 });
  }

  let updatedBooking = null;
  let upsertedBookingDetails = null;

  // If booking is present, validate and update
  if (body.booking) {
    const parseBooking = BookingUpdateSchema.omit({ status: true, briefing_completed: true, instructor_comment: true }).safeParse(body.booking);
    if (!parseBooking.success) {
      return NextResponse.json({ error: "Invalid booking data", details: parseBooking.error }, { status: 400 });
    }
    // Validate foreign keys (aircraft, flight_type, lesson)
    const { aircraft_id, flight_type_id, lesson_id } = parseBooking.data;
    const [aircraft, flightType, lesson] = await Promise.all([
      supabase.from("aircraft").select("id").eq("id", aircraft_id).eq("organization_id", booking.organization_id).single(),
      flight_type_id ? supabase.from("flight_types").select("id").eq("id", flight_type_id).eq("organization_id", booking.organization_id).single() : Promise.resolve({ data: null }),
      lesson_id ? supabase.from("lessons").select("id").eq("id", lesson_id).eq("organization_id", booking.organization_id).single() : Promise.resolve({ data: null }),
    ]);
    if (!aircraft.data) {
      return NextResponse.json({ error: "Invalid aircraft" }, { status: 400 });
    }
    if (flight_type_id && !flightType.data) {
      return NextResponse.json({ error: "Invalid flight type" }, { status: 400 });
    }
    if (lesson_id && !lesson.data) {
      return NextResponse.json({ error: "Invalid lesson" }, { status: 400 });
    }
    // Prevent updates to completed/cancelled bookings
    if (["complete", "cancelled"].includes(booking.status)) {
      return NextResponse.json({ error: "Cannot update completed or cancelled bookings" }, { status: 400 });
    }
    // Update booking
    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update({ ...parseBooking.data, updated_at: new Date().toISOString() })
      .eq("id", bookingId)
      .select()
      .maybeSingle();
    if (updateError) {
      if (
        updateError.message &&
        updateError.message.toLowerCase().includes("exclusion constraint")
      ) {
        return NextResponse.json({ error: "This resource (aircraft, user, or instructor) is already booked for the selected time range." }, { status: 409 });
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    updatedBooking = updated;
  }

  // If bookingDetails is present, validate and upsert
  if (body.bookingDetails) {
    const parseDetails = BookingDetailsSchema.safeParse(body.bookingDetails);
    if (!parseDetails.success) {
      return NextResponse.json({ error: "Invalid booking details data", details: parseDetails.error }, { status: 400 });
    }
    const upsertData = {
      ...parseDetails.data,
      override_conflict: parseDetails.data.overrideConflict ?? false,
      booking_id: bookingId,
      organization_id: booking.organization_id,
      updated_at: new Date().toISOString(),
    };
    delete upsertData.overrideConflict;
    const { data: upserted, error: upsertError } = await supabase
      .from('booking_details')
      .upsert([upsertData], { onConflict: 'booking_id' })
      .select()
      .maybeSingle();
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
    upsertedBookingDetails = upserted;
  }

  return NextResponse.json({ booking: updatedBooking, bookingDetails: upsertedBookingDetails });
} 
import { createClient } from '@/lib/supabaseServerClient';
import { Booking, User } from '@/types/bookings';

export async function getBookingById(id: string): Promise<any> {
  const supabase = await createClient();
  // 1. Fetch booking by id (no joins)
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, organization_id, aircraft_id, user_id, instructor_id, start_time, end_time, status, purpose, remarks, hobbs_start, hobbs_end, tach_start, tach_end, created_at, updated_at, flight_type_id, lesson_id, booking_type, briefing_completed, instructor_comment')
    .eq('id', id)
    .single();
  if (bookingError) {
    console.error('[DEBUG booking fetch] Error:', JSON.stringify(bookingError, null, 2));
    return null;
  }
  console.log('[DEBUG booking fetch] Data:', JSON.stringify(booking, null, 2));

  // 2. Fetch aircraft by aircraft_id
  let aircraft = undefined;
  if (booking && booking.aircraft_id) {
    const { data: aircraftData, error: aircraftError } = await supabase
      .from('aircraft')
      .select('id, registration, type, model')
      .eq('id', booking.aircraft_id)
      .single();
    if (aircraftError) {
      console.error('[DEBUG aircraft fetch] Error:', JSON.stringify(aircraftError, null, 2));
    } else {
      console.log('[DEBUG aircraft fetch] Data:', JSON.stringify(aircraftData, null, 2));
    }
    aircraft = aircraftData || undefined;
  }

  // 3. Fetch member user
  let member: User | undefined = undefined;
  if (booking && booking.user_id) {
    const { data: memberData, error: memberError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, profile_image_url')
      .eq('id', booking.user_id)
      .single();
    if (memberError) {
      console.error('[DEBUG member fetch] Error:', JSON.stringify(memberError, null, 2));
    } else {
      console.log('[DEBUG member fetch] Data:', JSON.stringify(memberData, null, 2));
    }
    member = memberData || undefined;
  }

  // 4. Fetch instructor user
  let instructor: User | undefined = undefined;
  if (booking && booking.instructor_id) {
    const { data: instructorData, error: instructorError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, profile_image_url')
      .eq('id', booking.instructor_id)
      .single();
    if (instructorError) {
      console.error('[DEBUG instructor fetch] Error:', JSON.stringify(instructorError, null, 2));
    } else {
      console.log('[DEBUG instructor fetch] Data:', JSON.stringify(instructorData, null, 2));
    }
    instructor = instructorData || undefined;
  }

  // 5. Fetch flight type by flight_type_id
  let flight_type = undefined;
  if (booking && booking.flight_type_id) {
    const { data: flightTypeData, error: flightTypeError } = await supabase
      .from('flight_types')
      .select('id, name')
      .eq('id', booking.flight_type_id)
      .single();
    if (flightTypeError) {
      console.error('[DEBUG flight_type fetch] Error:', JSON.stringify(flightTypeError, null, 2));
    } else {
      console.log('[DEBUG flight_type fetch] Data:', JSON.stringify(flightTypeData, null, 2));
    }
    flight_type = flightTypeData || undefined;
  }

  // 6. Fetch lesson by lesson_id
  let lesson = undefined;
  if (booking && booking.lesson_id) {
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('id, name, description')
      .eq('id', booking.lesson_id)
      .single();
    if (lessonError) {
      console.error('[DEBUG lesson fetch] Error:', JSON.stringify(lessonError, null, 2));
    } else {
      console.log('[DEBUG lesson fetch] Data:', JSON.stringify(lessonData, null, 2));
    }
    lesson = lessonData || undefined;
  }

  // 7. Fetch booking_details by booking_id
  let bookingDetails = undefined;
  if (booking && booking.id) {
    const { data: detailsData, error: detailsError } = await supabase
      .from('booking_details')
      .select('*')
      .eq('booking_id', booking.id)
      .maybeSingle();
    if (detailsError) {
      console.error('[DEBUG booking_details fetch] Error:', JSON.stringify(detailsError, null, 2));
    } else {
      console.log('[DEBUG booking_details fetch] Data:', JSON.stringify(detailsData, null, 2));
    }
    bookingDetails = detailsData || undefined;
  }

  return { ...booking, aircraft, member, instructor, flight_type, lesson, bookingDetails };
}

export async function getBookingByIdDetailed(id: string): Promise<Booking | null> {
  const supabase = await createClient();
  // 1. Fetch booking with no joins to avoid ambiguity
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, organization_id, aircraft_id, user_id, instructor_id, start_time, end_time, status, purpose, remarks, hobbs_start, hobbs_end, tach_start, tach_end, created_at, updated_at, flight_type_id, lesson_id, booking_type, briefing_completed, instructor_comment
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('[getBookingById] Supabase error:', JSON.stringify(error, null, 2));
    console.error('[getBookingById] Query params:', { id });
    return null;
  }
  if (!data) {
    console.warn('[getBookingById] No data returned for booking id:', id);
    return null;
  }
  console.debug('[getBookingById] Raw data:', JSON.stringify(data, null, 2));

  // Map fields to expected keys
  const d: any = data;
  const mapped = {
    id: d['id'],
    organization_id: d['organization_id'],
    aircraft_id: d['aircraft_id'],
    user_id: d['user_id'],
    instructor_id: d['instructor_id'],
    start_time: d['start_time'],
    end_time: d['end_time'],
    status: d['status'],
    purpose: d['purpose'],
    remarks: d['remarks'],
    hobbs_start: d['hobbs_start'],
    hobbs_end: d['hobbs_end'],
    tach_start: d['tach_start'],
    tach_end: d['tach_end'],
    created_at: d['created_at'],
    updated_at: d['updated_at'],
    flight_type_id: d['flight_type_id'],
    lesson_id: d['lesson_id'],
    booking_type: d['booking_type'],
    briefing_completed: d['briefing_completed'],
    instructor_comment: d['instructor_comment'],
    aircraft: undefined,
    flight_type: undefined,
    lesson: undefined,
    debriefs: [],
  };

  // 2. Fetch aircraft by aircraft_id
  let aircraft = undefined;
  if (mapped.aircraft_id) {
    const { data: aircraftData, error: aircraftError } = await supabase
      .from('aircraft')
      .select('id, registration, type, model')
      .eq('id', mapped.aircraft_id)
      .single();
    if (aircraftError) {
      console.error('[getBookingById] Error fetching aircraft:', JSON.stringify(aircraftError, null, 2));
    }
    aircraft = aircraftData || undefined;
  }

  // 3. Fetch member and instructor users by their IDs
  let member: User | undefined = undefined;
  let instructor: User | undefined = undefined;
  if (mapped.user_id) {
    const { data: memberData, error: memberError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, profile_image_url')
      .eq('id', mapped.user_id)
      .single();
    if (memberError) {
      console.error('[getBookingById] Error fetching member user:', JSON.stringify(memberError, null, 2));
    }
    member = memberData || undefined;
  }
  if (mapped.instructor_id) {
    const { data: instructorData, error: instructorError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, profile_image_url')
      .eq('id', mapped.instructor_id)
      .single();
    if (instructorError) {
      console.error('[getBookingById] Error fetching instructor user:', JSON.stringify(instructorError, null, 2));
    }
    instructor = instructorData || undefined;
  }

  // Build the Booking object explicitly
  const booking: Booking = {
    ...mapped,
    aircraft: aircraft ? {
      ...aircraft,
      current_tach: 0, // TODO: Add these fields to aircraft query
      current_hobbs: 0
    } : undefined,
    member,
    instructor,
  };
  return booking;
} 
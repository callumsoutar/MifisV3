import { createClient } from '@/lib/supabaseServerClient';
import { Booking, User } from '@/types/bookings';

export async function getBookingById(id: string): Promise<Booking | null> {
  console.log('[DEBUG] Entered getBookingById function');
  const supabase = await createClient();
  // 1. Fetch booking with no joins to isolate ambiguity
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, organization_id, aircraft_id, user_id, instructor_id, start_time, end_time, status, purpose, remarks, actual_start, actual_end, hobbs_start, hobbs_end, tach_start, tach_end, created_at, updated_at, flight_type_id, lesson_id, booking_type
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
    actual_start: d['actual_start'],
    actual_end: d['actual_end'],
    hobbs_start: d['hobbs_start'],
    hobbs_end: d['hobbs_end'],
    tach_start: d['tach_start'],
    tach_end: d['tach_end'],
    created_at: d['created_at'],
    updated_at: d['updated_at'],
    flight_type_id: d['flight_type_id'],
    lesson_id: d['lesson_id'],
    booking_type: d['booking_type'],
    // Joins will be added back below
    aircraft: undefined,
    flight_type: undefined,
    lesson: undefined,
    debriefs: [],
  };

  // 2. Fetch member and instructor users by their IDs
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

  console.log('[DEBUG] About to check for lesson_id:', mapped.lesson_id);
  let lesson = undefined;
  if (mapped.lesson_id) {
    console.log('[DEBUG] Inside lesson_id block:', mapped.lesson_id);
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('id, name, description, duration')
      .eq('id', mapped.lesson_id)
      .single();
    if (lessonError) {
      console.error('[getBookingById] Error fetching lesson:', JSON.stringify(lessonError, null, 2));
    } else {
      console.log('[getBookingById] Lesson fetch result:', JSON.stringify(lessonData, null, 2));
    }
    lesson = lessonData || undefined;
  }
  console.log('[DEBUG] Finished lesson fetch block');

  // Direct test fetch for lesson regardless of booking structure
  if (mapped.lesson_id) {
    console.log('[TEST] Fetching lesson directly with id:', mapped.lesson_id);
    const { data: testLesson, error: testLessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', mapped.lesson_id)
      .single();
    if (testLessonError) {
      console.error('[TEST] Error fetching lesson directly:', JSON.stringify(testLessonError, null, 2));
    } else {
      console.log('[TEST] Direct lesson fetch result:', JSON.stringify(testLesson, null, 2));
    }
  }

  // Build the Booking object explicitly
  const booking: Booking = {
    ...mapped,
    member,
    instructor,
    lesson,
  };
  console.log('[getBookingById] Final booking object:', JSON.stringify(booking, null, 2));
  console.log('[DEBUG] Returning booking from getBookingById');
  return booking;
} 
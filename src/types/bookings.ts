// Booking status and type enums
export type BookingStatus = 'unconfirmed' | 'confirmed' | 'briefing' | 'flying' | 'complete';
export type BookingType = 'flight' | 'groundwork' | 'maintenance' | 'other';

export interface Aircraft {
  id: string;
  registration: string;
  type: string;
  model: string;
  manufacturer?: string | null;
  current_tach: number;
  current_hobbs: number;
}

export interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  profile_image_url?: string | null;
}

export interface FlightType {
  id: string;
  name: string;
  description?: string | null;
}

export interface Lesson {
  id: string;
  name: string;
  description?: string | null;
  duration?: number | null;
}

export interface Debrief {
  id: string;
  instructor_id: string;
  comments: string;
  created_at: string;
  updated_at: string;
  instructor?: User;
}

export interface AircraftEquipment {
  id: string;
  aircraft_id: string;
  name: string;
  description?: string | null;
  due_at_hours?: number | null;
  due_at_date?: string | null;
  last_completed_hours?: number | null;
  last_completed_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AircraftTechLog {
  id: string;
  aircraft_id: string;
  entry_type: string;
  description: string;
  tach?: number | null;
  hobbs?: number | null;
  created_by?: string | null;
  created_at: string;
}

export interface BookingDetails {
  id: string;
  eta: string | null;
  passengers: string | null;
  route: string | null;
  equipment: any | null;
  remarks: string | null;
  authorization_completed: boolean;
  booking_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  overrideConflict?: boolean;
  actual_start?: string | null;
  actual_end?: string | null;
}

export interface Booking {
  id: string;
  organization_id: string;
  aircraft_id: string;
  user_id: string;
  instructor_id?: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  purpose: string;
  remarks?: string | null;
  hobbs_start?: number | null;
  hobbs_end?: number | null;
  tach_start?: number | null;
  tach_end?: number | null;
  created_at: string;
  updated_at: string;
  flight_type_id?: string | null;
  lesson_id?: string | null;
  booking_type?: BookingType | null;
  // Joined data
  aircraft?: Aircraft;
  member?: User;
  instructor?: User;
  flight_type?: FlightType;
  lesson?: Lesson;
  debriefs?: Debrief[];
  briefing_completed: boolean;
  instructor_comment?: string | null;
  bookingDetails?: BookingDetails;
} 
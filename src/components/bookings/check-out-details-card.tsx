'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Booking } from '@/types/bookings';
import { format } from 'date-fns';
import { CalendarDays, Plane, FileText, StickyNote, BookOpen, Users, Map, CheckCircle2, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabaseBrowserClient';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { DatePicker, TimeSelect } from '@/components/ui/date-time-picker';

// Utility: convert DB datetime to input[type=datetime-local] value
function toDatetimeLocal(dt: string | null | undefined): string {
  if (!dt) return '';
  const date = new Date(dt);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

export function CheckOutDetailsCard({ booking, editMode }: { booking: Booking; editMode: boolean }) {
  const initialFormRef = useRef({
    start_time: booking.start_time ? new Date(booking.start_time) : null,
    end_time: booking.end_time ? new Date(booking.end_time) : null,
    aircraft_id: booking.aircraft?.id || '',
    flight_type_id: booking.flight_type?.id || '',
    booking_type: booking.booking_type || '',
    lesson_id: booking.lesson?.id || '',
    purpose: booking.purpose || '',
    bookingRemarks: booking.remarks || '',
    eta: booking.bookingDetails?.eta ? new Date(booking.bookingDetails.eta) : null,
    passengers: booking.bookingDetails?.passengers || '',
    route: booking.bookingDetails?.route || '',
    remarks: booking.bookingDetails?.remarks || '',
  });
  const [form, setForm] = useState(initialFormRef.current);
  const [aircraftOptions, setAircraftOptions] = useState<any[]>([]);
  const [flightTypeOptions, setFlightTypeOptions] = useState<any[]>([]);
  const [lessonOptions, setLessonOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // New: handle check out with confirmation and status update
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  // In-app navigation dialog state
  const [pendingNavigation, setPendingNavigation] = useState<null | (() => void)>(null);
  const [showNavDialog, setShowNavDialog] = useState(false);

  // Dirty check
  const isDirty = editMode && Object.keys(form).some(
    key => form[key as keyof typeof form] !== initialFormRef.current[key as keyof typeof form]
  );

  // Unsaved changes alert on browser navigation
  useEffect(() => {
    if (!editMode) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, editMode]);

  useEffect(() => {
    const fetchOptions = async () => {
      const supabase = createClient();
      // Fetch all aircraft for the org (no filtering for busy aircraft)
      const { data: aircrafts } = await supabase
        .from('aircraft')
        .select('id, registration, type, model, organization_id')
        .eq('organization_id', booking.organization_id);
      setAircraftOptions(aircrafts || []);
      // Fetch flight types
      const { data: flightTypes } = await supabase
        .from('flight_types')
        .select('id, name, organization_id')
        .eq('organization_id', booking.organization_id);
      setFlightTypeOptions(flightTypes || []);
      // Fetch lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, name, organization_id')
        .eq('organization_id', booking.organization_id);
      setLessonOptions(lessons || []);
    };
    fetchOptions();
  }, [editMode, booking.organization_id]);

  useEffect(() => {
    // Debug log: resetting form state from booking prop
    console.debug('CheckOutDetailsCard useEffect: resetting form state from booking', booking);
    const newInitial = {
      start_time: booking.start_time ? new Date(booking.start_time) : null,
      end_time: booking.end_time ? new Date(booking.end_time) : null,
      aircraft_id: booking.aircraft?.id || '',
      flight_type_id: booking.flight_type?.id || '',
      booking_type: booking.booking_type || '',
      lesson_id: booking.lesson?.id || '',
      purpose: booking.purpose || '',
      bookingRemarks: booking.remarks || '',
      eta: booking.bookingDetails?.eta ? new Date(booking.bookingDetails.eta) : null,
      passengers: booking.bookingDetails?.passengers || '',
      route: booking.bookingDetails?.route || '',
      remarks: booking.bookingDetails?.remarks || '',
    };
    initialFormRef.current = newInitial;
    setForm(newInitial);
  }, [booking]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setForm({
      start_time: booking.start_time ? new Date(booking.start_time) : null,
      end_time: booking.end_time ? new Date(booking.end_time) : null,
      aircraft_id: booking.aircraft?.id || '',
      flight_type_id: booking.flight_type?.id || '',
      booking_type: booking.booking_type || '',
      lesson_id: booking.lesson?.id || '',
      purpose: booking.purpose || '',
      bookingRemarks: booking.remarks || '',
      eta: booking.bookingDetails?.eta ? new Date(booking.bookingDetails.eta) : null,
      passengers: booking.bookingDetails?.passengers || '',
      route: booking.bookingDetails?.route || '',
      remarks: booking.bookingDetails?.remarks || '',
    });
  };

  const handleSave = async () => {
    // Debug log: form state before validation
    console.debug('CheckOutDetailsCard form state before validation:', form);
    // Client-side validation
    if (!form.start_time) {
      setError('Start time is required.');
      return;
    }
    if (!form.end_time) {
      setError('End time is required.');
      return;
    }
    if (!form.aircraft_id) {
      setError('Aircraft is required.');
      return;
    }
    if (!form.flight_type_id) {
      setError('Flight type is required.');
      return;
    }
    if (!form.booking_type) {
      setError('Booking type is required.');
      return;
    }
    if (!form.lesson_id) {
      setError('Lesson is required.');
      return;
    }
    if (!form.purpose) {
      setError('Description is required.');
      return;
    }
    if (!form.bookingRemarks) {
      setError('Booking remarks are required.');
      return;
    }
    // Flight Information: eta is required
    if (!form.eta) {
      setError('ETA is required in Flight Information.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        booking: {
          start_time: form.start_time ? form.start_time.toISOString() : null,
          end_time: form.end_time ? form.end_time.toISOString() : null,
          aircraft_id: form.aircraft_id,
          flight_type_id: form.flight_type_id,
          booking_type: form.booking_type,
          lesson_id: form.lesson_id,
          purpose: form.purpose,
          remarks: form.bookingRemarks,
        },
        bookingDetails: {
          eta: form.eta ? form.eta.toISOString() : null,
          passengers: form.passengers,
          route: form.route,
          remarks: form.remarks,
          overrideConflict: true,
        },
      };
      // Debug log: request payload
      console.debug('CheckOutDetailsCard POST /api/bookings/[id] payload:', payload);
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      // Debug log: response
      console.debug('CheckOutDetailsCard POST /api/bookings/[id] response:', data);
      if (!res.ok) {
        setError(data.error || 'Failed to update check out details');
        // Show full error details if available
        if (data.details) {
          setError(prev => prev + '\n' + JSON.stringify(data.details, null, 2));
        }
        toast.error(data.error || 'Failed to update check out details');
        setLoading(false);
        return;
      }
      toast.success('Check out details updated');
      setLoading(false);
      router.refresh();
    } catch (e: any) {
      // Debug log: catch block error
      console.error('CheckOutDetailsCard handleSave catch error:', e);
      setError((e && e.message) ? e.message : JSON.stringify(e));
      toast.error((e && e.message) ? e.message : 'Unknown error');
      setLoading(false);
    }
  };

  // New: handle check out with confirmation and status update
  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    setError(null);
    try {
      // Save booking details first (same as handleSave)
      const payload = {
        booking: {
          start_time: form.start_time ? form.start_time.toISOString() : null,
          end_time: form.end_time ? form.end_time.toISOString() : null,
          aircraft_id: form.aircraft_id,
          flight_type_id: form.flight_type_id,
          booking_type: form.booking_type,
          lesson_id: form.lesson_id,
          purpose: form.purpose,
          remarks: form.bookingRemarks,
        },
        bookingDetails: {
          eta: form.eta ? form.eta.toISOString() : null,
          passengers: form.passengers,
          route: form.route,
          remarks: form.remarks,
          overrideConflict: true,
        },
      };
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to check out booking');
        setCheckOutLoading(false);
        toast.error(data.error || 'Failed to check out booking');
        return;
      }
      // Now patch status to 'flying'
      const patchRes = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aircraft_id: form.aircraft_id,
          start_time: form.start_time ? form.start_time.toISOString() : null,
          end_time: form.end_time ? form.end_time.toISOString() : null,
          status: 'flying',
          purpose: form.purpose,
          remarks: form.bookingRemarks,
          flight_type_id: form.flight_type_id,
          lesson_id: form.lesson_id,
          booking_type: form.booking_type,
        }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        setError(patchData.error || 'Failed to update booking status');
        setCheckOutLoading(false);
        toast.error(patchData.error || 'Failed to update booking status');
        return;
      }
      toast.success('Booking checked out!');
      setCheckOutLoading(false);
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      toast.error(e.message || 'Unknown error');
      setCheckOutLoading(false);
    }
  };

  // Intercept in-app navigation (router.push)
  const guardedRouterPush = (url: string) => {
    if (isDirty) {
      setPendingNavigation(() => () => router.push(url));
      setShowNavDialog(true);
    } else {
      router.push(url);
    }
  };

  // Intercept link clicks inside this component
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (isDirty) {
      e.preventDefault();
      setPendingNavigation(() => () => router.push(e.currentTarget.href));
      setShowNavDialog(true);
    }
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 w-full">
      <div className="flex items-center justify-between pb-2 gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            {booking.status === 'flying' ? 'Booking Information' : 'Check Flight Out'}
          </h2>
        </div>
        {editMode && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading} className="cursor-pointer">
              Undo Changes
            </Button>
            <Button variant="default" type="button" onClick={handleSave} disabled={loading} className="cursor-pointer">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 pt-2">
        {/* Scheduled Times: full width */}
        <div className="w-full">
          <div className="bg-slate-50 rounded-md p-4 flex flex-col gap-2 min-h-[96px] border border-slate-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-2 uppercase tracking-wide">
              <CalendarDays className="w-4 h-4 text-primary" /> Scheduled Times
            </div>
            <div className="flex flex-row gap-8 items-end">
              {/* Start Time */}
              <div className="flex-1">
                <div className="text-xs text-slate-500 font-semibold mb-0.5 uppercase tracking-wide">Start Time</div>
                {editMode ? (
                  <div className="flex gap-2">
                    <DatePicker
                      value={form.start_time}
                      onChange={(date: Date | null) => handleChange('start_time', date)}
                      placeholder="Select start date"
                    />
                    <TimeSelect
                      value={form.start_time ? format(form.start_time, 'HH:mm') : ''}
                      onChange={(time: string) => {
                        if (form.start_time) {
                          const [h, m] = time.split(':').map(Number);
                          const newDate = new Date(form.start_time);
                          newDate.setHours(h, m, 0, 0);
                          handleChange('start_time', newDate);
                        }
                      }}
                      placeholder="Start time"
                    />
                  </div>
                ) : (
                  <div className="text-lg font-bold text-slate-900 leading-tight">
                    {booking.start_time && new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-0.5">
                  {booking.start_time && new Date(booking.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              {/* End Time */}
              <div className="flex-1">
                <div className="text-xs text-slate-500 font-semibold mb-0.5 uppercase tracking-wide">End Time</div>
                {editMode ? (
                  <div className="flex gap-2">
                    <DatePicker
                      value={form.end_time}
                      onChange={(date: Date | null) => handleChange('end_time', date)}
                      placeholder="Select end date"
                    />
                    <TimeSelect
                      value={form.end_time ? format(form.end_time, 'HH:mm') : ''}
                      onChange={(time: string) => {
                        if (form.end_time) {
                          const [h, m] = time.split(':').map(Number);
                          const newDate = new Date(form.end_time);
                          newDate.setHours(h, m, 0, 0);
                          handleChange('end_time', newDate);
                        }
                      }}
                      placeholder="End time"
                    />
                  </div>
                ) : (
                  <div className="text-lg font-bold text-slate-900 leading-tight">
                    {booking.end_time && new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-0.5">
                  {booking.end_time && new Date(booking.end_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Aircraft & Flight Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Aircraft */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1 uppercase tracking-wide">
              <Plane className="w-4 h-4 text-primary" /> Aircraft
            </div>
            {editMode ? (
              <Select value={form.aircraft_id} onValueChange={val => handleChange('aircraft_id', val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {aircraftOptions.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.registration} {a.type && `(${a.type}${a.model ? ` – ${a.model}` : ''})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              booking.aircraft?.registration ? (
                <div className="bg-slate-100 rounded-md p-3 min-h-[32px] text-base text-slate-900 flex items-center font-bold border border-slate-100">
                  {booking.aircraft.registration}
                  {booking.aircraft.type && (
                    <span className="text-sm text-slate-600 font-normal ml-2">{booking.aircraft.type}{booking.aircraft.model ? ` – ${booking.aircraft.model}` : ''}</span>
                  )}
                </div>
              ) : (
                <div className="bg-slate-100 rounded-md p-3 min-h-[32px] text-base text-slate-900 flex items-center border border-slate-100">--</div>
              )
            )}
          </div>
          {/* Flight Type */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1 uppercase tracking-wide">
              <Plane className="w-4 h-4 text-primary" /> Flight Type
            </div>
            {editMode ? (
              <Select value={form.flight_type_id} onValueChange={val => handleChange('flight_type_id', val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Flight Type" />
                </SelectTrigger>
                <SelectContent>
                  {flightTypeOptions.map(ft => (
                    <SelectItem key={ft.id} value={ft.id}>{ft.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="bg-slate-100 rounded-md p-3 min-h-[32px] text-base text-slate-900 flex items-center border border-slate-100">
                {booking.flight_type?.name || '--'}
              </div>
            )}
          </div>
        </div>
        {/* Lesson & Booking Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          {/* Lesson */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1 uppercase tracking-wide">
              <BookOpen className="w-4 h-4 text-primary" /> Lesson
            </div>
            {editMode ? (
              <Select value={form.lesson_id} onValueChange={val => handleChange('lesson_id', val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Lesson" />
                </SelectTrigger>
                <SelectContent>
                  {lessonOptions.map(lesson => (
                    <SelectItem key={lesson.id} value={lesson.id}>{lesson.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="bg-slate-100 rounded-md p-3 min-h-[32px] text-base text-slate-900 flex items-center border border-slate-100">
                {booking.lesson?.name || '--'}
              </div>
            )}
          </div>
          {/* Booking Type */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1 uppercase tracking-wide">
              <FileText className="w-4 h-4 text-primary" /> Booking Type
            </div>
            {editMode ? (
              <Select value={form.booking_type} onValueChange={val => handleChange('booking_type', val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Booking Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="groundwork">Groundwork</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="bg-slate-100 rounded-md p-3 min-h-[32px] text-base text-slate-900 flex items-center border border-slate-100">
                {booking.booking_type ? booking.booking_type.charAt(0).toUpperCase() + booking.booking_type.slice(1) : '--'}
              </div>
            )}
          </div>
        </div>
        {/* Booking Remarks & Description side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Booking Remarks */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1 uppercase tracking-wide">
              <StickyNote className="w-4 h-4 text-primary" /> Booking Remarks
            </div>
            {editMode ? (
              <Textarea
                value={form.bookingRemarks}
                onChange={e => handleChange('bookingRemarks', e.target.value)}
                placeholder="Enter booking remarks"
                rows={2}
              />
            ) : (
              <div className="bg-slate-100 rounded-md p-3 min-h-[32px] text-base text-slate-900 flex items-center border border-slate-100 whitespace-pre-wrap">
                {form.bookingRemarks || '--'}
              </div>
            )}
          </div>
          {/* Description */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1 uppercase tracking-wide">
              <BookOpen className="w-4 h-4 text-primary" /> Description
            </div>
            {editMode ? (
              <Textarea
                value={form.purpose}
                onChange={e => handleChange('purpose', e.target.value)}
                placeholder="Enter flight purpose/description"
                rows={2}
              />
            ) : (
              <div className="bg-slate-100 rounded-md p-3 min-h-[32px] text-base text-slate-900 flex items-center border border-slate-100 whitespace-pre-wrap">
                {form.purpose || '--'}
              </div>
            )}
          </div>
        </div>
        {/* FLIGHT INFORMATION SECTION (now at the bottom) */}
        <div className="bg-slate-50 rounded-md p-4 border border-slate-100 flex flex-col gap-4 mt-2">
          <div className="text-base font-semibold text-primary mb-2 flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" /> Flight Information
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ETA */}
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1 uppercase tracking-wide">
                <CalendarDays className="w-4 h-4 text-primary" /> ETA
              </div>
              {editMode ? (
                <div className="flex gap-2">
                  <DatePicker
                    value={form.eta}
                    onChange={(date: Date | null) => handleChange('eta', date)}
                    placeholder="Select ETA date"
                  />
                  <TimeSelect
                    value={form.eta ? format(form.eta, 'HH:mm') : ''}
                    onChange={(time: string) => {
                      if (form.eta) {
                        const [h, m] = time.split(':').map(Number);
                        const newDate = new Date(form.eta);
                        newDate.setHours(h, m, 0, 0);
                        handleChange('eta', newDate);
                      }
                    }}
                    placeholder="ETA time"
                  />
                </div>
              ) : (
                <div className="bg-slate-100 rounded-md p-3 min-h-[32px] text-base text-slate-900 flex items-center border border-slate-100">
                  {form.eta ? format(new Date(form.eta), 'PPpp') : '--'}
                </div>
              )}
            </div>
            {/* Passengers */}
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1 uppercase tracking-wide">
                <Users className="w-4 h-4 text-primary" /> Passengers
              </div>
              {editMode ? (
                <input
                  type="text"
                  className="text-sm border rounded px-2 py-1 w-full bg-white"
                  value={form.passengers}
                  onChange={e => handleChange('passengers', e.target.value)}
                  placeholder="Enter passenger names or count"
                />
              ) : (
                <div className="bg-slate-100 rounded-md p-3 min-h-[32px] text-base text-slate-900 flex items-center border border-slate-100">
                  {form.passengers || '--'}
                </div>
              )}
            </div>
            {/* Route */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1 uppercase tracking-wide">
                <Map className="w-4 h-4 text-primary" /> Route
              </div>
              {editMode ? (
                <input
                  type="text"
                  className="text-sm border rounded px-2 py-1 w-full bg-white"
                  value={form.route}
                  onChange={e => handleChange('route', e.target.value)}
                  placeholder="Enter route details"
                />
              ) : (
                <div className="bg-slate-100 rounded-md p-3 min-h-[32px] text-base text-slate-900 flex items-center border border-slate-100">
                  {form.route || '--'}
                </div>
              )}
            </div>
            {/* Remarks (Flight Out) as single row */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1 uppercase tracking-wide">
                <StickyNote className="w-4 h-4 text-primary" /> Remarks (Flight Out)
              </div>
              {editMode ? (
                <input
                  type="text"
                  className="text-sm border rounded px-2 py-1 w-full bg-white"
                  value={form.remarks}
                  onChange={e => handleChange('remarks', e.target.value)}
                  placeholder="Enter remarks for check out"
                />
              ) : (
                <div className="bg-slate-100 rounded-md p-3 min-h-[32px] text-base text-slate-900 flex items-center border border-slate-100">
                  {form.remarks || '--'}
                </div>
              )}
            </div>
          </div>
        </div>
        {editMode && booking.status !== 'flying' && (
          <div className="flex justify-end items-center mt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" type="button" className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" disabled={checkOutLoading}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {checkOutLoading ? 'Checking Out...' : 'Check Flight Out'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to check out this booking?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will commit all changes and set the booking status to <b>flying</b>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={checkOutLoading} className="cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCheckOut} disabled={checkOutLoading} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                    Check Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        {error && <div className="text-red-500 text-sm mt-2 whitespace-pre-wrap">{error}</div>}
      </div>
      {/* Custom AlertDialog for in-app navigation */}
      <AlertDialog open={showNavDialog} onOpenChange={setShowNavDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowNavDialog(false)} className="cursor-pointer">Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowNavDialog(false);
              if (pendingNavigation) {
                pendingNavigation();
                setPendingNavigation(null);
              }
            }} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
              Leave Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
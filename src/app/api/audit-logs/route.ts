import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServerClient';

const FIELD_LABELS: Record<string, string> = {
  aircraft_id: 'aircraft',
  instructor_id: 'instructor',
  start_time: 'start time',
  end_time: 'end time',
  purpose: 'description',
  remarks: 'remarks',
  updated_at: 'updated at',
};

const IGNORED_FIELDS = ['updated_at', 'created_at', 'organization_id', 'id', 'user_id'];

async function resolveUserName(supabase: any, userId: string | null) {
  if (!userId) return null;
  const { data } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', userId)
    .single();
  if (!data) return null;
  return `${data.first_name || ''} ${data.last_name || ''}`.trim();
}

async function resolveAircraft(supabase: any, aircraftId: string | null) {
  if (!aircraftId) return null;
  const { data } = await supabase
    .from('aircraft')
    .select('registration')
    .eq('id', aircraftId)
    .single();
  if (!data) return null;
  return data.registration;
}

async function resolveInstructor(supabase: any, instructorId: string | null) {
  if (!instructorId) return null;
  const { data } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', instructorId)
    .single();
  if (!data) return null;
  return `${data.first_name || ''} ${data.last_name || ''}`.trim();
}

function formatValue(field: string, value: any) {
  if (value === null || value === undefined) return '—';
  if (field.endsWith('_at') && typeof value === 'string') {
    return new Date(value).toLocaleString();
  }
  return String(value);
}

function formatAuditDate(date: string) {
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rowId = searchParams.get('rowId');
  const tableName = searchParams.get('tableName');
  if (!rowId || !tableName) {
    return NextResponse.json({ logs: [] }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, changed_by, changed_at, column_changes')
    .eq('row_id', rowId)
    .eq('table_name', tableName)
    .order('changed_at', { ascending: false });

  if (error) {
    return NextResponse.json({ logs: [], error: error.message }, { status: 500 });
  }

  // Collect all userIds, aircraftIds, instructorIds to resolve in batch
  const userIds = Array.from(new Set(data.map((log: any) => log.changed_by).filter(Boolean)));
  const aircraftIds = Array.from(new Set(
    data.flatMap((log: any) =>
      log.column_changes ? [log.column_changes.aircraft_id?.old, log.column_changes.aircraft_id?.new] : []
    ).filter(Boolean)
  ));
  const instructorIds = Array.from(new Set(
    data.flatMap((log: any) =>
      log.column_changes ? [log.column_changes.instructor_id?.old, log.column_changes.instructor_id?.new] : []
    ).filter(Boolean)
  ));

  // Batch fetch users and aircraft
  const [usersRes, aircraftRes, instructorsRes] = await Promise.all([
    userIds.length
      ? supabase.from('users').select('id, first_name, last_name').in('id', userIds)
      : Promise.resolve({ data: [] }),
    aircraftIds.length
      ? supabase.from('aircraft').select('id, registration').in('id', aircraftIds)
      : Promise.resolve({ data: [] }),
    instructorIds.length
      ? supabase.from('users').select('id, first_name, last_name').in('id', instructorIds)
      : Promise.resolve({ data: [] }),
  ]);
  const userMap = Object.fromEntries((usersRes.data || []).map((u: any) => [u.id, `${u.first_name || ''} ${u.last_name || ''}`.trim()]));
  const aircraftMap = Object.fromEntries((aircraftRes.data || []).map((a: any) => [a.id, a.registration]));
  const instructorMap = Object.fromEntries((instructorsRes.data || []).map((u: any) => [u.id, `${u.first_name || ''} ${u.last_name || ''}`.trim()]));

  // Build user-friendly messages
  const logs = await Promise.all(
    data.map(async (log: any) => {
      let user = userMap[log.changed_by] || 'Someone';
      let date = formatAuditDate(log.changed_at);
      let descriptions: string[] = [];
      if (log.column_changes) {
        for (const [field, value] of Object.entries(log.column_changes)) {
          if (IGNORED_FIELDS.includes(field)) continue;
          let label = FIELD_LABELS[field] || field.replace(/_/g, ' ');
          let oldDisplay = '—';
          let newDisplay = '—';
          if (value && typeof value === 'object' && 'old' in value && 'new' in value) {
            // @ts-ignore
            oldDisplay = formatValue(field, value.old);
            // @ts-ignore
            newDisplay = formatValue(field, value.new);
            if (field === 'aircraft_id') {
              // @ts-ignore
              oldDisplay = aircraftMap[value.old] || oldDisplay;
              // @ts-ignore
              newDisplay = aircraftMap[value.new] || newDisplay;
            }
            if (field === 'instructor_id') {
              // @ts-ignore
              oldDisplay = instructorMap[value.old] || oldDisplay;
              // @ts-ignore
              newDisplay = instructorMap[value.new] || newDisplay;
            }
          }
          descriptions.push(`${label.charAt(0).toUpperCase() + label.slice(1)} changed from "${oldDisplay}" to "${newDisplay}"`);
        }
      }
      if (descriptions.length === 0) {
        if (log.action === 'INSERT') {
          descriptions.push('Booking Created');
        } else if (log.action === 'DELETE') {
          descriptions.push('Booking Deleted');
        } else if (log.action === 'UPDATE') {
          descriptions.push('Booking Updated');
        }
      }
      return {
        date,
        user,
        description: descriptions.join('; '),
      };
    })
  );

  return NextResponse.json({ logs });
} 
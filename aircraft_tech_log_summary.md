# Aircraft Tech Log & Maintenance Schema – Quick Reference

## 1. Schema Overview

### Aircraft Table (public.aircraft)
- `current_tach` (numeric, not null, default 0): Current tacho reading
- `current_hobbs` (numeric, not null, default 0): Current hobbs reading

### Bookings Table (public.bookings)
- `tach_start`, `tach_end`, `hobbs_start`, `hobbs_end`: Per-flight timekeeping

### Aircraft Equipment Table (public.aircraft_equipment)
- `id` (uuid, PK)
- `aircraft_id` (uuid, FK → aircraft)
- `name` (text): Equipment/maintenance item name
- `description` (text, optional)
- `due_at_hours` (numeric, optional): When due by tacho/hobbs
- `due_at_date` (timestamptz, optional): When due by date
- `last_completed_hours` (numeric, optional): Last completed at tacho/hobbs
- `last_completed_date` (timestamptz, optional): Last completed at date
- `created_at`, `updated_at`

### Aircraft Tech Log Table (public.aircraft_tech_log)
- `id` (uuid, PK)
- `aircraft_id` (uuid, FK → aircraft)
- `entry_type` (text): 'correction', 'maintenance', 'note', etc.
- `description` (text): Details of the entry
- `tach`, `hobbs` (numeric, optional): Value at time of entry
- `created_by` (uuid, FK → users, optional)
- `created_at` (timestamptz)

---

## 2. Workflow & Best Practices

### A. Booking Completion & Aircraft Timekeeping
- When a booking is completed and `tach_end`/`hobbs_end` are entered:
  1. Update the booking record.
  2. Update the aircraft's `current_tach`/`current_hobbs` to the latest values (if greater than current).
  3. Create a tech log entry for this update (automated).

### B. Manual Corrections
- Allow users to submit corrections via a form.
- Require a reason for correction.
- Create a tech log entry with the correction reason, new value, and user.
- Update the aircraft's `current_tach`/`current_hobbs` accordingly.

### C. Maintenance Compliance
- When maintenance is performed:
  - Update the relevant `aircraft_equipment` record's `last_completed_hours`/`last_completed_date`.
  - Optionally, create a tech log entry for traceability.
- Before flight/booking:
  - Check if any equipment is overdue (by hours or date).
  - Warn/block booking if maintenance is overdue.

### D. Data Integrity & Auditability
- Use triggers or transactional logic to ensure aircraft times only increase (prevent rollback).
- All manual changes are logged in `aircraft_tech_log` with user and timestamp.
- Allow admins/instructors to view and edit aircraft times, but require a reason for corrections.

---

## 3. Implementation Notes
- Update API and TypeScript types to include new fields and tables.
- Show current tacho/hobbs on aircraft pages.
- Allow corrections with audit logging.
- Show maintenance/equipment status and warnings.
- Implement business logic for updating aircraft times on booking completion and for compliance checks. 
-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create users table (profiles linked to auth.users)
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  date_of_birth DATE,
  license_number TEXT,
  license_expiry DATE,
  medical_expiry DATE,
  date_of_last_flight TIMESTAMP WITH TIME ZONE,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_organizations junction table for many-to-many relationship
CREATE TABLE public.user_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- member, admin, instructor, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Create aircraft table
CREATE TABLE public.aircraft (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  registration TEXT NOT NULL,
  type TEXT NOT NULL,
  model TEXT NOT NULL,
  manufacturer TEXT,
  year_manufactured INTEGER,
  total_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_maintenance_date TIMESTAMP WITH TIME ZONE,
  next_maintenance_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active', -- active, maintenance, out-of-service
  hourly_rate NUMERIC(10,2),
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, registration)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  aircraft_id UUID NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, in-progress, completed, cancelled
  purpose TEXT NOT NULL, -- training, personal, checkride, etc.
  remarks TEXT,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  hobbs_start NUMERIC(10,2),
  hobbs_end NUMERIC(10,2),
  tach_start NUMERIC(10,2),
  tach_end NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue, cancelled
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, invoice_number)
);

-- Create booking_details table
CREATE TABLE public.booking_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  eta TIMESTAMP WITH TIME ZONE,
  passengers TEXT,
  route TEXT,
  equipment JSONB,
  remarks TEXT,
  authorization_completed BOOLEAN NOT NULL DEFAULT false,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  override_conflict BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

-- Add Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_details ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user belongs to an organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_organizations
    WHERE user_id = $1 AND organization_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations RLS policies
CREATE POLICY "Users can view organizations they belong to" 
  ON public.organizations 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_organizations 
    WHERE user_id = auth.uid() AND organization_id = id
  ));

-- Users RLS policies
CREATE POLICY "Users can view their own profile" 
  ON public.users 
  FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Users can view other users in their organizations" 
  ON public.users 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_organizations uo1
    JOIN public.user_organizations uo2 ON uo1.organization_id = uo2.organization_id
    WHERE uo1.user_id = auth.uid() AND uo2.user_id = users.id
  ));

CREATE POLICY "Users can update their own profile" 
  ON public.users 
  FOR UPDATE 
  USING (id = auth.uid());

-- User Organizations RLS policies
CREATE POLICY "Users can view their own organization memberships" 
  ON public.user_organizations 
  FOR SELECT 
  USING (user_id = auth.uid() OR public.user_belongs_to_organization(auth.uid(), organization_id));

-- Aircraft RLS policies
CREATE POLICY "Users can view aircraft in their organizations" 
  ON public.aircraft 
  FOR SELECT 
  USING (public.user_belongs_to_organization(auth.uid(), organization_id));

-- Bookings RLS policies
CREATE POLICY "Users can view their own bookings" 
  ON public.bookings 
  FOR SELECT 
  USING (user_id = auth.uid() OR instructor_id = auth.uid());

CREATE POLICY "Users can view bookings in their organizations" 
  ON public.bookings 
  FOR SELECT 
  USING (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can create bookings in their organizations" 
  ON public.bookings 
  FOR INSERT 
  WITH CHECK (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can update their own bookings" 
  ON public.bookings 
  FOR UPDATE 
  USING (user_id = auth.uid() AND status != 'completed');

-- Invoices RLS policies
CREATE POLICY "Users can view their own invoices" 
  ON public.invoices 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can view invoices in their organizations" 
  ON public.invoices 
  FOR SELECT 
  USING (public.user_belongs_to_organization(auth.uid(), organization_id));

-- Booking Details RLS policies
CREATE POLICY "Users can view booking_details in their organizations"
  ON public.booking_details
  FOR SELECT
  USING (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can insert booking_details in their organizations"
  ON public.booking_details
  FOR INSERT
  WITH CHECK (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can update booking_details in their organizations"
  ON public.booking_details
  FOR UPDATE
  USING (public.user_belongs_to_organization(auth.uid(), organization_id));

-- Create trigger to update the updated_at field
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update the updated_at column automatically
CREATE TRIGGER set_updated_at_organizations
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_users
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_aircraft
BEFORE UPDATE ON public.aircraft
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_bookings
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_invoices
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_booking_details
BEFORE UPDATE ON public.booking_details
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Create trigger to automatically update user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Example trigger to prevent double-booking unless override_conflict is true
CREATE OR REPLACE FUNCTION public.prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.override_conflict IS FALSE THEN
    IF EXISTS (
      SELECT 1 FROM public.booking_details
      WHERE booking_id <> NEW.booking_id
        AND override_conflict IS FALSE
        -- Add any additional logic for overlapping times if needed
    ) THEN
      RAISE EXCEPTION 'Double booking is not allowed unless override_conflict is true.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_double_booking_trigger
BEFORE INSERT OR UPDATE ON public.booking_details
FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();

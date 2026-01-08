-- Create maintenance_tickets table for trouble ticket system
CREATE TABLE public.maintenance_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('issue', 'error', 'log')),
  
  -- Issue fields
  title text,
  description text,
  priority text CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category text,
  
  -- Error fields
  error_name text,
  error_message text,
  error_stack text,
  component_stack text,
  
  -- Log fields
  log_type text,
  log_message text,
  metadata jsonb,
  
  -- Context
  user_id uuid,
  user_email text,
  page_url text,
  browser_info text,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;

-- Admin can view all tickets
CREATE POLICY "Admins can view tickets" ON public.maintenance_tickets
  FOR SELECT USING (has_role(auth.uid(), 'Admin'::text));

-- Admin can update tickets (for status changes)
CREATE POLICY "Admins can update tickets" ON public.maintenance_tickets
  FOR UPDATE USING (has_role(auth.uid(), 'Admin'::text));

-- Admin can delete tickets
CREATE POLICY "Admins can delete tickets" ON public.maintenance_tickets
  FOR DELETE USING (has_role(auth.uid(), 'Admin'::text));

-- Service role can insert (edge functions use service role)
-- No INSERT policy needed as edge functions use service role key which bypasses RLS

-- Indexes for common queries
CREATE INDEX idx_maintenance_tickets_status ON public.maintenance_tickets(status);
CREATE INDEX idx_maintenance_tickets_type ON public.maintenance_tickets(type);
CREATE INDEX idx_maintenance_tickets_created ON public.maintenance_tickets(created_at DESC);
CREATE INDEX idx_maintenance_tickets_priority ON public.maintenance_tickets(priority);

-- Trigger for updated_at
CREATE TRIGGER update_maintenance_tickets_updated_at
  BEFORE UPDATE ON public.maintenance_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
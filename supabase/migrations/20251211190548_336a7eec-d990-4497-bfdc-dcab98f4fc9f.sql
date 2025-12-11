-- Create migration_mappings table to persist ID mappings
CREATE TABLE public.migration_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL,
  old_id INTEGER NOT NULL,
  new_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_table, old_id)
);

-- Enable RLS
ALTER TABLE public.migration_mappings ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage migration mappings"
ON public.migration_mappings
FOR ALL
USING (public.has_role(auth.uid(), 'Admin'))
WITH CHECK (public.has_role(auth.uid(), 'Admin'));
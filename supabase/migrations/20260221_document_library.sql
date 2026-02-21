-- Document Library: categories + documents tables
-- Migration: 20260221_document_library

-- 1. Document categories lookup table
CREATE TABLE public.document_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Seed categories
INSERT INTO public.document_categories (name, sort_order) VALUES
  ('Operations Manuals', 1),
  ('Training Materials', 2),
  ('Reference Documents', 3),
  ('Policies & Procedures', 4),
  ('General', 5);

-- 2. Documents table
CREATE TABLE public.documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category_id uuid NOT NULL REFERENCES public.document_categories(id),
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_documents_category_id ON public.documents(category_id);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX idx_documents_title_search ON public.documents USING gin(to_tsvector('english', title));

-- 4. RLS on document_categories
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON public.document_categories FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage categories"
  ON public.document_categories FOR ALL
  USING (public.has_role(auth.uid(), 'Admin'))
  WITH CHECK (public.has_role(auth.uid(), 'Admin'));

-- 5. RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents"
  ON public.documents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert documents"
  ON public.documents FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can update documents"
  ON public.documents FOR UPDATE
  USING (public.has_role(auth.uid(), 'Admin'))
  WITH CHECK (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can delete documents"
  ON public.documents FOR DELETE
  USING (public.has_role(auth.uid(), 'Admin'));

-- 6. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_documents_updated_at();

-- 7. Storage bucket for document files
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage RLS policies
CREATE POLICY "Authenticated users can download documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can update documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'Admin'))
  WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can delete documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'Admin'));

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_name text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  row_count integer NOT NULL DEFAULT 0,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  quality jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT ON public.reports TO anon;
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports are viewable by everyone"
  ON public.reports FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can upload a report"
  ON public.reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX reports_uploaded_at_idx ON public.reports (uploaded_at DESC);
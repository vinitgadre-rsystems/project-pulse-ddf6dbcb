CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_name text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  row_count integer NOT NULL DEFAULT 0,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  quality jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_by uuid,
  itops jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai jsonb NOT NULL DEFAULT '[]'::jsonb,
  team_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_agents jsonb DEFAULT '[]'::jsonb,
  itops_services jsonb
);

GRANT SELECT, INSERT ON public.reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reports"
  ON public.reports FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can upload reports"
  ON public.reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Signed-in users can update reports"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Signed-in users can delete reports"
  ON public.reports FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX reports_uploaded_at_idx ON public.reports (uploaded_at DESC);
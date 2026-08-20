ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS uploaded_by uuid;

DROP POLICY IF EXISTS "Anyone can upload a report" ON public.reports;
DROP POLICY IF EXISTS "Reports are viewable by everyone" ON public.reports;

REVOKE ALL ON public.reports FROM anon;
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

CREATE POLICY "Signed-in users can view reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Signed-in users can upload reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);
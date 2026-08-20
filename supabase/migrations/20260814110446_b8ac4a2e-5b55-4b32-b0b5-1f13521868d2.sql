DROP POLICY IF EXISTS "Signed-in users can upload reports" ON public.reports;
DROP POLICY IF EXISTS "Signed-in users can view reports" ON public.reports;

ALTER TABLE public.reports ALTER COLUMN uploaded_by DROP NOT NULL;

GRANT SELECT, INSERT ON public.reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

CREATE POLICY "Anyone can view reports" ON public.reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can upload reports" ON public.reports FOR INSERT TO anon, authenticated WITH CHECK (true);
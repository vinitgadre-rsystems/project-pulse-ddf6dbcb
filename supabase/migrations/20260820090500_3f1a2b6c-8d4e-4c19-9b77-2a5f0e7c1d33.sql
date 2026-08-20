ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS prod_support_weeks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prod_support_people jsonb NOT NULL DEFAULT '[]'::jsonb;

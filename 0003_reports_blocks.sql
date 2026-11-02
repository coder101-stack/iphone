CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post','user','comment')),
  target_id text NOT NULL CHECK (char_length(target_id) <= 200),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own report insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE TABLE public.blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own blocks read" ON public.blocks FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "Own blocks insert" ON public.blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Own blocks delete" ON public.blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_id);
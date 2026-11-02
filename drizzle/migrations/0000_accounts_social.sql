CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9._]{3,24}$'),
  display_name text,
  bio text CHECK (char_length(bio) <= 200),
  arem_score int CHECK (arem_score BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Users cannot change their own score
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, bio) ON public.profiles TO authenticated;

CREATE TABLE public.rock_its (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target text NOT NULL CHECK (char_length(target) <= 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, target)
);
GRANT SELECT, INSERT, DELETE ON public.rock_its TO authenticated;
GRANT ALL ON public.rock_its TO service_role;
ALTER TABLE public.rock_its ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own rocks read" ON public.rock_its FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own rocks insert" ON public.rock_its FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own rocks delete" ON public.rock_its FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id text NOT NULL CHECK (char_length(post_id) <= 120),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_post_idx ON public.comments(post_id, created_at);
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are public" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Own comment insert" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own comment delete" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model text NOT NULL CHECK (char_length(model) <= 120),
  brand text NOT NULL CHECK (char_length(brand) <= 80),
  colorway text NOT NULL DEFAULT '' CHECK (char_length(colorway) <= 120),
  called_score int NOT NULL CHECK (called_score BETWEEN 0 AND 100),
  reason text NOT NULL DEFAULT '' CHECK (char_length(reason) <= 600),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, model)
);
GRANT SELECT ON public.calls TO anon;
GRANT SELECT, INSERT ON public.calls TO authenticated;
GRANT ALL ON public.calls TO service_role;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Calls are public" ON public.calls FOR SELECT USING (true);
CREATE POLICY "Own call insert" ON public.calls FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base text; candidate text; n int := 0;
BEGIN
  base := lower(regexp_replace(coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'member'), '[^a-zA-Z0-9._]', '', 'g'));
  IF char_length(base) < 3 THEN base := base || 'arem'; END IF;
  base := left(base, 20);
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    n := n + 1; candidate := base || n::text;
  END LOOP;
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, candidate, coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'));
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
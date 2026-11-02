CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('PHOTO','VIDEO','ON FEET','FIT','SNEAKER REVIEW','COLLECTION')),
  media_path text NOT NULL CHECK (char_length(media_path) <= 300),
  is_video boolean NOT NULL DEFAULT false,
  sneaker text NOT NULL CHECK (char_length(sneaker) BETWEEN 1 AND 120),
  caption text NOT NULL DEFAULT '' CHECK (char_length(caption) <= 300),
  tags text[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 9),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_user_idx ON public.posts(user_id, created_at DESC);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are public" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Own post insert" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND split_part(media_path, '/', 1) = auth.uid()::text);
CREATE POLICY "Own post delete" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Post media readable" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Upload own post media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Delete own post media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);
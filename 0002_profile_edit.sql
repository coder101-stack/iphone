ALTER TABLE public.profiles ADD COLUMN avatar_path text CHECK (char_length(avatar_path) <= 300);
GRANT UPDATE (username, avatar_path) ON public.profiles TO authenticated;
CREATE POLICY "Upload own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);
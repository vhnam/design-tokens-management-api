ALTER TABLE public.workspace
ADD COLUMN IF NOT EXISTS "userId" text;

ALTER TABLE public.workspace
ADD CONSTRAINT "workspace_userId_user_id_fk"
FOREIGN KEY ("userId")
REFERENCES public."user"("id")
ON DELETE CASCADE;


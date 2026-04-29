CREATE TABLE IF NOT EXISTS public.workspace_user (
  "workspaceId" text NOT NULL REFERENCES public.workspace(id) ON DELETE CASCADE,
  "userId" text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  PRIMARY KEY ("workspaceId", "userId")
);

CREATE INDEX IF NOT EXISTS "workspace_user_userId_idx"
  ON public.workspace_user("userId");


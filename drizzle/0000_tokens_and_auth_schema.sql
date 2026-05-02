CREATE TYPE "public"."token_level" AS ENUM('primitive', 'semantic', 'component');--> statement-breakpoint
CREATE TYPE "public"."token_type" AS ENUM('color', 'dimension', 'typography', 'shadow', 'gradient', 'border', 'transition', 'fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'duration', 'cubicBezier', 'number', 'string');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"userId" text NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_alias_refs" (
	"id" text PRIMARY KEY NOT NULL,
	"from_token_id" text NOT NULL,
	"to_token_id" text NOT NULL,
	"from_composite_property_id" text
);
--> statement-breakpoint
CREATE TABLE "token_composite_properties" (
	"id" text PRIMARY KEY NOT NULL,
	"token_id" text NOT NULL,
	"property" text NOT NULL,
	"raw_value" text NOT NULL,
	"is_alias" boolean DEFAULT false NOT NULL,
	"order" integer
);
--> statement-breakpoint
CREATE TABLE "token_files" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"set_id" text NOT NULL,
	"parent_group_id" text,
	"name" text NOT NULL,
	"level" "token_level" NOT NULL,
	"component_name" text,
	"inherited_type" "token_type" NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"name" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"token_id" text NOT NULL,
	"changed_by_user_id" text NOT NULL,
	"previous_raw_value" text,
	"new_raw_value" text,
	"composite_property_id" text,
	"previous_composite_value" text,
	"new_composite_value" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "token_type",
	"raw_value" text,
	"is_alias" boolean DEFAULT false NOT NULL,
	"is_composite" boolean DEFAULT false NOT NULL,
	"description" text,
	"extensions" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"owner_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_alias_refs" ADD CONSTRAINT "token_alias_refs_from_token_id_tokens_id_fk" FOREIGN KEY ("from_token_id") REFERENCES "public"."tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_alias_refs" ADD CONSTRAINT "token_alias_refs_to_token_id_tokens_id_fk" FOREIGN KEY ("to_token_id") REFERENCES "public"."tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_alias_refs" ADD CONSTRAINT "token_alias_refs_from_composite_property_id_token_composite_properties_id_fk" FOREIGN KEY ("from_composite_property_id") REFERENCES "public"."token_composite_properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_composite_properties" ADD CONSTRAINT "token_composite_properties_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_files" ADD CONSTRAINT "token_files_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_files" ADD CONSTRAINT "token_files_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_groups" ADD CONSTRAINT "token_groups_set_id_token_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."token_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_sets" ADD CONSTRAINT "token_sets_file_id_token_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."token_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_versions" ADD CONSTRAINT "token_versions_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_versions" ADD CONSTRAINT "token_versions_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_versions" ADD CONSTRAINT "token_versions_composite_property_id_token_composite_properties_id_fk" FOREIGN KEY ("composite_property_id") REFERENCES "public"."token_composite_properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_group_id_token_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."token_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_unique" ON "accounts" USING btree ("providerId","accountId");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "accounts" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_identifier_unique" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "alias_refs_from_idx" ON "token_alias_refs" USING btree ("from_token_id");--> statement-breakpoint
CREATE INDEX "alias_refs_to_idx" ON "token_alias_refs" USING btree ("to_token_id");--> statement-breakpoint
CREATE INDEX "composite_props_token_id_idx" ON "token_composite_properties" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX "token_groups_set_id_idx" ON "token_groups" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "token_groups_parent_id_idx" ON "token_groups" USING btree ("parent_group_id");--> statement-breakpoint
CREATE INDEX "token_sets_file_id_idx" ON "token_sets" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "token_versions_token_id_idx" ON "token_versions" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX "token_versions_changed_at_idx" ON "token_versions" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "tokens_group_id_idx" ON "tokens" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tokens_name_group_id_idx" ON "tokens" USING btree ("name","group_id");--> statement-breakpoint
CREATE INDEX "tokens_is_alias_idx" ON "tokens" USING btree ("is_alias");
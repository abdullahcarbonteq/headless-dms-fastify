ALTER TABLE "documents" ADD COLUMN "storage_provider" text DEFAULT 'fs' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "external_key" text;--> statement-breakpoint
CREATE INDEX "documents_user_id_idx" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "documents_description_idx" ON "documents" USING btree ("description");--> statement-breakpoint
CREATE INDEX "documents_storage_provider_idx" ON "documents" USING btree ("storage_provider");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");
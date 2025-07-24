CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"mimetype" text NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

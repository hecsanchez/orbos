CREATE TABLE "safety_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content_id" uuid,
	"passed" boolean NOT NULL,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

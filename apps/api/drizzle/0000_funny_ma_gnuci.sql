CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."attempt_source" AS ENUM('lesson', 'phenomenon');--> statement-breakpoint
CREATE TYPE "public"."evidence_type" AS ENUM('photo', 'audio');--> statement-breakpoint
CREATE TYPE "public"."phenomenon_status" AS ENUM('pending', 'approved', 'completed');--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"standard_id" varchar(50) NOT NULL,
	"interaction_component" varchar(100),
	"correct" boolean NOT NULL,
	"time_spent_seconds" integer,
	"hint_used" boolean DEFAULT false NOT NULL,
	"source" "attempt_source" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"standard_id" varchar(50) NOT NULL,
	"phenomenon_id" uuid,
	"type" "evidence_type" NOT NULL,
	"storage_url" varchar(1000) NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_scripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"standard_id" varchar(50) NOT NULL,
	"student_age_target" integer NOT NULL,
	"script_json" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"safety_approved" boolean DEFAULT false NOT NULL,
	"admin_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mastery_state" (
	"student_id" uuid NOT NULL,
	"standard_id" varchar(50) NOT NULL,
	"mastery_level" real DEFAULT 0 NOT NULL,
	"confidence_score" real DEFAULT 0 NOT NULL,
	"has_direct_lesson_attempt" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mastery_state_student_id_standard_id_pk" PRIMARY KEY("student_id","standard_id")
);
--> statement-breakpoint
CREATE TABLE "phenomenon_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"linked_standards" jsonb DEFAULT '[]'::jsonb,
	"title" varchar(500) NOT NULL,
	"facilitation_guide" text NOT NULL,
	"evidence_prompt" text NOT NULL,
	"materials_needed" jsonb DEFAULT '[]'::jsonb,
	"status" "phenomenon_status" DEFAULT 'pending' NOT NULL,
	"approved_by" varchar(255),
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "standards" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"grade" integer NOT NULL,
	"subject" varchar(50) NOT NULL,
	"topic" varchar(500),
	"description" text NOT NULL,
	"prerequisites" jsonb DEFAULT '[]'::jsonb,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"grade_target" integer NOT NULL,
	"interests" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_standard_id_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."standards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_standard_id_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."standards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_phenomenon_id_phenomenon_proposals_id_fk" FOREIGN KEY ("phenomenon_id") REFERENCES "public"."phenomenon_proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_scripts" ADD CONSTRAINT "lesson_scripts_standard_id_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."standards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_state" ADD CONSTRAINT "mastery_state_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_state" ADD CONSTRAINT "mastery_state_standard_id_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."standards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phenomenon_proposals" ADD CONSTRAINT "phenomenon_proposals_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
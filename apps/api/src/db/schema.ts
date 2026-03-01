import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  boolean,
  real,
  jsonb,
  timestamp,
  pgEnum,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { vector } from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────

export const attemptSourceEnum = pgEnum('attempt_source', [
  'lesson',
  'phenomenon',
]);

export const phenomenonStatusEnum = pgEnum('phenomenon_status', [
  'pending',
  'approved',
  'completed',
]);

export const evidenceTypeEnum = pgEnum('evidence_type', ['photo', 'audio']);

// ── Students ───────────────────────────────────────

export const students = pgTable('students', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  age: integer('age').notNull(),
  gradeTarget: integer('grade_target').notNull(),
  interests: jsonb('interests').default(sql`'[]'::jsonb`),
});

// ── Standards ──────────────────────────────────────

export const standards = pgTable('standards', {
  id: varchar('id', { length: 50 }).primaryKey(),
  grade: integer('grade').notNull(),
  subject: varchar('subject', { length: 50 }).notNull(),
  topic: varchar('topic', { length: 500 }),
  description: text('description').notNull(),
  prerequisites: jsonb('prerequisites').default(sql`'[]'::jsonb`),
  embedding: vector('embedding', { dimensions: 1536 }),
});

// ── Mastery State ──────────────────────────────────

export const masteryState = pgTable(
  'mastery_state',
  {
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id),
    standardId: varchar('standard_id', { length: 50 })
      .notNull()
      .references(() => standards.id),
    masteryLevel: real('mastery_level').notNull().default(0),
    confidenceScore: real('confidence_score').notNull().default(0),
    hasDirectLessonAttempt: boolean('has_direct_lesson_attempt')
      .notNull()
      .default(false),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.studentId, table.standardId] })],
);

// ── Attempts ───────────────────────────────────────

export const attempts = pgTable('attempts', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id),
  standardId: varchar('standard_id', { length: 50 })
    .notNull()
    .references(() => standards.id),
  interactionComponent: varchar('interaction_component', { length: 100 }),
  correct: boolean('correct').notNull(),
  timeSpentSeconds: integer('time_spent_seconds'),
  hintUsed: boolean('hint_used').notNull().default(false),
  source: attemptSourceEnum('source').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Lesson Scripts ─────────────────────────────────

export const lessonScripts = pgTable('lesson_scripts', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  standardId: varchar('standard_id', { length: 50 })
    .notNull()
    .references(() => standards.id),
  studentAgeTarget: integer('student_age_target').notNull(),
  scriptJson: jsonb('script_json').notNull(),
  version: integer('version').notNull().default(1),
  safetyApproved: boolean('safety_approved').notNull().default(false),
  adminApproved: boolean('admin_approved').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Phenomenon Proposals ───────────────────────────

export const phenomenonProposals = pgTable('phenomenon_proposals', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id),
  linkedStandards: jsonb('linked_standards').default(sql`'[]'::jsonb`),
  title: varchar('title', { length: 500 }).notNull(),
  facilitationGuide: text('facilitation_guide').notNull(),
  evidencePrompt: text('evidence_prompt').notNull(),
  materialsNeeded: jsonb('materials_needed').default(sql`'[]'::jsonb`),
  status: phenomenonStatusEnum('status').notNull().default('pending'),
  approvedBy: varchar('approved_by', { length: 255 }),
  approvedAt: timestamp('approved_at'),
});

// ── Prompts ───────────────────────────────────────

export const prompts = pgTable('prompts', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).unique().notNull(),
  template: text('template').notNull(),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Evidence ───────────────────────────────────────

export const evidence = pgTable('evidence', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id),
  standardId: varchar('standard_id', { length: 50 })
    .notNull()
    .references(() => standards.id),
  phenomenonId: uuid('phenomenon_id').references(
    () => phenomenonProposals.id,
  ),
  type: evidenceTypeEnum('type').notNull(),
  storageUrl: varchar('storage_url', { length: 1000 }).notNull(),
  capturedAt: timestamp('captured_at').notNull().defaultNow(),
});

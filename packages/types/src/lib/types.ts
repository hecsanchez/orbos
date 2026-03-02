// ── Students ───────────────────────────────────────

export interface StudentResponseDto {
  id: string;
  name: string;
  age: number;
  grade_target: number;
  interests: string[];
}

export interface CreateStudentDto {
  name: string;
  age: number;
  grade_target: number;
  interests: string[];
}

// ── Standards ──────────────────────────────────────

export interface StandardResponseDto {
  id: string;
  grade: number;
  subject: string;
  topic: string | null;
  description: string;
  prerequisites: string[];
}

export interface SearchStandardsDto {
  query: string;
  grade?: number;
  subject?: string;
  topK?: number;
}

// ── Lessons ────────────────────────────────────────

export interface GenerateLessonDto {
  standard_id: string;
  student_age: number;
}

export interface LessonScriptResponseDto {
  id: string;
  standard_id: string;
  script: unknown[];
  safety_approved: boolean;
  admin_approved: boolean;
}

// ── Attempts ───────────────────────────────────────

export interface LogAttemptDto {
  student_id: string;
  standard_id: string;
  interaction_component: string;
  correct: boolean;
  time_spent_seconds: number;
  hint_used: boolean;
  source: 'lesson' | 'phenomenon';
}

export interface AttemptResponseDto {
  id: string;
  student_id: string;
  standard_id: string;
  interaction_component: string;
  correct: boolean;
  time_spent_seconds: number;
  hint_used: boolean;
  source: 'lesson' | 'phenomenon';
  created_at: string;
}

// ── Mastery ────────────────────────────────────────

export interface MasteryResponseDto {
  student_id: string;
  standard_id: string;
  mastery_level: number;
  confidence_score: number;
  has_direct_lesson_attempt: boolean;
  recommendation: 'advance' | 'practice' | 'reteach';
}

// ── Interactions ──────────────────────────────────

export interface InteractionBlock {
  component: string;
  props: Record<string, unknown>;
  tts_text: string;
}

export interface AttemptResult {
  component: string;
  correct: boolean;
  hint_used: boolean;
  time_spent_seconds: number;
}

// ── Orchestrator ───────────────────────────────────

export interface PlanItemDto {
  standard_id: string;
  standard_description: string;
  subject: string;
  grade: number;
  type: 'lesson' | 'practice' | 'phenomenon_evidence' | 'break';
  estimated_minutes: number;
  lesson_script_id?: string;
  phenomenon_id?: string;
}

export interface OrchestratorPlanDto {
  student_id: string;
  date: string;
  total_minutes: number;
  items: PlanItemDto[];
}

// ── Phenomena ──────────────────────────────────────

export interface ProposePhenomenonDto {
  student_id: string;
}

export interface ApprovePhenomenonDto {
  approved_by: string;
}

export interface PhenomenonResponseDto {
  id: string;
  student_id: string;
  linked_standards: string[];
  title: string;
  facilitation_guide: string;
  evidence_prompt: string;
  materials_needed: string[];
  status: 'pending' | 'approved' | 'completed';
  approved_by: string | null;
  approved_at: string | null;
}

// ── Safety Logs ───────────────────────────────────

export interface SafetyLogResponseDto {
  id: string;
  content_type: string;
  content_id: string | null;
  passed: boolean;
  flags: string[];
  attempt_number: number;
  created_at: string;
}

// ── Evidence ───────────────────────────────────────

export interface UploadEvidenceDto {
  student_id: string;
  standard_id: string;
  phenomenon_id: string;
  type: 'photo' | 'audio';
}

export interface EvidenceResponseDto {
  id: string;
  student_id: string;
  standard_id: string;
  phenomenon_id: string;
  type: 'photo' | 'audio';
  storage_url: string;
  captured_at: string;
}

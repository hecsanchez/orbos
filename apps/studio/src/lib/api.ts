import type {
  StudentResponseDto,
  LessonScriptResponseDto,
  PhenomenonResponseDto,
  SafetyLogResponseDto,
  StandardResponseDto,
} from '@orbos/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export function getStudents(): Promise<StudentResponseDto[]> {
  return request('/students');
}

export function getLessonScripts(filters?: {
  admin_approved?: string;
}): Promise<
  (LessonScriptResponseDto & {
    student_age_target?: number;
    created_at?: string;
  })[]
> {
  const params = new URLSearchParams();
  if (filters?.admin_approved !== undefined) {
    params.set('admin_approved', filters.admin_approved);
  }
  const qs = params.toString();
  return request(`/lessons${qs ? `?${qs}` : ''}`);
}

export function approveLessonScript(
  id: string,
): Promise<LessonScriptResponseDto> {
  return request(`/lessons/${id}/approve`, { method: 'PUT' });
}

export function getPhenomena(): Promise<PhenomenonResponseDto[]> {
  return request('/phenomena/student/all');
}

export function getPhenomenaForStudent(
  studentId: string,
): Promise<PhenomenonResponseDto[]> {
  return request(`/phenomena/student/${studentId}`);
}

export function approvePhenomenon(
  id: string,
  approvedBy: string,
): Promise<PhenomenonResponseDto> {
  return request(`/phenomena/${id}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ approved_by: approvedBy }),
  });
}

export function getSafetyLogs(filters?: {
  passed?: string;
  content_type?: string;
}): Promise<SafetyLogResponseDto[]> {
  const params = new URLSearchParams();
  if (filters?.passed !== undefined) params.set('passed', filters.passed);
  if (filters?.content_type) params.set('content_type', filters.content_type);
  const qs = params.toString();
  return request(`/safety/logs${qs ? `?${qs}` : ''}`);
}

export function getStandards(filters?: {
  grade?: string;
}): Promise<StandardResponseDto[]> {
  const qs = filters?.grade ? `?grade=${filters.grade}` : '';
  return request(`/standards${qs}`);
}

export function batchProposePhenomena(): Promise<{
  total_students: number;
  total_proposals: number;
  results: {
    student_id: string;
    student_name: string;
    proposals: number;
    error?: string;
  }[];
}> {
  return request('/phenomena/batch-propose', { method: 'POST' });
}

export function batchApprovePhenomena(
  approvedBy: string,
): Promise<{ approved_count: number; proposals: PhenomenonResponseDto[] }> {
  return request('/phenomena/batch-approve', {
    method: 'PUT',
    body: JSON.stringify({ approved_by: approvedBy }),
  });
}

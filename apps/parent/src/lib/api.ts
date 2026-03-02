import type {
  StudentResponseDto,
  MasteryResponseDto,
  EvidenceResponseDto,
  PhenomenonResponseDto,
  StandardResponseDto,
} from '@orbos/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export function getStudents(): Promise<StudentResponseDto[]> {
  return request('/students');
}

export function getMasteryForStudent(
  studentId: string,
): Promise<MasteryResponseDto[]> {
  return request(`/mastery/student/${studentId}`);
}

export function getEvidenceForStudent(
  studentId: string,
): Promise<EvidenceResponseDto[]> {
  return request(`/evidence/student/${studentId}`);
}

export function getPhenomenaForStudent(
  studentId: string,
): Promise<PhenomenonResponseDto[]> {
  return request(`/phenomena/student/${studentId}`);
}

export function getStandards(
  grade?: number,
): Promise<StandardResponseDto[]> {
  const qs = grade !== undefined ? `?grade=${grade}` : '';
  return request(`/standards${qs}`);
}

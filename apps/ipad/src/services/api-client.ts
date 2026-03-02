import type {
  StudentResponseDto,
  CreateStudentDto,
  OrchestratorPlanDto,
  LessonScriptResponseDto,
  LogAttemptDto,
  AttemptResponseDto,
  MasteryResponseDto,
  EvidenceResponseDto,
  PhenomenonResponseDto,
} from '@orbos/types';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string>),
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async getStudents(): Promise<StudentResponseDto[]> {
    return this.request('/students');
  }

  async createStudent(dto: CreateStudentDto): Promise<StudentResponseDto> {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getDailyPlan(studentId: string): Promise<OrchestratorPlanDto> {
    return this.request(`/orchestrator/daily-plan/${studentId}`);
  }

  async getLessonScript(
    standardId: string,
    studentAge: number,
  ): Promise<LessonScriptResponseDto> {
    return this.request('/lessons/generate', {
      method: 'POST',
      body: JSON.stringify({
        standard_id: standardId,
        student_age: studentAge,
      }),
    });
  }

  async getLessonScriptById(
    scriptId: string,
  ): Promise<LessonScriptResponseDto> {
    return this.request(`/lessons/${scriptId}`);
  }

  async logAttempt(attempt: LogAttemptDto): Promise<AttemptResponseDto> {
    return this.request('/attempts/log', {
      method: 'POST',
      body: JSON.stringify(attempt),
    });
  }

  async getMastery(
    studentId: string,
    standardId: string,
  ): Promise<MasteryResponseDto> {
    return this.request(`/mastery/${studentId}/${standardId}`);
  }

  async uploadEvidence(formData: FormData): Promise<EvidenceResponseDto> {
    const response = await fetch(`${this.baseUrl}/evidence/upload`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type — let fetch set multipart boundary
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async getPhenomenon(id: string): Promise<PhenomenonResponseDto> {
    return this.request(`/phenomena/${id}`);
  }
}

export const apiClient = new ApiClient(API_URL);

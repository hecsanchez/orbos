import type {
  StudentResponseDto,
  OrchestratorPlanDto,
  LessonScriptResponseDto,
  LogAttemptDto,
  AttemptResponseDto,
  MasteryResponseDto,
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
}

export const apiClient = new ApiClient(API_URL);

import { getDatabase } from '../db/sqlite';
import { apiClient } from './api-client';
import type {
  OrchestratorPlanDto,
  PlanItemDto,
  LessonScriptResponseDto,
} from '@orbos/types';

export type PrefetchProgress = {
  fetched: number;
  total: number;
};

export class CacheService {
  private onProgress?: (progress: PrefetchProgress) => void;

  setProgressCallback(cb: (progress: PrefetchProgress) => void) {
    this.onProgress = cb;
  }

  async fetchAndCacheDailyPlan(studentId: string): Promise<OrchestratorPlanDto> {
    const db = getDatabase();
    const today = new Date().toISOString().slice(0, 10);

    // Check cache first
    const cached = await db.getFirstAsync<{ plan_json: string }>(
      `SELECT plan_json FROM daily_plan WHERE student_id = ? AND date = ? LIMIT 1`,
      [studentId, today],
    );

    if (cached) {
      return JSON.parse(cached.plan_json) as OrchestratorPlanDto;
    }

    // Fetch from API
    const plan = await apiClient.getDailyPlan(studentId);

    // Store in SQLite
    await db.runAsync(
      `INSERT OR REPLACE INTO daily_plan (id, student_id, date, plan_json) VALUES (?, ?, ?, ?)`,
      [`plan-${studentId}-${today}`, studentId, today, JSON.stringify(plan)],
    );

    return plan;
  }

  async prefetchScripts(plan: OrchestratorPlanDto): Promise<void> {
    const db = getDatabase();
    const scriptItems = plan.items.filter(
      (item: PlanItemDto) =>
        (item.type === 'lesson' || item.type === 'practice') &&
        item.lesson_script_id,
    );

    const total = scriptItems.length;
    let fetched = 0;

    this.onProgress?.({ fetched: 0, total });

    const fetchOne = async (item: PlanItemDto) => {
      const scriptId = item.lesson_script_id!;

      // Check if already cached
      const existing = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM lesson_scripts WHERE id = ? LIMIT 1`,
        [scriptId],
      );

      if (existing) {
        fetched++;
        this.onProgress?.({ fetched, total });
        return;
      }

      // Fetch from API with one retry
      let script: LessonScriptResponseDto;
      try {
        script = await apiClient.getLessonScriptById(scriptId);
      } catch {
        // Retry once
        script = await apiClient.getLessonScriptById(scriptId);
      }

      // Cache in SQLite
      await db.runAsync(
        `INSERT OR REPLACE INTO lesson_scripts (id, standard_id, student_age, script_json, safety_approved) VALUES (?, ?, ?, ?, ?)`,
        [
          script.id,
          script.standard_id,
          0, // age not critical for cache lookup
          JSON.stringify(script.script),
          script.safety_approved ? 1 : 0,
        ],
      );

      fetched++;
      this.onProgress?.({ fetched, total });
    };

    // Fetch all in parallel
    await Promise.all(scriptItems.map(fetchOne));
  }

  async getCachedScript(lessonScriptId: string): Promise<LessonScriptResponseDto> {
    const db = getDatabase();
    const row = await db.getFirstAsync<{
      id: string;
      standard_id: string;
      script_json: string;
      safety_approved: number;
    }>(
      `SELECT id, standard_id, script_json, safety_approved FROM lesson_scripts WHERE id = ? LIMIT 1`,
      [lessonScriptId],
    );

    if (!row) {
      throw new Error(`Script "${lessonScriptId}" not found in cache`);
    }

    return {
      id: row.id,
      standard_id: row.standard_id,
      script: JSON.parse(row.script_json),
      safety_approved: row.safety_approved === 1,
      admin_approved: false,
    };
  }

  async isSessionReady(studentId: string): Promise<boolean> {
    const db = getDatabase();
    const today = new Date().toISOString().slice(0, 10);

    const plan = await db.getFirstAsync<{ plan_json: string }>(
      `SELECT plan_json FROM daily_plan WHERE student_id = ? AND date = ? LIMIT 1`,
      [studentId, today],
    );

    if (!plan) return false;

    const parsed = JSON.parse(plan.plan_json) as OrchestratorPlanDto;
    const scriptItems = parsed.items.filter(
      (item: PlanItemDto) =>
        (item.type === 'lesson' || item.type === 'practice') &&
        item.lesson_script_id,
    );

    for (const item of scriptItems) {
      const script = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM lesson_scripts WHERE id = ? LIMIT 1`,
        [item.lesson_script_id!],
      );
      if (!script) return false;
    }

    return true;
  }

  async clearStudentCache(studentId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(`DELETE FROM daily_plan WHERE student_id = ?`, [studentId]);
    await db.runAsync(`DELETE FROM attempt_queue WHERE student_id = ? AND synced = 0`, [studentId]);
  }
}

export const cacheService = new CacheService();

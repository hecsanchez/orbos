import { getDatabase } from '../db/sqlite';
import { cacheService, type PrefetchProgress } from './cache.service';
import { syncService } from './sync.service';
import type {
  StudentResponseDto,
  OrchestratorPlanDto,
  PlanItemDto,
  LessonScriptResponseDto,
  AttemptResult,
} from '@orbos/types';

export type SessionStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'active'
  | 'paused'
  | 'complete';

export interface SessionState {
  status: SessionStatus;
  student: StudentResponseDto | null;
  plan: OrchestratorPlanDto | null;
  currentItemIndex: number;
  currentItem: PlanItemDto | null;
  completedItems: PlanItemDto[];
  attempts: AttemptResult[];
  startedAt: string;
  prefetchProgress: PrefetchProgress | null;
  error: string | null;
}

export const INITIAL_SESSION_STATE: SessionState = {
  status: 'idle',
  student: null,
  plan: null,
  currentItemIndex: 0,
  currentItem: null,
  completedItems: [],
  attempts: [],
  startedAt: '',
  prefetchProgress: null,
  error: null,
};

type StateListener = (state: SessionState) => void;

export class SessionEngine {
  private state: SessionState = { ...INITIAL_SESSION_STATE };
  private listeners: Set<StateListener> = new Set();

  getState(): SessionState {
    return this.state;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(partial: Partial<SessionState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((fn) => fn(this.state));
  }

  async initialize(student: StudentResponseDto): Promise<void> {
    this.setState({
      ...INITIAL_SESSION_STATE,
      status: 'loading',
      student,
      prefetchProgress: { fetched: 0, total: 0 },
    });

    try {
      // Track progress
      cacheService.setProgressCallback((progress) => {
        this.setState({ prefetchProgress: progress });
      });

      // 1. Fetch + cache daily plan
      const plan = await cacheService.fetchAndCacheDailyPlan(student.id);

      // 2. Prefetch all scripts
      await cacheService.prefetchScripts(plan);

      this.setState({
        status: 'ready',
        plan,
        currentItemIndex: 0,
        currentItem: plan.items[0] ?? null,
        prefetchProgress: null,
      });
    } catch (err) {
      this.setState({
        status: 'idle',
        error: err instanceof Error ? err.message : String(err),
        prefetchProgress: null,
      });
      throw err;
    }
  }

  start(): void {
    if (this.state.status !== 'ready' || !this.state.plan) return;
    this.setState({
      status: 'active',
      startedAt: new Date().toISOString(),
    });
  }

  async getCurrentScript(): Promise<LessonScriptResponseDto> {
    const item = this.state.currentItem;
    if (!item || !item.lesson_script_id) {
      throw new Error('Current item has no lesson_script_id');
    }
    return cacheService.getCachedScript(item.lesson_script_id);
  }

  async completeCurrentItem(attempts: AttemptResult[]): Promise<void> {
    const item = this.state.currentItem;
    if (!item || !this.state.student) return;

    // Write attempts to SQLite queue immediately
    const db = getDatabase();
    for (const attempt of attempts) {
      const id = `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await db.runAsync(
        `INSERT INTO attempt_queue (id, student_id, standard_id, interaction_component, correct, time_spent_seconds, hint_used, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          this.state.student.id,
          item.standard_id,
          attempt.component,
          attempt.correct ? 1 : 0,
          attempt.time_spent_seconds,
          attempt.hint_used ? 1 : 0,
          item.type === 'phenomenon_evidence' ? 'phenomenon' : 'lesson',
          new Date().toISOString(),
        ],
      );
    }

    this.setState({
      completedItems: [...this.state.completedItems, item],
      attempts: [...this.state.attempts, ...attempts],
    });
  }

  startBreak(): void {
    // Break is handled by the UI — engine just tracks the item
  }

  advance(): void {
    if (!this.state.plan) return;

    const nextIndex = this.state.currentItemIndex + 1;
    if (nextIndex >= this.state.plan.items.length) {
      this.setState({
        status: 'complete',
        currentItemIndex: nextIndex,
        currentItem: null,
      });
      // Trigger sync on completion
      syncService.syncAll().catch((err) => {
        console.error('Sync failed after session complete:', err);
      });
    } else {
      this.setState({
        currentItemIndex: nextIndex,
        currentItem: this.state.plan.items[nextIndex],
      });
    }
  }

  isComplete(): boolean {
    return this.state.status === 'complete';
  }

  reset(): void {
    this.setState({ ...INITIAL_SESSION_STATE });
  }
}

export const sessionEngine = new SessionEngine();

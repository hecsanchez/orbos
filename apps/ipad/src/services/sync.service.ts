import { getDatabase } from '../db/sqlite';
import { apiClient } from './api-client';

const MAX_RETRIES = 3;

export class SyncService {
  private _syncing = false;

  get isSyncing(): boolean {
    return this._syncing;
  }

  async flushAttemptQueue(): Promise<{ synced: number; failed: number }> {
    const db = getDatabase();
    let synced = 0;
    let failed = 0;

    // Process in chronological order
    const rows = await db.getAllAsync<{
      id: string;
      student_id: string;
      standard_id: string;
      interaction_component: string;
      correct: number;
      time_spent_seconds: number;
      hint_used: number;
      source: string;
    }>(
      `SELECT * FROM attempt_queue WHERE synced = 0 ORDER BY created_at ASC`,
    );

    for (const row of rows) {
      let success = false;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          await apiClient.logAttempt({
            student_id: row.student_id,
            standard_id: row.standard_id,
            interaction_component: row.interaction_component,
            correct: row.correct === 1,
            time_spent_seconds: row.time_spent_seconds,
            hint_used: row.hint_used === 1,
            source: row.source as 'lesson' | 'phenomenon',
          });
          success = true;
          break;
        } catch {
          // Retry
        }
      }

      if (success) {
        await db.runAsync(`UPDATE attempt_queue SET synced = 1 WHERE id = ?`, [row.id]);
        synced++;
      } else {
        // Mark as sync_failed after max retries
        await db.runAsync(`UPDATE attempt_queue SET synced = -1 WHERE id = ?`, [row.id]);
        console.error(`Failed to sync attempt ${row.id} after ${MAX_RETRIES} retries`);
        failed++;
      }
    }

    return { synced, failed };
  }

  async flushEvidenceQueue(): Promise<{ uploaded: number; failed: number }> {
    // Evidence upload to R2 — placeholder for now
    // Will be implemented when evidence capture is built
    const db = getDatabase();
    const count = await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM evidence_queue WHERE synced = 0`,
    );
    return { uploaded: 0, failed: count?.cnt ?? 0 };
  }

  async syncAll(): Promise<void> {
    if (this._syncing) return;
    this._syncing = true;
    try {
      await this.flushAttemptQueue();
      await this.flushEvidenceQueue();
    } finally {
      this._syncing = false;
    }
  }

  async getPendingCount(): Promise<{ attempts: number; evidence: number }> {
    const db = getDatabase();
    const attempts = await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM attempt_queue WHERE synced = 0`,
    );
    const evidence = await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM evidence_queue WHERE synced = 0`,
    );
    return {
      attempts: attempts?.cnt ?? 0,
      evidence: evidence?.cnt ?? 0,
    };
  }
}

export const syncService = new SyncService();

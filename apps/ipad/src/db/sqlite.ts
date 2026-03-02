import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('orbos.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      grade_target INTEGER NOT NULL,
      interests TEXT NOT NULL DEFAULT '[]',
      avatar_id TEXT NOT NULL,
      accent_color TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_used_at TEXT NOT NULL DEFAULT (datetime('now')),
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS daily_plan (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      date TEXT NOT NULL,
      plan_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lesson_scripts (
      id TEXT PRIMARY KEY,
      standard_id TEXT NOT NULL,
      student_age INTEGER NOT NULL,
      script_json TEXT NOT NULL,
      safety_approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attempt_queue (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      standard_id TEXT NOT NULL,
      interaction_component TEXT NOT NULL,
      correct INTEGER NOT NULL,
      time_spent_seconds INTEGER NOT NULL,
      hint_used INTEGER NOT NULL,
      source TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidence_queue (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      standard_id TEXT NOT NULL,
      phenomenon_id TEXT,
      type TEXT NOT NULL,
      file_uri TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log('SQLite database initialized');
  return db;
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

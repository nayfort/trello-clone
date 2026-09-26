import { readdir, readFile } from 'node:fs/promises';
import { getMigrations } from 'better-auth/db/migration';
import { getAuth } from '../server/lib/auth';
import { db } from '../server/lib/db';
const pool = db();
const client = await pool.connect();
try {
  await client.query('SELECT pg_advisory_lock(74819302)');
  const { runMigrations } = await getMigrations(getAuth().options);
  await runMigrations();
  await client.query(
    'CREATE TABLE IF NOT EXISTS app_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const directory = new URL('../migrations/', import.meta.url);
  for (const name of (await readdir(directory))
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    if (
      (await client.query('SELECT 1 FROM app_migrations WHERE name=$1', [name]))
        .rowCount
    )
      continue;
    await client.query('BEGIN');
    try {
      await client.query(await readFile(new URL(name, directory), 'utf8'));
      await client.query('INSERT INTO app_migrations(name) VALUES ($1)', [
        name,
      ]);
      await client.query('COMMIT');
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  await client.query('SELECT pg_advisory_unlock(74819302)');
  client.release();
  await pool.end();
}

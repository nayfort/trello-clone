import { Pool } from 'pg';
import { spawn } from 'node:child_process';
const base = new URL(
  process.env.DATABASE_URL ||
    'postgresql://trello:trello_local@127.0.0.1:54329/trello',
);
const name = base.pathname.slice(1) + '_e2e';
if (name.length > 63 || !/^[a-zA-Z0-9_]+_e2e$/.test(name))
  throw new Error('Invalid test database name');
const pool = new Pool({ connectionString: base.href });
if (
  !(await pool.query('SELECT 1 FROM pg_database WHERE datname=$1', [name]))
    .rowCount
)
  await pool.query(`CREATE DATABASE "${name}"`);
await pool.end();
base.pathname = '/' + name;
const env = {
  ...process.env,
  DATABASE_URL: base.href,
  BETTER_AUTH_URL: 'http://127.0.0.1:3100',
  BETTER_AUTH_SECRET: 'isolated-e2e-secret-do-not-use-in-production-748193',
  SMTP_HOST: process.env.SMTP_HOST || '127.0.0.1',
  SMTP_PORT: process.env.SMTP_PORT || '10259',
  MAIL_FROM: 'Tests <tests@trello.local>',
  PORT: '3100',
  HOST: '127.0.0.1',
};
function run(args: string[]) {
  return spawn(process.execPath, args, { env, stdio: 'inherit' });
}
const migration = run(['node_modules/tsx/dist/cli.mjs', 'scripts/migrate.ts']);
await new Promise<void>((resolve, reject) =>
  migration.on('exit', (code) =>
    code === 0 ? resolve() : reject(new Error('Migration failed')),
  ),
);
const testPool = new Pool({ connectionString: base.href });
await testPool.query('DELETE FROM "rateLimit"');
await testPool.end();
const child = run(['.output/server/index.mjs']);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => child.kill(signal));
child.on('exit', (code) => process.exit(code ?? 1));

import { db } from '../lib/db';
export default defineEventHandler(async () => {
  await db().query('SELECT 1');
  return { status: 'ok' };
});

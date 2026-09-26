import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const template = await readFile(
  new URL('../.env.example', import.meta.url),
  'utf8',
);
try {
  await writeFile(
    new URL('../.env', import.meta.url),
    template.replace(
      'replace-with-a-random-secret-of-at-least-32-characters',
      randomBytes(32).toString('hex'),
    ),
    { flag: 'wx', mode: 0o600 },
  );
  console.log('Created .env with a unique authentication secret.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Existing .env preserved.');
}

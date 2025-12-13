import { join } from 'node:path';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { create } from '@platformatic/db';
import { test } from 'node:test';

let counter = 0;

type testfn = Parameters<typeof test>[0];
type TestContext = Parameters<Exclude<testfn, undefined>>[0];

export async function getServer(t: TestContext) {
  const dbPath = join(tmpdir(), 'db-' + process.pid + '-' + counter++ + '.sqlite');
  const connectionString = 'sqlite://' + dbPath;

  // We go up two folder because this files executes in the dist folder
  const config = JSON.parse(await readFile(join(import.meta.dirname, '..', 'watt.json'), 'utf8'));
  // Add your config customizations here. For example you want to set
  // all things that are set in the config file to read from an env variable
  config.server ||= {};
  config.server.logger ||= {};
  config.server.logger.level = 'warn';
  config.watch = false;

  config.migrations.autoApply = true;
  config.types.autogenerate = false;
  config.db.connectionString = connectionString;

  // Add your config customizations here
  const server = await create(join(import.meta.dirname, '../'), config);
  await server.start({}); // sets .getApplication()
  t.after(() => server.stop());

  t.after(async () => {
    await unlink(dbPath);
  });

  return server.getApplication();
}

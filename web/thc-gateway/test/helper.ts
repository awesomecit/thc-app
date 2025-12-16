import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { create } from '@platformatic/gateway';
import { test } from 'node:test';

type testfn = Parameters<typeof test>[0];
type TestContext = Parameters<Exclude<testfn, undefined>>[0];

export async function getServer(t: TestContext) {
  // Legge la configurazione del gateway
  const config = JSON.parse(await readFile(join(import.meta.dirname, '..', 'watt.json'), 'utf8'));

  // Configurazione per test: logger minimale, no watch, no applications
  config.server ||= {};
  config.server.logger ||= {};
  config.server.logger.level = 'info'; // Enable info to see plugin loading messages
  config.watch = false;

  // Remove gateway applications for unit testing (test only gateway health endpoints)
  if (config.gateway) {
    config.gateway.applications = [];
  }

  // Keep plugins configuration to load all plugins from plugins/ directory
  // Platformatic will automatically load plugins before calling start()

  // Crea il server gateway
  const server = await create(join(import.meta.dirname, '../'), config);
  await server.start({});
  t.after(() => server.stop());

  return server.getApplication();
}

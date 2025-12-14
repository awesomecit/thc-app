/**
 * Test Database Helper - PostgreSQL with Testcontainers
 *
 * Provides a PostgreSQL container for integration tests to avoid SQLite ESM issues.
 * See: docs/BUG_REPORT_PLATFORMATIC_SQLITE_ESM.md
 */

import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer | null = null;

/**
 * Start PostgreSQL container for tests
 * Reuses the same container for all tests in the suite
 */
export async function startTestDatabase(): Promise<string> {
  if (container) {
    return container.getConnectionUri();
  }

  console.warn('🐳 Starting PostgreSQL container for tests...');

  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withExposedPorts(5432)
    .withDatabase('testdb')
    .withUsername('testuser')
    .withPassword('testpass')
    .start();

  const connectionString = container.getConnectionUri();
  console.warn('✅ PostgreSQL container started:', connectionString);

  return connectionString;
}

/**
 * Stop PostgreSQL container after all tests
 */
export async function stopTestDatabase(): Promise<void> {
  if (container) {
    console.warn('🛑 Stopping PostgreSQL container...');
    await container.stop();
    container = null;
    console.warn('✅ PostgreSQL container stopped');
  }
}

/**
 * Get connection string for running container
 */
export function getTestDatabaseUrl(): string {
  if (!container) {
    throw new Error('Test database not started. Call startTestDatabase() first.');
  }
  return container.getConnectionUri();
}

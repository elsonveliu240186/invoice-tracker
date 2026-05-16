/**
 * Global setup for vitest — pre-creates the V8 coverage temp directory to avoid
 * an ENOENT race condition on Windows where workers try to write coverage JSON
 * before the directory is fully available after the provider's clean() deletes and recreates it.
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export function setup() {
  const tmpDir = resolve(process.cwd(), 'coverage', '.tmp');
  try {
    mkdirSync(tmpDir, { recursive: true });
  } catch {
    // Directory may already exist; ignore
  }
}

#!/usr/bin/env node

// Load New Relic agent as early as possible if installed via -r newrelic
// Fallback: allow requiring manually if env is present and module resolves
try {
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('newrelic');
  }
} catch {}

import 'reflect-metadata';
import { CLIApplication } from './CLIApplication.js';

/** Main CLI entry point */
async function main(): Promise<void> {
  try {
    const cli = new CLIApplication();
    await cli.run();
  } catch (error) {
    console.error('❌ CLI Application failed to start:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unhandled error in CLI application:', error);
  process.exit(1);
}); 
#!/usr/bin/env node

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
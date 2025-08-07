#!/usr/bin/env node

import 'reflect-metadata';
import { CLIApplication } from './CLIApplication.js';

/**
 * Main CLI Entry Point
 * 
 * 12 FACTOR APP: Entry Point Separation
 * This is the new main entry point for the DMS application
 * Provides a professional CLI interface using Commander.js
 */
async function main(): Promise<void> {
  try {
    const cli = new CLIApplication();
    await cli.run();
  } catch (error) {
    console.error('❌ CLI Application failed to start:', error);
    process.exit(1);
  }
}

// Run the CLI application
main().catch((error) => {
  console.error('❌ Unhandled error in CLI application:', error);
  process.exit(1);
}); 
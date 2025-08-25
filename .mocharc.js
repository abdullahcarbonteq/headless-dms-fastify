export default {
  // Test file patterns
  spec: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
  
  // Use ts-node for ES module support
  require: [
    'ts-node/register/esm',
    'reflect-metadata',
    'tsconfig-paths/register',
    'tests/setup.ts'
  ],
  
  // Test timeout
  timeout: 10000,
  
  // Reporter - you can easily change this to 'nyan' later! 🐱
  reporter: 'spec',
  
  // Environment variables
  env: {
    NODE_ENV: 'test'
  },
  
  // Load environment variables
  envFile: '.env.test',
  
  // Watch mode options
  watch: false,
  
  // Exit after tests complete
  exit: true,
  
  // Allow uncaught exceptions
  allowUncaught: false,
  
  // Async only
  asyncOnly: false,
  
  // Bail on first failure
  bail: false,
  
  // Check for leaks
  checkLeaks: true,
  
  // Delay root suite execution
  delay: false,
  
  // Growl notifications
  growl: false,
  
  // Inline diffs
  inlineDiffs: true,
  
  // Invert grep matches
  invert: false,
  
  // No colors
  colors: true,
  
  // No timeout
  noTimeouts: false,
  
  // Parallel execution
  parallel: false,
  
  // Retry failed tests
  retries: 0,
  
  // Sort test files
  sort: false,
  
  // Slow test threshold
  slow: 75,
  
  // UI interface
  ui: 'bdd'
}; 
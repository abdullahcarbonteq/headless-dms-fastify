// Simple test to understand @carbonteq/fp library
// This will help us learn how to use it before integrating into our project

import { Result, matchRes } from '@carbonteq/fp';

// Simple example: Divide two numbers
function divide(a, b) {
  if (b === 0) {
    return Result.Err('Division by zero is not allowed');
  }
  return Result.Ok(a / b);
}

// Test the divide function
console.log('=== Testing @carbonteq/fp ===');

// Success case
const successResult = divide(10, 2);
console.log('Success case:', successResult);

// Error case
const errorResult = divide(10, 0);
console.log('Error case:', errorResult);

// Using pattern matching
console.log('\n=== Pattern Matching ===');
matchRes(successResult, {
  Ok: (value) => console.log('Success:', value),
  Err: (error) => console.log('Error:', error)
});

matchRes(errorResult, {
  Ok: (value) => console.log('Success:', value),
  Err: (error) => console.log('Error:', error)
});

// Chaining operations
console.log('\n=== Chaining Operations ===');
const chainedResult = Result.Ok(10)
  .map(x => x * 2)
  .map(x => x + 5);

matchRes(chainedResult, {
  Ok: (value) => console.log('Chained result:', value),
  Err: (error) => console.log('Error:', error)
});

console.log('\n=== Test Complete ==='); 
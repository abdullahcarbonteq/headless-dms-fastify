// Simple test to see what TypeScript emits
import { Result } from '@carbonteq/fp';
export function testFunction() {
    return Result.Ok('Hello World');
}
export default {
    testFunction
};

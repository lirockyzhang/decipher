# Decipher Game Tests

This directory contains unit and integration tests for the Decipher game.

## Test Structure

- `game_engine.test.js` - Unit tests for the core GameEngine class
- `comprehensive_tests.js` - Comprehensive tests for all major components
- `integration_tests/` - Integration tests (to be created)
- `e2e_tests/` - End-to-end tests (to be created)

## Running Tests

Since this is a browser-based application without a Node.js environment set up, the tests are currently structured as browser-compatible JavaScript that would need to be run in a proper testing environment.

### For a complete testing setup, you would need:

1. **Jest** for unit testing:
   ```bash
   npm install --save-dev jest
   ```

2. **jsdom** for DOM manipulation testing:
   ```bash
   npm install --save-dev jsdom
   ```

3. **Test script in package.json**:
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch"
     }
   }
   ```

### Current Test Coverage

- GameEngine.evaluateGuess() - Various match scenarios
- GameEngine.generateRandomCode() - Code generation logic
- GameEngine.makeGuess() - Guess processing and game state
- EntropyMaximizingAgent information gain calculations
- Integration points between components

## Test Philosophy

Tests follow these principles:
- Test the core game logic thoroughly
- Verify edge cases and error conditions
- Ensure the entropy agent algorithms work correctly
- Validate UI interactions and state management
- Check security-related functionality

## Running Tests in Browser

To run tests in a browser environment, you would need to:

1. Create an HTML test runner file
2. Include the source files and test files
3. Execute the tests in the browser console

## Future Improvements

- Add more comprehensive error handling tests
- Implement mock objects for better isolation
- Add performance tests for the entropy agent
- Create visual regression tests for UI components
- Add accessibility testing
/**
 * Simplified Game Initialization - Sets up the game with the new architecture
 */
class CodebreakerGame {
    constructor(numColors = 5, numSlots = 5, maxAttempts = 8) {
        // Create the game controller which manages the game engine and agents
        this.gameController = new GameController(numColors, numSlots, maxAttempts);

        // Set up the human agent by default
        this.gameController.setHumanAgent();

        // Initialize the UI handler with the game controller
        this.uiHandler = new UIHandler(this.gameController, numColors, numSlots);
    }

    // Method to switch to an AI agent
    switchToAgent(agent) {
        this.gameController.setAgent(agent);
    }

    // Method to switch back to human player
    switchToHuman() {
        this.gameController.setHumanAgent();
    }

    // Method to start a new game
    startNewGame() {
        this.gameController.startNewGame();
    }

    // Get the current game state
    getGameState() {
        return this.gameController.getGameState();
    }

    // Check if the game is over
    isGameOver() {
        return this.gameController.isGameOver();
    }

    // Get the secret code
    getSecretCode() {
        return this.gameController.getSecretCode();
    }

    // Get the current agent
    getCurrentAgent() {
        return this.gameController.getCurrentAgent();
    }

    // Method to restart game with new settings
    restartWithSettings(numColors, numSlots, maxAttempts) {
        // Create new game controller with new settings
        this.gameController = new GameController(numColors, numSlots, maxAttempts);
        this.gameController.setHumanAgent();

        // Update UI handler with new settings
        this.uiHandler = new UIHandler(this.gameController, numColors, numSlots);

        return this.uiHandler;
    }
}

// Initialize game when page loads with default values
let codebreakerGame;
let uiHandler;

window.addEventListener('DOMContentLoaded', () => {
    codebreakerGame = new CodebreakerGame(5, 5); // Default: 5 colors, 5 slots
    uiHandler = codebreakerGame.uiHandler; // Reference to the UI handler

    // Make variables available globally for UI handler to access
    window.codebreakerGame = codebreakerGame;
    window.uiHandler = uiHandler;
});
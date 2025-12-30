/**
 * Simplified Game Controller - Orchestrates game flow between agents and game engine
 * Supports both human and AI agents through a unified interface
 */
class GameController {
    constructor(numColors = 5, numSlots = 5, maxAttempts = 8) {
        this.gameEngine = new GameEngine(numColors, numSlots, maxAttempts);
        this.currentAgent = null;
        this.gameHistory = [];
        this.isHumanTurn = false; // Track if it's human's turn
        this.gameActive = false;
    }

    setAgent(agent) {
        this.currentAgent = agent;
        this.isHumanTurn = false;
    }

    setHumanAgent() {
        this.currentAgent = new HumanAgent(this.gameEngine.colors.length, this.gameEngine.numSlots);
        this.isHumanTurn = true;
    }

    startNewGame() {
        this.gameEngine.resetGame();
        if (this.currentAgent) {
            this.currentAgent.reset();
        }
        this.gameHistory = [];
        this.gameActive = true;
    }

    /**
     * Submit a human guess - for human player interaction
     * @param {Array} guess - The human player's guess
     * @returns {Object} Feedback for the guess
     */
    submitHumanGuess(guess) {
        if (!this.isHumanTurn) {
            throw new Error("Cannot submit human guess when it's not human's turn");
        }

        if (this.gameEngine.isGameOver()) {
            return {
                gameOver: true,
                feedback: null,
                solved: false
            };
        }

        // Make the guess in the game engine
        const feedback = this.gameEngine.makeGuess(guess);

        // If there's a current human agent, process the feedback
        if (this.currentAgent instanceof HumanAgent) {
            this.currentAgent.processFeedback(guess, feedback);
        }

        // Record the move
        this.gameHistory.push({
            guess: [...guess],
            feedback: {...feedback},
            agentType: 'human'
        });

        const isSolved = feedback.exact === this.gameEngine.numSlots;

        return {
            guess: guess,
            feedback: feedback,
            gameOver: this.gameEngine.isGameOver(),
            attempts: this.gameEngine.getGameState().attempts,
            solved: isSolved,
            agentType: 'human'
        };
    }

    /**
     * Get the current game state for UI display
     * @returns {Object} Current game state
     */
    getGameState() {
        return this.gameEngine.getGameState();
    }

    /**
     * Check if the game is over
     * @returns {boolean} True if game is over
     */
    isGameOver() {
        return this.gameEngine.isGameOver();
    }

    /**
     * Get the secret code (for revealing at end of game)
     * @returns {Array} Secret code
     */
    getSecretCode() {
        return this.gameEngine.getSecretCode();
    }

    /**
     * Get the current agent
     * @returns {AgentInterface} Current agent
     */
    getCurrentAgent() {
        return this.currentAgent;
    }

    /**
     * Get the game engine
     * @returns {GameEngine} Game engine
     */
    getGameEngine() {
        return this.gameEngine;
    }
}
/**
 * Agent Interface - Common interface for all agents
 */
class AgentInterface {
    constructor(numColors, numSlots) {
        if (this.constructor === AgentInterface) {
            throw new TypeError("Cannot instantiate abstract class AgentInterface directly");
        }

        // Use the specified number of colors and slots
        this.numColors = numColors;
        this.numSlots = numSlots;

        // Create color mappings based on number of colors
        const colorNames = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'brown', 'lime'];
        this.colors = colorNames.slice(0, numColors);

        // Game state tracking
        this.currentGuesses = [];
        this.currentFeedbacks = [];

        // Performance metrics
        this.totalGames = 0;
        this.gamesWon = 0;
        this.totalAttempts = 0;
    }

    // Abstract methods that must be implemented by subclasses
    getNextAction(gameState) {
        throw new Error("getNextAction method must be implemented by subclass");
    }

    processFeedback(guess, feedback) {
        throw new Error("processFeedback method must be implemented by subclass");
    }

    reset() {
        this.currentGuesses = [];
        this.currentFeedbacks = [];
    }

    // Common utility methods
    guessToNumbers(guess) {
        const colorMap = {};
        this.colors.forEach((color, index) => {
            colorMap[color] = index;
        });
        return guess.map(color => colorMap[color]);
    }

    numbersToGuess(numbers) {
        return numbers.map(num => this.colors[num]);
    }

    getStats() {
        const winRate = this.totalGames > 0 ? (this.gamesWon / this.totalGames * 100).toFixed(2) : 0;
        const avgAttempts = this.totalGames > 0 ? (this.totalAttempts / this.totalGames).toFixed(2) : 0;

        return {
            totalGames: this.totalGames,
            gamesWon: this.gamesWon,
            winRate: parseFloat(winRate),
            avgAttempts: parseFloat(avgAttempts)
        };
    }
}
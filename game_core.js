/**
 * Core Game Engine - Pure game logic without UI concerns
 *
 * The GameEngine class manages the core logic of the Decipher game, including:
 * - Generating secret codes
 * - Evaluating player guesses
 * - Tracking game state
 * - Determining win/lose conditions
 *
 * The evaluation algorithm works in two passes:
 * 1. First pass: Identify exact matches (correct color in correct position)
 * 2. Second pass: Identify partial matches (correct color in wrong position)
 *
 * This two-pass approach prevents double-counting of colors when there are duplicates.
 */
class GameEngine {
    /**
     * Creates a new GameEngine instance
     * @param {number} numColors - Number of colors to use in the game (4-10)
     * @param {number} numSlots - Number of slots in the secret code (3-8)
     * @param {number} maxAttempts - Maximum number of guesses allowed (5-15)
     */
    constructor(numColors = 5, numSlots = 5, maxAttempts = 8) {
        // Available colors
        this.allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'brown', 'lime'];
        this.allColorCodes = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'yellow': '#ca8a04',
            'purple': '#a855f7',
            'orange': '#f97316',
            'pink': '#ec4899',
            'cyan': '#06b6d4',
            'brown': '#92400e',
            'lime': '#84cc16'
        };

        // Use the specified number of colors
        this.colors = this.allColors.slice(0, numColors);
        this.colorMap = {};
        for (const color of this.colors) {
            this.colorMap[color] = this.allColorCodes[color];
        }

        this.numSlots = numSlots;
        this.secretCode = [];
        this.maxAttempts = maxAttempts;

        this.resetGame();
    }

    resetGame() {
        this.secretCode = this.generateRandomCode();
        this.guesses = [];
        this.gameOver = false;
    }

    generateRandomCode() {
        const code = [];
        for (let i = 0; i < this.numSlots; i++) {
            const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            code.push(randomColor);
        }
        return code;
    }

    /**
     * Evaluates a player's guess against the secret code
     *
     * Algorithm:
     * 1. First pass: Identify exact matches (correct color in correct position)
     *    - Mark matched positions as null to prevent double counting
     * 2. Second pass: Identify partial matches (correct color in wrong position)
     *    - Only consider non-null positions from the first pass
     *
     * This two-pass algorithm ensures that duplicate colors are handled correctly
     * and prevents overcounting of matches.
     *
     * @param {string[]} guess - Array of color strings representing the player's guess
     * @returns {Object} Object containing exact and partial match counts
     * @returns {number} return.exact - Number of exact matches (correct color + position)
     * @returns {number} return.partial - Number of partial matches (correct color, wrong position)
     * @throws {Error} If guess is invalid (wrong length or invalid colors)
     */
    evaluateGuess(guess) {
        if (!Array.isArray(guess) || guess.length !== this.numSlots) {
            throw new Error(`Guess must be an array of ${this.numSlots} colors`);
        }

        // Validate each color
        for (const color of guess) {
            if (!this.colors.includes(color)) {
                throw new Error(`Invalid color: ${color}. Valid colors are: ${this.colors.join(', ')}`);
            }
        }

        let exact = 0;
        let partial = 0;

        const secretCopy = [...this.secretCode];
        const guessCopy = [...guess];

        // First pass: count exact matches
        for (let i = 0; i < this.numSlots; i++) {
            if (guessCopy[i] === secretCopy[i]) {
                exact++;
                secretCopy[i] = null;
                guessCopy[i] = null;
            }
        }

        // Second pass: count partial matches
        for (let i = 0; i < this.numSlots; i++) {
            if (guessCopy[i] !== null) {
                const index = secretCopy.indexOf(guessCopy[i]);
                if (index !== -1) {
                    partial++;
                    secretCopy[index] = null;
                }
            }
        }

        return { exact, partial };
    }

    makeGuess(guess) {
        if (this.gameOver) {
            throw new Error("Game is already over");
        }

        const feedback = this.evaluateGuess(guess);

        this.guesses.push({
            guess: [...guess],
            feedback: feedback
        });

        // Check win condition
        if (feedback.exact === this.numSlots) {
            this.gameOver = true;
        }
        // Check lose condition
        else if (this.guesses.length >= this.maxAttempts) {
            this.gameOver = true;
        }

        return feedback;
    }

    isGameOver() {
        return this.gameOver;
    }

    getGameState() {
        return {
            guesses: this.guesses.map(g => ({...g})),
            gameOver: this.gameOver,
            attempts: this.guesses.length,
            maxAttempts: this.maxAttempts,
            secretCode: [...this.secretCode] // For testing purposes only
        };
    }

    getSecretCode() {
        return [...this.secretCode];
    }
}
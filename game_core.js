/**
 * Core Game Engine - Pure game logic without UI concerns
 */
class GameEngine {
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
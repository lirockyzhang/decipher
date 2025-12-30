/**
 * Human Agent - Represents human player interaction
 */
class HumanAgent extends AgentInterface {
    constructor(numColors = 5, numSlots = 5) {
        super(numColors, numSlots);
        this.currentGuess = Array(numSlots).fill(null);
        this.selectedColor = null;
    }

    getNextAction(gameState) {
        // For human agent, this would return the current state of the guess being formed
        // In a real implementation, this would wait for user input
        return this.currentGuess;
    }

    processFeedback(guess, feedback) {
        // Human agent doesn't learn from feedback in the same way as AI agents
        // This is just to satisfy the interface
        this.currentGuesses.push(this.guessToNumbers(guess));
        this.currentFeedbacks.push(feedback);
    }

    reset() {
        super.reset();
        this.currentGuess = Array(this.numSlots).fill(null);
        this.selectedColor = null;
    }

    selectColor(colorIndex) {
        this.selectedColor = this.colors[colorIndex];
    }

    placeColorInSlot(slotIndex, color = null) {
        if (color) {
            this.currentGuess[slotIndex] = color;
        } else if (this.selectedColor) {
            this.currentGuess[slotIndex] = this.selectedColor;
        }
    }

    submitGuess() {
        if (this.currentGuess.every(color => color !== null)) {
            return [...this.currentGuess];
        }
        return null; // Not ready to submit
    }
}
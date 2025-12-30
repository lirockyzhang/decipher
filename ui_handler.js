/**
 * Simplified UI Handler - Handles all user interface interactions
 * Works with the GameController to support both human and AI agents
 */
class UIHandler {
    constructor(gameController) {
        this.gameController = gameController;
        this.game = this.gameController.gameEngine; // Reference to the game engine
        this.currentGuess = Array(this.game.numSlots).fill(null);
        this.selectedColor = null;
        this.currentSlotIndex = 0;
        this.gameOver = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateMovesCounter();
        this.renderActiveRow();
    }

    setupEventListeners() {
        // Color palette clicks
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectColor(e.target.dataset.color);
            });
        });

        // Submit button
        document.getElementById('submitGuess').addEventListener('click', () => {
            this.submitGuess();
        });

        // Agent suggestion button (optional - only if it exists)
        const agentSuggestBtn = document.getElementById('agentSuggest');
        if (agentSuggestBtn) {
            agentSuggestBtn.addEventListener('click', () => {
                this.getAgentSuggestion();
            });
        }

        // New game button
        document.getElementById('newGame').addEventListener('click', () => {
            this.resetGame();
        });

        // How to play button
        document.getElementById('howToPlay').addEventListener('click', () => {
            this.showModal();
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.hideModal();
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal');
            if (e.target === modal) {
                this.hideModal();
            }
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }

    handleKeyPress(e) {
        if (this.gameOver) {
            if (e.key.toLowerCase() === 'n') {
                this.resetGame();
            }
            return;
        }

        // Arrow keys for slot navigation
        if (e.key === 'ArrowLeft') {
            this.currentSlotIndex = Math.max(0, this.currentSlotIndex - 1);
            this.updateActiveSlot();
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            this.currentSlotIndex = Math.min(this.game.numSlots - 1, this.currentSlotIndex + 1);
            this.updateActiveSlot();
            e.preventDefault();
        }

        // Backspace to clear current slot
        if (e.key === 'Backspace') {
            this.currentGuess[this.currentSlotIndex] = null;
            this.updateActiveRowDisplay();
            e.preventDefault();
        }

        // Enter to submit guess
        if (e.key === 'Enter') {
            this.submitGuess();
            e.preventDefault();
        }

        // H for help
        if (e.key.toLowerCase() === 'h') {
            this.showModal();
            e.preventDefault();
        }

        // Escape to close modal
        if (e.key === 'Escape') {
            this.hideModal();
            e.preventDefault();
        }

        // Space to place selected color
        if (e.key === ' ' && this.selectedColor) {
            this.placeColor(this.currentSlotIndex);
            e.preventDefault();
        }
    }

    getAgentSuggestion() {
        if (this.gameOver) {
            this.showMessage('Game is over! Start a new game to get suggestions.', 'error');
            return;
        }

        try {
            // Show loading message
            this.showMessage('Calculating suggestion...', 'info');

            // Check if gameController and gameEngine are properly initialized
            if (!this.gameController || !this.gameController.gameEngine) {
                throw new Error('Game controller or game engine not properly initialized');
            }

            // Get the game engine from the controller to access game parameters
            const gameEngine = this.gameController.gameEngine;

            // Make sure the game engine has the required properties
            if (!gameEngine.colors || typeof gameEngine.numSlots === 'undefined') {
                throw new Error('Game engine missing required properties');
            }

            // Create a temporary entropy agent to get the suggestion
            const entropyAgent = new EntropyMaximizingAgent(gameEngine.colors.length, gameEngine.numSlots);

            // Get the current game state
            const gameState = this.gameController.getGameState();

            // Process the existing guesses and feedback to the entropy agent
            if (gameState.guesses) {
                for (const guessRecord of gameState.guesses) {
                    const guess = guessRecord.guess;
                    const feedback = guessRecord.feedback;
                    entropyAgent.processFeedback(guess, feedback);
                }
            }

            // Get the next action from the entropy agent
            const suggestedGuess = entropyAgent.getNextAction(gameState);

            // Fill the current guess with the suggested colors
            this.currentGuess = [...suggestedGuess];
            this.updateActiveRowDisplay();

            // Show a message with the suggestion
            this.showMessage(`Agent suggests: ${suggestedGuess.join(', ')}`, 'info');
        } catch (error) {
            console.error('Agent suggestion error:', error); // Log to console for debugging
            this.showMessage(`Error getting agent suggestion: ${error.message}`, 'error');
        }
    }

    selectColor(color) {
        this.selectedColor = color;

        // Update visual selection
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        document.querySelector(`[data-color="${color}"]`).classList.add('selected');

        // Auto-place in current slot
        this.placeColor(this.currentSlotIndex);
    }

    placeColor(index) {
        if (this.gameOver) return;

        this.currentGuess[index] = this.selectedColor;
        this.updateActiveRowDisplay();

        // Move to next empty slot
        for (let i = index + 1; i < this.game.numSlots; i++) {
            if (this.currentGuess[i] === null) {
                this.currentSlotIndex = i;
                this.updateActiveSlot();
                return;
            }
        }
        // If no empty slot ahead, stay on current
        this.currentSlotIndex = index;
        this.updateActiveSlot();
    }

    updateActiveSlot() {
        const activeRow = document.querySelector('.guess-row.active');
        if (!activeRow) return;

        const pegs = activeRow.querySelectorAll('.guess-peg');
        pegs.forEach((peg, index) => {
            if (index === this.currentSlotIndex) {
                peg.classList.add('active-slot');
            } else {
                peg.classList.remove('active-slot');
            }
        });
    }

    renderActiveRow() {
        const gameBoard = document.getElementById('gameBoard');

        const row = document.createElement('div');
        row.className = 'guess-row active';

        const guessColors = document.createElement('div');
        guessColors.className = 'guess-colors';

        for (let i = 0; i < this.game.numSlots; i++) {
            const peg = document.createElement('div');
            peg.className = 'guess-peg';
            peg.dataset.index = i;

            // Click handler for pegs
            peg.addEventListener('click', () => {
                this.currentSlotIndex = i;
                this.updateActiveSlot();
                if (this.selectedColor) {
                    this.placeColor(i);
                }
            });

            guessColors.appendChild(peg);
        }

        row.appendChild(guessColors);
        gameBoard.insertBefore(row, gameBoard.firstChild);

        this.updateActiveSlot();
    }

    updateActiveRowDisplay() {
        const activeRow = document.querySelector('.guess-row.active');
        if (!activeRow) return;

        const pegs = activeRow.querySelectorAll('.guess-peg');
        pegs.forEach((peg, index) => {
            const color = this.currentGuess[index];
            if (color) {
                peg.style.backgroundColor = this.game.colorMap[color];
                peg.classList.add('filled');
            } else {
                peg.style.backgroundColor = '';
                peg.classList.remove('filled');
            }
        });

        // Enable/disable submit button
        const allFilled = this.currentGuess.every(color => color !== null);
        document.getElementById('submitGuess').disabled = !allFilled;
    }

    submitGuess() {
        if (this.gameOver) return;
        if (this.currentGuess.some(color => color === null)) {
            this.showMessage('Please fill all slots before submitting!', 'error');
            return;
        }

        try {
            // Submit the human guess through the game controller
            const result = this.gameController.submitHumanGuess(this.currentGuess);

            // Add feedback to current row
            const activeRow = document.querySelector('.guess-row.active');
            activeRow.classList.remove('active');

            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'feedback';

            // Add feedback pegs
            for (let i = 0; i < result.feedback.exact; i++) {
                const peg = document.createElement('div');
                peg.className = 'feedback-peg';
                peg.style.backgroundColor = '#6aaa64';
                feedbackDiv.appendChild(peg);
            }
            for (let i = 0; i < result.feedback.partial; i++) {
                const peg = document.createElement('div');
                peg.className = 'feedback-peg';
                peg.style.backgroundColor = '#c9b458';
                feedbackDiv.appendChild(peg);
            }
            const remaining = this.game.numSlots - result.feedback.exact - result.feedback.partial;
            for (let i = 0; i < remaining; i++) {
                const peg = document.createElement('div');
                peg.className = 'feedback-peg';
                peg.style.backgroundColor = '#d3d6da';
                feedbackDiv.appendChild(peg);
            }

            activeRow.appendChild(feedbackDiv);

            // Update moves counter
            this.updateMovesCounter();

            // Check win/lose condition
            if (result.solved) {
                this.gameOver = true;
                this.revealSecretCode();
                this.showMessage(`Congratulations! You cracked the code in ${result.attempts} move(s)!`, 'success');
                document.getElementById('submitGuess').disabled = true;
                return;
            } else if (result.gameOver) {
                this.gameOver = true;
                this.revealSecretCode();
                this.showMessage(`Game Over! You ran out of moves.`, 'error');
                document.getElementById('submitGuess').disabled = true;
                return;
            }

            // Reset for next guess and create new active row
            this.currentGuess = Array(this.game.numSlots).fill(null);
            this.currentSlotIndex = 0;
            this.selectedColor = null;

            // Deselect colors
            document.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.remove('selected');
            });

            // Render new active row above
            this.renderActiveRow();
        } catch (error) {
            this.showMessage(`Error submitting guess: ${error.message}`, 'error');
        }
    }

    updateMovesCounter() {
        const gameState = this.gameController.getGameState();
        document.getElementById('movesCount').textContent = gameState.attempts;
        document.getElementById('maxMoves').textContent = this.game.maxAttempts;
    }

    revealSecretCode() {
        const secretPegs = document.querySelectorAll('.secret-peg');
        const secretCode = this.gameController.getSecretCode();

        for (let i = 0; i < this.game.numSlots; i++) {
            const peg = secretPegs[i];
            if (peg) {
                setTimeout(() => {
                    const color = secretCode[i];
                    peg.style.backgroundColor = this.game.colorMap[color];
                    peg.textContent = '';
                    peg.classList.remove('hidden');
                    peg.classList.add('revealed');
                }, i * 150); // Stagger the reveal animation
            }
        }
    }

    showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;

        if (!this.gameOver) {
            setTimeout(() => {
                messageEl.textContent = '';
                messageEl.className = 'message';
            }, type === 'info' ? 5000 : 3000); // Show info messages for longer (5 seconds)
        }
    }

    showModal() {
        document.getElementById('modal').style.display = 'block';
    }

    hideModal() {
        document.getElementById('modal').style.display = 'none';
    }

    resetGame() {
        this.gameController.startNewGame(); // Reset through the game controller
        this.currentGuess = Array(this.game.numSlots).fill(null);
        this.gameOver = false;
        this.selectedColor = null;
        this.currentSlotIndex = 0;

        document.getElementById('message').textContent = '';
        document.getElementById('message').className = 'message';
        document.getElementById('gameBoard').innerHTML = '';

        // Reset secret code display
        const secretPegs = document.querySelectorAll('.secret-peg');
        for (let i = 0; i < this.game.numSlots; i++) {
            const peg = secretPegs[i];
            if (peg) {
                peg.style.backgroundColor = '';
                peg.textContent = '?';
                peg.classList.remove('revealed');
                peg.classList.add('hidden');
            }
        }

        // Deselect colors
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        this.updateMovesCounter();
        this.renderActiveRow();
    }
}
/**
 * Simplified UI Handler - Handles all user interface interactions
 * Works with the GameController to support both human and AI agents
 */
class UIHandler {
    constructor(gameController, numColors = 5, numSlots = 5) {
        this.gameController = gameController;
        this.game = this.gameController.getGameEngine(); // Reference to the game engine
        this.numColors = numColors;
        this.numSlots = numSlots;
        this.currentGuess = Array(this.numSlots).fill(null);
        this.selectedColor = null;
        this.currentSlotIndex = 0;
        this.gameOver = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateMovesCounter();
        this.initializeDynamicUI();
        this.renderActiveRow();
    }

    initializeDynamicUI() {
        // Initialize the secret code display with the correct number of pegs
        this.updateSecretCodeDisplay();

        // Initialize the color palette with the correct number of colors
        this.updateColorPalette();

        // Set up event listeners for the color options
        this.setupColorEventListeners();
    }

    updateSecretCodeDisplay() {
        const secretCodeElement = document.getElementById('secretCode');
        secretCodeElement.innerHTML = '';

        // Add CSS class based on number of slots for responsive styling
        secretCodeElement.className = `secret-code ${this.getSlotClass()}`;

        for (let i = 0; i < this.numSlots; i++) {
            const peg = document.createElement('div');
            peg.className = 'secret-peg hidden';
            peg.textContent = '?';
            secretCodeElement.appendChild(peg);
        }
    }

    updateColorPalette() {
        const colorPaletteElement = document.getElementById('colorPalette');
        colorPaletteElement.innerHTML = '';

        // Get the available colors from the game engine
        const gameEngine = this.gameController.getGameEngine();
        const colors = gameEngine.colors;

        for (const color of colors) {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.dataset.color = color;
            colorOption.style.backgroundColor = gameEngine.colorMap[color];
            colorPaletteElement.appendChild(colorOption);
        }
    }

    getSlotClass() {
        if (this.numSlots >= 8) return 'slots-8';
        if (this.numSlots >= 7) return 'slots-7';
        if (this.numSlots >= 6) return 'slots-6';
        return ''; // default for 3-5 slots
    }

    setupEventListeners() {
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

        // Close settings modal
        const closeModalBtn = document.getElementById('closeModels');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }


        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }

        // Close settings modal
        const closeSettingsBtn = document.getElementById('closeSettings');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                this.hideSettingsModal();
            });
        }

        // Apply settings button
        const applySettingsBtn = document.getElementById('applySettings');
        if (applySettingsBtn) {
            applySettingsBtn.addEventListener('click', () => {
                this.applySettings();
            });
        }

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            const howToPlayModal = document.getElementById('modal');
            const settingsModal = document.getElementById('settingsModal');

            if (e.target === howToPlayModal) {
                this.hideModal();
            }
            if (e.target === settingsModal) {
                this.hideSettingsModal();
            }
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }

    setupColorEventListeners() {
        // Remove existing listeners to avoid duplicates
        document.querySelectorAll('.color-option').forEach(option => {
            // Remove old event listeners by replacing the element
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
        });

        // Add event listeners to the new elements
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectColor(e.target.dataset.color);
            });
        });
    }

    handleKeyPress(e) {
        // Check if we're in an input field or modal that should handle its own backspace
        const isInputElement = e.target.closest('input, .modal, textarea, select');

        if (this.gameOver) {
            if (e.key.toLowerCase() === 'n') {
                this.resetGame();
            }
            return;
        }

        // Arrow keys for slot navigation (only when not in an input field or modal)
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !isInputElement) {
            if (e.key === 'ArrowLeft') {
                this.currentSlotIndex = Math.max(0, this.currentSlotIndex - 1);
                this.updateActiveSlot();
            } else if (e.key === 'ArrowRight') {
                this.currentSlotIndex = Math.min(this.numSlots - 1, this.currentSlotIndex + 1);
                this.updateActiveSlot();
            }
            e.preventDefault();
        }

        // Backspace to clear current slot (only when not in an input field or modal)
        if (e.key === 'Backspace' && !isInputElement) {
            this.currentGuess[this.currentSlotIndex] = null;
            this.updateActiveRowDisplay();
            this.currentSlotIndex = Math.max(0, this.currentSlotIndex - 1);
            this.updateActiveSlot();
            e.preventDefault();
        }

        // Enter to submit guess (only when not in an input field or modal)
        if (e.key === 'Enter' && !isInputElement) {
            this.submitGuess();
            e.preventDefault();
        }

        // H for help
        if (e.key.toLowerCase() === 'h' && !isInputElement) {
            this.showModal();
            e.preventDefault();
        }

        // Escape to close modal (always allowed)
        if (e.key === 'Escape') {
            // Close any open modal
            this.hideModal();
            this.hideSettingsModal();
            e.preventDefault();
        }

        // Space to place selected color (only when not in an input field or modal)
        if (e.key === ' ' && this.selectedColor && !isInputElement) {
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
        row.className = `guess-row active ${this.getSlotClass()}`;

        const guessColors = document.createElement('div');
        guessColors.className = 'guess-colors';

        for (let i = 0; i < this.numSlots; i++) {
            const peg = document.createElement('div');
            peg.className = 'guess-peg';
            peg.dataset.index = i;

            // Click handler for pegs
            peg.addEventListener('click', () => {
                this.currentSlotIndex = i;
                this.updateActiveSlot();

                // Only handle placement/clearing if a color is selected
                if (this.selectedColor) {
                    // If the peg has the same color as the selected color, empty it
                    if (this.currentGuess[i] === this.selectedColor) {
                        this.currentGuess[i] = null;
                        this.updateActiveRowDisplay();
                    } else {
                        // Otherwise, place the selected color
                        this.placeColor(i);
                    }
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
            const remaining = this.numSlots - result.feedback.exact - result.feedback.partial;
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
            this.currentGuess = Array(this.numSlots).fill(null);
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
        this.currentGuess = Array(this.numSlots).fill(null);
        this.gameOver = false;
        this.selectedColor = null;
        this.currentSlotIndex = 0;

        document.getElementById('message').textContent = '';
        document.getElementById('message').className = 'message';
        document.getElementById('gameBoard').innerHTML = '';

        // Reset secret code display
        const secretPegs = document.querySelectorAll('.secret-peg');
        for (let i = 0; i < this.numSlots; i++) {
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

    // Settings modal methods
    showSettingsModal() {
        // Set current values in the settings form
        document.getElementById('numColors').value = this.game.colors.length;
        document.getElementById('numSlots').value = this.numSlots;
        document.getElementById('maxAttempts').value = this.game.maxAttempts;

        document.getElementById('settingsModal').style.display = 'block';
    }

    hideSettingsModal() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    applySettings() {
        const numColors = parseInt(document.getElementById('numColors').value);
        const numSlots = parseInt(document.getElementById('numSlots').value);
        const maxAttempts = parseInt(document.getElementById('maxAttempts').value);

        // Validate inputs
        if (numColors < 4 || numColors > 10) {
            this.showMessage('Number of colors must be between 4 and 10', 'error');
            return;
        }

        if (numSlots < 3 || numSlots > 8) {
            this.showMessage('Number of slots must be between 3 and 8', 'error');
            return;
        }

        if (maxAttempts < 5 || maxAttempts > 15) {
            this.showMessage('Max attempts must be between 5 and 15', 'error');
            return;
        }

        // Update the game with new settings
        this.restartGameWithNewSettings(numColors, numSlots, maxAttempts);

        // Close the settings modal
        this.hideSettingsModal();
    }

    restartGameWithNewSettings(numColors, numSlots, maxAttempts) {
        // Update the global game instance with new settings
        const newUiHandler = codebreakerGame.restartWithSettings(numColors, numSlots, maxAttempts);

        // Update the global uiHandler reference
        window.uiHandler = newUiHandler;

        // Update the display elements that show the number of slots
        document.getElementById('slotsCountDisplay').textContent = numSlots;
        document.getElementById('keyboardCountDisplay').textContent = numColors;

        // Explicitly reset the game to ensure proper initialization with new settings
        newUiHandler.resetGame();

        this.showMessage(`Game restarted with ${numColors} colors and ${numSlots} slots!`, 'success');
    }
}
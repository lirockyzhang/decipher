class CodebreakerGame {
    constructor() {
        this.colors = ['red', 'blue', 'green', 'yellow'];
        this.colorMap = {
            'red': '#dc2626',
            'blue': '#2563eb',
            'green': '#16a34a',
            'yellow': '#ca8a04'
        };
        this.secretCode = [];
        this.currentGuess = [null, null, null, null];
        this.guesses = [];
        this.maxAttempts = 8;
        this.gameOver = false;
        this.selectedColor = null;
        this.currentSlotIndex = 0;

        this.init();
    }

    init() {
        this.generateSecretCode();
        this.setupEventListeners();
        this.updateMovesCounter();
        this.renderActiveRow();
    }

    generateSecretCode() {
        this.secretCode = [];
        for (let i = 0; i < 4; i++) {
            const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.secretCode.push(randomColor);
        }
        console.log('Secret code:', this.secretCode);
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

        // Number keys 1-4 for color selection
        if (e.key >= '1' && e.key <= '4') {
            const colorIndex = parseInt(e.key) - 1;
            if (this.colors[colorIndex]) {
                this.selectColor(this.colors[colorIndex]);
            }
            e.preventDefault();
        }

        // Arrow keys for slot navigation
        if (e.key === 'ArrowLeft') {
            this.currentSlotIndex = Math.max(0, this.currentSlotIndex - 1);
            this.updateActiveSlot();
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            this.currentSlotIndex = Math.min(3, this.currentSlotIndex + 1);
            this.updateActiveSlot();
            e.preventDefault();
        }

        // Backspace to clear current slot and move to previous
        if (e.key === 'Backspace') {
            this.currentGuess[this.currentSlotIndex] = null;
            this.updateActiveRowDisplay();

            // Move to previous slot if not at the beginning
            if (this.currentSlotIndex > 0) {
                this.currentSlotIndex--;
                this.updateActiveSlot();
            }

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
        for (let i = index + 1; i < 4; i++) {
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

        for (let i = 0; i < 4; i++) {
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
                peg.style.backgroundColor = this.colorMap[color];
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

        const feedback = this.evaluateGuess(this.currentGuess);
        this.guesses.push({
            guess: [...this.currentGuess],
            feedback: feedback
        });

        // Add feedback to current row
        const activeRow = document.querySelector('.guess-row.active');
        activeRow.classList.remove('active');

        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback';

        // Add feedback pegs
        for (let i = 0; i < feedback.exact; i++) {
            const peg = document.createElement('div');
            peg.className = 'feedback-peg';
            peg.style.backgroundColor = '#6aaa64';
            feedbackDiv.appendChild(peg);
        }
        for (let i = 0; i < feedback.partial; i++) {
            const peg = document.createElement('div');
            peg.className = 'feedback-peg';
            peg.style.backgroundColor = '#c9b458';
            feedbackDiv.appendChild(peg);
        }
        const remaining = 4 - feedback.exact - feedback.partial;
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
        if (feedback.exact === 4) {
            this.gameOver = true;
            this.revealSecretCode();
            this.showMessage(`Congratulations! You cracked the code in ${this.guesses.length} move(s)!`, 'success');
            document.getElementById('submitGuess').disabled = true;
            return;
        } else if (this.guesses.length >= this.maxAttempts) {
            this.gameOver = true;
            this.revealSecretCode();
            this.showMessage(`Game Over! You ran out of moves.`, 'error');
            document.getElementById('submitGuess').disabled = true;
            return;
        }

        // Reset for next guess and create new active row
        this.currentGuess = [null, null, null, null];
        this.currentSlotIndex = 0;
        this.selectedColor = null;

        // Deselect colors
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Render new active row above
        this.renderActiveRow();
    }

    evaluateGuess(guess) {
        let exact = 0;
        let partial = 0;

        const secretCopy = [...this.secretCode];
        const guessCopy = [...guess];

        // First pass: count exact matches
        for (let i = 0; i < 4; i++) {
            if (guessCopy[i] === secretCopy[i]) {
                exact++;
                secretCopy[i] = null;
                guessCopy[i] = null;
            }
        }

        // Second pass: count partial matches
        for (let i = 0; i < 4; i++) {
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

    updateMovesCounter() {
        document.getElementById('movesCount').textContent = this.guesses.length;
        document.getElementById('maxMoves').textContent = this.maxAttempts;
    }

    revealSecretCode() {
        const secretPegs = document.querySelectorAll('.secret-peg');
        secretPegs.forEach((peg, index) => {
            setTimeout(() => {
                const color = this.secretCode[index];
                peg.style.backgroundColor = this.colorMap[color];
                peg.textContent = '';
                peg.classList.remove('hidden');
                peg.classList.add('revealed');
            }, index * 150); // Stagger the reveal animation
        });
    }

    showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;

        if (!this.gameOver) {
            setTimeout(() => {
                messageEl.textContent = '';
                messageEl.className = 'message';
            }, 3000);
        }
    }

    showModal() {
        document.getElementById('modal').style.display = 'block';
    }

    hideModal() {
        document.getElementById('modal').style.display = 'none';
    }

    resetGame() {
        this.secretCode = [];
        this.currentGuess = [null, null, null, null];
        this.guesses = [];
        this.gameOver = false;
        this.selectedColor = null;
        this.currentSlotIndex = 0;

        document.getElementById('message').textContent = '';
        document.getElementById('message').className = 'message';
        document.getElementById('gameBoard').innerHTML = '';

        // Reset secret code display
        const secretPegs = document.querySelectorAll('.secret-peg');
        secretPegs.forEach(peg => {
            peg.style.backgroundColor = '';
            peg.textContent = '?';
            peg.classList.remove('revealed');
            peg.classList.add('hidden');
        });

        // Deselect colors
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        this.generateSecretCode();
        this.updateMovesCounter();
        this.renderActiveRow();
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new CodebreakerGame();
});

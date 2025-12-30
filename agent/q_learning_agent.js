/**
 * Q-Learning Agent - Implements Q-learning algorithm for the Mastermind game
 */
class QLearningAgent extends AgentInterface {
    constructor(numColors = 5, numSlots = 5, learningRate = 0.1, discountFactor = 0.95, explorationRate = 0.1) {
        super(numColors, numSlots);
        
        this.learningRate = learningRate;          // Alpha: how much to update Q-values
        this.discountFactor = discountFactor;      // Gamma: how much future rewards matter
        this.explorationRate = explorationRate;    // Epsilon: probability of random action
        this.qTable = new Map();                  // State-action value table
    }

    // Convert game state to a string key for the Q-table
    stateToString(gameState) {
        if (!gameState || !gameState.guesses) {
            return "initial";
        }
        
        const stateParts = [];
        for (const guessRecord of gameState.guesses) {
            const guessStr = guessRecord.guess.join('');
            const feedbackStr = `${guessRecord.feedback.exact}${guessRecord.feedback.partial}`;
            stateParts.push(`${guessStr}-${feedbackStr}`);
        }
        
        return stateParts.join('|') || "initial";
    }

    // Convert an action (guess) to a string key
    actionToString(action) {
        return action.join('');
    }

    // Get all possible actions from the current state
    getPossibleActions(gameState) {
        // For efficiency, we'll generate a sample of possible actions
        // rather than all possible combinations
        const possibleActions = [];
        const maxActions = 1000; // Limit for performance
        
        // Generate random possible actions
        for (let i = 0; i < Math.min(maxActions, Math.pow(this.numColors, this.numSlots)); i++) {
            const action = [];
            for (let j = 0; j < this.numSlots; j++) {
                action.push(Math.floor(Math.random() * this.numColors));
            }
            possibleActions.push(action);
        }
        
        return possibleActions;
    }

    // Get Q-value for a state-action pair
    getQValue(stateStr, actionStr) {
        if (!this.qTable.has(stateStr)) {
            this.qTable.set(stateStr, new Map());
        }
        
        const actionMap = this.qTable.get(stateStr);
        if (!actionMap.has(actionStr)) {
            // Initialize Q-value based on potential feedback quality
            // Better feedback (more exact or partial matches) gets higher initial value
            actionMap.set(actionStr, 0.1); // Small positive initial value
        }
        
        return actionMap.get(actionStr);
    }

    // Set Q-value for a state-action pair
    setQValue(stateStr, actionStr, value) {
        if (!this.qTable.has(stateStr)) {
            this.qTable.set(stateStr, new Map());
        }
        
        this.qTable.get(stateStr).set(actionStr, value);
    }

    // Choose action using epsilon-greedy policy
    chooseAction(gameState) {
        const stateStr = this.stateToString(gameState);
        const possibleActions = this.getPossibleActions(gameState);
        
        // Exploration: random action with probability epsilon
        if (Math.random() < this.explorationRate) {
            const randomIndex = Math.floor(Math.random() * possibleActions.length);
            return possibleActions[randomIndex];
        }
        
        // Exploitation: choose action with highest Q-value
        let bestAction = possibleActions[0];
        let bestQValue = this.getQValue(stateStr, this.actionToString(bestAction));
        
        for (let i = 1; i < possibleActions.length; i++) {
            const action = possibleActions[i];
            const actionStr = this.actionToString(action);
            const qValue = this.getQValue(stateStr, actionStr);
            
            if (qValue > bestQValue) {
                bestQValue = qValue;
                bestAction = action;
            }
        }
        
        return bestAction;
    }

    // Update Q-value based on reward
    updateQValue(stateStr, actionStr, reward, nextStateStr) {
        const currentQ = this.getQValue(stateStr, actionStr);
        
        // Get the maximum Q-value for the next state
        let maxNextQ = 0;
        if (this.qTable.has(nextStateStr)) {
            const nextActionMap = this.qTable.get(nextStateStr);
            for (const nextQ of nextActionMap.values()) {
                if (nextQ > maxNextQ) {
                    maxNextQ = nextQ;
                }
            }
        }
        
        // Q-learning update rule: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
        const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
        this.setQValue(stateStr, actionStr, newQ);
    }

    // Calculate reward based on feedback
    calculateReward(feedback, gameState) {
        // Reward based on how close we are to solving the puzzle
        // Exact matches are most valuable, partial matches are less valuable
        const maxSlots = this.numSlots;
        const exactReward = feedback.exact * 2;  // Each exact match gets higher reward
        const partialReward = feedback.partial * 1; // Each partial match gets lower reward
        
        // Bonus for making progress toward solution
        const progressBonus = gameState.guesses.length > 0 ? 0.5 : 0;
        
        // Penalty for not making progress
        const noProgressPenalty = feedback.exact === 0 && feedback.partial === 0 ? -0.5 : 0;
        
        return exactReward + partialReward + progressBonus + noProgressPenalty;
    }

    // Implement the abstract method from AgentInterface
    getNextAction(gameState) {
        const action = this.chooseAction(gameState);
        return this.numbersToGuess(action);
    }

    // Implement the abstract method from AgentInterface
    processFeedback(guess, feedback) {
        // Convert guess to numbers for internal processing
        const guessNumbers = this.guessToNumbers(guess);
        
        // Add to current game history
        this.currentGuesses.push(guessNumbers);
        this.currentFeedbacks.push(feedback);
        
        // Update Q-values based on the feedback received
        this.updateQValues(guessNumbers, feedback);
    }

    // Update Q-values based on the latest action and feedback
    updateQValues(guess, feedback) {
        if (this.currentGuesses.length < 2) {
            // Need at least two states to update (current and previous)
            return;
        }
        
        // Get the previous state (before the current guess)
        const prevGameState = {
            guesses: this.currentGuesses.slice(0, -1).map((g, i) => ({
                guess: this.numbersToGuess(g),
                feedback: this.currentFeedbacks[i]
            }))
        };
        
        // Get the current state (after the current guess)
        const currentGameState = {
            guesses: [...prevGameState.guesses, {
                guess: this.numbersToGuess(guess),
                feedback: feedback
            }]
        };
        
        const prevStateStr = this.stateToString(prevGameState);
        const currentStateStr = this.stateToString(currentGameState);
        const actionStr = this.actionToString(guess);
        
        // Calculate reward for this action
        const reward = this.calculateReward(feedback, currentGameState);
        
        // Update Q-value
        this.updateQValue(prevStateStr, actionStr, reward, currentStateStr);
    }

    // Reset the agent for a new game
    reset() {
        super.reset();
        // Optionally reset Q-table for new game, or keep learning across games
        // this.qTable = new Map(); // Uncomment to reset Q-table for each game
    }

    // Train the agent on multiple games
    async train(episodes) {
        if (typeof logToAgentConsole !== 'undefined') {
            logToAgentConsole(`Starting Q-Learning agent training for ${episodes} episodes...`);
        } else {
            console.log(`Starting Q-Learning agent training for ${episodes} episodes...`);
        }

        for (let episode = 0; episode < episodes; episode++) {
            // Create a new game engine for this episode
            const gameEngine = new GameEngine(this.numColors, this.numSlots);

            // Reset agent for this game
            this.reset();

            let attempts = 0;
            let solved = false;

            while (attempts < this.maxAttempts && !solved) {
                // Get game state
                const gameState = gameEngine.getGameState();

                // Get next action from agent
                const guess = this.getNextAction(gameState);

                // Make the guess in the game engine
                const feedback = gameEngine.makeGuess(guess);

                // Process feedback with agent (updates Q-values)
                this.processFeedback(guess, feedback);

                if (feedback.exact === this.numSlots) {
                    solved = true;
                    this.gamesWon++;
                }

                attempts++;
            }

            this.totalGames++;
            this.totalAttempts += attempts;

            // Log progress every 100 episodes
            if (episode % 100 === 0) {
                const winRate = this.totalGames > 0 ? (this.gamesWon / this.totalGames * 100).toFixed(2) : 0;
                if (typeof logToAgentConsole !== 'undefined') {
                    logToAgentConsole(`Episode ${episode}: Solved = ${solved}, Attempts = ${attempts}, Win Rate = ${winRate}%`);
                } else {
                    console.log(`Episode ${episode}: Solved = ${solved}, Attempts = ${attempts}, Win Rate = ${winRate}%`);
                }
            }
        }

        if (typeof logToAgentConsole !== 'undefined') {
            logToAgentConsole('Q-Learning agent training completed!');
            const finalWinRate = this.totalGames > 0 ? (this.gamesWon / this.totalGames * 100).toFixed(2) : 0;
            logToAgentConsole(`Final stats: ${this.gamesWon}/${this.totalGames} games won (${finalWinRate}%)`);
        } else {
            console.log('Q-Learning agent training completed!');
            const finalWinRate = this.totalGames > 0 ? (this.gamesWon / this.totalGames * 100).toFixed(2) : 0;
            console.log(`Final stats: ${this.gamesWon}/${this.totalGames} games won (${finalWinRate}%)`);
        }
    }
}
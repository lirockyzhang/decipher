/**
 * Import the base AgentInterface class
 * Note: In a browser environment, you might need to ensure AgentInterface is loaded before this file
 */

class EntropyMaximizingAgent extends AgentInterface {
    constructor(numColors, numSlots) {
        super(numColors, numSlots); // Call the parent constructor to initialize common properties
    }

    chooseAction(state) {
        // Get potential solutions (consistent with all previous feedback)
        const potentialSolutions = this.getPotentialSolutions();

        // Get potential actions (broader set that may include non-consistent actions)
        // const actionsToEvaluate = this.getPotentialActions();
        const actionsToEvaluate = potentialSolutions;

        if (potentialSolutions.length === 0) {
            // Fallback if no potential solutions available
            // Just return a random action
            console.warn("No potential solutions available, selecting random action as fallback.");
            const randomAction = [];
            for (let i = 0; i < this.numSlots; i++) {
                randomAction.push(Math.floor(Math.random() * this.numColors));
            }
            return randomAction;
        } else {
            // Choose action with highest information gain based on potential solutions
            let bestAction = actionsToEvaluate[0];
            let bestGain = this.calculateInformationGainForAction(bestAction, potentialSolutions);

            for (let i = 1; i < actionsToEvaluate.length; i++) {
                const action = actionsToEvaluate[i];
                const gain = this.calculateInformationGainForAction(action, potentialSolutions);
                if (gain > bestGain) {
                    bestGain = gain;
                    bestAction = action;
                }
            }
            console.log(`Chosen action with estimated information gain: ${bestGain.toFixed(3)}`);
            return bestAction;
        }
    }

    // Implement the abstract method from AgentInterface
    processFeedback(guess, feedback) {
        const guessNumbers = this.guessToNumbers(guess);

        // Add to current game history
        this.currentGuesses.push(guessNumbers);
        this.currentFeedbacks.push(feedback);
    }

    // Implement the abstract method from AgentInterface
    getNextAction(gameState) {
        // Create state representation from game state
        const state = this.createState(gameState);

        // Choose action based on current state
        const action = this.chooseAction(state);

        // Convert action numbers back to colors
        return this.numbersToGuess(action);
    }

    // Helper methods for state representation
    createState(gameState) {
        // State is represented by the sequence of guesses and their feedback
        const stateParts = [];
        if (gameState && gameState.guesses) {
            for (let i = 0; i < gameState.guesses.length; i++) {
                const guess = this.guessToNumbers(gameState.guesses[i].guess);
                const feedback = gameState.guesses[i].feedback;
                stateParts.push(`${guess.join('')}-${feedback.exact}-${feedback.partial}`);
            }
        }
        return stateParts.join('|');
    }

    getAllPossibleActions() {
        // // For performance reasons, we'll limit the generation of all possible actions
        // // Only generate if the total number of combinations is reasonable (< 10000)
        // const maxCombinations = Math.pow(this.numColors, this.numSlots);
        
        // if (maxCombinations > 10000) {
        //     // If too many combinations, return a sample of possible actions
        //     // Generate a sample of random possible actions
        //     return this.getRandomPossibleActions(1000); // Generate 1000 random actions as sample
        // }
        
        const actions = [];
        const numColors = this.numColors;
        const numSlots = this.numSlots;

        // Create all possible combinations recursively
        function generateCombinations(currentCombination, remainingSlots) {
            if (remainingSlots === 0) {
                actions.push([...currentCombination]);
                return;
            }

            for (let color = 0; color < numColors; color++) {
                currentCombination.push(color);
                generateCombinations(currentCombination, remainingSlots - 1);
                currentCombination.pop();
            }
        }

        generateCombinations([], numSlots);
        return actions;
    }
    
    getRandomPossibleActions(count) {
        count = Math.min(count, Math.pow(this.numColors, this.numSlots));
        console.log(`Generating ${count} random possible actions...`);
        const actions = [];
        const seenActions = new Set(); // To track unique actions

        while (actions.length < count) {
            const action = [];
            for (let j = 0; j < this.numSlots; j++) {
                action.push(Math.floor(Math.random() * this.numColors));
            }

            // Convert action to string to use as a key in the Set
            const actionKey = action.join(',');

            // Only add the action if we haven't seen it before
            if (!seenActions.has(actionKey)) {
                seenActions.add(actionKey);
                actions.push(action);
            }
        }
        return actions;
    }

    // Get potential solutions (codes consistent with all previous feedback)
    getPotentialSolutions() {
        // For efficiency, start with a sample of possible actions and filter them
        let possibleSolutions = this.getRandomPossibleActions(5000);

        // Filter based on ALL previous guesses and feedback
        for (let i = 0; i < this.currentGuesses.length; i++) {
            const prevGuess = this.currentGuesses[i];
            const prevFeedback = this.currentFeedbacks[i];

            // Filter solutions that would produce the SAME feedback as the previous guess when guessed against
            possibleSolutions = possibleSolutions.filter(solution => {
                const feedback = this.evaluateGuessFeedback(prevGuess, solution);
                return feedback.exact === prevFeedback.exact && feedback.partial === prevFeedback.partial;
            });
        }
        console.log(`Filtered potential solutions count: ${possibleSolutions.length}`);
        return possibleSolutions;
    }

    // Get potential actions (broader set that may include non-consistent actions)
    getPotentialActions() {
        // For performance, return a sample of random possible actions
        // This includes both consistent and non-consistent actions
        return this.getRandomPossibleActions(5000);
    }

    // Calculate information gain for a specific action based on potential solutions
    calculateInformationGainForAction(action, potentialSolutions) {
        // Group potential solutions by the feedback they would produce with this action
        const feedbackGroups = new Map();

        for (const solution of potentialSolutions) {
            const feedback = this.evaluateGuessFeedback(action, solution);
            const feedbackKey = `${feedback.exact}-${feedback.partial}`;

            if (!feedbackGroups.has(feedbackKey)) {
                feedbackGroups.set(feedbackKey, 0);
            }
            feedbackGroups.set(feedbackKey, feedbackGroups.get(feedbackKey) + 1);
        }

        // Calculate expected entropy after this action
        let expectedEntropyAfter = 0;
        const totalSolutions = potentialSolutions.length;

        for (const [feedbackKey, count] of feedbackGroups) {
            if (count > 0) {
                const probability = count / totalSolutions;
                const entropyOfGroup = Math.log2(count);
                expectedEntropyAfter += probability * entropyOfGroup;
            }
        }

        // Information gain = entropy before - expected entropy after
        const entropyBefore = Math.log2(potentialSolutions.length);
        return entropyBefore - expectedEntropyAfter;
    }

    // Evaluate how two guesses would compare in terms of feedback (without knowing the secret)
    // This method compares two guesses as if one was the secret and the other was the guess
    // Used for filtering possible solutions based on previous feedback
    evaluateGuessFeedback(guess1, guess2) {
        let exact = 0;
        let partial = 0;

        const guess2Copy = [...guess2];
        const guess1Copy = [...guess1];

        // First pass: count exact matches
        for (let i = 0; i < this.numSlots; i++) {
            if (guess1Copy[i] === guess2Copy[i]) {
                exact++;
                guess2Copy[i] = -1; // Mark as used
                guess1Copy[i] = -2;  // Mark as used
            }
        }

        // Second pass: count partial matches
        for (let i = 0; i < this.numSlots; i++) {
            if (guess1Copy[i] !== -2) { // If not already used in exact match
                const index = guess2Copy.indexOf(guess1Copy[i]);
                if (index !== -1) {
                    partial++;
                    guess2Copy[index] = -1; // Mark as used
                }
            }
        }

        return { exact, partial };
    }



    // Helper function to sample a random subset of an array
    sampleArray(array, sampleSize) {
        if (array.length <= sampleSize) return array;
        
        const result = [];
        const indices = new Set();
        
        while (result.length < sampleSize) {
            const randomIndex = Math.floor(Math.random() * array.length);
            if (!indices.has(randomIndex)) {
                indices.add(randomIndex);
                result.push(array[randomIndex]);
            }
        }
        
        return result;
    }

    // Train the agent on multiple games
    async train(episodes) {
        if (typeof logToAgentConsole !== 'undefined') {
            logToAgentConsole(`Starting Entropy agent training for ${episodes} episodes...`);
        } else {
            console.log(`Starting Entropy agent training for ${episodes} episodes...`);
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

                // Process feedback with agent
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
            logToAgentConsole('Entropy agent training completed!');
            const finalWinRate = this.totalGames > 0 ? (this.gamesWon / this.totalGames * 100).toFixed(2) : 0;
            logToAgentConsole(`Final stats: ${this.gamesWon}/${this.totalGames} games won (${finalWinRate}%)`);
        } else {
            console.log('Entropy agent training completed!');
            const finalWinRate = this.totalGames > 0 ? (this.gamesWon / this.totalGames * 100).toFixed(2) : 0;
            console.log(`Final stats: ${this.gamesWon}/${this.totalGames} games won (${finalWinRate}%)`);
        }
    }
}
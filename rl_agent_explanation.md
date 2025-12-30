# Reinforcement Learning Agent for Codebreaker Game

## Implementation Overview

The RL agent is implemented using Q-learning, a model-free reinforcement learning algorithm. Here's how it works:

### Core Components

1. **State Representation**:
   - The state is represented by the game history: all previous guesses and their feedback
   - Each state is encoded as a string combining guesses and feedback: `guess1-feedback1|guess2-feedback2|...`
   - This allows the agent to learn from the sequence of interactions

2. **Action Space**:
   - All possible 4-color combinations (256 total: 4^4)
   - Each action is a 4-element array of color indices [0,1,2,3]

3. **Q-Table**:
   - Maps state-action pairs to Q-values using a JavaScript Map
   - Q(s,a) represents the expected future reward for taking action a in state s

4. **Reward System**:
   - Positive rewards for exact matches (correct color in correct position)
   - Smaller rewards for partial matches (correct color in wrong position)
   - Penalty for each attempt (earlier solutions are better)
   - Large bonus for solving the puzzle
   - Small penalty for guesses that provide no useful information

5. **Learning Algorithm**:
   - Uses the Q-learning formula: `Q(s,a) = Q(s,a) + α[r + γ * max(Q(s',a')) - Q(s,a)]`
   - α (learning rate) = 0.1
   - γ (discount factor) = 0.9
   - ε (exploration rate) = 0.1 for ε-greedy strategy

## How the Agent Learns

1. **Initialization**: Q-table starts empty with default values of 0
2. **Exploration vs Exploitation**: Uses ε-greedy strategy (10% random, 90% best known action)
3. **Learning Loop**:
   - Observe current state
   - Select action (explore or exploit)
   - Execute action and observe reward
   - Update Q-value using Q-learning formula
4. **Policy Improvement**: Over time, the agent learns which actions lead to higher rewards in each state

## Potential Improvements

### 1. State Space Optimization
- **Current Issue**: The state space grows exponentially with game history
- **Improvement**: Use feature-based state representation instead of raw history
  - Encode only relevant features like number of unique colors used
  - Track consistency with previous feedback
  - Use abstract features rather than exact sequences

### 2. Action Space Reduction
- **Current Issue**: Agent considers all 256 possible actions
- **Improvement**: Implement action filtering
  - Eliminate actions inconsistent with previous feedback
  - Use constraint satisfaction to reduce valid actions
  - Focus exploration on promising action subsets

### 3. Advanced Exploration Strategies
- **Current**: Simple ε-greedy exploration
- **Improvements**:
  - Upper Confidence Bound (UCB) for better exploration-exploitation balance
  - Boltzmann exploration (softmax action selection)
  - Intrinsic motivation for exploration of novel states

### 4. Deep Q-Network (DQN)
- **Current**: Tabular Q-learning with explicit state storage
- **Improvement**: Use neural networks to approximate Q-values
  - Better generalization across similar states
  - Handle larger state spaces more efficiently
  - Transfer learning between games

### 5. Model-Based Approach
- **Current**: Model-free learning (no environment model)
- **Improvement**: Learn environment dynamics
  - Predict feedback for potential actions
  - Plan ahead using learned model
  - Reduce sample complexity

### 6. Curriculum Learning
- **Current**: Random secret codes for training
- **Improvement**: Gradually increase difficulty
  - Start with simpler patterns
  - Progress to more complex codes
  - Learn sub-skills before complex tasks

### 7. Multi-Agent Collaboration
- **Improvement**: Multiple agents with different strategies
  - Ensemble approach for better decisions
  - Specialized agents for different game phases
  - Share learned knowledge between agents

### 8. Improved Reward Shaping
- **Current**: Simple reward based on feedback quality
- **Improvement**: More sophisticated reward functions
  - Reward reduction in search space
  - Reward consistency with constraints
  - Negative rewards for redundant guesses

### 9. Memory and Planning
- **Current**: Greedy action selection based on immediate Q-values
- **Improvement**: Add planning capabilities
  - Look ahead multiple moves
  - Consider future state values
  - Use Monte Carlo Tree Search (MCTS) for planning

### 10. Transfer Learning
- **Improvement**: Apply knowledge from one game to another
  - Learn general patterns across different games
  - Adapt quickly to new game instances
  - Share knowledge between similar puzzle games

## Performance Considerations

The current implementation is efficient for the Codebreaker game but could benefit from:
- Better state generalization to handle larger state spaces
- More efficient action selection algorithms
- Parallel training for faster learning
- Experience replay for better sample efficiency

## Conclusion

The current implementation provides a solid foundation for learning to play Codebreaker, but there are many opportunities for improvement in terms of learning efficiency, generalization, and performance. The most impactful improvements would likely be state space optimization and action space reduction, as these would significantly speed up learning.
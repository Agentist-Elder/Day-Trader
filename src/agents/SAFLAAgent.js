// SAFLA (Self-Aware Feedback Loop Algorithm) Learning Agent
// Integrated with AgentDB Reinforcement Learning (with async ES Module support)
const MemoryManager = require('../core/MemoryManager');

class SAFLAAgent {
  constructor(engine, algorithm = 'dqn') {
    this.engine = engine;
    this.memory = new MemoryManager();
    this.algorithm = algorithm;
    this.learningRate = 0.001;
    this.explorationRate = 0.1;

    // RL agent will be initialized when MemoryManager completes
    this.rl = null;
    this._rlInitialized = false;
  }

  async _ensureRLInitialized() {
    if (this._rlInitialized) return;

    // Wait for MemoryManager to initialize
    await this.memory._ensureInitialized();

    // Check if AgentDB initialized successfully with RL support
    if (this.memory._initialized && this.memory.db && this.memory.db.createRLAgent) {
      try {
        this.rl = this.memory.db.createRLAgent({
          algorithm: this.algorithm,
          stateSize: 128,
          actionSize: 3,
          learningRate: this.learningRate,
          gamma: 0.95,
          epsilon: 1.0,
          epsilonDecay: 0.995,
          epsilonMin: 0.01,
          batchSize: 32,
          replayBufferSize: 10000
        });
        this._rlInitialized = true;
      } catch (err) {
        console.warn('⚠️  RL agent initialization failed, using fallback:', err.message);
        this._rlInitialized = false;
      }
    }
  }

  async learn(action, outcome) {
    await this._ensureRLInitialized();

    // Create pattern from current state
    const pattern = {
      action: action,
      price: await this.engine.getPrice('AAPL'),
      volume: Math.random() * 1000,
      momentum: Math.random(),
      cash: this.engine.portfolio.cash,
      positions: Object.keys(this.engine.portfolio.positions).length
    };

    // Store pattern in memory
    await this.memory.storePattern(pattern, outcome);

    // If RL agent available, train it
    if (this._rlInitialized && this.rl) {
      try {
        const currentState = await this._getCurrentState();
        const nextState = await this._getCurrentState();
        const actionIdx = ['buy', 'sell', 'hold'].indexOf(action);
        const reward = outcome;

        await this.rl.learn({
          state: currentState,
          action: actionIdx,
          reward: reward,
          nextState: nextState,
          done: false
        });

        this.explorationRate = this.rl.getEpsilon();
        const qValue = await this.rl.getQValue(currentState, actionIdx);

        console.log('📚 SAFLA learned:', {
          action,
          outcome: outcome.toFixed(2),
          algorithm: this.algorithm,
          explorationRate: this.explorationRate.toFixed(3),
          qValue: qValue ? qValue.toFixed(2) : 'N/A'
        });
      } catch (err) {
        // Fallback to simple learning
        this._simpleFallbackLearning(action, outcome);
      }
    } else {
      // Fallback to simple learning
      this._simpleFallbackLearning(action, outcome);
    }
  }

  _simpleFallbackLearning(action, outcome) {
    // Simple exploration adjustment (fallback when RL not available)
    if (outcome > 0) {
      this.explorationRate = Math.max(0.05, this.explorationRate - 0.01);
    } else {
      this.explorationRate = Math.min(0.3, this.explorationRate + 0.01);
    }

    console.log('📚 SAFLA learned (fallback):', {
      action,
      outcome: outcome.toFixed(2),
      newExplorationRate: this.explorationRate.toFixed(3)
    });
  }

  async decide() {
    await this._ensureRLInitialized();

    // If RL agent available, use it
    if (this._rlInitialized && this.rl) {
      try {
        const state = await this._getCurrentState();
        const actionIdx = await this.rl.selectAction(state);
        const actions = ['buy', 'sell', 'hold'];
        const action = actions[actionIdx];
        const qValues = await this.rl.getAllQValues(state);

        const isExploring = Math.random() < this.explorationRate;
        const source = isExploring ? 'exploring' : 'exploiting';

        console.log('🎯 SAFLA decision:', {
          action,
          source,
          qValues: qValues ? {
            buy: qValues[0].toFixed(2),
            sell: qValues[1].toFixed(2),
            hold: qValues[2].toFixed(2)
          } : 'N/A',
          explorationRate: this.explorationRate.toFixed(3),
          algorithm: this.algorithm
        });

        return { action, source, qValues };
      } catch (err) {
        // Fallback to simple decision
        return await this._simpleFallbackDecision();
      }
    } else {
      // Fallback to simple decision
      return await this._simpleFallbackDecision();
    }
  }

  async _simpleFallbackDecision() {
    // Simple exploration vs exploitation (fallback)
    if (Math.random() < this.explorationRate) {
      return { action: 'explore', source: 'random' };
    }

    const similar = await this.memory.findSimilar({
      price: await this.engine.getPrice('AAPL'),
      cash: this.engine.portfolio.cash
    });

    if (similar.length > 0 && similar[0].success) {
      return { action: similar[0].pattern.action, source: 'learned' };
    }

    return { action: 'hold', source: 'default' };
  }

  async _getCurrentState() {
    // Convert current trading state to 128-dimensional vector
    const pattern = {
      price: await this.engine.getPrice('AAPL'),
      volume: Math.random() * 1000,
      momentum: Math.random(),
      cash: this.engine.portfolio.cash,
      positions: Object.keys(this.engine.portfolio.positions).length,
      action: 'hold'
    };

    return this.memory._patternToVector(pattern);
  }

  async switchAlgorithm(algorithm) {
    if (this._rlInitialized && this.rl) {
      await this.rl.switchAlgorithm(algorithm);
      this.algorithm = algorithm;
      console.log(`🔄 Switched to ${algorithm} algorithm`);
    } else {
      this.algorithm = algorithm;
      console.log(`🔄 Algorithm set to ${algorithm} (will use when RL available)`);
    }
  }

  async getPerformanceMetrics() {
    if (this._rlInitialized && this.rl) {
      return await this.rl.getMetrics();
    }
    return { error: 'RL agent not available' };
  }

  async saveModel(path) {
    if (this._rlInitialized && this.rl) {
      await this.rl.save(path);
      console.log(`💾 Model saved to ${path}`);
    } else {
      console.warn('⚠️  Cannot save model: RL agent not available');
    }
  }

  async loadModel(path) {
    if (this._rlInitialized && this.rl) {
      await this.rl.load(path);
      console.log(`📥 Model loaded from ${path}`);
    } else {
      console.warn('⚠️  Cannot load model: RL agent not available');
    }
  }

  async close() {
    await this.memory.close();
  }
}

module.exports = SAFLAAgent;
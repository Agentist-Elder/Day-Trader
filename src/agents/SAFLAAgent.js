// SAFLA (Self-Aware Feedback Loop Algorithm) Learning Agent
const MemoryManager = require('../core/MemoryManager');

class SAFLAAgent {
  constructor(engine) {
    this.engine = engine;
    this.memory = new MemoryManager();
    this.learningRate = 0.01;
    this.explorationRate = 0.1;
  }

  async learn(action, outcome) {
    // Create pattern from current state
    const pattern = {
      action: action,
      price: await this.engine.getPrice('AAPL'),
      volume: Math.random() * 1000,
      momentum: Math.random(),
      cash: this.engine.portfolio.cash,
      positions: Object.keys(this.engine.portfolio.positions).length
    };
    
    // Store pattern with outcome
    await this.memory.storePattern(pattern, outcome);
    
    // Adapt exploration rate based on success
    if (outcome > 0) {
      this.explorationRate = Math.max(0.05, this.explorationRate - 0.01);
    } else {
      this.explorationRate = Math.min(0.3, this.explorationRate + 0.01);
    }
    
    console.log('📚 SAFLA learned:', {
      action,
      outcome: outcome.toFixed(2),
      newExplorationRate: this.explorationRate.toFixed(3)
    });
  }

  async decide() {
    // Exploration vs exploitation
    if (Math.random() < this.explorationRate) {
      return { action: 'explore', source: 'random' };
    }
    
    // Use learned patterns
    const similar = await this.memory.findSimilar({ 
      price: await this.engine.getPrice('AAPL'),
      cash: this.engine.portfolio.cash 
    });
    
    if (similar.length > 0 && similar[0].success) {
      return { action: similar[0].pattern.action, source: 'learned' };
    }
    
    return { action: 'hold', source: 'default' };
  }
}

module.exports = SAFLAAgent;

// Integrated Neural Trading System
const TradingEngine = require('./core/TradingEngine');
const GOAPAgent = require('./agents/GOAPAgent');
const SAFLAAgent = require('./agents/SAFLAAgent');

class NeuralTradingSystem {
  constructor() {
    this.engine = new TradingEngine();
    this.goap = new GOAPAgent(this.engine);
    this.safla = new SAFLAAgent(this.engine);
    this.trades = 0;
    this.profit = 0;
  }

  async run(iterations = 10) {
    console.log('🚀 Neural Trading System v2.0');
    console.log('💰 Initial Capital:', this.engine.portfolio.cash);
    console.log('🧠 GOAP + SAFLA Enabled\n');
    
    for (let i = 0; i < iterations; i++) {
      // GOAP provides strategic plan
      const plan = await this.goap.plan();
      
      // SAFLA decides based on learning
      const decision = await this.safla.decide();
      
      // Combine both inputs
      const action = decision.source === 'learned' ? decision.action : plan.action;
      
      console.log(`Round ${i + 1}: ${action} (GOAP: ${plan.action}, SAFLA: ${decision.action})`);
      
      // Execute trade if buying
      let outcome = 0;
      if (action === 'buy' && this.engine.portfolio.cash > 1000) {
        const result = await this.engine.buy('AAPL', 5);
        if (result.success) {
          outcome = 10; // Positive reward for successful buy
          this.trades++;
        }
      }
      
      // Learn from outcome
      await this.safla.learn(action, outcome);
    }
    
    console.log('\n📈 Final Report:');
    console.log('💰 Cash:', this.engine.portfolio.cash.toFixed(2));
    console.log('📊 Positions:', this.engine.portfolio.positions);
    console.log('🔄 Trades executed:', this.trades);
    console.log('📚 Patterns learned:', this.safla.memory.patterns.length);
  }
}

module.exports = NeuralTradingSystem;

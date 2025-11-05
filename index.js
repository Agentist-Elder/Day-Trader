// Neural Trading System - Main Entry Point
const TradingEngine = require('./src/core/TradingEngine');
const GOAPAgent = require('./src/agents/GOAPAgent');

class NeuralTradingSystem {
  constructor() {
    this.engine = new TradingEngine();
    this.agent = new GOAPAgent(this.engine);
    this.running = false;
  }

  async start() {
    console.log('🚀 Neural Trading System Started');
    console.log('💰 Initial Capital:', this.engine.portfolio.cash);
    console.log('📊 Mode:', this.engine.mode);
    
    this.running = true;
    
    // Run agent decision loop
    while (this.running) {
      const decision = await this.agent.execute();
      
      if (decision.action === 'buy') {
        await this.engine.buy('AAPL', 5);
      }
      
      // Wait 2 seconds between decisions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Stop after 3 iterations for demo
      if (this.engine.portfolio.history.length >= 3) {
        this.stop();
      }
    }
  }

  stop() {
    this.running = false;
    console.log('\n📈 Final Portfolio:');
    console.log('💰 Cash:', this.engine.portfolio.cash);
    console.log('📊 Positions:', this.engine.portfolio.positions);
    console.log('📜 Trades:', this.engine.portfolio.history.length);
  }
}

// Run if called directly
if (require.main === module) {
  const system = new NeuralTradingSystem();
  system.start().catch(console.error);
}

module.exports = NeuralTradingSystem;

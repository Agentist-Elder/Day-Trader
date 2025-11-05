// Test the setup
const TradingEngine = require('./src/core/TradingEngine');

async function test() {
  console.log('Testing Neural Trading System...\n');
  
  const engine = new TradingEngine();
  console.log('✅ TradingEngine initialized');
  console.log('💰 Starting cash:', engine.portfolio.cash);
  
  // Test buy
  const result = await engine.buy('AAPL', 10);
  console.log('📈 Buy order:', result);
  console.log('�� Remaining cash:', engine.portfolio.cash);
  console.log('📊 Positions:', engine.portfolio.positions);
}

test().catch(console.error);

// Test SAFLA Learning
const TradingEngine = require('./src/core/TradingEngine');
const SAFLAAgent = require('./src/agents/SAFLAAgent');

async function testSAFLA() {
  console.log('Testing SAFLA Learning...\n');
  
  const engine = new TradingEngine();
  const safla = new SAFLAAgent(engine);
  
  // Simulate some trades and learning
  for (let i = 0; i < 5; i++) {
    const decision = await safla.decide();
    console.log(`\nRound ${i + 1}:`);
    console.log('🤔 Decision:', decision);
    
    // Simulate outcome (random for demo)
    const outcome = Math.random() * 100 - 50;
    await safla.learn(decision.action, outcome);
  }
  
  console.log('\n📊 Final exploration rate:', safla.explorationRate);
  console.log('💾 Patterns learned:', safla.memory.patterns.length);
}

testSAFLA();

// Test Integrated System
const NeuralTradingSystem = require('./src/NeuralTradingSystem');

async function test() {
  const system = new NeuralTradingSystem();
  await system.run(10);
}

test().catch(console.error);

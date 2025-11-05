// Test Strategy Verification
const StrategyVerifier = require('./src/core/StrategyVerifier');

async function testVerifier() {
  console.log('Testing Strategy Verifier...\n');
  
  const verifier = new StrategyVerifier();
  
  // Simulate historical trade data
  const historicalData = [
    { action: 'buy', outcome: 50 },
    { action: 'buy', outcome: -20 },
    { action: 'sell', outcome: 30 },
    { action: 'buy', outcome: -15 },
    { action: 'hold', outcome: 0 },
    { action: 'buy', outcome: 45 },
    { action: 'sell', outcome: 25 },
    { action: 'buy', outcome: -10 },
    { action: 'buy', outcome: 60 },
    { action: 'sell', outcome: -5 }
  ];
  
  const result = await verifier.verifyStrategy('momentum', historicalData);
  
  console.log('📊 Metrics:', result.metrics);
  console.log('✅ Proofs:', result.proofs);
  console.log('🎯 Recommendation:', result.recommendation);
  console.log('📈 Strategy is:', result.valid ? 'APPROVED' : 'REJECTED');
}

testVerifier();

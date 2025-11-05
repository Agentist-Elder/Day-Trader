
// Test GOAP Agent

const TradingEngine = require('./src/core/TradingEngine');

const GOAPAgent = require('./src/agents/GOAPAgent');

async function testGOAP() {

  console.log('Testing GOAP Agent...\n');

  

  const engine = new TradingEngine();

  const agent = new GOAPAgent(engine);

  

  console.log('Initial state:');

  console.log('💰 Cash:', engine.portfolio.cash);

  console.log('📊 Positions:', engine.portfolio.positions);

  

  console.log('\nAgent planning...');

  const decision = await agent.execute();

  

  if (decision.action === 'buy') {

    await engine.buy('AAPL', 10);

    console.log('✅ Executed buy order');

    console.log('💰 New cash:', engine.portfolio.cash);

    console.log('📊 New positions:', engine.portfolio.positions);

  }

}

testGOAP().catch(console.error);


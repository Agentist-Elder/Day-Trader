// Test Momentum Strategy
const MockDataFeed = require('./src/data/MockDataFeed');
const TemporalAnalyzer = require('./src/core/TemporalAnalyzer');
const MomentumStrategy = require('./src/strategies/MomentumStrategy');

async function testStrategy() {
  console.log('Testing Momentum Strategy...\n');
  
  const feed = new MockDataFeed();
  const analyzer = new TemporalAnalyzer();
  const strategy = new MomentumStrategy(feed, analyzer);
  
  // Analyze multiple symbols
  const symbols = ['AAPL', 'GOOGL', 'TSLA'];
  
  for (const symbol of symbols) {
    const analysis = await strategy.analyze(symbol);
    
    console.log(`\n📊 ${symbol} Analysis:`);
    console.log(`  Momentum: ${(analysis.momentum * 100).toFixed(2)}%`);
    console.log(`  Sentiment: ${analysis.sentiment}`);
    console.log(`  Trend: ${analysis.trend}`);
    console.log(`  Signal: ${analysis.signal}`);
    console.log(`  Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
  }
}

testStrategy();

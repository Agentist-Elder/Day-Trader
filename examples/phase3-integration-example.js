/**
 * Phase 3: Data Integration - Usage Example
 *
 * This example demonstrates how to use the MockDataFeed and RealTimePriceSimulator
 * components for testing and development.
 */

const MockDataFeed = require('../src/data/MockDataFeed');
const RealTimePriceSimulator = require('../src/data/RealTimePriceSimulator');

async function demonstrateDataIntegration() {
  console.log('=== Phase 3: Data Integration Demo ===\n');

  // 1. Using MockDataFeed directly
  console.log('1. MockDataFeed - Direct Usage:');
  const dataFeed = new MockDataFeed();

  // Get current price
  const currentPrice = await dataFeed.getPrice('AAPL');
  console.log(`   Current AAPL price: $${currentPrice.toFixed(2)}`);

  // Get historical data
  const historicalData = await dataFeed.getHistoricalData('AAPL', 5);
  console.log(`   Historical data (last 5 days):`);
  historicalData.forEach((candle, i) => {
    console.log(`     Day ${i + 1}: Open=$${candle.open.toFixed(2)}, Close=$${candle.close.toFixed(2)}, Volume=${candle.volume}`);
  });

  // Get sentiment
  const sentiment = await dataFeed.getSentiment('AAPL');
  console.log(`   Sentiment: ${sentiment.sentiment} (score: ${sentiment.score.toFixed(2)})\n`);

  // 2. Using RealTimePriceSimulator
  console.log('2. RealTimePriceSimulator - Real-time Updates:');
  const simulator = new RealTimePriceSimulator(2000); // 2-second intervals

  // Track price changes
  const priceHistory = {
    AAPL: [],
    GOOGL: []
  };

  // Subscribe to AAPL
  simulator.subscribe('AAPL', (update) => {
    priceHistory.AAPL.push(update.price);
    console.log(`   [${new Date(update.timestamp).toISOString()}] AAPL: $${update.price.toFixed(2)}`);
  });

  // Subscribe to GOOGL
  simulator.subscribe('GOOGL', (update) => {
    priceHistory.GOOGL.push(update.price);
    console.log(`   [${new Date(update.timestamp).toISOString()}] GOOGL: $${update.price.toFixed(2)}`);
  });

  console.log('   Starting simulator...');
  simulator.start();

  // Run for 6 seconds (3 updates)
  await new Promise(resolve => setTimeout(resolve, 6500));

  console.log('\n   Stopping simulator...');
  simulator.stop();

  // 3. Calculate statistics from collected data
  console.log('\n3. Price Statistics:');
  for (const [symbol, prices] of Object.entries(priceHistory)) {
    if (prices.length > 0) {
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const volatility = ((max - min) / avg * 100).toFixed(2);

      console.log(`   ${symbol}:`);
      console.log(`     Average: $${avg.toFixed(2)}`);
      console.log(`     Range: $${min.toFixed(2)} - $${max.toFixed(2)}`);
      console.log(`     Volatility: ${volatility}%`);
    }
  }

  // 4. Multiple symbols with sentiment
  console.log('\n4. Market Overview:');
  const symbols = ['AAPL', 'GOOGL', 'TSLA', 'MSFT'];

  for (const symbol of symbols) {
    const price = await dataFeed.getPrice(symbol);
    const sentiment = await dataFeed.getSentiment(symbol);

    const sentimentEmoji = {
      bullish: '📈',
      bearish: '📉',
      neutral: '➡️'
    };

    console.log(`   ${symbol}: $${price.toFixed(2)} ${sentimentEmoji[sentiment.sentiment]} ${sentiment.sentiment}`);
  }

  console.log('\n=== Demo Complete ===');
}

// Run the demonstration
if (require.main === module) {
  demonstrateDataIntegration().catch(console.error);
}

module.exports = { demonstrateDataIntegration };

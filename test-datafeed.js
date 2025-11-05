// Test Mock Data Feed
const MockDataFeed = require('./src/data/MockDataFeed');

async function testDataFeed() {
  console.log('Testing Data Feed...\n');
  
  const feed = new MockDataFeed();
  
  // Test current price
  const price = await feed.getPrice('AAPL');
  console.log('📊 Current AAPL price:', price.toFixed(2));
  
  // Test historical data
  const history = await feed.getHistoricalData('AAPL', 5);
  console.log('\n📈 Historical data (5 days):');
  history.forEach(day => {
    console.log(`  ${day.date.toLocaleDateString()}: $${day.close.toFixed(2)}`);
  });
  
  // Test sentiment
  const sentiment = await feed.getSentiment('AAPL');
  console.log('\n💭 Sentiment:', sentiment);
}

testDataFeed();

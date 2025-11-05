// Test Temporal Analysis
const TemporalAnalyzer = require('./src/core/TemporalAnalyzer');

async function testTemporal() {
  console.log('Testing Temporal Analyzer...\n');
  
  const analyzer = new TemporalAnalyzer();
  
  // Simulate price history with pattern
  const priceHistory = [
    150, 152, 151, 153, 155,  // Upward
    154, 153, 152, 154, 156,  // Pattern
    155, 157, 156, 158, 160,  // Similar pattern
    159, 158, 157, 159, 161   // Continuation
  ];
  
  const analysis = await analyzer.analyzePattern(priceHistory);
  
  console.log('📊 Analysis Results:');
  console.log('📈 Trend:', analysis.trend);
  console.log('📉 Volatility:', analysis.volatility.toFixed(2));
  console.log('🔮 Next prediction:', analysis.prediction.toFixed(2));
  console.log('🔄 Patterns found:', analysis.patterns);
  console.log('⚡ Cycles:', analysis.cycles);
}

testTemporal();

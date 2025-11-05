// Mock Data Feed for Testing
class MockDataFeed {
  constructor() {
    this.symbols = ['AAPL', 'GOOGL', 'TSLA', 'MSFT'];
    this.basePrice = { AAPL: 150, GOOGL: 2800, TSLA: 250, MSFT: 350 };
    this.volatility = 0.02;
  }

  async getPrice(symbol) {
    const base = this.basePrice[symbol] || 100;
    const change = (Math.random() - 0.5) * 2 * this.volatility;
    return base * (1 + change);
  }

  async getHistoricalData(symbol, days = 30) {
    const data = [];
    let price = this.basePrice[symbol] || 100;
    
    for (let i = 0; i < days; i++) {
      price *= (1 + (Math.random() - 0.48) * 0.02);
      data.push({
        date: new Date(Date.now() - (days - i) * 86400000),
        open: price * 0.99,
        high: price * 1.02,
        low: price * 0.98,
        close: price,
        volume: Math.floor(Math.random() * 1000000)
      });
    }
    return data;
  }

  async getSentiment(symbol) {
    const sentiments = ['bullish', 'bearish', 'neutral'];
    return {
      symbol,
      sentiment: sentiments[Math.floor(Math.random() * 3)],
      score: Math.random()
    };
  }
}

module.exports = MockDataFeed;

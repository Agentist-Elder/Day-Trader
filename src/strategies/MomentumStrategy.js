// Momentum Trading Strategy
class MomentumStrategy {
  constructor(dataFeed, analyzer) {
    this.dataFeed = dataFeed;
    this.analyzer = analyzer;
    this.lookbackPeriod = 10;
    this.threshold = 0.02; // 2% momentum threshold
  }

  async analyze(symbol) {
    // Get historical data
    const history = await this.dataFeed.getHistoricalData(symbol, this.lookbackPeriod);
    const prices = history.map(h => h.close);
    
    // Calculate momentum
    const momentum = this.calculateMomentum(prices);
    
    // Get sentiment
    const sentiment = await this.dataFeed.getSentiment(symbol);
    
    // Analyze temporal patterns
    const temporal = await this.analyzer.analyzePattern(prices);
    
    // Generate signal
    const signal = this.generateSignal(momentum, sentiment, temporal);
    
    return {
      symbol,
      momentum,
      sentiment: sentiment.sentiment,
      trend: temporal.trend,
      prediction: temporal.prediction,
      signal,
      confidence: this.calculateConfidence(momentum, sentiment, temporal)
    };
  }

  calculateMomentum(prices) {
    const recent = prices.slice(-5).reduce((a, b) => a + b) / 5;
    const older = prices.slice(0, 5).reduce((a, b) => a + b) / 5;
    return (recent - older) / older;
  }

  generateSignal(momentum, sentiment, temporal) {
    if (momentum > this.threshold && sentiment.sentiment === 'bullish' && temporal.trend === 'UPWARD') {
      return 'BUY';
    }
    if (momentum < -this.threshold && sentiment.sentiment === 'bearish' && temporal.trend === 'DOWNWARD') {
      return 'SELL';
    }
    return 'HOLD';
  }

  calculateConfidence(momentum, sentiment, temporal) {
    let confidence = 0.5;
    if (Math.abs(momentum) > this.threshold) confidence += 0.2;
    if (sentiment.sentiment !== 'neutral') confidence += 0.15;
    if (temporal.cycles.detected) confidence += 0.15;
    return Math.min(confidence, 1.0);
  }
}

module.exports = MomentumStrategy;

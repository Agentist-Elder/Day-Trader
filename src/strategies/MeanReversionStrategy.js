// Mean Reversion Trading Strategy
class MeanReversionStrategy {
  constructor(dataFeed, analyzer) {
    this.dataFeed = dataFeed;
    this.analyzer = analyzer;
    this.lookbackPeriod = 20;
    this.stdDevMultiplier = 2; // Number of standard deviations for overbought/oversold
  }

  async analyze(symbol) {
    // Get historical data
    const history = await this.dataFeed.getHistoricalData(symbol, this.lookbackPeriod);

    if (!history || history.length === 0) {
      throw new Error('No historical data available');
    }

    const prices = history.map(h => h.close);
    const currentPrice = prices[prices.length - 1];

    // Calculate mean and standard deviation
    const mean = this.calculateMean(prices);
    const stdDev = this.calculateStdDev(prices, mean);

    // Calculate how many standard deviations the current price is from the mean
    const deviation = this.calculateDeviation(currentPrice, mean, stdDev);

    // Get sentiment
    const sentiment = await this.dataFeed.getSentiment(symbol);

    // Analyze temporal patterns
    const temporal = await this.analyzer.analyzePattern(prices);

    // Generate signal based on mean reversion
    const signal = this.generateSignal(deviation, sentiment, temporal);

    return {
      symbol,
      currentPrice,
      mean,
      stdDev,
      deviation,
      sentiment: sentiment.sentiment,
      trend: temporal.trend,
      signal,
      confidence: this.calculateConfidence(deviation, sentiment, temporal)
    };
  }

  calculateMean(prices) {
    const sum = prices.reduce((acc, price) => acc + price, 0);
    return sum / prices.length;
  }

  calculateStdDev(prices, mean) {
    if (prices.length === 1) {
      return 0;
    }

    const squaredDifferences = prices.map(price => Math.pow(price - mean, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / prices.length;
    return Math.sqrt(variance);
  }

  calculateDeviation(price, mean, stdDev) {
    if (stdDev === 0) {
      return 0; // Avoid division by zero
    }
    return (price - mean) / stdDev;
  }

  generateSignal(deviation, sentiment, temporal) {
    // Mean reversion logic:
    // If price is significantly below mean (oversold), expect it to rise -> BUY
    // If price is significantly above mean (overbought), expect it to fall -> SELL
    // Otherwise -> HOLD

    if (deviation < -this.stdDevMultiplier) {
      // Oversold - price is significantly below mean
      return 'BUY';
    }

    if (deviation > this.stdDevMultiplier) {
      // Overbought - price is significantly above mean
      return 'SELL';
    }

    // Price is within normal range
    return 'HOLD';
  }

  calculateConfidence(deviation, sentiment, temporal) {
    let confidence = 0.5; // Base confidence

    // Add confidence based on how far from mean
    if (Math.abs(deviation) > this.stdDevMultiplier) {
      confidence += 0.2;
    }

    // Add confidence if sentiment supports the trade
    if (sentiment.sentiment !== 'neutral') {
      confidence += 0.15;
    }

    // Add confidence if cycles are detected (mean reversion works better with cycles)
    if (temporal.cycles && temporal.cycles.detected) {
      confidence += 0.15;
    }

    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }
}

module.exports = MeanReversionStrategy;

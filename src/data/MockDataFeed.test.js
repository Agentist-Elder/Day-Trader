const MockDataFeed = require('./MockDataFeed');

describe('MockDataFeed', () => {
  let mockDataFeed;
  let originalRandom;

  beforeEach(() => {
    mockDataFeed = new MockDataFeed();
    originalRandom = Math.random;
  });

  afterEach(() => {
    Math.random = originalRandom;
  });

  describe('constructor', () => {
    it('should initialize with correct default symbols', () => {
      expect(mockDataFeed.symbols).toEqual(['AAPL', 'GOOGL', 'TSLA', 'MSFT']);
    });

    it('should initialize with correct base prices', () => {
      expect(mockDataFeed.basePrice).toEqual({
        AAPL: 150,
        GOOGL: 2800,
        TSLA: 250,
        MSFT: 350
      });
    });

    it('should initialize with correct volatility', () => {
      expect(mockDataFeed.volatility).toBe(0.02);
    });
  });

  describe('getPrice', () => {
    it('should return a promise', () => {
      const result = mockDataFeed.getPrice('AAPL');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return a number', async () => {
      const price = await mockDataFeed.getPrice('AAPL');
      expect(typeof price).toBe('number');
    });

    it('should return price based on symbol base price', async () => {
      Math.random = jest.fn(() => 0.5);
      const price = await mockDataFeed.getPrice('AAPL');
      // With Math.random = 0.5, change = 0, so price = base
      expect(price).toBe(150);
    });

    it('should apply positive volatility when random > 0.5', async () => {
      Math.random = jest.fn(() => 1);
      const price = await mockDataFeed.getPrice('AAPL');
      // With Math.random = 1, change = (1 - 0.5) * 2 * 0.02 = 0.02
      // price = 150 * 1.02 = 153
      expect(price).toBe(153);
    });

    it('should apply negative volatility when random < 0.5', async () => {
      Math.random = jest.fn(() => 0);
      const price = await mockDataFeed.getPrice('AAPL');
      // With Math.random = 0, change = (0 - 0.5) * 2 * 0.02 = -0.02
      // price = 150 * 0.98 = 147
      expect(price).toBe(147);
    });

    it('should use default base price of 100 for unknown symbols', async () => {
      Math.random = jest.fn(() => 0.5);
      const price = await mockDataFeed.getPrice('UNKNOWN');
      expect(price).toBe(100);
    });

    it('should handle GOOGL symbol correctly', async () => {
      Math.random = jest.fn(() => 0.5);
      const price = await mockDataFeed.getPrice('GOOGL');
      expect(price).toBe(2800);
    });

    it('should handle TSLA symbol correctly', async () => {
      Math.random = jest.fn(() => 0.5);
      const price = await mockDataFeed.getPrice('TSLA');
      expect(price).toBe(250);
    });

    it('should handle MSFT symbol correctly', async () => {
      Math.random = jest.fn(() => 0.5);
      const price = await mockDataFeed.getPrice('MSFT');
      expect(price).toBe(350);
    });

    it('should generate different prices on consecutive calls', async () => {
      // Don't mock Math.random, allow natural variation
      Math.random = originalRandom;
      const price1 = await mockDataFeed.getPrice('AAPL');
      const price2 = await mockDataFeed.getPrice('AAPL');

      // Prices should be within expected range but likely different
      expect(price1).toBeGreaterThan(147); // 150 * (1 - 0.02)
      expect(price1).toBeLessThan(153);    // 150 * (1 + 0.02)
      expect(price2).toBeGreaterThan(147);
      expect(price2).toBeLessThan(153);
    });

    it('should respect volatility bounds', async () => {
      // Test with many random values to ensure bounds
      const prices = [];
      for (let i = 0; i < 100; i++) {
        const price = await mockDataFeed.getPrice('AAPL');
        prices.push(price);
      }

      prices.forEach(price => {
        expect(price).toBeGreaterThanOrEqual(147); // 150 * (1 - 0.02)
        expect(price).toBeLessThanOrEqual(153);    // 150 * (1 + 0.02)
      });
    });
  });

  describe('getHistoricalData', () => {
    beforeEach(() => {
      // Mock Date.now for consistent testing
      jest.spyOn(Date, 'now').mockReturnValue(1609459200000); // 2021-01-01
    });

    afterEach(() => {
      Date.now.mockRestore();
    });

    it('should return a promise', () => {
      const result = mockDataFeed.getHistoricalData('AAPL');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return an array', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL');
      expect(Array.isArray(data)).toBe(true);
    });

    it('should return 30 data points by default', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL');
      expect(data.length).toBe(30);
    });

    it('should return requested number of days', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 60);
      expect(data.length).toBe(60);
    });

    it('should handle single day request', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 1);
      expect(data.length).toBe(1);
    });

    it('should return data with correct structure', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 1);
      const candle = data[0];

      expect(candle).toHaveProperty('date');
      expect(candle).toHaveProperty('open');
      expect(candle).toHaveProperty('high');
      expect(candle).toHaveProperty('low');
      expect(candle).toHaveProperty('close');
      expect(candle).toHaveProperty('volume');
    });

    it('should have date as Date object', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 1);
      expect(data[0].date).toBeInstanceOf(Date);
    });

    it('should have numeric OHLC values', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 1);
      const candle = data[0];

      expect(typeof candle.open).toBe('number');
      expect(typeof candle.high).toBe('number');
      expect(typeof candle.low).toBe('number');
      expect(typeof candle.close).toBe('number');
      expect(typeof candle.volume).toBe('number');
    });

    it('should have integer volume', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 1);
      expect(Number.isInteger(data[0].volume)).toBe(true);
    });

    it('should have volume within expected range', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 10);
      data.forEach(candle => {
        expect(candle.volume).toBeGreaterThanOrEqual(0);
        expect(candle.volume).toBeLessThan(1000000);
      });
    });

    it('should maintain OHLC relationships', async () => {
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5) // For price evolution
        .mockReturnValueOnce(0.5); // For volume

      const data = await mockDataFeed.getHistoricalData('AAPL', 1);
      const candle = data[0];

      // High should be highest
      expect(candle.high).toBeGreaterThanOrEqual(candle.close);
      expect(candle.high).toBeGreaterThanOrEqual(candle.open);
      expect(candle.high).toBeGreaterThanOrEqual(candle.low);

      // Low should be lowest
      expect(candle.low).toBeLessThanOrEqual(candle.close);
      expect(candle.low).toBeLessThanOrEqual(candle.open);
      expect(candle.low).toBeLessThanOrEqual(candle.high);
    });

    it('should have dates in chronological order', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 5);

      for (let i = 1; i < data.length; i++) {
        expect(data[i].date.getTime()).toBeGreaterThan(data[i - 1].date.getTime());
      }
    });

    it('should have dates spaced by one day', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 3);
      const day1 = data[0].date.getTime();
      const day2 = data[1].date.getTime();
      const day3 = data[2].date.getTime();

      const oneDay = 86400000; // milliseconds in a day
      expect(day2 - day1).toBe(oneDay);
      expect(day3 - day2).toBe(oneDay);
    });

    it('should start from the earliest date in the past', async () => {
      const now = Date.now();
      const data = await mockDataFeed.getHistoricalData('AAPL', 30);
      const expectedEarliestDate = now - (30 * 86400000);

      expect(data[0].date.getTime()).toBeGreaterThanOrEqual(expectedEarliestDate - 1000);
      expect(data[0].date.getTime()).toBeLessThanOrEqual(expectedEarliestDate + 1000);
    });

    it('should use symbol base price as starting point', async () => {
      Math.random = jest.fn(() => 0.48); // Neutral price change
      const data = await mockDataFeed.getHistoricalData('AAPL', 1);

      // Price should be close to base price (150) with minimal drift
      expect(data[0].close).toBeGreaterThan(145);
      expect(data[0].close).toBeLessThan(155);
    });

    it('should use default base price for unknown symbols', async () => {
      Math.random = jest.fn(() => 0.48);
      const data = await mockDataFeed.getHistoricalData('UNKNOWN', 1);

      // Price should be close to default 100
      expect(data[0].close).toBeGreaterThan(95);
      expect(data[0].close).toBeLessThan(105);
    });

    it('should evolve prices over time', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 30);

      // Collect all close prices
      const closePrices = data.map(d => d.close);

      // Should have some variation
      const minPrice = Math.min(...closePrices);
      const maxPrice = Math.max(...closePrices);

      expect(maxPrice).toBeGreaterThan(minPrice);
    });

    it('should calculate open/high/low relative to close', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 1);
      const candle = data[0];

      // Based on the implementation:
      // open = close * 0.99
      // high = close * 1.02
      // low = close * 0.98

      expect(candle.open).toBeCloseTo(candle.close * 0.99, 10);
      expect(candle.high).toBeCloseTo(candle.close * 1.02, 10);
      expect(candle.low).toBeCloseTo(candle.close * 0.98, 10);
    });
  });

  describe('getSentiment', () => {
    it('should return a promise', () => {
      const result = mockDataFeed.getSentiment('AAPL');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return an object with correct structure', async () => {
      const sentiment = await mockDataFeed.getSentiment('AAPL');

      expect(sentiment).toHaveProperty('symbol');
      expect(sentiment).toHaveProperty('sentiment');
      expect(sentiment).toHaveProperty('score');
    });

    it('should return the queried symbol', async () => {
      const sentiment = await mockDataFeed.getSentiment('AAPL');
      expect(sentiment.symbol).toBe('AAPL');
    });

    it('should return valid sentiment values', async () => {
      const validSentiments = ['bullish', 'bearish', 'neutral'];
      const sentiment = await mockDataFeed.getSentiment('AAPL');

      expect(validSentiments).toContain(sentiment.sentiment);
    });

    it('should return score as a number', async () => {
      const sentiment = await mockDataFeed.getSentiment('AAPL');
      expect(typeof sentiment.score).toBe('number');
    });

    it('should return score between 0 and 1', async () => {
      const sentiment = await mockDataFeed.getSentiment('AAPL');
      expect(sentiment.score).toBeGreaterThanOrEqual(0);
      expect(sentiment.score).toBeLessThanOrEqual(1);
    });

    it('should return bullish when random < 0.33', async () => {
      Math.random = jest.fn()
        .mockReturnValueOnce(0.1) // For sentiment selection
        .mockReturnValueOnce(0.5); // For score

      const sentiment = await mockDataFeed.getSentiment('AAPL');
      expect(sentiment.sentiment).toBe('bullish');
    });

    it('should return bearish when 0.33 <= random < 0.67', async () => {
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5) // For sentiment selection
        .mockReturnValueOnce(0.5); // For score

      const sentiment = await mockDataFeed.getSentiment('AAPL');
      expect(sentiment.sentiment).toBe('bearish');
    });

    it('should return neutral when random >= 0.67', async () => {
      Math.random = jest.fn()
        .mockReturnValueOnce(0.8) // For sentiment selection
        .mockReturnValueOnce(0.5); // For score

      const sentiment = await mockDataFeed.getSentiment('AAPL');
      expect(sentiment.sentiment).toBe('neutral');
    });

    it('should handle different symbols', async () => {
      const symbols = ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'UNKNOWN'];

      for (const symbol of symbols) {
        const sentiment = await mockDataFeed.getSentiment(symbol);
        expect(sentiment.symbol).toBe(symbol);
        expect(['bullish', 'bearish', 'neutral']).toContain(sentiment.sentiment);
        expect(sentiment.score).toBeGreaterThanOrEqual(0);
        expect(sentiment.score).toBeLessThanOrEqual(1);
      }
    });

    it('should vary sentiment across multiple calls', async () => {
      Math.random = originalRandom;

      const sentiments = new Set();
      for (let i = 0; i < 20; i++) {
        const sentiment = await mockDataFeed.getSentiment('AAPL');
        sentiments.add(sentiment.sentiment);
      }

      // With 20 calls, we should likely see multiple different sentiments
      // This is probabilistic, but with 20 calls, chance of all same is extremely low
      expect(sentiments.size).toBeGreaterThan(1);
    });

    it('should vary scores across multiple calls', async () => {
      Math.random = originalRandom;

      const scores = [];
      for (let i = 0; i < 10; i++) {
        const sentiment = await mockDataFeed.getSentiment('AAPL');
        scores.push(sentiment.score);
      }

      // Check that we have some variation in scores
      const uniqueScores = new Set(scores);
      expect(uniqueScores.size).toBeGreaterThan(1);
    });
  });

  describe('integration scenarios', () => {
    it('should support getting price, historical data, and sentiment for same symbol', async () => {
      const symbol = 'AAPL';

      const price = await mockDataFeed.getPrice(symbol);
      const historical = await mockDataFeed.getHistoricalData(symbol, 10);
      const sentiment = await mockDataFeed.getSentiment(symbol);

      expect(price).toBeGreaterThan(0);
      expect(historical.length).toBe(10);
      expect(sentiment.symbol).toBe(symbol);
    });

    it('should handle concurrent requests', async () => {
      const promises = [
        mockDataFeed.getPrice('AAPL'),
        mockDataFeed.getPrice('GOOGL'),
        mockDataFeed.getHistoricalData('TSLA', 5),
        mockDataFeed.getSentiment('MSFT')
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toBeGreaterThan(0); // AAPL price
      expect(results[1]).toBeGreaterThan(0); // GOOGL price
      expect(results[2].length).toBe(5);     // TSLA historical
      expect(results[3].symbol).toBe('MSFT'); // MSFT sentiment
    });

    it('should work with all supported symbols', async () => {
      for (const symbol of mockDataFeed.symbols) {
        const price = await mockDataFeed.getPrice(symbol);
        const historical = await mockDataFeed.getHistoricalData(symbol, 1);
        const sentiment = await mockDataFeed.getSentiment(symbol);

        expect(price).toBeGreaterThan(0);
        expect(historical.length).toBe(1);
        expect(sentiment.symbol).toBe(symbol);
      }
    });
  });

  describe('boundary and edge cases', () => {
    it('should handle zero days for historical data', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 0);
      expect(data.length).toBe(0);
    });

    it('should handle very large number of days', async () => {
      const data = await mockDataFeed.getHistoricalData('AAPL', 1000);
      expect(data.length).toBe(1000);
    });

    it('should handle empty string symbol', async () => {
      Math.random = jest.fn(() => 0.5);
      const price = await mockDataFeed.getPrice('');
      expect(price).toBe(100); // Default price with no volatility

      const sentiment = await mockDataFeed.getSentiment('');
      expect(sentiment.symbol).toBe('');
    });

    it('should handle null symbol gracefully', async () => {
      Math.random = jest.fn(() => 0.5);
      const price = await mockDataFeed.getPrice(null);
      expect(price).toBe(100); // Default price with no volatility
    });

    it('should handle undefined symbol gracefully', async () => {
      Math.random = jest.fn(() => 0.5);
      const price = await mockDataFeed.getPrice(undefined);
      expect(price).toBe(100); // Default price with no volatility
    });
  });
});

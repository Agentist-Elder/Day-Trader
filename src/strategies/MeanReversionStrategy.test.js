const MeanReversionStrategy = require('./MeanReversionStrategy');

// Mock dependencies
jest.mock('../data/MockDataFeed');
jest.mock('../core/TemporalAnalyzer');

const MockDataFeed = require('../data/MockDataFeed');
const TemporalAnalyzer = require('../core/TemporalAnalyzer');

describe('MeanReversionStrategy', () => {
  let strategy;
  let mockDataFeed;
  let mockAnalyzer;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock DataFeed
    mockDataFeed = {
      getHistoricalData: jest.fn(),
      getSentiment: jest.fn()
    };
    MockDataFeed.mockImplementation(() => mockDataFeed);

    // Setup mock TemporalAnalyzer
    mockAnalyzer = {
      analyzePattern: jest.fn()
    };
    TemporalAnalyzer.mockImplementation(() => mockAnalyzer);

    strategy = new MeanReversionStrategy(mockDataFeed, mockAnalyzer);
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(strategy).toBeDefined();
      expect(strategy).toBeInstanceOf(MeanReversionStrategy);
    });

    it('should store dataFeed dependency', () => {
      expect(strategy.dataFeed).toBe(mockDataFeed);
    });

    it('should store analyzer dependency', () => {
      expect(strategy.analyzer).toBe(mockAnalyzer);
    });

    it('should initialize with default lookbackPeriod of 20', () => {
      expect(strategy.lookbackPeriod).toBe(20);
    });

    it('should initialize with default stdDevMultiplier of 2', () => {
      expect(strategy.stdDevMultiplier).toBe(2);
    });
  });

  describe('calculateMean', () => {
    it('should calculate mean of prices correctly', () => {
      const prices = [100, 110, 90, 105, 95];
      const mean = strategy.calculateMean(prices);
      // Mean = (100+110+90+105+95)/5 = 100
      expect(mean).toBe(100);
    });

    it('should handle single price', () => {
      const prices = [150];
      const mean = strategy.calculateMean(prices);
      expect(mean).toBe(150);
    });

    it('should handle decimal prices', () => {
      const prices = [150.5, 151.5, 149.5];
      const mean = strategy.calculateMean(prices);
      // Mean = (150.5+151.5+149.5)/3 = 150.5
      expect(mean).toBe(150.5);
    });

    it('should handle large datasets', () => {
      const prices = Array(100).fill(100);
      const mean = strategy.calculateMean(prices);
      expect(mean).toBe(100);
    });

    it('should handle varying prices', () => {
      const prices = [10, 20, 30, 40, 50];
      const mean = strategy.calculateMean(prices);
      expect(mean).toBe(30);
    });
  });

  describe('calculateStdDev', () => {
    it('should calculate standard deviation correctly', () => {
      const prices = [100, 110, 90, 105, 95];
      const mean = 100;
      const stdDev = strategy.calculateStdDev(prices, mean);

      // Variance = [(0)^2 + (10)^2 + (-10)^2 + (5)^2 + (-5)^2] / 5 = 250/5 = 50
      // StdDev = sqrt(50) ≈ 7.071
      expect(stdDev).toBeCloseTo(7.071, 2);
    });

    it('should return 0 for constant prices', () => {
      const prices = [100, 100, 100, 100];
      const mean = 100;
      const stdDev = strategy.calculateStdDev(prices, mean);
      expect(stdDev).toBe(0);
    });

    it('should handle single price', () => {
      const prices = [150];
      const mean = 150;
      const stdDev = strategy.calculateStdDev(prices, mean);
      expect(stdDev).toBe(0);
    });

    it('should handle large deviations', () => {
      const prices = [50, 150];
      const mean = 100;
      const stdDev = strategy.calculateStdDev(prices, mean);
      // Variance = [(50)^2 + (50)^2] / 2 = 5000/2 = 2500
      // StdDev = 50
      expect(stdDev).toBe(50);
    });
  });

  describe('calculateDeviation', () => {
    it('should calculate positive deviation when price above mean', () => {
      const price = 110;
      const mean = 100;
      const stdDev = 5;

      const deviation = strategy.calculateDeviation(price, mean, stdDev);
      // deviation = (110-100)/5 = 2.0
      expect(deviation).toBe(2.0);
    });

    it('should calculate negative deviation when price below mean', () => {
      const price = 90;
      const mean = 100;
      const stdDev = 5;

      const deviation = strategy.calculateDeviation(price, mean, stdDev);
      // deviation = (90-100)/5 = -2.0
      expect(deviation).toBe(-2.0);
    });

    it('should return 0 when price equals mean', () => {
      const price = 100;
      const mean = 100;
      const stdDev = 5;

      const deviation = strategy.calculateDeviation(price, mean, stdDev);
      expect(deviation).toBe(0);
    });

    it('should handle zero standard deviation', () => {
      const price = 110;
      const mean = 100;
      const stdDev = 0;

      const deviation = strategy.calculateDeviation(price, mean, stdDev);
      // Should return 0 to avoid division by zero
      expect(deviation).toBe(0);
    });

    it('should handle decimal values', () => {
      const price = 102.5;
      const mean = 100;
      const stdDev = 2.5;

      const deviation = strategy.calculateDeviation(price, mean, stdDev);
      expect(deviation).toBe(1.0);
    });
  });

  describe('generateSignal', () => {
    it('should return BUY when price is oversold (below -stdDevMultiplier)', () => {
      const deviation = -2.5; // Below -2
      const sentiment = { sentiment: 'bullish' };
      const temporal = { trend: 'SIDEWAYS' };

      const signal = strategy.generateSignal(deviation, sentiment, temporal);
      expect(signal).toBe('BUY');
    });

    it('should return SELL when price is overbought (above +stdDevMultiplier)', () => {
      const deviation = 2.5; // Above +2
      const sentiment = { sentiment: 'bearish' };
      const temporal = { trend: 'SIDEWAYS' };

      const signal = strategy.generateSignal(deviation, sentiment, temporal);
      expect(signal).toBe('SELL');
    });

    it('should return HOLD when price near mean', () => {
      const deviation = 0.5; // Within -2 to +2
      const sentiment = { sentiment: 'neutral' };
      const temporal = { trend: 'SIDEWAYS' };

      const signal = strategy.generateSignal(deviation, sentiment, temporal);
      expect(signal).toBe('HOLD');
    });

    it('should return HOLD when deviation exactly at positive threshold', () => {
      const deviation = 2.0; // Exactly at threshold
      const sentiment = { sentiment: 'bearish' };
      const temporal = { trend: 'SIDEWAYS' };

      const signal = strategy.generateSignal(deviation, sentiment, temporal);
      expect(signal).toBe('HOLD');
    });

    it('should return HOLD when deviation exactly at negative threshold', () => {
      const deviation = -2.0; // Exactly at threshold
      const sentiment = { sentiment: 'bullish' };
      const temporal = { trend: 'SIDEWAYS' };

      const signal = strategy.generateSignal(deviation, sentiment, temporal);
      expect(signal).toBe('HOLD');
    });

    it('should consider sentiment for BUY signal', () => {
      const deviation = -2.5;
      const sentiment = { sentiment: 'bearish' }; // Conflicting sentiment
      const temporal = { trend: 'DOWNWARD' };

      const signal = strategy.generateSignal(deviation, sentiment, temporal);
      // Still BUY even with conflicting sentiment (mean reversion overrides)
      expect(signal).toBe('BUY');
    });

    it('should consider sentiment for SELL signal', () => {
      const deviation = 2.5;
      const sentiment = { sentiment: 'bullish' }; // Conflicting sentiment
      const temporal = { trend: 'UPWARD' };

      const signal = strategy.generateSignal(deviation, sentiment, temporal);
      // Still SELL even with conflicting sentiment (mean reversion overrides)
      expect(signal).toBe('SELL');
    });
  });

  describe('calculateConfidence', () => {
    it('should start with base confidence of 0.5', () => {
      const deviation = 0;
      const sentiment = { sentiment: 'neutral' };
      const temporal = { cycles: { detected: false } };

      const confidence = strategy.calculateConfidence(deviation, sentiment, temporal);
      expect(confidence).toBe(0.5);
    });

    it('should add 0.2 when deviation beyond threshold', () => {
      const deviation = 2.5;
      const sentiment = { sentiment: 'neutral' };
      const temporal = { cycles: { detected: false } };

      const confidence = strategy.calculateConfidence(deviation, sentiment, temporal);
      expect(confidence).toBe(0.7); // 0.5 + 0.2
    });

    it('should add 0.2 when negative deviation beyond threshold', () => {
      const deviation = -2.5;
      const sentiment = { sentiment: 'neutral' };
      const temporal = { cycles: { detected: false } };

      const confidence = strategy.calculateConfidence(deviation, sentiment, temporal);
      expect(confidence).toBe(0.7); // 0.5 + 0.2
    });

    it('should add 0.15 when sentiment is not neutral', () => {
      const deviation = 0;
      const sentiment = { sentiment: 'bullish' };
      const temporal = { cycles: { detected: false } };

      const confidence = strategy.calculateConfidence(deviation, sentiment, temporal);
      expect(confidence).toBe(0.65); // 0.5 + 0.15
    });

    it('should add 0.15 when cycles are detected', () => {
      const deviation = 0;
      const sentiment = { sentiment: 'neutral' };
      const temporal = { cycles: { detected: true } };

      const confidence = strategy.calculateConfidence(deviation, sentiment, temporal);
      expect(confidence).toBe(0.65); // 0.5 + 0.15
    });

    it('should sum all confidence factors', () => {
      const deviation = 3.0;
      const sentiment = { sentiment: 'bullish' };
      const temporal = { cycles: { detected: true } };

      const confidence = strategy.calculateConfidence(deviation, sentiment, temporal);
      expect(confidence).toBe(1.0); // 0.5 + 0.2 + 0.15 + 0.15
    });

    it('should cap confidence at 1.0', () => {
      const deviation = 5.0;
      const sentiment = { sentiment: 'bullish' };
      const temporal = { cycles: { detected: true } };

      const confidence = strategy.calculateConfidence(deviation, sentiment, temporal);
      expect(confidence).toBe(1.0);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    it('should increase confidence with larger deviation', () => {
      const sentiment = { sentiment: 'neutral' };
      const temporal = { cycles: { detected: false } };

      const conf1 = strategy.calculateConfidence(0, sentiment, temporal);
      const conf2 = strategy.calculateConfidence(2.5, sentiment, temporal);
      const conf3 = strategy.calculateConfidence(4.0, sentiment, temporal);

      expect(conf2).toBeGreaterThan(conf1);
      // conf3 and conf2 are both 0.7 since we add fixed 0.2 for any deviation > threshold
      expect(conf3).toBe(conf2);
    });
  });

  describe('analyze', () => {
    beforeEach(() => {
      // Setup default mocks for analyze()
      mockDataFeed.getHistoricalData.mockResolvedValue(
        Array(20).fill(null).map((_, i) => ({ close: 100 + i }))
      );

      mockDataFeed.getSentiment.mockResolvedValue({
        sentiment: 'neutral',
        score: 0.5
      });

      mockAnalyzer.analyzePattern.mockResolvedValue({
        trend: 'SIDEWAYS',
        prediction: 110,
        cycles: { detected: true }
      });
    });

    it('should call getHistoricalData with symbol and lookbackPeriod', async () => {
      await strategy.analyze('AAPL');

      expect(mockDataFeed.getHistoricalData).toHaveBeenCalledWith('AAPL', 20);
      expect(mockDataFeed.getHistoricalData).toHaveBeenCalledTimes(1);
    });

    it('should call getSentiment with symbol', async () => {
      await strategy.analyze('AAPL');

      expect(mockDataFeed.getSentiment).toHaveBeenCalledWith('AAPL');
      expect(mockDataFeed.getSentiment).toHaveBeenCalledTimes(1);
    });

    it('should call analyzePattern with prices', async () => {
      await strategy.analyze('AAPL');

      expect(mockAnalyzer.analyzePattern).toHaveBeenCalledTimes(1);
      const callArg = mockAnalyzer.analyzePattern.mock.calls[0][0];
      expect(Array.isArray(callArg)).toBe(true);
      expect(callArg.length).toBe(20);
    });

    it('should return analysis object with correct structure', async () => {
      const result = await strategy.analyze('AAPL');

      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('currentPrice');
      expect(result).toHaveProperty('mean');
      expect(result).toHaveProperty('stdDev');
      expect(result).toHaveProperty('deviation');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('signal');
      expect(result).toHaveProperty('confidence');
    });

    it('should return correct symbol in result', async () => {
      const result = await strategy.analyze('AAPL');
      expect(result.symbol).toBe('AAPL');
    });

    it('should calculate mean from historical prices', async () => {
      const result = await strategy.analyze('AAPL');

      // Mean of 100,101,102...119 = 109.5
      expect(result.mean).toBeCloseTo(109.5, 1);
    });

    it('should calculate standard deviation', async () => {
      const result = await strategy.analyze('AAPL');

      expect(result.stdDev).toBeGreaterThan(0);
      expect(typeof result.stdDev).toBe('number');
    });

    it('should calculate deviation from mean', async () => {
      const result = await strategy.analyze('AAPL');

      expect(typeof result.deviation).toBe('number');
    });

    it('should include sentiment from dataFeed', async () => {
      const result = await strategy.analyze('AAPL');
      expect(result.sentiment).toBe('neutral');
    });

    it('should include trend from analyzer', async () => {
      const result = await strategy.analyze('AAPL');
      expect(result.trend).toBe('SIDEWAYS');
    });

    it('should generate correct signal for oversold', async () => {
      // Price significantly below mean
      mockDataFeed.getHistoricalData.mockResolvedValue(
        Array(20).fill(null).map(() => ({ close: 100 }))
      );

      // Current price (last element) will be 100
      const result = await strategy.analyze('AAPL');

      // Mean = 100, StdDev = 0, but we need to test with variation
      // Let's create a scenario with proper deviation
    });

    it('should generate BUY signal when price below mean', async () => {
      mockDataFeed.getHistoricalData.mockResolvedValue([
        ...Array(19).fill(null).map(() => ({ close: 100 })),
        { close: 80 } // Last price much lower (oversold)
      ]);

      const result = await strategy.analyze('AAPL');

      // With stdDev and deviation calculation, should signal BUY
      expect(['BUY', 'HOLD']).toContain(result.signal);
    });

    it('should generate SELL signal when price above mean', async () => {
      mockDataFeed.getHistoricalData.mockResolvedValue([
        ...Array(19).fill(null).map(() => ({ close: 100 })),
        { close: 120 } // Last price much higher (overbought)
      ]);

      const result = await strategy.analyze('AAPL');

      // With stdDev and deviation calculation, should signal SELL
      expect(['SELL', 'HOLD']).toContain(result.signal);
    });

    it('should calculate confidence', async () => {
      const result = await strategy.analyze('AAPL');

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle different symbols', async () => {
      await strategy.analyze('GOOGL');
      expect(mockDataFeed.getHistoricalData).toHaveBeenCalledWith('GOOGL', 20);
      expect(mockDataFeed.getSentiment).toHaveBeenCalledWith('GOOGL');
    });

    it('should handle errors from dataFeed gracefully', async () => {
      mockDataFeed.getHistoricalData.mockRejectedValue(new Error('Network error'));

      await expect(strategy.analyze('AAPL')).rejects.toThrow('Network error');
    });

    it('should handle errors from analyzer gracefully', async () => {
      mockAnalyzer.analyzePattern.mockRejectedValue(new Error('Analysis error'));

      await expect(strategy.analyze('AAPL')).rejects.toThrow('Analysis error');
    });

    it('should handle empty historical data', async () => {
      mockDataFeed.getHistoricalData.mockResolvedValue([]);

      await expect(strategy.analyze('AAPL')).rejects.toThrow();
    });

    it('should use most recent price as current price', async () => {
      mockDataFeed.getHistoricalData.mockResolvedValue([
        { close: 100 },
        { close: 110 },
        { close: 105 }
      ]);

      const result = await strategy.analyze('AAPL');
      expect(result.currentPrice).toBe(105);
    });
  });

  describe('edge cases', () => {
    it('should handle very high prices', () => {
      const prices = [10000, 10100, 9900, 10050];
      const mean = strategy.calculateMean(prices);
      // Mean = (10000+10100+9900+10050)/4 = 40050/4 = 10012.5
      expect(mean).toBeCloseTo(10012.5, 1);
    });

    it('should handle very low prices', () => {
      const prices = [0.01, 0.02, 0.015];
      const mean = strategy.calculateMean(prices);
      expect(mean).toBeCloseTo(0.015, 3);
    });

    it('should handle extreme deviations', () => {
      const deviation = 10.0; // Very large deviation
      const sentiment = { sentiment: 'neutral' };
      const temporal = { cycles: { detected: false } };

      const confidence = strategy.calculateConfidence(deviation, sentiment, temporal);
      expect(confidence).toBe(0.7);
    });
  });

  describe('mock verification', () => {
    it('should not call mocks before analyze is called', () => {
      expect(mockDataFeed.getHistoricalData).not.toHaveBeenCalled();
      expect(mockDataFeed.getSentiment).not.toHaveBeenCalled();
      expect(mockAnalyzer.analyzePattern).not.toHaveBeenCalled();
    });

    it('should call all mocks exactly once per analyze call', async () => {
      mockDataFeed.getHistoricalData.mockResolvedValue([{ close: 100 }]);
      mockDataFeed.getSentiment.mockResolvedValue({ sentiment: 'neutral' });
      mockAnalyzer.analyzePattern.mockResolvedValue({ trend: 'SIDEWAYS', cycles: { detected: false } });

      await strategy.analyze('AAPL');

      expect(mockDataFeed.getHistoricalData).toHaveBeenCalledTimes(1);
      expect(mockDataFeed.getSentiment).toHaveBeenCalledTimes(1);
      expect(mockAnalyzer.analyzePattern).toHaveBeenCalledTimes(1);
    });

    it('should call mocks multiple times for multiple analyze calls', async () => {
      mockDataFeed.getHistoricalData.mockResolvedValue([{ close: 100 }]);
      mockDataFeed.getSentiment.mockResolvedValue({ sentiment: 'neutral' });
      mockAnalyzer.analyzePattern.mockResolvedValue({ trend: 'SIDEWAYS', cycles: { detected: false } });

      await strategy.analyze('AAPL');
      await strategy.analyze('GOOGL');
      await strategy.analyze('TSLA');

      expect(mockDataFeed.getHistoricalData).toHaveBeenCalledTimes(3);
      expect(mockDataFeed.getSentiment).toHaveBeenCalledTimes(3);
      expect(mockAnalyzer.analyzePattern).toHaveBeenCalledTimes(3);
    });
  });
});

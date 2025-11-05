const MomentumStrategy = require('./MomentumStrategy');

// Mock dependencies
jest.mock('../data/MockDataFeed');
jest.mock('../core/TemporalAnalyzer');

const MockDataFeed = require('../data/MockDataFeed');
const TemporalAnalyzer = require('../core/TemporalAnalyzer');

describe('MomentumStrategy', () => {
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

    strategy = new MomentumStrategy(mockDataFeed, mockAnalyzer);
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(strategy).toBeDefined();
      expect(strategy).toBeInstanceOf(MomentumStrategy);
    });

    it('should store dataFeed dependency', () => {
      expect(strategy.dataFeed).toBe(mockDataFeed);
    });

    it('should store analyzer dependency', () => {
      expect(strategy.analyzer).toBe(mockAnalyzer);
    });

    it('should initialize with default lookbackPeriod of 10', () => {
      expect(strategy.lookbackPeriod).toBe(10);
    });

    it('should initialize with default threshold of 0.02', () => {
      expect(strategy.threshold).toBe(0.02);
    });
  });

  describe('calculateMomentum', () => {
    it('should calculate positive momentum when recent prices higher', () => {
      // Older prices: avg = 100
      // Recent prices: avg = 105
      // Momentum = (105 - 100) / 100 = 0.05
      const prices = [100, 100, 100, 100, 100, 105, 105, 105, 105, 105];
      const momentum = strategy.calculateMomentum(prices);
      expect(momentum).toBeCloseTo(0.05, 4);
    });

    it('should calculate negative momentum when recent prices lower', () => {
      // Older prices: avg = 100
      // Recent prices: avg = 95
      // Momentum = (95 - 100) / 100 = -0.05
      const prices = [100, 100, 100, 100, 100, 95, 95, 95, 95, 95];
      const momentum = strategy.calculateMomentum(prices);
      expect(momentum).toBeCloseTo(-0.05, 4);
    });

    it('should calculate zero momentum when prices are flat', () => {
      const prices = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
      const momentum = strategy.calculateMomentum(prices);
      expect(momentum).toBe(0);
    });

    it('should use last 5 prices for recent average', () => {
      const prices = [50, 50, 50, 50, 50, 100, 100, 100, 100, 100];
      const momentum = strategy.calculateMomentum(prices);
      // Recent: 100, Older: 50, Momentum = (100-50)/50 = 1.0
      expect(momentum).toBeCloseTo(1.0, 4);
    });

    it('should use first 5 prices for older average', () => {
      const prices = [200, 200, 200, 200, 200, 100, 100, 100, 100, 100];
      const momentum = strategy.calculateMomentum(prices);
      // Recent: 100, Older: 200, Momentum = (100-200)/200 = -0.5
      expect(momentum).toBeCloseTo(-0.5, 4);
    });

    it('should handle decimal prices', () => {
      const prices = [150.50, 150.50, 150.50, 150.50, 150.50, 153.01, 153.01, 153.01, 153.01, 153.01];
      const momentum = strategy.calculateMomentum(prices);
      // Recent: 153.01, Older: 150.50, Momentum = (153.01-150.50)/150.50
      expect(momentum).toBeCloseTo(0.016678, 4);
    });

    it('should handle large price values', () => {
      const prices = [2800, 2800, 2800, 2800, 2800, 2856, 2856, 2856, 2856, 2856];
      const momentum = strategy.calculateMomentum(prices);
      // Momentum = (2856-2800)/2800 = 0.02
      expect(momentum).toBeCloseTo(0.02, 4);
    });
  });

  describe('generateSignal', () => {
    it('should return BUY when all conditions are bullish', () => {
      const momentum = 0.03; // Above threshold (0.02)
      const sentiment = { sentiment: 'bullish' };
      const temporal = { trend: 'UPWARD' };

      const signal = strategy.generateSignal(momentum, sentiment, temporal);
      expect(signal).toBe('BUY');
    });

    it('should return SELL when all conditions are bearish', () => {
      const momentum = -0.03; // Below -threshold (-0.02)
      const sentiment = { sentiment: 'bearish' };
      const temporal = { trend: 'DOWNWARD' };

      const signal = strategy.generateSignal(momentum, sentiment, temporal);
      expect(signal).toBe('SELL');
    });

    it('should return HOLD when momentum is positive but sentiment not bullish', () => {
      const momentum = 0.03;
      const sentiment = { sentiment: 'neutral' };
      const temporal = { trend: 'UPWARD' };

      const signal = strategy.generateSignal(momentum, sentiment, temporal);
      expect(signal).toBe('HOLD');
    });

    it('should return HOLD when momentum is positive but trend not upward', () => {
      const momentum = 0.03;
      const sentiment = { sentiment: 'bullish' };
      const temporal = { trend: 'SIDEWAYS' };

      const signal = strategy.generateSignal(momentum, sentiment, temporal);
      expect(signal).toBe('HOLD');
    });

    it('should return HOLD when momentum below threshold', () => {
      const momentum = 0.01; // Below threshold
      const sentiment = { sentiment: 'bullish' };
      const temporal = { trend: 'UPWARD' };

      const signal = strategy.generateSignal(momentum, sentiment, temporal);
      expect(signal).toBe('HOLD');
    });

    it('should return HOLD when momentum is negative but sentiment not bearish', () => {
      const momentum = -0.03;
      const sentiment = { sentiment: 'neutral' };
      const temporal = { trend: 'DOWNWARD' };

      const signal = strategy.generateSignal(momentum, sentiment, temporal);
      expect(signal).toBe('HOLD');
    });

    it('should return HOLD when momentum is negative but trend not downward', () => {
      const momentum = -0.03;
      const sentiment = { sentiment: 'bearish' };
      const temporal = { trend: 'SIDEWAYS' };

      const signal = strategy.generateSignal(momentum, sentiment, temporal);
      expect(signal).toBe('HOLD');
    });

    it('should return HOLD when momentum exactly at threshold', () => {
      const momentum = 0.02; // Exactly at threshold
      const sentiment = { sentiment: 'bullish' };
      const temporal = { trend: 'UPWARD' };

      const signal = strategy.generateSignal(momentum, sentiment, temporal);
      expect(signal).toBe('HOLD');
    });

    it('should return HOLD when momentum exactly at negative threshold', () => {
      const momentum = -0.02; // Exactly at negative threshold
      const sentiment = { sentiment: 'bearish' };
      const temporal = { trend: 'DOWNWARD' };

      const signal = strategy.generateSignal(momentum, sentiment, temporal);
      expect(signal).toBe('HOLD');
    });
  });

  describe('calculateConfidence', () => {
    it('should start with base confidence of 0.5', () => {
      const momentum = 0;
      const sentiment = { sentiment: 'neutral' };
      const temporal = { cycles: { detected: false } };

      const confidence = strategy.calculateConfidence(momentum, sentiment, temporal);
      expect(confidence).toBe(0.5);
    });

    it('should add 0.2 when momentum exceeds threshold', () => {
      const momentum = 0.03;
      const sentiment = { sentiment: 'neutral' };
      const temporal = { cycles: { detected: false } };

      const confidence = strategy.calculateConfidence(momentum, sentiment, temporal);
      expect(confidence).toBe(0.7); // 0.5 + 0.2
    });

    it('should add 0.2 when negative momentum exceeds threshold', () => {
      const momentum = -0.03;
      const sentiment = { sentiment: 'neutral' };
      const temporal = { cycles: { detected: false } };

      const confidence = strategy.calculateConfidence(momentum, sentiment, temporal);
      expect(confidence).toBe(0.7); // 0.5 + 0.2
    });

    it('should add 0.15 when sentiment is not neutral', () => {
      const momentum = 0;
      const sentiment = { sentiment: 'bullish' };
      const temporal = { cycles: { detected: false } };

      const confidence = strategy.calculateConfidence(momentum, sentiment, temporal);
      expect(confidence).toBe(0.65); // 0.5 + 0.15
    });

    it('should add 0.15 for bearish sentiment', () => {
      const momentum = 0;
      const sentiment = { sentiment: 'bearish' };
      const temporal = { cycles: { detected: false } };

      const confidence = strategy.calculateConfidence(momentum, sentiment, temporal);
      expect(confidence).toBe(0.65); // 0.5 + 0.15
    });

    it('should add 0.15 when cycles are detected', () => {
      const momentum = 0;
      const sentiment = { sentiment: 'neutral' };
      const temporal = { cycles: { detected: true } };

      const confidence = strategy.calculateConfidence(momentum, sentiment, temporal);
      expect(confidence).toBe(0.65); // 0.5 + 0.15
    });

    it('should sum all confidence factors', () => {
      const momentum = 0.03;
      const sentiment = { sentiment: 'bullish' };
      const temporal = { cycles: { detected: true } };

      const confidence = strategy.calculateConfidence(momentum, sentiment, temporal);
      expect(confidence).toBe(1.0); // 0.5 + 0.2 + 0.15 + 0.15
    });

    it('should cap confidence at 1.0', () => {
      // Even if factors sum to > 1.0, should cap at 1.0
      const momentum = 0.05;
      const sentiment = { sentiment: 'bullish' };
      const temporal = { cycles: { detected: true } };

      const confidence = strategy.calculateConfidence(momentum, sentiment, temporal);
      expect(confidence).toBe(1.0);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    it('should not add momentum bonus at threshold', () => {
      const momentum = 0.02; // Exactly at threshold
      const sentiment = { sentiment: 'neutral' };
      const temporal = { cycles: { detected: false } };

      const confidence = strategy.calculateConfidence(momentum, sentiment, temporal);
      expect(confidence).toBe(0.5); // No bonus
    });
  });

  describe('analyze', () => {
    beforeEach(() => {
      // Setup default mocks for analyze()
      mockDataFeed.getHistoricalData.mockResolvedValue([
        { close: 100 }, { close: 101 }, { close: 102 }, { close: 103 }, { close: 104 },
        { close: 105 }, { close: 106 }, { close: 107 }, { close: 108 }, { close: 109 }
      ]);

      mockDataFeed.getSentiment.mockResolvedValue({
        sentiment: 'bullish',
        score: 0.8
      });

      mockAnalyzer.analyzePattern.mockResolvedValue({
        trend: 'UPWARD',
        prediction: 110,
        cycles: { detected: true }
      });
    });

    it('should call getHistoricalData with symbol and lookbackPeriod', async () => {
      await strategy.analyze('AAPL');

      expect(mockDataFeed.getHistoricalData).toHaveBeenCalledWith('AAPL', 10);
      expect(mockDataFeed.getHistoricalData).toHaveBeenCalledTimes(1);
    });

    it('should call getSentiment with symbol', async () => {
      await strategy.analyze('AAPL');

      expect(mockDataFeed.getSentiment).toHaveBeenCalledWith('AAPL');
      expect(mockDataFeed.getSentiment).toHaveBeenCalledTimes(1);
    });

    it('should call analyzePattern with prices', async () => {
      await strategy.analyze('AAPL');

      const expectedPrices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109];
      expect(mockAnalyzer.analyzePattern).toHaveBeenCalledWith(expectedPrices);
      expect(mockAnalyzer.analyzePattern).toHaveBeenCalledTimes(1);
    });

    it('should return analysis object with correct structure', async () => {
      const result = await strategy.analyze('AAPL');

      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('momentum');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('prediction');
      expect(result).toHaveProperty('signal');
      expect(result).toHaveProperty('confidence');
    });

    it('should return correct symbol in result', async () => {
      const result = await strategy.analyze('AAPL');
      expect(result.symbol).toBe('AAPL');
    });

    it('should calculate momentum from prices', async () => {
      const result = await strategy.analyze('AAPL');

      // Recent avg: (105+106+107+108+109)/5 = 107
      // Older avg: (100+101+102+103+104)/5 = 102
      // Momentum: (107-102)/102 = 0.049
      expect(result.momentum).toBeCloseTo(0.049, 2);
    });

    it('should include sentiment from dataFeed', async () => {
      const result = await strategy.analyze('AAPL');
      expect(result.sentiment).toBe('bullish');
    });

    it('should include trend from analyzer', async () => {
      const result = await strategy.analyze('AAPL');
      expect(result.trend).toBe('UPWARD');
    });

    it('should include prediction from analyzer', async () => {
      const result = await strategy.analyze('AAPL');
      expect(result.prediction).toBe(110);
    });

    it('should generate correct signal', async () => {
      const result = await strategy.analyze('AAPL');
      // Momentum > 0.02, sentiment bullish, trend UPWARD
      expect(result.signal).toBe('BUY');
    });

    it('should calculate confidence', async () => {
      const result = await strategy.analyze('AAPL');
      // 0.5 + 0.2 (momentum) + 0.15 (sentiment) + 0.15 (cycles) = 1.0
      expect(result.confidence).toBe(1.0);
    });

    it('should handle different symbols', async () => {
      await strategy.analyze('GOOGL');
      expect(mockDataFeed.getHistoricalData).toHaveBeenCalledWith('GOOGL', 10);
      expect(mockDataFeed.getSentiment).toHaveBeenCalledWith('GOOGL');
    });

    it('should handle bearish signals', async () => {
      mockDataFeed.getHistoricalData.mockResolvedValue([
        { close: 109 }, { close: 108 }, { close: 107 }, { close: 106 }, { close: 105 },
        { close: 104 }, { close: 103 }, { close: 102 }, { close: 101 }, { close: 100 }
      ]);

      mockDataFeed.getSentiment.mockResolvedValue({
        sentiment: 'bearish',
        score: 0.2
      });

      mockAnalyzer.analyzePattern.mockResolvedValue({
        trend: 'DOWNWARD',
        prediction: 95,
        cycles: { detected: false }
      });

      const result = await strategy.analyze('AAPL');
      expect(result.signal).toBe('SELL');
    });

    it('should handle HOLD signals', async () => {
      mockDataFeed.getSentiment.mockResolvedValue({
        sentiment: 'neutral',
        score: 0.5
      });

      const result = await strategy.analyze('AAPL');
      // Even with upward momentum, neutral sentiment causes HOLD
      expect(result.signal).toBe('HOLD');
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

      // Will throw when trying to calculate momentum
      await expect(strategy.analyze('AAPL')).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very small price values', () => {
      const prices = [0.01, 0.01, 0.01, 0.01, 0.01, 0.02, 0.02, 0.02, 0.02, 0.02];
      const momentum = strategy.calculateMomentum(prices);
      expect(momentum).toBeCloseTo(1.0, 2); // 100% increase
    });

    it('should handle very large momentum values', () => {
      const prices = [10, 10, 10, 10, 10, 100, 100, 100, 100, 100];
      const momentum = strategy.calculateMomentum(prices);
      expect(momentum).toBeCloseTo(9.0, 2); // 900% increase
    });

    it('should handle mixed volatility', () => {
      const prices = [100, 110, 90, 105, 95, 102, 108, 98, 103, 107];
      const momentum = strategy.calculateMomentum(prices);
      expect(momentum).toBeGreaterThan(-1);
      expect(momentum).toBeLessThan(1);
    });
  });

  describe('mock verification', () => {
    it('should not call mocks before analyze is called', () => {
      expect(mockDataFeed.getHistoricalData).not.toHaveBeenCalled();
      expect(mockDataFeed.getSentiment).not.toHaveBeenCalled();
      expect(mockAnalyzer.analyzePattern).not.toHaveBeenCalled();
    });

    it('should call all mocks exactly once per analyze call', async () => {
      mockDataFeed.getHistoricalData.mockResolvedValue([
        { close: 100 }, { close: 101 }, { close: 102 }, { close: 103 }, { close: 104 },
        { close: 105 }, { close: 106 }, { close: 107 }, { close: 108 }, { close: 109 }
      ]);
      mockDataFeed.getSentiment.mockResolvedValue({ sentiment: 'bullish' });
      mockAnalyzer.analyzePattern.mockResolvedValue({ trend: 'UPWARD', cycles: { detected: false } });

      await strategy.analyze('AAPL');

      expect(mockDataFeed.getHistoricalData).toHaveBeenCalledTimes(1);
      expect(mockDataFeed.getSentiment).toHaveBeenCalledTimes(1);
      expect(mockAnalyzer.analyzePattern).toHaveBeenCalledTimes(1);
    });

    it('should call mocks multiple times for multiple analyze calls', async () => {
      mockDataFeed.getHistoricalData.mockResolvedValue([
        { close: 100 }, { close: 101 }, { close: 102 }, { close: 103 }, { close: 104 },
        { close: 105 }, { close: 106 }, { close: 107 }, { close: 108 }, { close: 109 }
      ]);
      mockDataFeed.getSentiment.mockResolvedValue({ sentiment: 'bullish' });
      mockAnalyzer.analyzePattern.mockResolvedValue({ trend: 'UPWARD', cycles: { detected: false } });

      await strategy.analyze('AAPL');
      await strategy.analyze('GOOGL');
      await strategy.analyze('TSLA');

      expect(mockDataFeed.getHistoricalData).toHaveBeenCalledTimes(3);
      expect(mockDataFeed.getSentiment).toHaveBeenCalledTimes(3);
      expect(mockAnalyzer.analyzePattern).toHaveBeenCalledTimes(3);
    });
  });
});

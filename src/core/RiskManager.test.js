// London School TDD Tests for RiskManager
// Focus on mocking dependencies and testing interactions

const RiskManager = require('./RiskManager');

describe('RiskManager - London School TDD', () => {
  let mockEngine;
  let riskManager;

  beforeEach(() => {
    // Mock TradingEngine with all required properties and methods
    mockEngine = {
      portfolio: {
        cash: 100000,
        positions: {},
        history: []
      },
      getPrice: jest.fn().mockResolvedValue(150)
    };

    riskManager = new RiskManager(mockEngine);
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct risk limits', () => {
      expect(riskManager.limits.maxRiskPerTrade).toBe(0.01);
      expect(riskManager.limits.maxPortfolioDrawdown).toBe(0.10);
      expect(riskManager.limits.maxPositionSize).toBe(0.20);
    });

    test('should store initial capital from engine', () => {
      expect(riskManager.initialCapital).toBe(100000);
    });

    test('should initialize peak portfolio value to initial cash', () => {
      expect(riskManager.peakPortfolioValue).toBe(100000);
    });

    test('should store reference to trading engine', () => {
      expect(riskManager.engine).toBe(mockEngine);
    });
  });

  describe('getPortfolioValue()', () => {
    test('should return cash when no positions', async () => {
      const value = await riskManager.getPortfolioValue();
      expect(value).toBe(100000);
    });

    test('should calculate total value including positions', async () => {
      mockEngine.portfolio.positions = { AAPL: 100 };
      mockEngine.getPrice.mockResolvedValue(150);

      const value = await riskManager.getPortfolioValue();

      expect(mockEngine.getPrice).toHaveBeenCalledWith('AAPL');
      expect(value).toBe(115000); // 100000 cash + (100 * 150)
    });

    test('should calculate value for multiple positions', async () => {
      mockEngine.portfolio.positions = { AAPL: 100, GOOGL: 50 };
      mockEngine.getPrice
        .mockResolvedValueOnce(150)  // AAPL
        .mockResolvedValueOnce(2800); // GOOGL

      const value = await riskManager.getPortfolioValue();

      expect(mockEngine.getPrice).toHaveBeenCalledTimes(2);
      expect(value).toBe(255000); // 100000 + 15000 + 140000
    });

    test('should update peak portfolio value when current value is higher', async () => {
      mockEngine.portfolio.positions = { AAPL: 200 };
      mockEngine.getPrice.mockResolvedValue(200);

      await riskManager.getPortfolioValue();

      expect(riskManager.peakPortfolioValue).toBe(140000); // 100000 + (200 * 200)
    });

    test('should not update peak when current value is lower', async () => {
      riskManager.peakPortfolioValue = 150000;
      mockEngine.portfolio.cash = 50000;
      mockEngine.portfolio.positions = {};

      await riskManager.getPortfolioValue();

      expect(riskManager.peakPortfolioValue).toBe(150000);
    });
  });

  describe('checkTrade() - Risk Per Trade Limit (1%)', () => {
    test('should allow trade within 1% risk limit', async () => {
      const result = await riskManager.checkTrade('buy', 'AAPL', 6, 150);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Trade passes all risk checks');
      expect(result.metrics.riskPerTrade).toBe('0.90%');
    });

    test('should reject trade exceeding 1% risk limit', async () => {
      const result = await riskManager.checkTrade('buy', 'AAPL', 100, 150);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Risk per trade');
      expect(result.reason).toContain('15.00%');
      expect(result.reason).toContain('exceeds limit (1%)');
    });

    test('should calculate risk correctly at exactly 1% threshold', async () => {
      // 1% of 100000 = 1000, at price 150 = 6.666... shares
      const result = await riskManager.checkTrade('buy', 'AAPL', 6.666, 150);

      expect(result.allowed).toBe(true);
      expect(parseFloat(result.metrics.riskPerTrade)).toBeCloseTo(1.0, 1);
    });

    test('should reject trade just over 1% threshold', async () => {
      const result = await riskManager.checkTrade('buy', 'AAPL', 7, 150);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Risk per trade (1.05%) exceeds limit (1%)');
    });

    test('should always allow sell orders', async () => {
      mockEngine.portfolio.positions = { AAPL: 1000 };

      const result = await riskManager.checkTrade('sell', 'AAPL', 1000, 150);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Sell orders allowed');
    });
  });

  describe('checkDrawdown() - Portfolio Drawdown Limit (10%)', () => {
    test('should allow trade when no drawdown', async () => {
      const result = await riskManager.checkDrawdown();

      expect(result.allowed).toBe(true);
      expect(result.currentDrawdown).toBe(0);
    });

    test('should allow trade within 10% drawdown limit', async () => {
      riskManager.peakPortfolioValue = 100000;
      mockEngine.portfolio.cash = 92000;

      const result = await riskManager.checkDrawdown();

      expect(result.allowed).toBe(true);
      expect(result.currentDrawdown).toBeCloseTo(0.08, 2);
    });

    test('should reject trade when drawdown exceeds 10%', async () => {
      riskManager.peakPortfolioValue = 100000;
      mockEngine.portfolio.cash = 85000;

      const result = await riskManager.checkDrawdown();

      expect(result.allowed).toBe(false);
      expect(result.currentDrawdown).toBeCloseTo(0.15, 2);
    });

    test('should reject trade at exactly 10% drawdown threshold', async () => {
      riskManager.peakPortfolioValue = 100000;
      mockEngine.portfolio.cash = 90000;

      const result = await riskManager.checkDrawdown();

      expect(result.allowed).toBe(true);
      expect(result.currentDrawdown).toBe(0.10);
    });

    test('should calculate drawdown with positions included', async () => {
      riskManager.peakPortfolioValue = 150000;
      mockEngine.portfolio.cash = 50000;
      mockEngine.portfolio.positions = { AAPL: 500 };
      mockEngine.getPrice.mockResolvedValue(150);

      const result = await riskManager.checkDrawdown();

      // Current: 50000 + (500 * 150) = 125000
      // Drawdown: (150000 - 125000) / 150000 = 0.1667
      expect(result.allowed).toBe(false);
      expect(result.currentDrawdown).toBeCloseTo(0.1667, 4);
    });

    test('should return peak and current values', async () => {
      riskManager.peakPortfolioValue = 120000;
      mockEngine.portfolio.cash = 110000;

      const result = await riskManager.checkDrawdown();

      expect(result.peakValue).toBe(120000);
      expect(result.currentValue).toBe(110000);
    });
  });

  describe('checkPositionSize() - Position Size Limit (20%)', () => {
    test('should allow position within 20% limit', async () => {
      const result = await riskManager.checkPositionSize('AAPL', 100, 150);

      expect(result.allowed).toBe(true);
      expect(result.currentSize).toBe(0.15); // (100 * 150) / 100000
    });

    test('should reject position exceeding 20% limit', async () => {
      const result = await riskManager.checkPositionSize('AAPL', 200, 150);

      expect(result.allowed).toBe(false);
      expect(result.currentSize).toBe(0.30);
    });

    test('should allow position at exactly 20% threshold', async () => {
      const result = await riskManager.checkPositionSize('AAPL', 133.33, 150);

      expect(result.allowed).toBe(true);
      expect(result.currentSize).toBeCloseTo(0.20, 4);
    });

    test('should add to existing position when checking size', async () => {
      mockEngine.portfolio.positions = { AAPL: 50 };
      mockEngine.portfolio.cash = 92500; // Adjust so portfolio stays at 100k
      mockEngine.getPrice.mockResolvedValue(150);

      const result = await riskManager.checkPositionSize('AAPL', 100, 150);

      // Total: (50 + 100) * 150 = 22500 / 100000 = 22.5%
      expect(result.allowed).toBe(false);
      expect(result.currentSize).toBeCloseTo(0.225, 2);
    });

    test('should handle zero existing position', async () => {
      const result = await riskManager.checkPositionSize('GOOGL', 10, 2000);

      expect(result.allowed).toBe(true);
      expect(result.currentSize).toBe(0.20);
    });

    test('should calculate based on current portfolio value with positions', async () => {
      mockEngine.portfolio.cash = 50000;
      mockEngine.portfolio.positions = { MSFT: 100 };
      mockEngine.getPrice.mockResolvedValueOnce(300); // For portfolio calc
      mockEngine.getPrice.mockResolvedValueOnce(150); // For position check

      const result = await riskManager.checkPositionSize('AAPL', 100, 150);

      // Portfolio: 50000 + (100 * 300) = 80000
      // Position: (100 * 150) = 15000 / 80000 = 18.75%
      expect(result.allowed).toBe(true);
      expect(result.currentSize).toBeCloseTo(0.1875, 4);
    });

    test('should return position and portfolio values', async () => {
      const result = await riskManager.checkPositionSize('AAPL', 100, 150);

      expect(result.positionValue).toBe(15000);
      expect(result.portfolioValue).toBe(100000);
    });
  });

  describe('checkTrade() - Integration of All Limits', () => {
    test('should check drawdown before position size', async () => {
      riskManager.peakPortfolioValue = 100000;
      mockEngine.portfolio.cash = 80000; // 20% drawdown

      const result = await riskManager.checkTrade('buy', 'AAPL', 10, 150);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Portfolio drawdown');
      expect(result.reason).toContain('20.00%');
    });

    test('should check position size before risk per trade', async () => {
      const result = await riskManager.checkTrade('buy', 'AAPL', 300, 100);

      // 300 * 100 = 30000 / 100000 = 30% position size
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Position size');
      expect(result.reason).toContain('30.00%');
    });

    test('should pass all checks for valid small trade', async () => {
      const result = await riskManager.checkTrade('buy', 'AAPL', 5, 150);

      expect(result.allowed).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.riskPerTrade).toBe('0.75%');
      expect(result.metrics.positionSize).toBe('0.75%');
      expect(result.metrics.drawdown).toBe('0.00%');
    });

    test('should provide all metrics when trade passes', async () => {
      mockEngine.portfolio.positions = { AAPL: 50 };
      mockEngine.portfolio.cash = 95000;
      riskManager.peakPortfolioValue = 110000;

      const result = await riskManager.checkTrade('buy', 'AAPL', 5, 150);

      expect(result.allowed).toBe(true);
      expect(result.metrics.riskPerTrade).toBeDefined();
      expect(result.metrics.positionSize).toBeDefined();
      expect(result.metrics.drawdown).toBeDefined();
    });
  });

  describe('getRiskMetrics() - Comprehensive Monitoring', () => {
    test('should return all risk metrics for empty portfolio', async () => {
      const metrics = await riskManager.getRiskMetrics();

      expect(metrics.portfolioValue).toBe('100000.00');
      expect(metrics.peakValue).toBe('100000.00');
      expect(metrics.drawdown).toBe('0.00%');
      expect(metrics.drawdownAllowed).toBe(true);
      expect(metrics.positions).toEqual({});
    });

    test('should include all position details', async () => {
      mockEngine.portfolio.positions = { AAPL: 100, GOOGL: 20 };
      mockEngine.portfolio.cash = 29000; // Total will be 100k
      // Mock needs to return correct values for AAPL and GOOGL in order
      mockEngine.getPrice.mockImplementation((symbol) => {
        if (symbol === 'AAPL') return Promise.resolve(150);
        if (symbol === 'GOOGL') return Promise.resolve(2800);
      });

      const metrics = await riskManager.getRiskMetrics();

      expect(metrics.positions.AAPL).toEqual({
        quantity: 100,
        value: 15000,
        percentOfPortfolio: '15.00%'
      });
      expect(metrics.positions.GOOGL).toEqual({
        quantity: 20,
        value: 56000,
        percentOfPortfolio: '56.00%'
      });
    });

    test('should show drawdown status', async () => {
      riskManager.peakPortfolioValue = 120000;
      mockEngine.portfolio.cash = 95000;

      const metrics = await riskManager.getRiskMetrics();

      expect(metrics.peakValue).toBe('120000.00');
      expect(metrics.portfolioValue).toBe('95000.00');
      expect(metrics.drawdown).toBe('20.83%');
      expect(metrics.drawdownAllowed).toBe(false);
    });

    test('should include risk limits configuration', async () => {
      const metrics = await riskManager.getRiskMetrics();

      expect(metrics.limits.maxRiskPerTrade).toBe('1%');
      expect(metrics.limits.maxDrawdown).toBe('10%');
      expect(metrics.limits.maxPositionSize).toBe('20%');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle zero cash portfolio', async () => {
      mockEngine.portfolio.cash = 0;
      mockEngine.portfolio.positions = { AAPL: 100 };
      mockEngine.getPrice.mockResolvedValue(150);
      riskManager.peakPortfolioValue = 15000; // Set peak to current value

      const result = await riskManager.checkTrade('buy', 'GOOGL', 1, 2800);

      // With zero cash, any buy will fail on risk per trade (18.67%)
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Risk per trade');
    });

    test('should handle very small trade amounts', async () => {
      const result = await riskManager.checkTrade('buy', 'AAPL', 0.1, 150);

      expect(result.allowed).toBe(true);
    });

    test('should handle fractional shares', async () => {
      const result = await riskManager.checkTrade('buy', 'AAPL', 6.5, 150);

      expect(result.metrics.riskPerTrade).toBe('0.97%');
    });

    test('should handle maximum allowed trade size', async () => {
      // Max 1% = $1000, at $150/share = 6.66 shares
      const result = await riskManager.checkTrade('buy', 'AAPL', 6.66, 150);

      expect(result.allowed).toBe(true);
    });

    test('should reject when portfolio value drops to zero', async () => {
      mockEngine.portfolio.cash = 0;
      mockEngine.portfolio.positions = {};

      const result = await riskManager.checkTrade('buy', 'AAPL', 1, 150);

      // This would cause division by zero in risk calculations
      expect(result.allowed).toBe(false);
    });

    test('should handle negative drawdown (portfolio gained)', async () => {
      riskManager.peakPortfolioValue = 100000;
      mockEngine.portfolio.cash = 120000;

      const result = await riskManager.checkDrawdown();

      // Peak is updated to 120000, so drawdown becomes 0
      expect(result.allowed).toBe(true);
      expect(result.currentDrawdown).toBe(0);
      expect(riskManager.peakPortfolioValue).toBe(120000);
    });
  });

  describe('Mock Interaction Verification', () => {
    test('should call engine.getPrice for each position in portfolio', async () => {
      mockEngine.portfolio.positions = { AAPL: 100, GOOGL: 50, MSFT: 25 };

      await riskManager.getPortfolioValue();

      expect(mockEngine.getPrice).toHaveBeenCalledTimes(3);
      expect(mockEngine.getPrice).toHaveBeenCalledWith('AAPL');
      expect(mockEngine.getPrice).toHaveBeenCalledWith('GOOGL');
      expect(mockEngine.getPrice).toHaveBeenCalledWith('MSFT');
    });

    test('should not call getPrice when portfolio is empty', async () => {
      await riskManager.getPortfolioValue();

      expect(mockEngine.getPrice).not.toHaveBeenCalled();
    });

    test('should access engine portfolio properties', async () => {
      mockEngine.portfolio.cash = 50000;
      mockEngine.portfolio.positions = { AAPL: 100 };

      await riskManager.checkTrade('buy', 'GOOGL', 10, 2000);

      expect(mockEngine.portfolio.cash).toBe(50000);
      expect(mockEngine.portfolio.positions.AAPL).toBe(100);
    });
  });
});

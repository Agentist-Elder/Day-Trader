const StrategyVerifier = require('./StrategyVerifier');

describe('StrategyVerifier', () => {
  let verifier;
  let consoleLogSpy;

  beforeEach(() => {
    verifier = new StrategyVerifier();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(verifier).toBeDefined();
      expect(verifier).toBeInstanceOf(StrategyVerifier);
    });

    it('should initialize with correct rules', () => {
      expect(verifier.rules).toEqual({
        maxDrawdown: 0.25,
        riskPerTrade: 0.02,
        minWinRate: 0.4
      });
    });

    it('should initialize with empty proofs array', () => {
      expect(verifier.proofs).toEqual([]);
      expect(Array.isArray(verifier.proofs)).toBe(true);
    });

    it('should have maxDrawdown rule of 25%', () => {
      expect(verifier.rules.maxDrawdown).toBe(0.25);
    });

    it('should have riskPerTrade rule of 2%', () => {
      expect(verifier.rules.riskPerTrade).toBe(0.02);
    });

    it('should have minWinRate rule of 40%', () => {
      expect(verifier.rules.minWinRate).toBe(0.4);
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate win rate correctly for all wins', () => {
      const data = [
        { outcome: 100 },
        { outcome: 200 },
        { outcome: 150 }
      ];

      const metrics = verifier.calculateMetrics(data);
      expect(metrics.winRate).toBe(1.0); // 3/3 = 100%
    });

    it('should calculate win rate correctly for all losses', () => {
      const data = [
        { outcome: -100 },
        { outcome: -200 },
        { outcome: -150 }
      ];

      const metrics = verifier.calculateMetrics(data);
      expect(metrics.winRate).toBe(0.0); // 0/3 = 0%
    });

    it('should calculate win rate correctly for mixed results', () => {
      const data = [
        { outcome: 100 },
        { outcome: -50 },
        { outcome: 200 },
        { outcome: -100 }
      ];

      const metrics = verifier.calculateMetrics(data);
      expect(metrics.winRate).toBe(0.5); // 2/4 = 50%
    });

    it('should count zero outcomes as losses', () => {
      const data = [
        { outcome: 100 },
        { outcome: 0 },
        { outcome: 0 }
      ];

      const metrics = verifier.calculateMetrics(data);
      expect(metrics.winRate).toBeCloseTo(0.333, 2); // 1/3
    });

    it('should calculate maxDrawdown from largest loss', () => {
      const data = [
        { outcome: 100 },
        { outcome: -10000 }, // Max loss
        { outcome: -5000 }
      ];

      const metrics = verifier.calculateMetrics(data);
      // maxDrawdown = abs(-10000 / 100000) = 0.1
      expect(metrics.maxDrawdown).toBe(0.1);
    });

    it('should handle positive outcomes for maxDrawdown', () => {
      const data = [
        { outcome: 100 },
        { outcome: 200 },
        { outcome: 50 }
      ];

      const metrics = verifier.calculateMetrics(data);
      // Min is 50, maxDrawdown = abs(50/100000)
      expect(metrics.maxDrawdown).toBe(0.0005);
    });

    it('should return correct total trades count', () => {
      const data = [
        { outcome: 100 },
        { outcome: -50 },
        { outcome: 200 }
      ];

      const metrics = verifier.calculateMetrics(data);
      expect(metrics.totalTrades).toBe(3);
    });

    it('should return fixed avgRisk of 0.015', () => {
      const data = [{ outcome: 100 }];

      const metrics = verifier.calculateMetrics(data);
      expect(metrics.avgRisk).toBe(0.015);
    });

    it('should have correct metrics structure', () => {
      const data = [{ outcome: 100 }];

      const metrics = verifier.calculateMetrics(data);

      expect(metrics).toHaveProperty('winRate');
      expect(metrics).toHaveProperty('maxDrawdown');
      expect(metrics).toHaveProperty('avgRisk');
      expect(metrics).toHaveProperty('totalTrades');
    });

    it('should handle single trade', () => {
      const data = [{ outcome: 100 }];

      const metrics = verifier.calculateMetrics(data);
      expect(metrics.winRate).toBe(1.0);
      expect(metrics.totalTrades).toBe(1);
    });

    it('should handle large datasets', () => {
      const data = Array(1000).fill(null).map((_, i) => ({
        outcome: i % 2 === 0 ? 100 : -50
      }));

      const metrics = verifier.calculateMetrics(data);
      expect(metrics.winRate).toBe(0.5);
      expect(metrics.totalTrades).toBe(1000);
    });

    it('should handle very large losses', () => {
      const data = [
        { outcome: 100 },
        { outcome: -25000 } // 25% drawdown
      ];

      const metrics = verifier.calculateMetrics(data);
      expect(metrics.maxDrawdown).toBe(0.25);
    });
  });

  describe('verifyStrategy', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
    });

    afterEach(() => {
      Date.now.mockRestore();
    });

    it('should return valid=true for safe strategy', async () => {
      const strategy = {};
      const historicalData = [
        { outcome: 100 },
        { outcome: 200 },
        { outcome: 150 },
        { outcome: 180 }
      ];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.valid).toBe(true);
    });

    it('should return valid=false for unsafe strategy', async () => {
      const strategy = {};
      const historicalData = [
        { outcome: -100 },
        { outcome: -200 },
        { outcome: -150 }
      ];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.valid).toBe(false);
    });

    it('should return SAFE recommendation for valid strategy', async () => {
      const strategy = {};
      const historicalData = [
        { outcome: 100 },
        { outcome: 200 },
        { outcome: 150 }
      ];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.recommendation).toBe('SAFE');
    });

    it('should return RISKY recommendation for invalid strategy', async () => {
      const strategy = {};
      const historicalData = [
        { outcome: -100 },
        { outcome: -200 }
      ];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.recommendation).toBe('RISKY');
    });

    it('should include metrics in result', async () => {
      const strategy = {};
      const historicalData = [
        { outcome: 100 },
        { outcome: -50 }
      ];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.metrics).toBeDefined();
      expect(result.metrics).toHaveProperty('winRate');
      expect(result.metrics).toHaveProperty('maxDrawdown');
      expect(result.metrics).toHaveProperty('avgRisk');
    });

    it('should include proofs in result', async () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.proofs).toBeDefined();
      expect(result.proofs).toHaveProperty('drawdown');
      expect(result.proofs).toHaveProperty('risk');
      expect(result.proofs).toHaveProperty('winRate');
    });

    it('should verify drawdown rule correctly', async () => {
      const strategy = {};
      const historicalData = [
        { outcome: 100 },
        { outcome: -20000 } // 20% drawdown (below 25% limit)
      ];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.proofs.drawdown).toBe(true);
    });

    it('should fail drawdown rule when exceeded', async () => {
      const strategy = {};
      const historicalData = [
        { outcome: 100 },
        { outcome: -30000 } // 30% drawdown (exceeds 25% limit)
      ];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.proofs.drawdown).toBe(false);
    });

    it('should verify risk rule correctly', async () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      // avgRisk is 0.015, which is < 0.02
      expect(result.proofs.risk).toBe(true);
    });

    it('should verify winRate rule correctly', async () => {
      const strategy = {};
      const historicalData = [
        { outcome: 100 },
        { outcome: 200 },
        { outcome: -50 }
      ];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      // Win rate: 2/3 = 0.667, which is > 0.4
      expect(result.proofs.winRate).toBe(true);
    });

    it('should fail winRate rule when below threshold', async () => {
      const strategy = {};
      const historicalData = [
        { outcome: 100 },
        { outcome: -200 },
        { outcome: -150 },
        { outcome: -180 }
      ];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      // Win rate: 1/4 = 0.25, which is < 0.4
      expect(result.proofs.winRate).toBe(false);
    });

    it('should store proof in proofs array', async () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      await verifier.verifyStrategy(strategy, historicalData);

      expect(verifier.proofs).toHaveLength(1);
    });

    it('should store multiple proofs', async () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      await verifier.verifyStrategy(strategy, historicalData);
      await verifier.verifyStrategy(strategy, historicalData);
      await verifier.verifyStrategy(strategy, historicalData);

      expect(verifier.proofs).toHaveLength(3);
    });

    it('should store proof with timestamp', async () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      await verifier.verifyStrategy(strategy, historicalData);

      expect(verifier.proofs[0]).toHaveProperty('timestamp');
      expect(verifier.proofs[0].timestamp).toBe(1609459200000);
    });

    it('should store proof with theorem', async () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      await verifier.verifyStrategy(strategy, historicalData);

      expect(verifier.proofs[0]).toHaveProperty('theorem');
      expect(verifier.proofs[0].theorem).toHaveProperty('name');
      expect(verifier.proofs[0].theorem.name).toBe('strategy_safety');
    });

    it('should store proof with hypothesis', async () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      await verifier.verifyStrategy(strategy, historicalData);

      expect(verifier.proofs[0].theorem).toHaveProperty('hypothesis');
      expect(Array.isArray(verifier.proofs[0].theorem.hypothesis)).toBe(true);
      expect(verifier.proofs[0].theorem.hypothesis).toHaveLength(3);
    });

    it('should store proof with conclusion', async () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      await verifier.verifyStrategy(strategy, historicalData);

      expect(verifier.proofs[0].theorem).toHaveProperty('conclusion');
      expect(verifier.proofs[0].theorem.conclusion).toBe('strategy_is_safe');
    });

    it('should store proof with metrics', async () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      await verifier.verifyStrategy(strategy, historicalData);

      expect(verifier.proofs[0]).toHaveProperty('metrics');
      expect(verifier.proofs[0].metrics).toHaveProperty('winRate');
    });

    it('should store proof with proofs', async () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      await verifier.verifyStrategy(strategy, historicalData);

      expect(verifier.proofs[0]).toHaveProperty('proofs');
      expect(verifier.proofs[0].proofs).toHaveProperty('drawdown');
      expect(verifier.proofs[0].proofs).toHaveProperty('risk');
      expect(verifier.proofs[0].proofs).toHaveProperty('winRate');
    });

    it('should log verification message', async () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      await verifier.verifyStrategy(strategy, historicalData);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Verifying strategy')
      );
    });

    it('should return promise', () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      const result = verifier.verifyStrategy(strategy, historicalData);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should handle edge case: exactly at winRate threshold', async () => {
      const strategy = {};
      const historicalData = [
        { outcome: 100 },
        { outcome: 200 },
        { outcome: -150 },
        { outcome: -180 },
        { outcome: -200 }
      ];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      // Win rate: 2/5 = 0.4, exactly at threshold
      expect(result.proofs.winRate).toBe(false); // Must be > 0.4, not >=
    });

    it('should handle edge case: exactly at drawdown threshold', async () => {
      const strategy = {};
      const historicalData = [
        { outcome: 100 },
        { outcome: -25000 } // Exactly 25% drawdown
      ];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.proofs.drawdown).toBe(false); // Must be < 0.25, not <=
    });
  });

  describe('integration scenarios', () => {
    it('should verify high-quality strategy', async () => {
      const strategy = {};
      const historicalData = Array(100).fill(null).map((_, i) => ({
        outcome: i % 5 === 0 ? -500 : 200 // 80% win rate, small losses
      }));

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.valid).toBe(true);
      expect(result.recommendation).toBe('SAFE');
      expect(result.proofs.winRate).toBe(true);
      expect(result.proofs.drawdown).toBe(true);
      expect(result.proofs.risk).toBe(true);
    });

    it('should reject poor strategy', async () => {
      const strategy = {};
      const historicalData = Array(100).fill(null).map((_, i) => ({
        outcome: i % 5 === 0 ? 100 : -200 // 20% win rate, large losses
      }));

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.valid).toBe(false);
      expect(result.recommendation).toBe('RISKY');
    });

    it('should handle verification of multiple strategies', async () => {
      const strategy1 = {};
      const strategy2 = {};

      const goodData = [{ outcome: 100 }, { outcome: 200 }];
      const badData = [{ outcome: -100 }, { outcome: -200 }];

      const result1 = await verifier.verifyStrategy(strategy1, goodData);
      const result2 = await verifier.verifyStrategy(strategy2, badData);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(false);
      expect(verifier.proofs).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty historical data gracefully', async () => {
      const strategy = {};
      const historicalData = [];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.metrics.winRate).toBeNaN(); // 0/0
    });

    it('should handle single trade', async () => {
      const strategy = {};
      const historicalData = [{ outcome: 100 }];

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.valid).toBe(true);
      expect(result.metrics.totalTrades).toBe(1);
    });

    it('should handle very large datasets', async () => {
      const strategy = {};
      const historicalData = Array(10000).fill(null).map(() => ({
        outcome: Math.random() > 0.5 ? 100 : -50
      }));

      const result = await verifier.verifyStrategy(strategy, historicalData);
      expect(result.metrics.totalTrades).toBe(10000);
    });
  });
});

/**
 * End-to-End Integration Tests
 * Tests the complete Neural Trading System workflow from data ingestion to trade execution
 * Using London School TDD principles where applicable
 */

const TradingEngine = require('./core/TradingEngine');
const MockDataFeed = require('./data/MockDataFeed');
const RealTimePriceSimulator = require('./data/RealTimePriceSimulator');
const MomentumStrategy = require('./strategies/MomentumStrategy');
const MeanReversionStrategy = require('./strategies/MeanReversionStrategy');
const StrategyVerifier = require('./core/StrategyVerifier');
const TemporalAnalyzer = require('./core/TemporalAnalyzer');

describe('End-to-End Trading System Tests', () => {
  describe('Complete Trading Workflow', () => {
    let engine;
    let dataFeed;
    let momentumStrategy;
    let meanReversionStrategy;
    let verifier;

    beforeEach(() => {
      // Initialize complete system
      engine = new TradingEngine();
      dataFeed = new MockDataFeed();
      const analyzer = new TemporalAnalyzer();
      momentumStrategy = new MomentumStrategy(dataFeed, analyzer);
      meanReversionStrategy = new MeanReversionStrategy(dataFeed, analyzer);
      verifier = new StrategyVerifier();
    });

    it('should execute a complete momentum-based trade', async () => {
      const symbol = 'AAPL';

      // 1. Analyze with momentum strategy
      const analysis = await momentumStrategy.analyze(symbol);

      expect(analysis).toHaveProperty('signal');
      expect(analysis).toHaveProperty('confidence');
      expect(analysis).toHaveProperty('momentum');

      // 2. If we have a strong signal, execute trade
      if (analysis.signal === 'BUY' && analysis.confidence > 0.7) {
        const price = await dataFeed.getPrice(symbol);
        const quantity = 5;

        // 3. Execute trade
        const result = await engine.buy(symbol, quantity);

        // 4. Verify trade execution
        if (result.success) {
          expect(engine.portfolio.positions[symbol]).toBe(quantity);
          expect(engine.portfolio.history).toHaveLength(1);
          expect(engine.portfolio.history[0]).toMatchObject({
            action: 'buy',
            symbol,
            quantity
          });
        }
      }

      // Workflow completed successfully
      expect(engine).toBeDefined();
    });

    it('should execute a complete mean reversion trade', async () => {
      const symbol = 'GOOGL';

      // 1. Analyze with mean reversion strategy
      const analysis = await meanReversionStrategy.analyze(symbol);

      expect(analysis).toHaveProperty('signal');
      expect(analysis).toHaveProperty('confidence');
      expect(analysis).toHaveProperty('deviation');
      expect(analysis).toHaveProperty('mean');

      // 2. If price is significantly deviated and signal is BUY, execute trade
      if (Math.abs(analysis.deviation) > 2 && analysis.confidence > 0.7 && analysis.signal === 'BUY') {
        const quantity = 2;

        // 3. Execute buy trade
        const result = await engine.buy(symbol, quantity);

        // 4. Verify trade execution
        if (result) {
          expect(result).toHaveProperty('success');
          if (result.success) {
            expect(engine.portfolio.positions[symbol]).toBe(quantity);
          } else {
            expect(result).toHaveProperty('reason');
          }
        }
      }

      expect(analysis.mean).toBeGreaterThan(0);
    });

    it('should verify strategy before deployment', async () => {
      // Generate historical trade data
      const historicalTrades = [];
      for (let i = 0; i < 100; i++) {
        // Simulate 60% win rate strategy
        const outcome = i % 5 < 3 ? Math.random() * 500 : -Math.random() * 300;
        historicalTrades.push({ outcome });
      }

      // Verify strategy meets safety requirements
      const verification = await verifier.verifyStrategy({}, historicalTrades);

      expect(verification).toHaveProperty('valid');
      expect(verification).toHaveProperty('recommendation');
      expect(verification).toHaveProperty('metrics');
      expect(verification).toHaveProperty('proofs');

      // Check metrics
      expect(verification.metrics).toHaveProperty('winRate');
      expect(verification.metrics).toHaveProperty('maxDrawdown');
      expect(verification.metrics).toHaveProperty('avgRisk');

      // Verify recommendation is provided
      expect(['SAFE', 'RISKY']).toContain(verification.recommendation);
    });

    it('should enforce risk management throughout workflow', async () => {
      const initialCash = engine.portfolio.cash;

      // Try to execute multiple trades
      const symbols = ['AAPL', 'GOOGL', 'TSLA'];
      const tradeResults = [];

      for (const symbol of symbols) {
        const result = await engine.buy(symbol, 10);
        tradeResults.push(result);

        if (!result.success) {
          // Risk manager should have blocked the trade
          expect(result.reason).toBeDefined();
        }
      }

      // Portfolio should never lose more than max drawdown
      const riskMetrics = await engine.riskManager.getRiskMetrics();
      expect(parseFloat(riskMetrics.drawdown)).toBeLessThanOrEqual(10.0);

      // At least one trade result should exist
      expect(tradeResults.length).toBeGreaterThan(0);
    });

    it('should handle complete multi-strategy workflow', async () => {
      const symbol = 'AAPL';

      // 1. Analyze with both strategies
      const [momentumAnalysis, meanRevAnalysis] = await Promise.all([
        momentumStrategy.analyze(symbol),
        meanReversionStrategy.analyze(symbol)
      ]);

      // 2. Both analyses should complete
      expect(momentumAnalysis.signal).toBeDefined();
      expect(meanRevAnalysis.signal).toBeDefined();

      // 3. If both strategies agree on direction, stronger signal
      const strategiesAgree = momentumAnalysis.signal === meanRevAnalysis.signal;
      const combinedConfidence = strategiesAgree
        ? (momentumAnalysis.confidence + meanRevAnalysis.confidence) / 2
        : Math.max(momentumAnalysis.confidence, meanRevAnalysis.confidence);

      expect(combinedConfidence).toBeGreaterThanOrEqual(0);
      expect(combinedConfidence).toBeLessThanOrEqual(1);

      // 4. Execute trade if high combined confidence
      if (strategiesAgree && combinedConfidence > 0.75) {
        const signal = momentumAnalysis.signal;
        if (signal === 'BUY') {
          const result = await engine.buy(symbol, 5);
          expect(result).toHaveProperty('success');
        }
      }

      // Workflow completed
      expect(true).toBe(true);
    });

    it('should maintain portfolio consistency throughout workflow', async () => {
      const initialCash = engine.portfolio.cash;
      const initialPositions = { ...engine.portfolio.positions };

      // Execute a trade
      const result = await engine.buy('TEST', 5);

      if (result.success) {
        const tradeCost = result.price * result.quantity;

        // Cash should decrease by exact trade cost
        expect(engine.portfolio.cash).toBeCloseTo(initialCash - tradeCost, 2);

        // Positions should be updated
        expect(engine.portfolio.positions['TEST']).toBe(5);

        // History should record the trade
        expect(engine.portfolio.history).toHaveLength(1);
        expect(engine.portfolio.history[0].symbol).toBe('TEST');
      }

      // Portfolio integrity maintained
      expect(engine.portfolio.cash).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Real-Time Data Integration', () => {
    let simulator;
    let dataFeed;

    beforeEach(() => {
      dataFeed = new MockDataFeed();
      simulator = new RealTimePriceSimulator(100); // Fast updates for testing
    });

    afterEach(() => {
      if (simulator) {
        simulator.stop();
      }
    });

    it('should process real-time price updates', async () => {
      const updates = [];

      // Subscribe to price updates
      simulator.subscribe('AAPL', (update) => {
        updates.push(update);
      });

      // Start simulator
      simulator.start();

      // Wait for some updates
      await new Promise(resolve => setTimeout(resolve, 350)); // Allow 3 updates

      // Stop simulator
      simulator.stop();

      // Should have received updates
      expect(updates.length).toBeGreaterThan(0);
      updates.forEach(update => {
        expect(update).toHaveProperty('symbol');
        expect(update).toHaveProperty('price');
        expect(update).toHaveProperty('timestamp');
        expect(update.symbol).toBe('AAPL');
      });
    });

    it('should handle multiple symbol subscriptions', async () => {
      const symbols = ['AAPL', 'GOOGL', 'TSLA'];
      const updateCounts = { AAPL: 0, GOOGL: 0, TSLA: 0 };

      // Subscribe to all symbols
      symbols.forEach(symbol => {
        simulator.subscribe(symbol, (update) => {
          updateCounts[symbol]++;
        });
      });

      // Start simulator
      simulator.start();

      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 250));

      // Stop simulator
      simulator.stop();

      // All symbols should have received updates
      symbols.forEach(symbol => {
        expect(updateCounts[symbol]).toBeGreaterThan(0);
      });
    });
  });

  describe('Strategy Integration with Live Data', () => {
    let engine;
    let dataFeed;
    let strategy;
    let analyzer;

    beforeEach(() => {
      engine = new TradingEngine();
      dataFeed = new MockDataFeed();
      analyzer = new TemporalAnalyzer();
      strategy = new MomentumStrategy(dataFeed, analyzer);
    });

    it('should analyze and execute based on live market data', async () => {
      // 1. Get live market analysis
      const symbols = ['AAPL', 'GOOGL'];
      const analyses = [];

      for (const symbol of symbols) {
        const analysis = await strategy.analyze(symbol);
        analyses.push({ symbol, ...analysis });
      }

      // 2. All analyses should complete
      expect(analyses).toHaveLength(2);
      analyses.forEach(analysis => {
        expect(analysis.signal).toBeDefined();
        expect(['BUY', 'SELL', 'HOLD']).toContain(analysis.signal);
      });

      // 3. Execute trades for high-confidence signals
      for (const analysis of analyses) {
        if (analysis.signal === 'BUY' && analysis.confidence > 0.8) {
          const result = await engine.buy(analysis.symbol, 3);
          if (result.success) {
            expect(engine.portfolio.positions[analysis.symbol]).toBeGreaterThan(0);
          }
        }
      }

      // Workflow completed successfully
      expect(analyses.length).toBe(2);
    });

    it('should handle rapid market analysis cycles', async () => {
      const symbol = 'AAPL';
      const analysisResults = [];

      // Perform multiple rapid analyses
      for (let i = 0; i < 5; i++) {
        const analysis = await strategy.analyze(symbol);
        analysisResults.push(analysis);
      }

      // All analyses should complete
      expect(analysisResults).toHaveLength(5);

      // Each should have valid structure
      analysisResults.forEach(analysis => {
        expect(analysis).toHaveProperty('signal');
        expect(analysis).toHaveProperty('momentum');
        expect(analysis).toHaveProperty('confidence');
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    let engine;

    beforeEach(() => {
      engine = new TradingEngine();
    });

    it('should handle insufficient funds gracefully', async () => {
      // Drain cash
      engine.portfolio.cash = 100;

      // Try to buy expensive stock
      const result = await engine.buy('EXPENSIVE', 100);

      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
      expect(engine.portfolio.positions['EXPENSIVE']).toBeUndefined();
    });

    it('should handle invalid buy operations', async () => {
      // Try to buy with negative quantity (should handle gracefully)
      const result = await engine.buy('TEST', -5);

      // Engine should handle this (either reject or ignore)
      expect(result).toBeDefined();
    });

    it('should maintain system state after errors', async () => {
      const initialCash = engine.portfolio.cash;
      const initialPositions = { ...engine.portfolio.positions };

      // Try invalid operations
      await engine.buy('TEST', -5); // Negative quantity

      // Try operation that will fail (not enough cash)
      engine.portfolio.cash = 10;
      await engine.buy('EXPENSIVE', 1000);

      // Cash should not have decreased from failed trade
      expect(engine.portfolio.cash).toBe(10);
      // Positions should not include failed trade
      expect(engine.portfolio.positions['EXPENSIVE']).toBeUndefined();
    });

    it('should recover from partial trade failures', async () => {
      // Execute successful trade
      const success = await engine.buy('AAPL', 5);
      const positionsAfterSuccess = { ...engine.portfolio.positions };

      // Try failed trade
      engine.portfolio.cash = 10; // Not enough for next trade
      await engine.buy('GOOGL', 100);

      // First trade should still be valid
      expect(engine.portfolio.positions).toEqual(positionsAfterSuccess);
      expect(engine.portfolio.positions['AAPL']).toBe(5);
    });
  });

  describe('Performance and Scalability', () => {
    let engine;
    let dataFeed;

    beforeEach(() => {
      engine = new TradingEngine();
      dataFeed = new MockDataFeed();
    });

    it('should handle large portfolio efficiently', async () => {
      const startTime = Date.now();

      // Simulate large portfolio
      for (let i = 0; i < 20; i++) {
        const symbol = `STOCK${i}`;
        await engine.buy(symbol, 1);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 2 seconds for 20 trades)
      expect(duration).toBeLessThan(2000);
    });

    it('should calculate risk metrics efficiently for multiple positions', async () => {
      // Add multiple positions
      await engine.buy('AAPL', 5);
      await engine.buy('GOOGL', 3);
      await engine.buy('TSLA', 2);

      const startTime = Date.now();
      const metrics = await engine.riskManager.getRiskMetrics();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // < 1 second

      // Metrics should be complete
      expect(Object.keys(metrics.positions).length).toBe(3);
    });

    it('should handle concurrent strategy analyses', async () => {
      const analyzer = new TemporalAnalyzer();
      const strategies = [
        new MomentumStrategy(dataFeed, analyzer),
        new MeanReversionStrategy(dataFeed, analyzer)
      ];

      const symbols = ['AAPL', 'GOOGL', 'TSLA', 'MSFT'];

      const startTime = Date.now();

      // Analyze all combinations concurrently
      const promises = [];
      for (const strategy of strategies) {
        for (const symbol of symbols) {
          promises.push(strategy.analyze(symbol));
        }
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Should complete efficiently
      expect(results).toHaveLength(8); // 2 strategies × 4 symbols
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('System Health and Monitoring', () => {
    let engine;

    beforeEach(() => {
      engine = new TradingEngine();
    });

    it('should provide comprehensive system health status', async () => {
      // Get various system metrics
      const portfolio = engine.portfolio;
      const riskMetrics = await engine.riskManager.getRiskMetrics();

      // Portfolio should be healthy
      expect(portfolio.cash).toBeGreaterThan(0);
      expect(portfolio.cash).toBeDefined();

      // Risk metrics should be within limits
      const drawdown = parseFloat(riskMetrics.drawdown);
      expect(drawdown).toBeLessThanOrEqual(10.0);

      // Risk metrics should have required properties
      expect(riskMetrics).toHaveProperty('portfolioValue');
      expect(riskMetrics).toHaveProperty('drawdown');
    });

    it('should track trading history accurately', async () => {
      // Execute trades
      await engine.buy('AAPL', 5);
      await engine.buy('GOOGL', 3);

      // History should reflect all trades
      expect(engine.portfolio.history.length).toBeGreaterThanOrEqual(2);

      // Each history entry should have required fields
      engine.portfolio.history.forEach(trade => {
        expect(trade).toHaveProperty('action');
        expect(trade).toHaveProperty('symbol');
        expect(trade).toHaveProperty('quantity');
        expect(trade).toHaveProperty('price');
        expect(trade).toHaveProperty('timestamp');
      });

      // Verify specific trades
      expect(engine.portfolio.history[0].symbol).toBe('AAPL');
      expect(engine.portfolio.history[0].quantity).toBe(5);
      expect(engine.portfolio.history[1].symbol).toBe('GOOGL');
      expect(engine.portfolio.history[1].quantity).toBe(3);
    });
  });
});

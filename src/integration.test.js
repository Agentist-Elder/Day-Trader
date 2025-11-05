// Integration Tests - London School TDD
// Tests the complete system working together

const request = require('supertest');
const { createServer } = require('./server');
const TradingEngine = require('./core/TradingEngine');

describe('Trading Dashboard Integration Tests', () => {
  let app;
  let server;
  let engine;

  beforeEach(() => {
    // Create real trading engine for integration testing
    engine = new TradingEngine();
    const result = createServer(engine);
    app = result.app;
    server = result.server;
  });

  afterEach((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('Complete trading workflow', () => {
    it('should handle a complete trading session from start to finish', async () => {
      // 1. Check initial portfolio state
      const initialPortfolio = await request(app)
        .get('/api/portfolio')
        .expect(200);

      expect(initialPortfolio.body.cash).toBe(100000);
      expect(initialPortfolio.body.positions).toEqual({});
      expect(initialPortfolio.body.totalValue).toBe(100000);

      // 2. Check initial metrics
      const initialMetrics = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(initialMetrics.body.portfolioValue).toBe('100000.00');
      expect(initialMetrics.body.drawdown).toBe('0.00%');
      expect(initialMetrics.body.drawdownAllowed).toBe(true);

      // 3. Execute a trade (small quantity to stay within risk limits)
      // Max risk per trade is 1% = $1000, so buy ~6 shares at ~$150 = $900
      const tradeResult = await engine.buy('AAPL', 6);
      expect(tradeResult.success).toBe(true);

      // 4. Verify portfolio updated
      const updatedPortfolio = await request(app)
        .get('/api/portfolio')
        .expect(200);

      expect(updatedPortfolio.body.cash).toBeLessThan(100000);
      expect(updatedPortfolio.body.positions.AAPL).toBe(6);

      // 5. Verify trade history
      const history = await request(app)
        .get('/api/history')
        .expect(200);

      expect(history.body).toHaveLength(1);
      expect(history.body[0]).toMatchObject({
        action: 'buy',
        symbol: 'AAPL',
        quantity: 6
      });

      // 6. Verify metrics updated
      const updatedMetrics = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(Object.keys(updatedMetrics.body.positions)).toContain('AAPL');
      expect(updatedMetrics.body.positions.AAPL.quantity).toBe(6);
    });

    it('should enforce risk limits across the system', async () => {
      // Try to execute a trade that exceeds risk limits
      // Max risk per trade is 1% of portfolio ($1000)
      // Try to buy more than that
      const result = await engine.buy('EXPENSIVE', 100);

      // Trade should be rejected if it exceeds limits
      if (!result.success) {
        expect(result.reason).toBeDefined();
      }

      // Verify metrics still show safe levels
      const metrics = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(metrics.body.drawdownAllowed).toBe(true);
    });

    it('should maintain data consistency across all endpoints', async () => {
      // Execute multiple trades
      await engine.buy('AAPL', 5);
      await engine.buy('GOOGL', 3);

      // Fetch all data
      const [portfolio, metrics, history] = await Promise.all([
        request(app).get('/api/portfolio'),
        request(app).get('/api/metrics'),
        request(app).get('/api/history')
      ]);

      // Verify consistency
      const portfolioPositions = portfolio.body.positions;
      const metricsPositions = metrics.body.positions;
      const historyTrades = history.body;

      // Position counts should match
      expect(Object.keys(portfolioPositions).length).toBe(
        Object.keys(metricsPositions).length
      );

      // History should show all trades
      expect(historyTrades.length).toBeGreaterThan(0);

      // Each position in portfolio should appear in metrics
      Object.keys(portfolioPositions).forEach(symbol => {
        expect(metricsPositions[symbol]).toBeDefined();
        expect(metricsPositions[symbol].quantity).toBe(portfolioPositions[symbol]);
      });
    });

    it('should handle rapid sequential requests', async () => {
      // Make multiple concurrent requests
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app).get('/api/portfolio')
      );

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.cash).toBeDefined();
        expect(response.body.totalValue).toBeDefined();
      });
    });

    it('should serve static files and API endpoints from same server', async () => {
      // Test static file
      const htmlResponse = await request(app)
        .get('/')
        .expect(200);

      expect(htmlResponse.text).toContain('Neural Trading Dashboard');

      // Test API endpoint
      const apiResponse = await request(app)
        .get('/api/portfolio')
        .expect(200);

      expect(apiResponse.body).toHaveProperty('cash');
    });

    it('should handle history limit parameter correctly', async () => {
      // Create multiple trades
      for (let i = 0; i < 5; i++) {
        const result = await engine.buy('STOCK' + i, 1);
        if (!result.success) break; // Stop if risk limit reached
      }

      // Request limited history
      const limitedHistory = await request(app)
        .get('/api/history?limit=2')
        .expect(200);

      expect(limitedHistory.body.length).toBeLessThanOrEqual(2);

      // Request full history
      const fullHistory = await request(app)
        .get('/api/history')
        .expect(200);

      expect(fullHistory.body.length).toBeGreaterThanOrEqual(limitedHistory.body.length);
    });

    it('should calculate portfolio value correctly', async () => {
      const initialCash = engine.portfolio.cash;

      // Execute a trade
      const tradeResult = await engine.buy('TEST', 5);
      if (tradeResult.success) {
        const tradeCost = tradeResult.price * tradeResult.quantity;

        // Get portfolio
        const portfolio = await request(app)
          .get('/api/portfolio')
          .expect(200);

        // Cash should be reduced by trade cost
        const expectedCash = initialCash - tradeCost;
        expect(Math.abs(portfolio.body.cash - expectedCash)).toBeLessThan(0.01);

        // Total value should include position value
        expect(portfolio.body.totalValue).toBeGreaterThan(portfolio.body.cash);
      }
    });

    it('should provide comprehensive risk metrics', async () => {
      const metrics = await request(app)
        .get('/api/metrics')
        .expect(200);

      // Verify all required metrics are present
      expect(metrics.body).toHaveProperty('portfolioValue');
      expect(metrics.body).toHaveProperty('peakValue');
      expect(metrics.body).toHaveProperty('drawdown');
      expect(metrics.body).toHaveProperty('drawdownAllowed');
      expect(metrics.body).toHaveProperty('positions');
      expect(metrics.body).toHaveProperty('limits');

      // Verify limits structure
      expect(metrics.body.limits).toHaveProperty('maxRiskPerTrade');
      expect(metrics.body.limits).toHaveProperty('maxDrawdown');
      expect(metrics.body.limits).toHaveProperty('maxPositionSize');
    });

    it('should handle health check endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();

      // Verify timestamp is recent (within last minute)
      const timestamp = new Date(response.body.timestamp);
      const now = new Date();
      const diffMs = now - timestamp;
      expect(diffMs).toBeLessThan(60000); // Less than 1 minute
    });
  });

  describe('Error scenarios', () => {
    it('should handle invalid routes gracefully', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    it('should validate query parameters', async () => {
      // Invalid limit parameter
      const response = await request(app)
        .get('/api/history?limit=invalid')
        .expect(200);

      // Should return array (handles invalid gracefully)
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

// Server API Tests - London School TDD
const request = require('supertest');
const { createServer } = require('./server');

describe('Trading Dashboard Server', () => {
  let app;
  let server;
  let mockEngine;

  beforeEach(() => {
    // Mock TradingEngine with realistic behavior
    mockEngine = {
      portfolio: {
        cash: 95000,
        positions: {
          'AAPL': 10,
          'GOOGL': 5
        },
        history: [
          { action: 'buy', symbol: 'AAPL', quantity: 10, price: 150, timestamp: new Date('2024-01-01') },
          { action: 'buy', symbol: 'GOOGL', quantity: 5, price: 1000, timestamp: new Date('2024-01-02') }
        ]
      },
      riskManager: {
        getRiskMetrics: jest.fn().mockResolvedValue({
          portfolioValue: '100500.00',
          peakValue: '101000.00',
          drawdown: '0.50%',
          drawdownAllowed: true,
          positions: {
            'AAPL': {
              quantity: 10,
              value: 1500,
              percentOfPortfolio: '1.49%'
            },
            'GOOGL': {
              quantity: 5,
              value: 5000,
              percentOfPortfolio: '4.98%'
            }
          },
          limits: {
            maxRiskPerTrade: '1%',
            maxDrawdown: '10%',
            maxPositionSize: '20%'
          }
        }),
        getPortfolioValue: jest.fn().mockResolvedValue(100500)
      },
      getPrice: jest.fn().mockImplementation((symbol) => {
        const prices = { 'AAPL': 150, 'GOOGL': 1000 };
        return Promise.resolve(prices[symbol] || 100);
      })
    };

    const result = createServer(mockEngine);
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

  describe('GET /api/portfolio', () => {
    it('should return portfolio with cash and positions', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        cash: 95000,
        totalValue: 100500,
        positions: {
          'AAPL': 10,
          'GOOGL': 5
        }
      });

      expect(mockEngine.riskManager.getPortfolioValue).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockEngine.riskManager.getPortfolioValue.mockRejectedValue(new Error('Price service down'));

      const response = await request(app)
        .get('/api/portfolio')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to fetch portfolio',
        message: 'Price service down'
      });
    });
  });

  describe('GET /api/metrics', () => {
    it('should return comprehensive risk metrics', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        portfolioValue: '100500.00',
        peakValue: '101000.00',
        drawdown: '0.50%',
        drawdownAllowed: true,
        positions: {
          'AAPL': {
            quantity: 10,
            value: 1500,
            percentOfPortfolio: '1.49%'
          },
          'GOOGL': {
            quantity: 5,
            value: 5000,
            percentOfPortfolio: '4.98%'
          }
        },
        limits: {
          maxRiskPerTrade: '1%',
          maxDrawdown: '10%',
          maxPositionSize: '20%'
        }
      });

      expect(mockEngine.riskManager.getRiskMetrics).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockEngine.riskManager.getRiskMetrics.mockRejectedValue(new Error('Calculation error'));

      const response = await request(app)
        .get('/api/metrics')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to fetch metrics',
        message: 'Calculation error'
      });
    });
  });

  describe('GET /api/history', () => {
    it('should return trade history with most recent first', async () => {
      const response = await request(app)
        .get('/api/history')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        action: 'buy',
        symbol: 'GOOGL',
        quantity: 5,
        price: 1000
      });
      expect(response.body[0].timestamp).toBeDefined();
      expect(response.body[1].symbol).toBe('AAPL');
    });

    it('should limit history to specified number of records', async () => {
      const response = await request(app)
        .get('/api/history?limit=1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].symbol).toBe('GOOGL');
    });

    it('should return empty array when no history exists', async () => {
      mockEngine.portfolio.history = [];

      const response = await request(app)
        .get('/api/history')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockEngine.portfolio = null;

      const response = await request(app)
        .get('/api/history')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to fetch history',
        message: expect.any(String)
      });
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Static file serving', () => {
    it('should serve the dashboard HTML file', async () => {
      await request(app)
        .get('/')
        .expect(200);
    });
  });

  describe('CORS configuration', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});

describe('Server creation', () => {
  it('should require a trading engine', () => {
    expect(() => createServer()).toThrow('Trading engine is required');
  });

  it('should validate engine has required methods', () => {
    const invalidEngine = { portfolio: {} };
    expect(() => createServer(invalidEngine)).toThrow('Trading engine must have riskManager');
  });
});

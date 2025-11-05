// Express Server for Trading Dashboard
const express = require('express');
const cors = require('cors');
const path = require('path');

/**
 * Create and configure Express server
 * @param {Object} tradingEngine - Trading engine instance
 * @returns {Object} { app, server } - Express app and HTTP server
 */
function createServer(tradingEngine) {
  // Validate trading engine
  if (!tradingEngine) {
    throw new Error('Trading engine is required');
  }
  if (!tradingEngine.riskManager) {
    throw new Error('Trading engine must have riskManager');
  }

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'ui')));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  // Portfolio endpoint
  app.get('/api/portfolio', async (req, res) => {
    try {
      const totalValue = await tradingEngine.riskManager.getPortfolioValue();
      res.json({
        cash: tradingEngine.portfolio.cash,
        totalValue: totalValue,
        positions: tradingEngine.portfolio.positions
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch portfolio',
        message: error.message
      });
    }
  });

  // Risk metrics endpoint
  app.get('/api/metrics', async (req, res) => {
    try {
      const metrics = await tradingEngine.riskManager.getRiskMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch metrics',
        message: error.message
      });
    }
  });

  // Trade history endpoint
  app.get('/api/history', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
      const history = [...tradingEngine.portfolio.history].reverse();
      const limitedHistory = limit ? history.slice(0, limit) : history;
      res.json(limitedHistory);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch history',
        message: error.message
      });
    }
  });

  // Serve dashboard HTML for root
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ui', 'index.html'));
  });

  // Start server (only if not in test mode)
  let server = null;
  if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3000;
    server = app.listen(PORT, () => {
      console.log(`Trading dashboard server running on port ${PORT}`);
    });
  }

  return { app, server };
}

module.exports = { createServer };

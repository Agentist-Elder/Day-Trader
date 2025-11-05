// Start the trading dashboard server
const { createServer } = require('./server');
const TradingEngine = require('./core/TradingEngine');

// Create trading engine instance
const engine = new TradingEngine();

// Add some sample data for demonstration
async function initializeSampleData() {
  console.log('Initializing sample trading data...');

  // Execute some sample trades
  await engine.buy('AAPL', 10);
  await engine.buy('GOOGL', 5);
  await engine.buy('MSFT', 8);

  console.log('Sample data initialized');
  console.log('Portfolio:', engine.portfolio);
}

// Initialize and start server
async function start() {
  try {
    await initializeSampleData();

    // Create and start server
    const { server } = createServer(engine);

    const PORT = process.env.PORT || 3000;
    if (!server) {
      // Start manually if not already started (e.g., in test mode)
      const express = require('express');
      const app = createServer(engine).app;
      app.listen(PORT, () => {
        console.log(`\n✓ Trading Dashboard Server running on http://localhost:${PORT}`);
        console.log(`✓ Open http://localhost:${PORT} in your browser\n`);
      });
    } else {
      console.log(`\n✓ Trading Dashboard Server running on http://localhost:${PORT}`);
      console.log(`✓ Open http://localhost:${PORT} in your browser\n`);
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

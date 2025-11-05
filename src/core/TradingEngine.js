// Core Trading Engine with AgentDB integration
const RiskManager = require('./RiskManager');

class TradingEngine {
  constructor() {
    this.portfolio = {
      cash: 100000,
      positions: {},
      history: []
    };
    this.mode = 'paper'; // paper or live
    this.memory = []; // Simple array for now until AgentDB API is verified
    this.riskManager = new RiskManager(this);
  }

  async buy(symbol, quantity) {
    const price = await this.getPrice(symbol);
    const cost = price * quantity;

    // Check risk limits before executing trade
    const riskCheck = await this.riskManager.checkTrade('buy', symbol, quantity, price);
    if (!riskCheck.allowed) {
      return { success: false, reason: riskCheck.reason };
    }

    if (this.portfolio.cash >= cost) {
      this.portfolio.cash -= cost;
      this.portfolio.positions[symbol] = (this.portfolio.positions[symbol] || 0) + quantity;
      this.recordTrade('buy', symbol, quantity, price);
      return {
        success: true,
        price,
        quantity,
        riskMetrics: riskCheck.metrics
      };
    }
    return { success: false, reason: 'Insufficient funds' };
  }

  async getPrice(symbol) {
    // Mock price for now
    return 150 + Math.random() * 10;
  }

  recordTrade(action, symbol, quantity, price) {
    const trade = { action, symbol, quantity, price, timestamp: new Date() };
    this.portfolio.history.push(trade);
    // Store in memory for learning
    this.memory.push(trade);
  }
}

module.exports = TradingEngine;

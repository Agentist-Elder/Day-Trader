// Risk Manager - Enforces trading risk limits
class RiskManager {
  constructor(engine) {
    this.engine = engine;
    this.limits = {
      maxRiskPerTrade: 0.01,      // 1% max risk per trade
      maxPortfolioDrawdown: 0.10,  // 10% max portfolio drawdown
      maxPositionSize: 0.20        // 20% max position size
    };
    this.initialCapital = engine.portfolio.cash;
    this.peakPortfolioValue = engine.portfolio.cash;
  }

  /**
   * Get current total portfolio value (cash + positions)
   */
  async getPortfolioValue() {
    let totalValue = this.engine.portfolio.cash;

    // Add value of all positions
    for (const [symbol, quantity] of Object.entries(this.engine.portfolio.positions)) {
      const price = await this.engine.getPrice(symbol);
      totalValue += price * quantity;
    }

    // Update peak value if current value is higher
    if (totalValue > this.peakPortfolioValue) {
      this.peakPortfolioValue = totalValue;
    }

    return totalValue;
  }

  /**
   * Check if a trade is allowed based on all risk limits
   * @param {string} action - 'buy' or 'sell'
   * @param {string} symbol - Trading symbol
   * @param {number} quantity - Number of shares
   * @param {number} price - Price per share
   * @returns {Object} {allowed: boolean, reason: string}
   */
  async checkTrade(action, symbol, quantity, price) {
    // Only check risk for buy orders (sells reduce risk)
    if (action !== 'buy') {
      return { allowed: true, reason: 'Sell orders allowed' };
    }

    // Check drawdown first
    const drawdownCheck = await this.checkDrawdown();
    if (!drawdownCheck.allowed) {
      return {
        allowed: false,
        reason: `Portfolio drawdown (${(drawdownCheck.currentDrawdown * 100).toFixed(2)}%) exceeds limit (${this.limits.maxPortfolioDrawdown * 100}%)`
      };
    }

    // Check position size
    const positionCheck = await this.checkPositionSize(symbol, quantity, price);
    if (!positionCheck.allowed) {
      return {
        allowed: false,
        reason: `Position size (${(positionCheck.currentSize * 100).toFixed(2)}%) exceeds limit (${this.limits.maxPositionSize * 100}%)`
      };
    }

    // Check risk per trade (based on potential loss)
    const portfolioValue = await this.getPortfolioValue();
    const tradeCost = price * quantity;
    const riskPerTrade = tradeCost / portfolioValue;

    if (riskPerTrade > this.limits.maxRiskPerTrade) {
      return {
        allowed: false,
        reason: `Risk per trade (${(riskPerTrade * 100).toFixed(2)}%) exceeds limit (${this.limits.maxRiskPerTrade * 100}%)`
      };
    }

    // All checks passed
    return {
      allowed: true,
      reason: 'Trade passes all risk checks',
      metrics: {
        riskPerTrade: (riskPerTrade * 100).toFixed(2) + '%',
        positionSize: (positionCheck.currentSize * 100).toFixed(2) + '%',
        drawdown: (drawdownCheck.currentDrawdown * 100).toFixed(2) + '%'
      }
    };
  }

  /**
   * Check current portfolio drawdown
   * @returns {Object} {allowed: boolean, currentDrawdown: number}
   */
  async checkDrawdown() {
    const currentValue = await this.getPortfolioValue();
    const drawdown = (this.peakPortfolioValue - currentValue) / this.peakPortfolioValue;

    return {
      allowed: drawdown <= this.limits.maxPortfolioDrawdown,
      currentDrawdown: drawdown,
      peakValue: this.peakPortfolioValue,
      currentValue: currentValue
    };
  }

  /**
   * Check if position size is within limits
   * @param {string} symbol - Trading symbol
   * @param {number} additionalQuantity - Quantity to add to position
   * @param {number} price - Price per share
   * @returns {Object} {allowed: boolean, currentSize: number}
   */
  async checkPositionSize(symbol, additionalQuantity, price) {
    const portfolioValue = await this.getPortfolioValue();

    // Calculate new position size including additional quantity
    const currentQuantity = this.engine.portfolio.positions[symbol] || 0;
    const newQuantity = currentQuantity + additionalQuantity;
    const positionValue = newQuantity * price;
    const positionSize = positionValue / portfolioValue;

    return {
      allowed: positionSize <= this.limits.maxPositionSize,
      currentSize: positionSize,
      positionValue: positionValue,
      portfolioValue: portfolioValue
    };
  }

  /**
   * Get current risk metrics for monitoring
   * @returns {Object} Current risk status
   */
  async getRiskMetrics() {
    const portfolioValue = await this.getPortfolioValue();
    const drawdown = await this.checkDrawdown();

    // Calculate position sizes for all holdings
    const positions = {};
    for (const [symbol, quantity] of Object.entries(this.engine.portfolio.positions)) {
      const price = await this.engine.getPrice(symbol);
      const value = quantity * price;
      positions[symbol] = {
        quantity,
        value,
        percentOfPortfolio: (value / portfolioValue * 100).toFixed(2) + '%'
      };
    }

    return {
      portfolioValue: portfolioValue.toFixed(2),
      peakValue: this.peakPortfolioValue.toFixed(2),
      drawdown: (drawdown.currentDrawdown * 100).toFixed(2) + '%',
      drawdownAllowed: drawdown.allowed,
      positions,
      limits: {
        maxRiskPerTrade: (this.limits.maxRiskPerTrade * 100) + '%',
        maxDrawdown: (this.limits.maxPortfolioDrawdown * 100) + '%',
        maxPositionSize: (this.limits.maxPositionSize * 100) + '%'
      }
    };
  }
}

module.exports = RiskManager;

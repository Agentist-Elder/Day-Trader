const MockDataFeed = require('./MockDataFeed');

/**
 * Real-time price simulator that emits price updates at regular intervals
 */
class RealTimePriceSimulator {
  /**
   * @param {number} updateInterval - Interval in milliseconds between price updates (default: 1000ms)
   */
  constructor(updateInterval = 1000) {
    this.updateInterval = updateInterval;
    this.dataFeed = new MockDataFeed();
    this.subscribers = {};
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Subscribe to price updates for a symbol
   * @param {string} symbol - The symbol to subscribe to
   * @param {Function} callback - Callback function to receive price updates
   * @returns {Function} Unsubscribe function
   */
  subscribe(symbol, callback) {
    // Validate inputs
    if (typeof symbol !== 'string') {
      throw new Error('Symbol must be a string');
    }

    if (!symbol || symbol.length === 0) {
      throw new Error('Symbol cannot be empty');
    }

    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    // Initialize subscribers array for symbol if it doesn't exist
    if (!this.subscribers[symbol]) {
      this.subscribers[symbol] = [];
    }

    // Add callback to subscribers
    this.subscribers[symbol].push(callback);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(symbol, callback);
    };
  }

  /**
   * Unsubscribe from price updates
   * @param {string} symbol - The symbol to unsubscribe from
   * @param {Function} callback - The callback to remove
   */
  unsubscribe(symbol, callback) {
    if (!this.subscribers[symbol]) {
      return;
    }

    const index = this.subscribers[symbol].indexOf(callback);
    if (index !== -1) {
      this.subscribers[symbol].splice(index, 1);
    }

    // Clean up empty subscriber arrays
    if (this.subscribers[symbol].length === 0) {
      delete this.subscribers[symbol];
    }
  }

  /**
   * Start the price simulator
   */
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      await this._updatePrices();
    }, this.updateInterval);
  }

  /**
   * Stop the price simulator
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get list of currently subscribed symbols
   * @returns {string[]} Array of subscribed symbols
   */
  getSubscribedSymbols() {
    return Object.keys(this.subscribers).filter(
      symbol => this.subscribers[symbol].length > 0
    );
  }

  /**
   * Internal method to update prices for all subscribed symbols
   * @private
   */
  async _updatePrices() {
    const symbols = this.getSubscribedSymbols();

    if (symbols.length === 0) {
      return;
    }

    for (const symbol of symbols) {
      try {
        const price = await this.dataFeed.getPrice(symbol);
        const timestamp = Date.now();

        const priceUpdate = {
          symbol,
          price,
          timestamp
        };

        // Notify all subscribers for this symbol
        const callbacks = this.subscribers[symbol] || [];
        callbacks.forEach(callback => {
          try {
            callback(priceUpdate);
          } catch (error) {
            console.error(`Error in subscriber callback for ${symbol}:`, error);
          }
        });
      } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
      }
    }
  }
}

module.exports = RealTimePriceSimulator;

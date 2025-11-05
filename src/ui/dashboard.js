// Dashboard Client-Side JavaScript
// Handles data fetching and UI updates for the trading dashboard

class DashboardAPI {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  /**
   * Fetch portfolio data from the server
   * @returns {Promise<Object>} Portfolio data
   */
  async fetchPortfolio() {
    const response = await fetch(`${this.baseURL}/api/portfolio`);
    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Fetch risk metrics from the server
   * @returns {Promise<Object>} Risk metrics
   */
  async fetchMetrics() {
    const response = await fetch(`${this.baseURL}/api/metrics`);
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Fetch trade history from the server
   * @param {number} limit - Number of recent trades to fetch
   * @returns {Promise<Array>} Trade history
   */
  async fetchHistory(limit = 20) {
    const response = await fetch(`${this.baseURL}/api/history?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Format number as USD currency
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Format timestamp to readable date/time
   * @param {string|Date} timestamp - Timestamp to format
   * @returns {string} Formatted date/time string
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Get CSS class for drawdown display
   * @param {string} drawdown - Drawdown percentage string
   * @returns {string} CSS class name
   */
  getDrawdownClass(drawdown) {
    const value = parseFloat(drawdown);
    if (value < 5) return 'positive';
    if (value < 8) return 'warning';
    return 'negative';
  }

  /**
   * Get badge class based on current value vs limit
   * @param {string} current - Current value percentage
   * @param {string} limit - Limit value percentage
   * @returns {string} Badge class name
   */
  getLimitBadgeClass(current, limit) {
    const currentVal = parseFloat(current);
    const limitVal = parseFloat(limit);
    const percentage = (currentVal / limitVal) * 100;

    if (percentage < 50) return 'limit-ok';
    if (percentage < 80) return 'limit-warning';
    return 'limit-danger';
  }
}

// Browser-side initialization
if (typeof window !== 'undefined') {
  class Dashboard {
    constructor() {
      this.api = new DashboardAPI();
      this.updateInterval = null;
      this.initializeElements();
      this.attachEventListeners();
      this.startAutoUpdate();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
      this.elements = {
        status: document.getElementById('status'),
        totalValue: document.getElementById('total-value'),
        cashBalance: document.getElementById('cash-balance'),
        peakValue: document.getElementById('peak-value'),
        drawdown: document.getElementById('drawdown'),
        maxRisk: document.getElementById('max-risk'),
        maxDrawdown: document.getElementById('max-drawdown'),
        maxPosition: document.getElementById('max-position'),
        drawdownStatus: document.getElementById('drawdown-status'),
        positionsBody: document.getElementById('positions-body'),
        historyBody: document.getElementById('history-body'),
        errorContainer: document.getElementById('error-container'),
        refreshPortfolio: document.getElementById('refresh-portfolio')
      };
    }

    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
      this.elements.refreshPortfolio.addEventListener('click', () => {
        this.refreshAll();
      });
    }

    /**
     * Update status indicator
     */
    updateStatus(message, type = 'loading') {
      this.elements.status.textContent = message;
      this.elements.status.className = `status ${type}`;
    }

    /**
     * Show error message
     */
    showError(message) {
      this.elements.errorContainer.innerHTML = `
        <div class="error-message">
          <strong>Error:</strong> ${message}
        </div>
      `;
    }

    /**
     * Clear error message
     */
    clearError() {
      this.elements.errorContainer.innerHTML = '';
    }

    /**
     * Update portfolio display
     */
    async updatePortfolio() {
      try {
        const portfolio = await this.api.fetchPortfolio();
        this.elements.totalValue.textContent = this.api.formatCurrency(portfolio.totalValue);
        this.elements.cashBalance.textContent = this.api.formatCurrency(portfolio.cash);
      } catch (error) {
        console.error('Failed to update portfolio:', error);
        throw error;
      }
    }

    /**
     * Update risk metrics display
     */
    async updateMetrics() {
      try {
        const metrics = await this.api.fetchMetrics();

        // Update portfolio metrics
        this.elements.peakValue.textContent = this.api.formatCurrency(parseFloat(metrics.peakValue));
        this.elements.drawdown.textContent = metrics.drawdown;
        this.elements.drawdown.className = `metric-value ${this.api.getDrawdownClass(metrics.drawdown)}`;

        // Update risk limits
        this.elements.maxRisk.textContent = metrics.limits.maxRiskPerTrade;
        this.elements.maxDrawdown.textContent = metrics.limits.maxDrawdown;
        this.elements.maxPosition.textContent = metrics.limits.maxPositionSize;

        // Update drawdown status
        const statusText = metrics.drawdownAllowed ? 'Within Limits' : 'EXCEEDED';
        const statusClass = metrics.drawdownAllowed ? 'positive' : 'negative';
        this.elements.drawdownStatus.textContent = statusText;
        this.elements.drawdownStatus.className = `metric-value ${statusClass}`;

        // Update positions table
        this.updatePositionsTable(metrics.positions);
      } catch (error) {
        console.error('Failed to update metrics:', error);
        throw error;
      }
    }

    /**
     * Update positions table
     */
    updatePositionsTable(positions) {
      if (!positions || Object.keys(positions).length === 0) {
        this.elements.positionsBody.innerHTML = `
          <tr><td colspan="4" class="empty-state">No positions</td></tr>
        `;
        return;
      }

      const rows = Object.entries(positions).map(([symbol, data]) => {
        const badgeClass = this.api.getLimitBadgeClass(data.percentOfPortfolio, '20%');
        return `
          <tr>
            <td><strong>${symbol}</strong></td>
            <td>${data.quantity}</td>
            <td>${this.api.formatCurrency(data.value)}</td>
            <td>
              ${data.percentOfPortfolio}
              <span class="limit-badge ${badgeClass}">${data.percentOfPortfolio}</span>
            </td>
          </tr>
        `;
      }).join('');

      this.elements.positionsBody.innerHTML = rows;
    }

    /**
     * Update trade history table
     */
    async updateHistory() {
      try {
        const history = await this.api.fetchHistory(20);

        if (!history || history.length === 0) {
          this.elements.historyBody.innerHTML = `
            <tr><td colspan="6" class="empty-state">No trades yet</td></tr>
          `;
          return;
        }

        const rows = history.map(trade => {
          const total = trade.price * trade.quantity;
          const actionClass = trade.action === 'buy' ? 'positive' : 'negative';
          return `
            <tr>
              <td>${this.api.formatTimestamp(trade.timestamp)}</td>
              <td><span class="metric-value ${actionClass}">${trade.action.toUpperCase()}</span></td>
              <td><strong>${trade.symbol}</strong></td>
              <td>${trade.quantity}</td>
              <td>${this.api.formatCurrency(trade.price)}</td>
              <td>${this.api.formatCurrency(total)}</td>
            </tr>
          `;
        }).join('');

        this.elements.historyBody.innerHTML = rows;
      } catch (error) {
        console.error('Failed to update history:', error);
        throw error;
      }
    }

    /**
     * Refresh all dashboard data
     */
    async refreshAll() {
      this.updateStatus('Updating...', 'loading');
      this.clearError();
      this.elements.refreshPortfolio.disabled = true;

      try {
        await Promise.all([
          this.updatePortfolio(),
          this.updateMetrics(),
          this.updateHistory()
        ]);
        this.updateStatus('Connected', 'connected');
      } catch (error) {
        this.updateStatus('Error', 'error');
        this.showError(error.message);
      } finally {
        this.elements.refreshPortfolio.disabled = false;
      }
    }

    /**
     * Start auto-update interval
     */
    startAutoUpdate() {
      // Initial load
      this.refreshAll();

      // Update every 5 seconds
      this.updateInterval = setInterval(() => {
        this.refreshAll();
      }, 5000);
    }

    /**
     * Stop auto-update interval
     */
    stopAutoUpdate() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    }
  }

  // Initialize dashboard when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new Dashboard();
    });
  } else {
    new Dashboard();
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardAPI;
}

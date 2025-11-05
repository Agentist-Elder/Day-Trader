// Dashboard.js Tests - London School TDD
// Testing the client-side JavaScript that interacts with the API

/**
 * Since this is client-side code that runs in the browser,
 * we'll test the core logic and API interaction patterns.
 * We mock the fetch API and DOM elements.
 */

// Mock fetch globally
global.fetch = jest.fn();

// Mock DOM elements
const mockElements = {
  status: { textContent: '', classList: { add: jest.fn(), remove: jest.fn() } },
  totalValue: { textContent: '' },
  cashBalance: { textContent: '' },
  peakValue: { textContent: '' },
  drawdown: { textContent: '' },
  maxRisk: { textContent: '' },
  maxDrawdown: { textContent: '' },
  maxPosition: { textContent: '' },
  drawdownStatus: { textContent: '' },
  positionsBody: { innerHTML: '' },
  historyBody: { innerHTML: '' },
  errorContainer: { innerHTML: '' },
  refreshPortfolio: { addEventListener: jest.fn(), disabled: false }
};

global.document = {
  getElementById: jest.fn((id) => mockElements[id.replace(/-/g, '')])
};

// Import the dashboard module
const DashboardAPI = require('./dashboard');

describe('DashboardAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    Object.keys(mockElements).forEach(key => {
      if (mockElements[key].textContent !== undefined) {
        mockElements[key].textContent = '';
      }
      if (mockElements[key].innerHTML !== undefined) {
        mockElements[key].innerHTML = '';
      }
    });
  });

  describe('fetchPortfolio', () => {
    it('should fetch and update portfolio data successfully', async () => {
      const mockData = {
        cash: 95000,
        totalValue: 100500,
        positions: { 'AAPL': 10 }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const api = new DashboardAPI('http://localhost:3000');
      const result = await api.fetchPortfolio();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/portfolio');
      expect(result).toEqual(mockData);
    });

    it('should throw error when fetch fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });

      const api = new DashboardAPI('http://localhost:3000');
      await expect(api.fetchPortfolio()).rejects.toThrow('Failed to fetch portfolio: Internal Server Error');
    });

    it('should throw error when network request fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const api = new DashboardAPI('http://localhost:3000');
      await expect(api.fetchPortfolio()).rejects.toThrow('Network error');
    });
  });

  describe('fetchMetrics', () => {
    it('should fetch and return risk metrics successfully', async () => {
      const mockMetrics = {
        portfolioValue: '100500.00',
        peakValue: '101000.00',
        drawdown: '0.50%',
        drawdownAllowed: true,
        positions: {},
        limits: {
          maxRiskPerTrade: '1%',
          maxDrawdown: '10%',
          maxPositionSize: '20%'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics
      });

      const api = new DashboardAPI('http://localhost:3000');
      const result = await api.fetchMetrics();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/metrics');
      expect(result).toEqual(mockMetrics);
    });

    it('should throw error when fetch fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Service Unavailable'
      });

      const api = new DashboardAPI('http://localhost:3000');
      await expect(api.fetchMetrics()).rejects.toThrow('Failed to fetch metrics: Service Unavailable');
    });
  });

  describe('fetchHistory', () => {
    it('should fetch and return trade history successfully', async () => {
      const mockHistory = [
        { action: 'buy', symbol: 'AAPL', quantity: 10, price: 150, timestamp: '2024-01-01T00:00:00.000Z' }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory
      });

      const api = new DashboardAPI('http://localhost:3000');
      const result = await api.fetchHistory();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/history?limit=20');
      expect(result).toEqual(mockHistory);
    });

    it('should accept custom limit parameter', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const api = new DashboardAPI('http://localhost:3000');
      await api.fetchHistory(50);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/history?limit=50');
    });

    it('should throw error when fetch fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      const api = new DashboardAPI('http://localhost:3000');
      await expect(api.fetchHistory()).rejects.toThrow('Failed to fetch history: Bad Request');
    });
  });

  describe('formatCurrency', () => {
    it('should format numbers as USD currency', () => {
      const api = new DashboardAPI('http://localhost:3000');
      expect(api.formatCurrency(100500)).toBe('$100,500.00');
      expect(api.formatCurrency(95000)).toBe('$95,000.00');
      expect(api.formatCurrency(1500.5)).toBe('$1,500.50');
    });

    it('should handle zero values', () => {
      const api = new DashboardAPI('http://localhost:3000');
      expect(api.formatCurrency(0)).toBe('$0.00');
    });

    it('should handle negative values', () => {
      const api = new DashboardAPI('http://localhost:3000');
      expect(api.formatCurrency(-500)).toBe('-$500.00');
    });
  });

  describe('formatTimestamp', () => {
    it('should format ISO timestamp to readable format', () => {
      const api = new DashboardAPI('http://localhost:3000');
      const timestamp = '2024-01-15T10:30:45.000Z';
      const result = api.formatTimestamp(timestamp);
      // Result will vary by timezone, just check it's formatted
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle Date objects', () => {
      const api = new DashboardAPI('http://localhost:3000');
      const date = new Date('2024-01-15T10:30:45.000Z');
      const result = api.formatTimestamp(date);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('getDrawdownClass', () => {
    it('should return positive class for low drawdown', () => {
      const api = new DashboardAPI('http://localhost:3000');
      expect(api.getDrawdownClass('0.50%')).toBe('positive');
      expect(api.getDrawdownClass('2.00%')).toBe('positive');
    });

    it('should return warning class for medium drawdown', () => {
      const api = new DashboardAPI('http://localhost:3000');
      expect(api.getDrawdownClass('5.00%')).toBe('warning');
      expect(api.getDrawdownClass('7.50%')).toBe('warning');
    });

    it('should return negative class for high drawdown', () => {
      const api = new DashboardAPI('http://localhost:3000');
      expect(api.getDrawdownClass('8.00%')).toBe('negative');
      expect(api.getDrawdownClass('10.00%')).toBe('negative');
    });

    it('should handle values without % sign', () => {
      const api = new DashboardAPI('http://localhost:3000');
      expect(api.getDrawdownClass('5.0')).toBe('warning');
    });
  });

  describe('getLimitBadgeClass', () => {
    it('should return limit-ok for values under 50%', () => {
      const api = new DashboardAPI('http://localhost:3000');
      // 9.5% out of 20% limit = 47.5% utilization (< 50%)
      expect(api.getLimitBadgeClass('9.50%', '20%')).toBe('limit-ok');
      expect(api.getLimitBadgeClass('5.00%', '20%')).toBe('limit-ok');
    });

    it('should return limit-warning for values 50-80%', () => {
      const api = new DashboardAPI('http://localhost:3000');
      expect(api.getLimitBadgeClass('12.00%', '20%')).toBe('limit-warning');
    });

    it('should return limit-danger for values over 80%', () => {
      const api = new DashboardAPI('http://localhost:3000');
      expect(api.getLimitBadgeClass('18.00%', '20%')).toBe('limit-danger');
    });

    it('should handle string number values', () => {
      const api = new DashboardAPI('http://localhost:3000');
      expect(api.getLimitBadgeClass('5.50', '10')).toBe('limit-warning');
    });
  });

  describe('error handling', () => {
    it('should handle API returning error object', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch portfolio', message: 'Database error' }),
        statusText: 'Internal Server Error'
      });

      const api = new DashboardAPI('http://localhost:3000');
      await expect(api.fetchPortfolio()).rejects.toThrow();
    });

    it('should handle malformed JSON response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      const api = new DashboardAPI('http://localhost:3000');
      await expect(api.fetchPortfolio()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Base URL handling', () => {
    it('should use custom base URL when provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      const api = new DashboardAPI('http://custom-server:8080');
      await api.fetchPortfolio();

      expect(fetch).toHaveBeenCalledWith('http://custom-server:8080/api/portfolio');
    });

    it('should default to relative URLs when no base URL provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      const api = new DashboardAPI();
      await api.fetchPortfolio();

      expect(fetch).toHaveBeenCalledWith('/api/portfolio');
    });
  });
});

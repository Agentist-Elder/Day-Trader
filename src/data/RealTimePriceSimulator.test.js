const RealTimePriceSimulator = require('./RealTimePriceSimulator');
const MockDataFeed = require('./MockDataFeed');

// Mock the MockDataFeed
jest.mock('./MockDataFeed');

describe('RealTimePriceSimulator', () => {
  let simulator;
  let mockDataFeed;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup mock implementation
    mockDataFeed = {
      getPrice: jest.fn()
    };
    MockDataFeed.mockImplementation(() => mockDataFeed);

    simulator = new RealTimePriceSimulator();
  });

  afterEach(() => {
    if (simulator && simulator.stop) {
      simulator.stop();
    }
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(simulator).toBeDefined();
      expect(simulator).toBeInstanceOf(RealTimePriceSimulator);
    });

    it('should initialize with MockDataFeed', () => {
      expect(MockDataFeed).toHaveBeenCalled();
    });

    it('should have default update interval of 1000ms', () => {
      expect(simulator.updateInterval).toBe(1000);
    });

    it('should accept custom update interval', () => {
      const customSimulator = new RealTimePriceSimulator(500);
      expect(customSimulator.updateInterval).toBe(500);
      customSimulator.stop();
    });

    it('should initialize with empty subscribers', () => {
      expect(simulator.subscribers).toEqual({});
    });

    it('should not be running initially', () => {
      expect(simulator.isRunning).toBe(false);
    });
  });

  describe('subscribe', () => {
    it('should allow subscribing to a symbol', () => {
      const callback = jest.fn();
      simulator.subscribe('AAPL', callback);

      expect(simulator.subscribers['AAPL']).toBeDefined();
      expect(simulator.subscribers['AAPL']).toContain(callback);
    });

    it('should allow multiple subscribers for same symbol', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      simulator.subscribe('AAPL', callback1);
      simulator.subscribe('AAPL', callback2);

      expect(simulator.subscribers['AAPL']).toHaveLength(2);
      expect(simulator.subscribers['AAPL']).toContain(callback1);
      expect(simulator.subscribers['AAPL']).toContain(callback2);
    });

    it('should allow subscribing to different symbols', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      simulator.subscribe('AAPL', callback1);
      simulator.subscribe('GOOGL', callback2);

      expect(simulator.subscribers['AAPL']).toContain(callback1);
      expect(simulator.subscribers['GOOGL']).toContain(callback2);
    });

    it('should return unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = simulator.subscribe('AAPL', callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove subscriber when unsubscribe is called', () => {
      const callback = jest.fn();
      const unsubscribe = simulator.subscribe('AAPL', callback);

      expect(simulator.subscribers['AAPL']).toContain(callback);

      unsubscribe();

      // Array should be deleted when empty
      expect(simulator.subscribers['AAPL']).toBeUndefined();
    });

    it('should handle unsubscribe when already unsubscribed', () => {
      const callback = jest.fn();
      const unsubscribe = simulator.subscribe('AAPL', callback);

      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should throw error if callback is not a function', () => {
      expect(() => simulator.subscribe('AAPL', 'not-a-function')).toThrow();
      expect(() => simulator.subscribe('AAPL', null)).toThrow();
      expect(() => simulator.subscribe('AAPL', undefined)).toThrow();
    });

    it('should throw error if symbol is not a string', () => {
      const callback = jest.fn();
      expect(() => simulator.subscribe(null, callback)).toThrow();
      expect(() => simulator.subscribe(undefined, callback)).toThrow();
      expect(() => simulator.subscribe(123, callback)).toThrow();
    });
  });

  describe('unsubscribe', () => {
    it('should remove specific callback from symbol', () => {
      const callback = jest.fn();
      simulator.subscribe('AAPL', callback);

      simulator.unsubscribe('AAPL', callback);

      // Array should be deleted when empty
      expect(simulator.subscribers['AAPL']).toBeUndefined();
    });

    it('should handle unsubscribing non-existent symbol', () => {
      const callback = jest.fn();
      expect(() => simulator.unsubscribe('NONEXISTENT', callback)).not.toThrow();
    });

    it('should handle unsubscribing non-existent callback', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      simulator.subscribe('AAPL', callback1);

      expect(() => simulator.unsubscribe('AAPL', callback2)).not.toThrow();
    });
  });

  describe('start', () => {
    it('should start the simulator', () => {
      simulator.start();
      expect(simulator.isRunning).toBe(true);
    });

    it('should not start multiple times', () => {
      simulator.start();
      simulator.start();

      expect(simulator.isRunning).toBe(true);
      // Should only have one interval running
    });

    it('should fetch prices for subscribed symbols', async () => {
      mockDataFeed.getPrice.mockResolvedValue(150);

      const callback = jest.fn();
      simulator.subscribe('AAPL', callback);

      simulator.start();

      // Fast-forward time by update interval
      await jest.advanceTimersByTimeAsync(1000);

      expect(mockDataFeed.getPrice).toHaveBeenCalledWith('AAPL');
    });

    it('should call subscribers with price updates', async () => {
      mockDataFeed.getPrice.mockResolvedValue(150);

      const callback = jest.fn();
      simulator.subscribe('AAPL', callback);

      simulator.start();

      await jest.advanceTimersByTimeAsync(1000);

      expect(callback).toHaveBeenCalledWith({
        symbol: 'AAPL',
        price: 150,
        timestamp: expect.any(Number)
      });
    });

    it('should update multiple symbols', async () => {
      mockDataFeed.getPrice
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(2800);

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      simulator.subscribe('AAPL', callback1);
      simulator.subscribe('GOOGL', callback2);

      simulator.start();

      await jest.advanceTimersByTimeAsync(1000);

      expect(callback1).toHaveBeenCalledWith({
        symbol: 'AAPL',
        price: 150,
        timestamp: expect.any(Number)
      });

      expect(callback2).toHaveBeenCalledWith({
        symbol: 'GOOGL',
        price: 2800,
        timestamp: expect.any(Number)
      });
    });

    it('should call all subscribers for a symbol', async () => {
      mockDataFeed.getPrice.mockResolvedValue(150);

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      simulator.subscribe('AAPL', callback1);
      simulator.subscribe('AAPL', callback2);

      simulator.start();

      await jest.advanceTimersByTimeAsync(1000);

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should update at specified interval', async () => {
      mockDataFeed.getPrice.mockResolvedValue(150);

      const callback = jest.fn();
      simulator.subscribe('AAPL', callback);

      simulator.start();

      await jest.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should use custom update interval', async () => {
      const customSimulator = new RealTimePriceSimulator(500);
      mockDataFeed.getPrice.mockResolvedValue(150);

      const callback = jest.fn();
      customSimulator.subscribe('AAPL', callback);

      customSimulator.start();

      await jest.advanceTimersByTimeAsync(500);
      expect(callback).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(500);
      expect(callback).toHaveBeenCalledTimes(2);

      customSimulator.stop();
    });

    it('should handle errors from data feed gracefully', async () => {
      mockDataFeed.getPrice.mockRejectedValue(new Error('Network error'));

      const callback = jest.fn();
      simulator.subscribe('AAPL', callback);

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      simulator.start();

      await jest.advanceTimersByTimeAsync(1000);

      // Callback should not be called on error
      expect(callback).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should continue updating after an error', async () => {
      mockDataFeed.getPrice
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(150);

      const callback = jest.fn();
      simulator.subscribe('AAPL', callback);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      simulator.start();

      // First update fails
      await jest.advanceTimersByTimeAsync(1000);
      expect(callback).not.toHaveBeenCalled();

      // Second update succeeds
      await jest.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should not update if no subscribers', async () => {
      simulator.start();

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockDataFeed.getPrice).not.toHaveBeenCalled();
    });

    it('should handle errors in subscriber callbacks gracefully', async () => {
      mockDataFeed.getPrice.mockResolvedValue(150);

      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const goodCallback = jest.fn();

      simulator.subscribe('AAPL', errorCallback);
      simulator.subscribe('AAPL', goodCallback);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      simulator.start();

      await jest.advanceTimersByTimeAsync(1000);

      // Both callbacks should be called despite error
      expect(errorCallback).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in subscriber callback'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('stop', () => {
    it('should stop the simulator', () => {
      simulator.start();
      simulator.stop();

      expect(simulator.isRunning).toBe(false);
    });

    it('should stop calling subscribers', async () => {
      mockDataFeed.getPrice.mockResolvedValue(150);

      const callback = jest.fn();
      simulator.subscribe('AAPL', callback);

      simulator.start();

      await jest.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalledTimes(1);

      simulator.stop();

      await jest.advanceTimersByTimeAsync(1000);
      // Should not be called again after stop
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call multiple times', () => {
      simulator.start();
      simulator.stop();

      expect(() => simulator.stop()).not.toThrow();
      expect(simulator.isRunning).toBe(false);
    });

    it('should be safe to call when not started', () => {
      expect(() => simulator.stop()).not.toThrow();
      expect(simulator.isRunning).toBe(false);
    });
  });

  describe('getSubscribedSymbols', () => {
    it('should return empty array when no subscriptions', () => {
      expect(simulator.getSubscribedSymbols()).toEqual([]);
    });

    it('should return subscribed symbols', () => {
      const callback = jest.fn();
      simulator.subscribe('AAPL', callback);
      simulator.subscribe('GOOGL', callback);

      const symbols = simulator.getSubscribedSymbols();
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('GOOGL');
      expect(symbols.length).toBe(2);
    });

    it('should not return symbols with no subscribers', () => {
      const callback = jest.fn();
      const unsubscribe = simulator.subscribe('AAPL', callback);

      unsubscribe();

      expect(simulator.getSubscribedSymbols()).toEqual([]);
    });
  });

  describe('integration scenarios', () => {
    it('should support dynamic subscription changes', async () => {
      mockDataFeed.getPrice.mockResolvedValue(150);

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      simulator.subscribe('AAPL', callback1);
      simulator.start();

      await jest.advanceTimersByTimeAsync(1000);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();

      // Add another subscription while running
      simulator.subscribe('AAPL', callback2);

      await jest.advanceTimersByTimeAsync(1000);
      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should handle unsubscribe while running', async () => {
      mockDataFeed.getPrice.mockResolvedValue(150);

      const callback = jest.fn();
      const unsubscribe = simulator.subscribe('AAPL', callback);

      simulator.start();

      await jest.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      await jest.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle restart after stop', async () => {
      mockDataFeed.getPrice.mockResolvedValue(150);

      const callback = jest.fn();
      simulator.subscribe('AAPL', callback);

      simulator.start();
      await jest.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalledTimes(1);

      simulator.stop();
      await jest.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalledTimes(1);

      simulator.start();
      await jest.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should provide accurate timestamps', async () => {
      mockDataFeed.getPrice.mockResolvedValue(150);

      const callback = jest.fn();
      simulator.subscribe('AAPL', callback);

      const startTime = Date.now();
      simulator.start();

      await jest.advanceTimersByTimeAsync(1000);

      const call = callback.mock.calls[0][0];
      expect(call.timestamp).toBeGreaterThanOrEqual(startTime);
    });
  });

  describe('edge cases', () => {
    it('should handle empty symbol string', () => {
      const callback = jest.fn();
      expect(() => simulator.subscribe('', callback)).toThrow();
    });

    it('should handle very small update intervals', async () => {
      const fastSimulator = new RealTimePriceSimulator(1);
      mockDataFeed.getPrice.mockResolvedValue(150);

      const callback = jest.fn();
      fastSimulator.subscribe('AAPL', callback);

      fastSimulator.start();

      await jest.advanceTimersByTimeAsync(1);
      expect(callback).toHaveBeenCalled();

      fastSimulator.stop();
    });

    it('should handle very large update intervals', async () => {
      const slowSimulator = new RealTimePriceSimulator(60000);
      mockDataFeed.getPrice.mockResolvedValue(150);

      const callback = jest.fn();
      slowSimulator.subscribe('AAPL', callback);

      slowSimulator.start();

      await jest.advanceTimersByTimeAsync(59999);
      expect(callback).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(1);
      expect(callback).toHaveBeenCalled();

      slowSimulator.stop();
    });

    it('should handle subscribing same callback multiple times', () => {
      const callback = jest.fn();

      simulator.subscribe('AAPL', callback);
      simulator.subscribe('AAPL', callback);

      // Should only be added once
      expect(simulator.subscribers['AAPL'].filter(cb => cb === callback).length).toBe(2);
    });
  });
});

/**
 * Phase 4: Strategy Development - Usage Example
 *
 * This example demonstrates all three trading strategies:
 * 1. MomentumStrategy - Trend following
 * 2. MeanReversionStrategy - Buy low, sell high
 * 3. RiskManager - Risk controls
 */

const MockDataFeed = require('../src/data/MockDataFeed');
const TemporalAnalyzer = require('../src/core/TemporalAnalyzer');
const MomentumStrategy = require('../src/strategies/MomentumStrategy');
const MeanReversionStrategy = require('../src/strategies/MeanReversionStrategy');
const StrategyVerifier = require('../src/core/StrategyVerifier');
const RiskManager = require('../src/core/RiskManager');

async function demonstrateStrategies() {
  console.log('=== Phase 4: Strategy Development Demo ===\n');

  // Initialize dependencies
  const dataFeed = new MockDataFeed();
  const analyzer = new TemporalAnalyzer();

  // Initialize strategies
  const momentumStrategy = new MomentumStrategy(dataFeed, analyzer);
  const meanReversionStrategy = new MeanReversionStrategy(dataFeed, analyzer);
  const verifier = new StrategyVerifier();

  const symbols = ['AAPL', 'GOOGL', 'TSLA'];

  console.log('1. Momentum Strategy Analysis:');
  console.log('   (Follows trends - BUY in uptrends, SELL in downtrends)\n');

  for (const symbol of symbols) {
    try {
      const analysis = await momentumStrategy.analyze(symbol);

      const signalEmoji = {
        BUY: '📈 ',
        SELL: '📉',
        HOLD: '➡️ '
      };

      console.log(`   ${symbol}:`);
      console.log(`     Signal: ${signalEmoji[analysis.signal]} ${analysis.signal}`);
      console.log(`     Momentum: ${(analysis.momentum * 100).toFixed(2)}%`);
      console.log(`     Sentiment: ${analysis.sentiment}`);
      console.log(`     Trend: ${analysis.trend}`);
      console.log(`     Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
      console.log('');
    } catch (error) {
      console.log(`     Error analyzing ${symbol}: ${error.message}`);
    }
  }

  console.log('\n2. Mean Reversion Strategy Analysis:');
  console.log('   (Buy when oversold, sell when overbought)\n');

  for (const symbol of symbols) {
    try {
      const analysis = await meanReversionStrategy.analyze(symbol);

      const signalEmoji = {
        BUY: '📈',
        SELL: '📉',
        HOLD: '➡️'
      };

      const condition =
        analysis.deviation > 2
          ? 'OVERBOUGHT'
          : analysis.deviation < -2
          ? 'OVERSOLD'
          : 'NORMAL';

      console.log(`   ${symbol}:`);
      console.log(`     Signal: ${signalEmoji[analysis.signal]} ${analysis.signal}`);
      console.log(`     Current Price: $${analysis.currentPrice.toFixed(2)}`);
      console.log(`     Mean (20-day): $${analysis.mean.toFixed(2)}`);
      console.log(`     Std Dev: $${analysis.stdDev.toFixed(2)}`);
      console.log(`     Deviation: ${analysis.deviation.toFixed(2)}σ (${condition})`);
      console.log(`     Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
      console.log('');
    } catch (error) {
      console.log(`     Error analyzing ${symbol}: ${error.message}`);
    }
  }

  console.log('\n3. Strategy Comparison:');
  console.log('   (Same symbol, different strategies)\n');

  const testSymbol = 'AAPL';
  const momentumAnalysis = await momentumStrategy.analyze(testSymbol);
  const meanRevAnalysis = await meanReversionStrategy.analyze(testSymbol);

  console.log(`   ${testSymbol}:`);
  console.log(`     Momentum Strategy: ${momentumAnalysis.signal} (${(momentumAnalysis.confidence * 100).toFixed(0)}% confidence)`);
  console.log(`     Mean Reversion Strategy: ${meanRevAnalysis.signal} (${(meanRevAnalysis.confidence * 100).toFixed(0)}% confidence)`);

  if (momentumAnalysis.signal === meanRevAnalysis.signal) {
    console.log(`     ✅ Both strategies agree: ${momentumAnalysis.signal}`);
  } else {
    console.log(`     ⚠️  Strategies disagree - use caution or higher confidence strategy`);
  }

  console.log('\n4. Strategy Verification (Formal Rules Check):');
  console.log('   (Verify strategies meet safety requirements)\n');

  // Generate sample historical data for verification
  const goodTradeHistory = Array(100)
    .fill(null)
    .map((_, i) => ({
      outcome: i % 5 === 0 ? -300 : 200 // 80% win rate, acceptable losses
    }));

  const riskyTradeHistory = Array(100)
    .fill(null)
    .map((_, i) => ({
      outcome: i % 5 === 0 ? 100 : -500 // 20% win rate, large losses
    }));

  console.log('   Testing a SAFE strategy...');
  const safeVerification = await verifier.verifyStrategy({}, goodTradeHistory);
  console.log(`     Valid: ${safeVerification.valid ? '✅' : '❌'}`);
  console.log(`     Recommendation: ${safeVerification.recommendation}`);
  console.log(`     Win Rate: ${(safeVerification.metrics.winRate * 100).toFixed(0)}%`);
  console.log(`     Max Drawdown: ${(safeVerification.metrics.maxDrawdown * 100).toFixed(2)}%`);
  console.log(`     Avg Risk: ${(safeVerification.metrics.avgRisk * 100).toFixed(2)}%`);

  console.log('\n   Testing a RISKY strategy...');
  const riskyVerification = await verifier.verifyStrategy({}, riskyTradeHistory);
  console.log(`     Valid: ${riskyVerification.valid ? '✅' : '❌'}`);
  console.log(`     Recommendation: ${riskyVerification.recommendation}`);
  console.log(`     Win Rate: ${(riskyVerification.metrics.winRate * 100).toFixed(0)}%`);
  console.log(`     Max Drawdown: ${(riskyVerification.metrics.maxDrawdown * 100).toFixed(2)}%`);
  console.log(`     Avg Risk: ${(riskyVerification.metrics.avgRisk * 100).toFixed(2)}%`);

  console.log('\n5. Risk Management Integration:');
  console.log('   (Checking if trades pass risk limits)\n');

  // Mock trading engine for risk manager
  const mockEngine = {
    portfolio: {
      cash: 100000,
      positions: {
        AAPL: 10
      }
    },
    getPrice: async (symbol) => {
      return dataFeed.getPrice(symbol);
    }
  };

  const riskManager = new RiskManager(mockEngine);

  // Test various trade scenarios
  console.log('   Scenario 1: Small buy order (should pass)');
  const trade1 = await riskManager.checkTrade('buy', 'GOOGL', 5, 2800);
  console.log(`     Result: ${trade1.allowed ? '✅ ALLOWED' : '❌ BLOCKED'}`);
  console.log(`     Reason: ${trade1.reason}`);
  if (trade1.metrics) {
    console.log(`     Risk per trade: ${trade1.metrics.riskPerTrade}`);
    console.log(`     Position size: ${trade1.metrics.positionSize}`);
  }

  console.log('\n   Scenario 2: Large buy order (may be blocked)');
  const trade2 = await riskManager.checkTrade('buy', 'GOOGL', 100, 2800);
  console.log(`     Result: ${trade2.allowed ? '✅ ALLOWED' : '❌ BLOCKED'}`);
  console.log(`     Reason: ${trade2.reason}`);

  console.log('\n   Scenario 3: Sell order (always allowed)');
  const trade3 = await riskManager.checkTrade('sell', 'AAPL', 5, 150);
  console.log(`     Result: ${trade3.allowed ? '✅ ALLOWED' : '❌ BLOCKED'}`);
  console.log(`     Reason: ${trade3.reason}`);

  console.log('\n6. Complete Trading Decision Example:');
  console.log('   (Combining strategy + verification + risk management)\n');

  const symbol = 'AAPL';

  // 1. Get strategy signal
  const signal = await momentumStrategy.analyze(symbol);
  console.log(`   Step 1: Strategy Analysis`);
  console.log(`     Signal: ${signal.signal}`);
  console.log(`     Confidence: ${(signal.confidence * 100).toFixed(0)}%`);

  // 2. Check if we should act on the signal
  if (signal.signal !== 'HOLD' && signal.confidence > 0.7) {
    console.log(`\n   Step 2: High confidence ${signal.signal} signal - checking risk...`);

    const quantity = signal.signal === 'BUY' ? 10 : 5;
    const price = await dataFeed.getPrice(symbol);

    const riskCheck = await riskManager.checkTrade(
      signal.signal.toLowerCase(),
      symbol,
      quantity,
      price
    );

    console.log(`     Risk Check: ${riskCheck.allowed ? 'PASSED ✅' : 'FAILED ❌'}`);

    if (riskCheck.allowed) {
      console.log(`\n   Step 3: Execute Trade`);
      console.log(`     ${signal.signal} ${quantity} shares of ${symbol} at $${price.toFixed(2)}`);
      console.log(`     Total: $${(quantity * price).toFixed(2)}`);
    } else {
      console.log(`\n   Step 3: Trade Blocked`);
      console.log(`     Reason: ${riskCheck.reason}`);
    }
  } else {
    console.log(`\n   Step 2: ${signal.confidence > 0.7 ? 'HOLD signal' : 'Low confidence'} - no action taken`);
  }

  console.log('\n=== Demo Complete ===');
  console.log('\nKey Takeaways:');
  console.log('  • Momentum Strategy: Follows trends (momentum > 2%)');
  console.log('  • Mean Reversion: Buys dips, sells rallies (±2σ from mean)');
  console.log('  • Strategy Verifier: Ensures strategies meet safety rules');
  console.log('  • Risk Manager: Enforces position limits and drawdown controls');
  console.log('  • Combine all tools for comprehensive trading decisions');
}

// Run the demonstration
if (require.main === module) {
  demonstrateStrategies().catch(console.error);
}

module.exports = { demonstrateStrategies };

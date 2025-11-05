// Test AgentDB Memory Manager
const MemoryManager = require('./src/core/MemoryManager');

async function testMemory() {
  console.log('Testing Memory Manager...\n');
  
  try {
    const memory = new MemoryManager();
    console.log('✅ Memory Manager initialized');
    
    // Store a pattern
    const pattern = {
      action: 'buy',
      price: 150,
      volume: 1000,
      momentum: 0.8
    };
    
    await memory.storePattern(pattern, 25.50);
    console.log('✅ Pattern stored');
    
    // Search for similar
    const similar = await memory.findSimilar({
      price: 152,
      volume: 900,
      momentum: 0.75
    });
    
    console.log('📊 Similar patterns found:', similar.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMemory();

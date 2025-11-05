// AgentDB Memory Manager - Simplified for testing
class MemoryManager {
  constructor() {
    this.patterns = [];
    this.skills = new Map();
  }

  async storePattern(pattern, outcome) {
    const entry = {
      pattern,
      outcome,
      timestamp: Date.now(),
      success: outcome > 0
    };
    this.patterns.push(entry);
    
    // Store successful patterns as skills
    if (outcome > 0) {
      this.skills.set(pattern.action, pattern);
    }
    
    return entry;
  }

  async findSimilar(currentPattern, k = 5) {
    // Simple similarity based on price difference
    return this.patterns
      .map(entry => ({
        ...entry,
        similarity: 1 / (1 + Math.abs(entry.pattern.price - currentPattern.price))
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }

  getSkills() {
    return Array.from(this.skills.values());
  }
}

module.exports = MemoryManager;

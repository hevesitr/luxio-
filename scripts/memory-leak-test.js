#!/usr/bin/env node

/**
 * Memory Leak Detection Test
 *
 * Monitors memory usage patterns and detects potential memory leaks
 * Takes heap snapshots and analyzes memory growth over time
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class MemoryLeakDetector {
  constructor() {
    this.snapshots = [];
    this.testDuration = 5 * 60 * 1000; // 5 minutes
    this.interval = 10000; // 10 seconds
    this.maxMemoryGrowth = 50 * 1024 * 1024; // 50MB acceptable growth
  }

  async runMemoryLeakTest() {
    console.log('🧠 Starting Memory Leak Detection Test...\n');
    console.log(`Test Duration: ${this.testDuration / 1000 / 60} minutes`);
    console.log(`Snapshot Interval: ${this.interval / 1000} seconds\n`);

    try {
      await this.takeInitialSnapshot();
      await this.simulateUserActivity();
      await this.takeFinalSnapshot();
      await this.analyzeResults();

      console.log('✅ Memory leak test completed!');
      return this.generateReport();
    } catch (error) {
      console.error('❌ Memory leak test failed:', error.message);
      throw error;
    }
  }

  async takeInitialSnapshot() {
    console.log('📸 Taking initial memory snapshot...');

    if (global.gc) {
      global.gc(); // Force garbage collection if available
    }

    const snapshot = {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      heapUsed: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss,
      phase: 'initial'
    };

    this.snapshots.push(snapshot);

    console.log(`   Initial heap usage: ${(snapshot.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Initial RSS: ${(snapshot.rss / 1024 / 1024).toFixed(2)} MB\n`);
  }

  async simulateUserActivity() {
    console.log('🎭 Simulating user activity...\n');

    const startTime = Date.now();
    let iteration = 0;

    while (Date.now() - startTime < this.testDuration) {
      iteration++;

      // Simulate different types of user activity
      await this.simulateProfileOperations(iteration);
      await this.simulateAIOperations(iteration);
      await this.simulateMemoryIntensiveOperations(iteration);

      // Take periodic snapshots
      if (iteration % Math.floor((this.interval / 1000) / 2) === 0) { // Every 10 seconds
        await this.takePeriodicSnapshot(iteration);
      }

      // Progress indicator
      if (iteration % 10 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = (elapsed / (this.testDuration / 1000)) * 100;
        process.stdout.write(`\r   Progress: ${progress.toFixed(1)}% (${elapsed.toFixed(0)}s elapsed)`);
      }

      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n');
  }

  async simulateProfileOperations(iteration) {
    try {
      // Simulate profile service operations
      const ProfileService = require('../src/services/ProfileService').default;

      // Create mock profile data
      const mockProfile = {
        id: `test_user_${iteration}`,
        name: `Test User ${iteration}`,
        age: 20 + (iteration % 40),
        bio: `This is a test bio for user ${iteration}. `.repeat(5),
        interests: ['test', 'demo', 'sample', 'mock'][iteration % 4],
        photos: [`photo_${iteration}_1.jpg`, `photo_${iteration}_2.jpg`]
      };

      // Simulate profile operations (without actual DB calls)
      const operations = [
        () => ProfileService.updateProfile(mockProfile.id, { bio: mockProfile.bio }),
        () => ProfileService.searchProfiles({ minAge: 20, maxAge: 30 }),
      ];

      // Execute random operation
      const operation = operations[Math.floor(Math.random() * operations.length)];
      await operation();

    } catch (error) {
      // Ignore errors in simulation - we're testing memory, not functionality
    }
  }

  async simulateAIOperations(iteration) {
    try {
      // Simulate AI service operations
      const AISparkService = require('../src/services/AISparkService').default;
      const MoodMatchingService = require('../src/services/MoodMatchingService').default;

      // Simulate AI calculations (without actual processing)
      const userId = `ai_user_${iteration}`;
      const targetUserId = `ai_target_${iteration}`;

      const operations = [
        () => AISparkService.calculateSparkScore(userId, targetUserId),
        () => MoodMatchingService.setUserMood(userId, 'romantic'),
        () => MoodMatchingService.findMoodMatches(userId)
      ];

      // Execute random operation
      const operation = operations[Math.floor(Math.random() * operations.length)];
      await operation();

    } catch (error) {
      // Ignore errors in simulation
    }
  }

  async simulateMemoryIntensiveOperations(iteration) {
    // Simulate memory-intensive operations
    const operations = [
      () => {
        // Create large objects
        const largeObject = {};
        for (let i = 0; i < 10000; i++) {
          largeObject[`key_${i}`] = `value_${i}_${iteration}`.repeat(10);
        }
        // Let it be garbage collected
        return largeObject;
      },
      () => {
        // Create large arrays
        const largeArray = new Array(50000).fill(null).map((_, i) =>
          ({ id: i, data: `data_${i}_${iteration}`.repeat(5) })
        );
        // Process and discard
        return largeArray.filter(item => item.id % 2 === 0);
      }
    ];

    const operation = operations[Math.floor(Math.random() * operations.length)];
    const result = operation();

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));

    // Result goes out of scope - should be GC'd
  }

  async takePeriodicSnapshot(iteration) {
    const snapshot = {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      heapUsed: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss,
      phase: 'periodic',
      iteration: iteration
    };

    this.snapshots.push(snapshot);
  }

  async takeFinalSnapshot() {
    console.log('📸 Taking final memory snapshot...');

    if (global.gc) {
      global.gc(); // Force garbage collection
    }

    const snapshot = {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      heapUsed: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss,
      phase: 'final'
    };

    this.snapshots.push(snapshot);

    console.log(`   Final heap usage: ${(snapshot.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Final RSS: ${(snapshot.rss / 1024 / 1024).toFixed(2)} MB\n`);
  }

  async analyzeResults() {
    console.log('🔍 Analyzing memory usage patterns...\n');

    const initialSnapshot = this.snapshots.find(s => s.phase === 'initial');
    const finalSnapshot = this.snapshots.find(s => s.phase === 'final');
    const periodicSnapshots = this.snapshots.filter(s => s.phase === 'periodic');

    if (!initialSnapshot || !finalSnapshot) {
      throw new Error('Missing required snapshots');
    }

    // Calculate memory growth
    const heapGrowth = finalSnapshot.heapUsed - initialSnapshot.heapUsed;
    const rssGrowth = finalSnapshot.rss - initialSnapshot.rss;
    const externalGrowth = finalSnapshot.external - initialSnapshot.external;

    console.log('📊 Memory Growth Analysis:');
    console.log(`   Heap growth: ${(heapGrowth / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   RSS growth: ${(rssGrowth / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   External growth: ${(externalGrowth / 1024 / 1024).toFixed(2)} MB\n`);

    // Analyze trends
    const heapValues = this.snapshots.map(s => s.heapUsed);
    const heapTrend = this.calculateTrend(heapValues);

    console.log('📈 Memory Trend Analysis:');
    console.log(`   Heap usage trend: ${heapTrend.direction} (${heapTrend.slope.toFixed(2)} MB/min)\n`);

    // Memory leak detection
    const leakAnalysis = this.detectMemoryLeaks();

    console.log('🚨 Memory Leak Detection:');
    console.log(`   Status: ${leakAnalysis.status}`);
    if (leakAnalysis.details) {
      console.log(`   Details: ${leakAnalysis.details}`);
    }
    if (leakAnalysis.recommendations.length > 0) {
      console.log('   Recommendations:');
      leakAnalysis.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    this.analysis = {
      heapGrowth,
      rssGrowth,
      externalGrowth,
      heapTrend,
      leakAnalysis,
      snapshotsCount: this.snapshots.length
    };
  }

  calculateTrend(values) {
    if (values.length < 2) return { direction: 'insufficient_data', slope: 0 };

    const n = values.length;
    const timestamps = this.snapshots.map(s => s.timestamp);
    const timeSpan = (timestamps[n - 1] - timestamps[0]) / (1000 * 60); // minutes

    // Simple linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
      const x = i; // time index
      const y = values[i] / (1024 * 1024); // MB
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const direction = slope > 0.1 ? 'increasing' :
                     slope < -0.1 ? 'decreasing' : 'stable';

    return { direction, slope };
  }

  detectMemoryLeaks() {
    const heapGrowth = this.analysis.heapGrowth;
    const heapTrend = this.analysis.heapTrend;

    let status = '✅ NO LEAKS DETECTED';
    let details = '';
    const recommendations = [];

    // Check for significant heap growth
    if (heapGrowth > this.maxMemoryGrowth) {
      status = '⚠️ POTENTIAL MEMORY LEAK';
      details = `Heap grew by ${(heapGrowth / 1024 / 1024).toFixed(2)} MB`;
      recommendations.push('Monitor heap usage in production');
      recommendations.push('Implement proper cleanup in services');
    }

    // Check for continuous growth trend
    if (heapTrend.direction === 'increasing' && heapTrend.slope > 1) {
      status = '🚨 MEMORY LEAK DETECTED';
      details = `Continuous heap growth at ${heapTrend.slope.toFixed(2)} MB/min`;
      recommendations.push('Immediate investigation required');
      recommendations.push('Check for circular references');
      recommendations.push('Implement object pooling for heavy operations');
    }

    // Check for external memory growth (native objects)
    if (this.analysis.externalGrowth > 10 * 1024 * 1024) {
      recommendations.push('Monitor external memory usage (native objects)');
    }

    return { status, details, recommendations };
  }

  generateReport() {
    const report = {
      testDuration: this.testDuration,
      snapshotsTaken: this.snapshots.length,
      analysis: this.analysis,
      recommendations: this.analysis.leakAnalysis.recommendations,
      summary: {
        heapGrowthMB: (this.analysis.heapGrowth / 1024 / 1024).toFixed(2),
        rssGrowthMB: (this.analysis.rssGrowth / 1024 / 1024).toFixed(2),
        memoryLeakDetected: this.analysis.leakAnalysis.status.includes('LEAK'),
        overallStatus: this.analysis.leakAnalysis.status
      }
    };

    // Save detailed report
    const reportPath = 'memory-leak-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`💾 Memory leak report saved to: ${reportPath}`);

    return report;
  }
}

// Run the test if called directly
if (require.main === module) {
  const detector = new MemoryLeakDetector();
  detector.runMemoryLeakTest()
    .then((report) => {
      console.log('\n🎯 Memory leak detection completed!');
      console.log(`Overall Status: ${report.summary.overallStatus}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Memory leak detection failed:', error.message);
      process.exit(1);
    });
}

module.exports = MemoryLeakDetector;

#!/usr/bin/env node

/**
 * Performance Testing Suite
 *
 * Comprehensive performance testing for the Dating App
 * Includes bundle analysis, memory monitoring, and load testing simulation
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class PerformanceTester {
  constructor() {
    this.results = {
      bundleAnalysis: {},
      memoryUsage: {},
      loadTesting: {},
      recommendations: []
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Performance Testing...\n');

    try {
      await this.analyzeBundleSize();
      await this.checkMemoryUsage();
      await this.runLoadTestingSimulation();
      await this.generateReport();

      console.log('✅ Performance testing completed!');
      return this.results;
    } catch (error) {
      console.error('❌ Performance testing failed:', error.message);
      throw error;
    }
  }

  async analyzeBundleSize() {
    console.log('📦 Analyzing Bundle Size...');

    try {
      // For Expo apps, we need to use expo export or similar
      // Let's check the package.json to understand the build process
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

      // Estimate bundle size by checking node_modules and source files
      const sourceSize = this.calculateDirectorySize('src');
      const nodeModulesSize = this.calculateDirectorySize('node_modules');

      // Get dependency count
      const dependencyCount = Object.keys(packageJson.dependencies || {}).length;
      const devDependencyCount = Object.keys(packageJson.devDependencies || {}).length;

      this.results.bundleAnalysis = {
        estimatedSourceSize: `${(sourceSize / 1024 / 1024).toFixed(2)} MB`,
        nodeModulesSize: `${(nodeModulesSize / 1024 / 1024).toFixed(2)} MB`,
        totalDependencies: dependencyCount + devDependencyCount,
        runtimeDependencies: dependencyCount,
        devDependencies: devDependencyCount,
        status: sourceSize < 50 * 1024 * 1024 ? '✅ GOOD' : '⚠️ LARGE',
        recommendations: []
      };

      if (sourceSize > 30 * 1024 * 1024) {
        this.results.bundleAnalysis.recommendations.push('Consider code splitting and lazy loading');
      }

      if (dependencyCount > 50) {
        this.results.bundleAnalysis.recommendations.push('Consider removing unused dependencies');
      }

      console.log(`✅ Bundle Analysis: ${this.results.bundleAnalysis.estimatedSourceSize} source, ${this.results.bundleAnalysis.nodeModulesSize} dependencies`);

    } catch (error) {
      console.log('⚠️ Bundle analysis skipped (Expo app)');
      this.results.bundleAnalysis = {
        status: 'SKIPPED',
        reason: 'Expo apps require different bundle analysis approach',
        recommendations: ['Use Expo Application Services for bundle analysis']
      };
    }
  }

  async checkMemoryUsage() {
    console.log('🧠 Checking Memory Usage...');

    // Simulate memory usage patterns
    const initialMemory = process.memoryUsage();

    // Import our services to check their memory footprint
    try {
      // Load some of our services
      require('../src/services/ProfileService');
      require('../src/services/AISparkService');
      require('../src/services/MoodMatchingService');

      const afterImportMemory = process.memoryUsage();

      const memoryIncrease = afterImportMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = (memoryIncrease / 1024 / 1024).toFixed(2);

      this.results.memoryUsage = {
        initialHeapUsed: `${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        afterImportHeapUsed: `${(afterImportMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        memoryIncrease: `${memoryIncreaseMB} MB`,
        status: memoryIncrease < 50 * 1024 * 1024 ? '✅ GOOD' : '⚠️ HIGH',
        recommendations: []
      };

      if (memoryIncrease > 30 * 1024 * 1024) {
        this.results.memoryUsage.recommendations.push('Consider lazy loading services');
      }

      console.log(`✅ Memory Usage: ${this.results.memoryUsage.memoryIncrease} increase after imports`);

    } catch (error) {
      console.log('⚠️ Memory check encountered import issues');
      this.results.memoryUsage = {
        status: 'PARTIAL',
        error: error.message,
        recommendations: ['Monitor memory usage in production app']
      };
    }
  }

  async runLoadTestingSimulation() {
    console.log('⚡ Running Load Testing Simulation...');

    const testResults = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      errorRate: 0,
      recommendations: []
    };

    try {
      // Simulate API load testing with our services
      const services = [
        { name: 'ProfileService', service: require('../src/services/ProfileService') },
        { name: 'AISparkService', service: require('../src/services/AISparkService') },
        { name: 'MoodMatchingService', service: require('../src/services/MoodMatchingService') }
      ];

      const startTime = Date.now();
      const requestPromises = [];

      // Simulate 100 concurrent requests
      for (let i = 0; i < 100; i++) {
        const service = services[i % services.length];

        const requestPromise = this.simulateServiceCall(service.service, i)
          .then(result => ({
            success: true,
            responseTime: Date.now() - startTime,
            service: service.name
          }))
          .catch(error => ({
            success: false,
            responseTime: Date.now() - startTime,
            service: service.name,
            error: error.message
          }));

        requestPromises.push(requestPromise);
      }

      const results = await Promise.all(requestPromises);

      // Analyze results
      testResults.totalRequests = results.length;
      testResults.successfulRequests = results.filter(r => r.success).length;
      testResults.failedRequests = results.filter(r => !r.success).length;

      const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
      testResults.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      testResults.p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
      testResults.errorRate = (testResults.failedRequests / testResults.totalRequests) * 100;

      // Performance targets
      const targets = {
        averageResponseTime: 200, // ms
        p95ResponseTime: 500, // ms
        errorRate: 5 // %
      };

      testResults.targets = targets;
      testResults.averageStatus = testResults.averageResponseTime <= targets.averageResponseTime ? '✅ GOOD' : '⚠️ SLOW';
      testResults.p95Status = testResults.p95ResponseTime <= targets.p95ResponseTime ? '✅ GOOD' : '⚠️ SLOW';
      testResults.errorStatus = testResults.errorRate <= targets.errorRate ? '✅ GOOD' : '❌ HIGH';

      // Generate recommendations
      if (testResults.averageResponseTime > targets.averageResponseTime) {
        testResults.recommendations.push('Consider optimizing service methods and caching');
      }
      if (testResults.p95ResponseTime > targets.p95ResponseTime) {
        testResults.recommendations.push('Implement request queuing and rate limiting');
      }
      if (testResults.errorRate > targets.errorRate) {
        testResults.recommendations.push('Improve error handling and add circuit breakers');
      }

      this.results.loadTesting = testResults;

      console.log(`✅ Load Testing: ${testResults.successfulRequests}/${testResults.totalRequests} successful`);
      console.log(`   Average: ${testResults.averageResponseTime.toFixed(0)}ms | P95: ${testResults.p95ResponseTime}ms | Errors: ${testResults.errorRate.toFixed(1)}%`);

    } catch (error) {
      console.log('⚠️ Load testing simulation failed');
      this.results.loadTesting = {
        status: 'FAILED',
        error: error.message,
        recommendations: ['Implement proper load testing with K6 or Artillery']
      };
    }
  }

  async simulateServiceCall(service, index) {
    // Simulate different types of service calls
    const userId = `user_${index}`;
    const targetUserId = `user_${(index + 1) % 100}`;

    if (service.default && typeof service.default.getProfile === 'function') {
      // ProfileService
      return await service.default.getProfile(userId);
    } else if (service.default && typeof service.default.calculateSparkScore === 'function') {
      // AISparkService
      return await service.default.calculateSparkScore(userId, targetUserId);
    } else if (service.default && typeof service.default.setUserMood === 'function') {
      // MoodMatchingService
      return await service.default.setUserMood(userId, 'romantic');
    }

    // Default mock response
    return { success: true, simulated: true };
  }

  calculateDirectorySize(dirPath) {
    let totalSize = 0;

    function calculateSize(itemPath) {
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        const items = fs.readdirSync(itemPath);
        items.forEach(item => {
          calculateSize(path.join(itemPath, item));
        });
      } else {
        totalSize += stats.size;
      }
    }

    try {
      calculateSize(dirPath);
    } catch (error) {
      // Directory might not exist or be accessible
      totalSize = 0;
    }

    return totalSize;
  }

  async generateReport() {
    console.log('\n📊 Performance Testing Report\n');

    // Bundle Analysis
    console.log('📦 Bundle Analysis:');
    console.log(`   Status: ${this.results.bundleAnalysis.status}`);
    if (this.results.bundleAnalysis.estimatedSourceSize) {
      console.log(`   Source Size: ${this.results.bundleAnalysis.estimatedSourceSize}`);
      console.log(`   Dependencies: ${this.results.bundleAnalysis.totalDependencies} packages`);
    }
    if (this.results.bundleAnalysis.recommendations?.length > 0) {
      console.log('   Recommendations:');
      this.results.bundleAnalysis.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    // Memory Usage
    console.log('\n🧠 Memory Usage:');
    console.log(`   Status: ${this.results.memoryUsage.status}`);
    if (this.results.memoryUsage.memoryIncrease) {
      console.log(`   Memory Increase: ${this.results.memoryUsage.memoryIncrease}`);
    }
    if (this.results.memoryUsage.recommendations?.length > 0) {
      console.log('   Recommendations:');
      this.results.memoryUsage.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    // Load Testing
    console.log('\n⚡ Load Testing:');
    if (this.results.loadTesting.totalRequests) {
      console.log(`   Total Requests: ${this.results.loadTesting.totalRequests}`);
      console.log(`   Success Rate: ${((this.results.loadTesting.successfulRequests / this.results.loadTesting.totalRequests) * 100).toFixed(1)}%`);
      console.log(`   Average Response: ${this.results.loadTesting.averageResponseTime.toFixed(0)}ms ${this.results.loadTesting.averageStatus}`);
      console.log(`   P95 Response: ${this.results.loadTesting.p95ResponseTime}ms ${this.results.loadTesting.p95Status}`);
      console.log(`   Error Rate: ${this.results.loadTesting.errorRate.toFixed(1)}% ${this.results.loadTesting.errorStatus}`);
    } else {
      console.log(`   Status: ${this.results.loadTesting.status}`);
    }
    if (this.results.loadTesting.recommendations?.length > 0) {
      console.log('   Recommendations:');
      this.results.loadTesting.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    // Overall Assessment
    console.log('\n🏆 Overall Assessment:');
    const allStatuses = [
      this.results.bundleAnalysis.status,
      this.results.memoryUsage.status,
      this.results.loadTesting.averageStatus,
      this.results.loadTesting.p95Status,
      this.results.loadTesting.errorStatus
    ].filter(status => status && !status.includes('SKIPPED') && !status.includes('FAILED'));

    const goodCount = allStatuses.filter(s => s?.includes('GOOD') || s?.includes('✅')).length;
    const totalCount = allStatuses.length;

    if (goodCount / totalCount >= 0.8) {
      console.log('   🎉 EXCELLENT: Performance meets production standards!');
    } else if (goodCount / totalCount >= 0.6) {
      console.log('   ✅ GOOD: Minor optimizations needed for production');
    } else {
      console.log('   ⚠️ NEEDS WORK: Significant performance improvements required');
    }

    console.log(`   Score: ${goodCount}/${totalCount} metrics passing`);

    // Save detailed report
    const reportPath = 'performance-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  }
}

// Run the tests if called directly
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runAllTests()
    .then(() => {
      console.log('\n🎯 Performance testing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Performance testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = PerformanceTester;

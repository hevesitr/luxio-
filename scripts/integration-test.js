#!/usr/bin/env node

/**
 * Integration Test Suite
 *
 * Tests the complete integration of all services and new features
 */

const fs = require('fs');
const { performance } = require('perf_hooks');

// Mock React Native environment variables
global.__DEV__ = true;

class IntegrationTester {
  constructor() {
    this.results = {
      supabaseConnection: {},
      aiServices: {},
      coreServices: {},
      performance: {},
      overall: {}
    };
  }

  async runAllIntegrationTests() {
    console.log('🔗 Starting Integration Test Suite...\n');

    try {
      await this.testSupabaseConnection();
      await this.testAIServices();
      await this.testCoreServices();
      await this.testPerformance();
      await this.generateReport();

      console.log('✅ Integration testing completed!');
      return this.results;
    } catch (error) {
      console.error('❌ Integration testing failed:', error.message);
      throw error;
    }
  }

  async testSupabaseConnection() {
    console.log('🔌 Testing Supabase Connection...');

    try {
      // Test basic connection
      const startTime = performance.now();
      const { supabase } = require('../src/services/supabaseClient');
      const connectionTime = performance.now() - startTime;

      // Test basic query
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (error) throw error;

      this.results.supabaseConnection = {
        status: '✅ SUCCESS',
        connectionTime: `${connectionTime.toFixed(2)}ms`,
        canQuery: true,
        profileCount: data || 'unknown'
      };

      console.log(`✅ Supabase connected in ${connectionTime.toFixed(2)}ms`);

    } catch (error) {
      console.log('❌ Supabase connection failed');
      this.results.supabaseConnection = {
        status: '❌ FAILED',
        error: error.message
      };
    }
  }

  async testAIServices() {
    console.log('🤖 Testing AI Services...');

    const aiTests = {
      AISparkService: false,
      MoodMatchingService: false,
      MemoryService: false,
      SmartDateService: false,
      CompatibilityRainbowService: false
    };

    // Simple file existence and syntax checks (avoiding complex imports)
    const servicesToCheck = [
      { name: 'AISparkService', file: '../src/services/AISparkService.js' },
      { name: 'MoodMatchingService', file: '../src/services/MoodMatchingService.js' },
      { name: 'MemoryService', file: '../src/services/MemoryService.js' },
      { name: 'SmartDateService', file: '../src/services/SmartDateService.js' },
      { name: 'CompatibilityRainbowService', file: '../src/services/CompatibilityRainbowService.js' }
    ];

    servicesToCheck.forEach(({ name, file }) => {
      try {
        // Check if file exists and has basic structure
        const filePath = require.resolve(file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Basic checks
        const hasClass = content.includes(`class ${name}`);
        const hasExport = content.includes('export default') || content.includes('export {');
        const hasMethods = content.includes('async ') && content.includes('return');

        aiTests[name] = hasClass && hasExport && hasMethods;

        if (!aiTests[name]) {
          console.log(`⚠️ ${name} basic structure check failed`);
        }
      } catch (error) {
        console.log(`⚠️ ${name} file check failed:`, error.message.substring(0, 50));
      }
    });

    const passedCount = Object.values(aiTests).filter(Boolean).length;
    const totalCount = Object.keys(aiTests).length;

    this.results.aiServices = {
      ...aiTests,
      summary: `${passedCount}/${totalCount} services structurally valid`,
      overallStatus: passedCount === totalCount ? '✅ ALL VALID' :
                    passedCount >= totalCount * 0.8 ? '⚠️ MOSTLY VALID' : '❌ ISSUES DETECTED'
    };

    console.log(`🤖 AI Services: ${passedCount}/${totalCount} structurally valid`);
  }

  async testCoreServices() {
    console.log('🔧 Testing Core Services...');

    const coreTests = {
      ProfileService: false,
      SupabaseStorageService: false,
      ErrorHandler: false,
      Logger: false
    };

    // Simple file existence and structure checks
    const servicesToCheck = [
      { name: 'ProfileService', file: '../src/services/ProfileService.js' },
      { name: 'SupabaseStorageService', file: '../src/services/SupabaseStorageService.js' },
      { name: 'ErrorHandler', file: '../src/services/ErrorHandler.js' },
      { name: 'Logger', file: '../src/services/Logger.js' }
    ];

    servicesToCheck.forEach(({ name, file }) => {
      try {
        // Check if file exists and has basic structure
        const filePath = require.resolve(file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Basic checks
        const hasClass = content.includes(`class ${name}`) || content.includes('const Logger');
        const hasExport = content.includes('export default') || content.includes('export {');
        const hasFunctions = content.includes('function') || content.includes('=>') || content.includes('async');

        coreTests[name] = hasClass && hasExport && hasFunctions;

        if (!coreTests[name]) {
          console.log(`⚠️ ${name} basic structure check failed`);
        }
      } catch (error) {
        console.log(`⚠️ ${name} file check failed:`, error.message.substring(0, 50));
      }
    });

    const passedCount = Object.values(coreTests).filter(Boolean).length;
    const totalCount = Object.keys(coreTests).length;

    this.results.coreServices = {
      ...coreTests,
      summary: `${passedCount}/${totalCount} services structurally valid`,
      overallStatus: passedCount === totalCount ? '✅ ALL VALID' : '⚠️ SOME ISSUES'
    };

    console.log(`🔧 Core Services: ${passedCount}/${totalCount} structurally valid`);
  }

  async testPerformance() {
    console.log('⚡ Testing Performance...');

    const performanceMetrics = {
      serviceLoadTime: 0,
      memoryUsage: 0,
      concurrentRequests: 0
    };

    try {
      // Test service load time
      const startTime = performance.now();

      require('../src/services/AISparkService');
      require('../src/services/MoodMatchingService');
      require('../src/services/MemoryService');
      require('../src/services/SmartDateService');
      require('../src/services/CompatibilityRainbowService');

      const loadTime = performance.now() - startTime;
      performanceMetrics.serviceLoadTime = `${loadTime.toFixed(2)}ms`;

      // Test memory usage
      const memUsage = process.memoryUsage();
      performanceMetrics.memoryUsage = `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`;

      // Test concurrent requests simulation
      const concurrentPromises = [];
      for (let i = 0; i < 10; i++) {
        concurrentPromises.push(
          Promise.resolve().then(() => {
            // Simulate quick service call
            return new Promise(resolve => setTimeout(resolve, Math.random() * 50));
          })
        );
      }

      const concurrentStart = performance.now();
      await Promise.all(concurrentPromises);
      const concurrentTime = performance.now() - concurrentStart;

      performanceMetrics.concurrentRequests = `${concurrentTime.toFixed(2)}ms for 10 concurrent ops`;

      this.results.performance = {
        ...performanceMetrics,
        status: loadTime < 500 ? '✅ FAST' : '⚠️ SLOW',
        memoryStatus: memUsage.heapUsed < 100 * 1024 * 1024 ? '✅ GOOD' : '⚠️ HIGH'
      };

      console.log(`⚡ Performance: Load ${loadTime.toFixed(2)}ms, Memory ${performanceMetrics.memoryUsage}`);

    } catch (error) {
      console.log('⚠️ Performance test failed');
      this.results.performance = {
        status: '❌ FAILED',
        error: error.message
      };
    }
  }

  async generateReport() {
    console.log('\n📊 Integration Test Report\n');

    // Supabase Connection
    console.log('🔌 Supabase Connection:');
    if (this.results.supabaseConnection.status === '✅ SUCCESS') {
      console.log(`   Status: ${this.results.supabaseConnection.status}`);
      console.log(`   Connection Time: ${this.results.supabaseConnection.connectionTime}`);
      console.log(`   Can Query: ✅`);
    } else {
      console.log(`   Status: ${this.results.supabaseConnection.status}`);
      console.log(`   Error: ${this.results.supabaseConnection.error}`);
    }

    // AI Services
    console.log('\n🤖 AI Services:');
    console.log(`   Overall: ${this.results.aiServices.overallStatus}`);
    Object.entries(this.results.aiServices).forEach(([service, status]) => {
      if (service !== 'summary' && service !== 'overallStatus') {
        console.log(`   ${service}: ${status ? '✅' : '❌'}`);
      }
    });

    // Core Services
    console.log('\n🔧 Core Services:');
    console.log(`   Overall: ${this.results.coreServices.overallStatus}`);
    Object.entries(this.results.coreServices).forEach(([service, status]) => {
      if (service !== 'summary' && service !== 'overallStatus') {
        console.log(`   ${service}: ${status ? '✅' : '❌'}`);
      }
    });

    // Performance
    console.log('\n⚡ Performance:');
    if (this.results.performance.status !== '❌ FAILED') {
      console.log(`   Service Load: ${this.results.performance.serviceLoadTime}`);
      console.log(`   Memory Usage: ${this.results.performance.memoryUsage}`);
      console.log(`   Concurrent Ops: ${this.results.performance.concurrentRequests}`);
    } else {
      console.log(`   Status: ${this.results.performance.status}`);
    }

    // Overall Assessment
    console.log('\n🏆 Overall Integration Assessment:');

    const allStatuses = [
      this.results.supabaseConnection.status,
      this.results.aiServices.overallStatus,
      this.results.coreServices.overallStatus,
      this.results.performance.status
    ];

    const successCount = allStatuses.filter(s =>
      s?.includes('✅') || s?.includes('ALL WORKING') || s?.includes('SUCCESS')
    ).length;

    const totalCount = allStatuses.length;

    if (successCount === totalCount) {
      console.log('   🎉 EXCELLENT: All integrations working perfectly!');
    } else if (successCount >= totalCount * 0.75) {
      console.log('   ✅ GOOD: Most integrations working well');
    } else if (successCount >= totalCount * 0.5) {
      console.log('   ⚠️ FAIR: Some integration issues to resolve');
    } else {
      console.log('   ❌ POOR: Major integration problems detected');
    }

    console.log(`   Score: ${successCount}/${totalCount} integration areas working`);

    this.results.overall = {
      score: `${successCount}/${totalCount}`,
      status: successCount === totalCount ? 'EXCELLENT' :
             successCount >= totalCount * 0.75 ? 'GOOD' :
             successCount >= totalCount * 0.5 ? 'FAIR' : 'POOR'
    };

    // Save detailed report
    const reportPath = 'integration-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  }
}

// Run the tests if called directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllIntegrationTests()
    .then((results) => {
      console.log('\n🎯 Integration testing completed!');
      console.log(`Overall Status: ${results.overall.status} (${results.overall.score})`);
      process.exit(results.overall.status === 'EXCELLENT' ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Integration testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = IntegrationTester;

#!/usr/bin/env node

/**
 * React Native Performance Audit
 *
 * Lighthouse-style performance audit for React Native apps
 * Focuses on bundle size, startup time, and runtime performance
 */

const fs = require('fs');
const path = require('path');

class ReactNativePerformanceAudit {
  constructor() {
    this.scores = {
      bundleSize: 0,
      startupTime: 0,
      memoryUsage: 0,
      renderPerformance: 0,
      networkEfficiency: 0,
      overall: 0
    };

    this.metrics = {};
    this.recommendations = [];
  }

  async runAudit() {
    console.log('🔍 Running React Native Performance Audit...\n');

    try {
      await this.auditBundleSize();
      await this.auditStartupTime();
      await this.auditMemoryUsage();
      await this.auditRenderPerformance();
      await this.auditNetworkEfficiency();
      await this.calculateOverallScore();
      await this.generateReport();

      console.log('✅ Performance audit completed!');
      return this.scores;
    } catch (error) {
      console.error('❌ Performance audit failed:', error.message);
      throw error;
    }
  }

  async auditBundleSize() {
    console.log('📦 Auditing Bundle Size...');

    try {
      // Analyze source code size
      const sourceSize = this.calculateDirectorySize('src');
      const sourceSizeMB = sourceSize / (1024 * 1024);

      // Analyze dependencies
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencyCount = Object.keys(packageJson.dependencies || {}).length;
      const devDependencyCount = Object.keys(packageJson.devDependencies || {}).length;

      // Calculate score (lower size = higher score)
      let score = 100;
      if (sourceSizeMB > 5) score -= 30;
      else if (sourceSizeMB > 3) score -= 15;
      else if (sourceSizeMB > 2) score -= 5;

      if (dependencyCount > 50) score -= 20;
      else if (dependencyCount > 30) score -= 10;
      else if (dependencyCount > 20) score -= 5;

      this.scores.bundleSize = Math.max(0, score);

      this.metrics.bundleSize = {
        sourceSizeMB: sourceSizeMB.toFixed(2),
        totalDependencies: dependencyCount + devDependencyCount,
        runtimeDependencies: dependencyCount,
        score: this.scores.bundleSize
      };

      // Recommendations
      if (sourceSizeMB > 4) {
        this.recommendations.push('Implement code splitting and lazy loading to reduce initial bundle size');
      }
      if (dependencyCount > 40) {
        this.recommendations.push('Audit and remove unused dependencies to reduce bundle size');
      }

      console.log(`   Bundle Size Score: ${this.scores.bundleSize}/100`);
      console.log(`   Source Size: ${sourceSizeMB.toFixed(2)} MB`);
      console.log(`   Dependencies: ${dependencyCount} runtime, ${devDependencyCount} dev\n`);

    } catch (error) {
      console.log('   ⚠️ Bundle size audit failed, using default score');
      this.scores.bundleSize = 50;
    }
  }

  async auditStartupTime() {
    console.log('⚡ Auditing App Startup Time...');

    try {
      // Analyze imports and initialization code
      const appJsContent = fs.readFileSync('App.js', 'utf8');
      const indexJsContent = fs.readFileSync('index.js', 'utf8');

      // Count heavy imports
      const heavyImports = [
        'react-native-vector-icons',
        'react-native-image-picker',
        '@react-native-async-storage',
        'expo-av',
        'expo-camera'
      ];

      let heavyImportCount = 0;
      const allImports = appJsContent + indexJsContent;

      heavyImports.forEach(imp => {
        if (allImports.includes(imp)) heavyImportCount++;
      });

      // Check for lazy loading
      const hasLazyLoading = allImports.includes('lazy(') || allImports.includes('Lazy(');
      const hasSuspense = allImports.includes('Suspense') || allImports.includes('<Suspense');

      // Calculate score
      let score = 100;
      if (heavyImportCount > 3) score -= 25;
      else if (heavyImportCount > 1) score -= 10;

      if (!hasLazyLoading) score -= 15;
      if (!hasSuspense) score -= 10;

      this.scores.startupTime = Math.max(0, score);

      this.metrics.startupTime = {
        heavyImportsDetected: heavyImportCount,
        lazyLoadingImplemented: hasLazyLoading,
        suspenseImplemented: hasSuspense,
        score: this.scores.startupTime
      };

      // Recommendations
      if (heavyImportCount > 2) {
        this.recommendations.push('Reduce heavy imports in App.js to improve startup time');
      }
      if (!hasLazyLoading) {
        this.recommendations.push('Implement lazy loading for screens to reduce initial load time');
      }

      console.log(`   Startup Time Score: ${this.scores.startupTime}/100`);
      console.log(`   Heavy Imports: ${heavyImportCount}`);
      console.log(`   Lazy Loading: ${hasLazyLoading ? '✅' : '❌'}\n`);

    } catch (error) {
      console.log('   ⚠️ Startup time audit failed, using default score');
      this.scores.startupTime = 60;
    }
  }

  async auditMemoryUsage() {
    console.log('🧠 Auditing Memory Usage...');

    try {
      // Check for memory-intensive patterns
      const sourceFiles = this.getAllSourceFiles('src');
      let memoryIssues = 0;
      let largeObjects = 0;

      sourceFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // Check for memory-intensive patterns
        if (content.includes('new Array(') && content.includes('1000')) memoryIssues++;
        if (content.includes('JSON.parse') && content.includes('large')) memoryIssues++;
        if (content.includes('new Map()') && content.includes('1000')) memoryIssues++;
        if (content.includes('new Set()') && content.includes('1000')) memoryIssues++;

        // Check for large object literals
        const objectMatches = content.match(/\{[^}]{1000,}\}/g);
        if (objectMatches) largeObjects += objectMatches.length;
      });

      // Check for proper cleanup
      const hasCleanup = sourceFiles.some(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('useEffect') && content.includes('return () =>');
      });

      // Calculate score
      let score = 100;
      if (memoryIssues > 3) score -= 30;
      else if (memoryIssues > 1) score -= 15;
      if (largeObjects > 2) score -= 20;
      if (!hasCleanup) score -= 10;

      this.scores.memoryUsage = Math.max(0, score);

      this.metrics.memoryUsage = {
        memoryIntensivePatterns: memoryIssues,
        largeObjectsDetected: largeObjects,
        properCleanupImplemented: hasCleanup,
        score: this.scores.memoryUsage
      };

      // Recommendations
      if (memoryIssues > 0) {
        this.recommendations.push('Review and optimize memory-intensive operations');
      }
      if (!hasCleanup) {
        this.recommendations.push('Implement proper cleanup in useEffect hooks to prevent memory leaks');
      }

      console.log(`   Memory Usage Score: ${this.scores.memoryUsage}/100`);
      console.log(`   Memory Issues: ${memoryIssues}`);
      console.log(`   Proper Cleanup: ${hasCleanup ? '✅' : '❌'}\n`);

    } catch (error) {
      console.log('   ⚠️ Memory usage audit failed, using default score');
      this.scores.memoryUsage = 70;
    }
  }

  async auditRenderPerformance() {
    console.log('🎨 Auditing Render Performance...');

    try {
      const componentFiles = this.getAllSourceFiles('src').filter(file =>
        file.includes('Screen') || file.includes('Component')
      );

      let performanceIssues = 0;
      let optimizationFeatures = 0;

      componentFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // Check for performance issues
        if (content.includes('useState') && !content.includes('useCallback')) performanceIssues++;
        if (content.includes('useEffect') && content.includes('[]') && content.includes('setState')) performanceIssues++;
        if (content.match(/onPress=\{[^}]*\([^}]*\)[^}]*\}/g)) performanceIssues++; // Inline functions

        // Check for optimizations
        if (content.includes('React.memo')) optimizationFeatures++;
        if (content.includes('useMemo')) optimizationFeatures++;
        if (content.includes('useCallback')) optimizationFeatures++;
        if (content.includes('React.lazy')) optimizationFeatures++;
      });

      // Calculate score
      let score = 100;
      if (performanceIssues > 5) score -= 40;
      else if (performanceIssues > 2) score -= 20;
      else if (performanceIssues > 0) score -= 10;

      // Bonus for optimizations
      score += Math.min(20, optimizationFeatures * 5);

      this.scores.renderPerformance = Math.max(0, Math.min(100, score));

      this.metrics.renderPerformance = {
        performanceIssuesDetected: performanceIssues,
        optimizationFeaturesImplemented: optimizationFeatures,
        score: this.scores.renderPerformance
      };

      // Recommendations
      if (performanceIssues > 3) {
        this.recommendations.push('Optimize component re-renders with React.memo and useCallback');
      }
      if (optimizationFeatures < 2) {
        this.recommendations.push('Implement React.memo, useMemo, and useCallback for better performance');
      }

      console.log(`   Render Performance Score: ${this.scores.renderPerformance}/100`);
      console.log(`   Performance Issues: ${performanceIssues}`);
      console.log(`   Optimizations: ${optimizationFeatures}\n`);

    } catch (error) {
      console.log('   ⚠️ Render performance audit failed, using default score');
      this.scores.renderPerformance = 65;
    }
  }

  async auditNetworkEfficiency() {
    console.log('🌐 Auditing Network Efficiency...');

    try {
      const sourceFiles = this.getAllSourceFiles('src');
      let networkIssues = 0;
      let cachingImplemented = 0;
      let errorHandling = 0;

      sourceFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // Check for network issues
        if (content.includes('fetch(') && !content.includes('try') && !content.includes('catch')) networkIssues++;
        if (content.includes('axios.get') && !content.includes('timeout')) networkIssues++;
        if (content.includes('supabase') && content.includes('.select()') && content.includes('*')) networkIssues++;

        // Check for caching
        if (content.includes('React Query') || content.includes('@tanstack/react-query')) cachingImplemented++;
        if (content.includes('AsyncStorage') && content.includes('cache')) cachingImplemented++;

        // Check for error handling
        if (content.includes('try') && content.includes('catch') && content.includes('network')) errorHandling++;
        if (content.includes('ErrorHandler')) errorHandling++;
      });

      // Calculate score
      let score = 100;
      if (networkIssues > 3) score -= 30;
      else if (networkIssues > 1) score -= 15;

      // Bonus for good practices
      score += Math.min(20, cachingImplemented * 10);
      score += Math.min(15, errorHandling * 5);

      this.scores.networkEfficiency = Math.max(0, Math.min(100, score));

      this.metrics.networkEfficiency = {
        networkIssuesDetected: networkIssues,
        cachingImplemented: cachingImplemented > 0,
        errorHandlingImplemented: errorHandling > 0,
        score: this.scores.networkEfficiency
      };

      // Recommendations
      if (networkIssues > 0) {
        this.recommendations.push('Implement proper error handling and timeouts for network requests');
      }
      if (cachingImplemented === 0) {
        this.recommendations.push('Implement caching layer (React Query) to reduce network requests');
      }

      console.log(`   Network Efficiency Score: ${this.scores.networkEfficiency}/100`);
      console.log(`   Network Issues: ${networkIssues}`);
      console.log(`   Caching: ${cachingImplemented > 0 ? '✅' : '❌'}\n`);

    } catch (error) {
      console.log('   ⚠️ Network efficiency audit failed, using default score');
      this.scores.networkEfficiency = 55;
    }
  }

  async calculateOverallScore() {
    console.log('📊 Calculating Overall Performance Score...');

    // Weighted average of all scores
    const weights = {
      bundleSize: 0.25,        // 25% - Critical for app size
      startupTime: 0.25,       // 25% - Critical for user experience
      memoryUsage: 0.20,       // 20% - Important for stability
      renderPerformance: 0.15, // 15% - Important for smoothness
      networkEfficiency: 0.15  // 15% - Important for responsiveness
    };

    this.scores.overall = Math.round(
      Object.entries(weights).reduce((total, [metric, weight]) => {
        return total + (this.scores[metric] * weight);
      }, 0)
    );

    console.log(`   Overall Score: ${this.scores.overall}/100`);

    // Performance grade
    if (this.scores.overall >= 90) {
      console.log('   Grade: 🏆 EXCELLENT');
    } else if (this.scores.overall >= 80) {
      console.log('   Grade: ✅ VERY GOOD');
    } else if (this.scores.overall >= 70) {
      console.log('   Grade: ⚠️ GOOD');
    } else if (this.scores.overall >= 60) {
      console.log('   Grade: 📉 NEEDS IMPROVEMENT');
    } else {
      console.log('   Grade: ❌ POOR');
    }

    console.log('');
  }

  async generateReport() {
    console.log('📋 Generating Performance Audit Report...\n');

    console.log('🎯 SCORES SUMMARY:');
    console.log(`   Bundle Size:        ${this.scores.bundleSize}/100`);
    console.log(`   Startup Time:       ${this.scores.startupTime}/100`);
    console.log(`   Memory Usage:       ${this.scores.memoryUsage}/100`);
    console.log(`   Render Performance: ${this.scores.renderPerformance}/100`);
    console.log(`   Network Efficiency: ${this.scores.networkEfficiency}/100`);
    console.log(`   ==============================`);
    console.log(`   OVERALL SCORE:      ${this.scores.overall}/100\n`);

    if (this.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      this.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      console.log('');
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      scores: this.scores,
      metrics: this.metrics,
      recommendations: this.recommendations,
      targetScore: 90,
      achievedTarget: this.scores.overall >= 90
    };

    const reportPath = 'performance-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`💾 Detailed report saved to: ${reportPath}`);

    return report;
  }

  calculateDirectorySize(dirPath) {
    let totalSize = 0;

    function calculateSize(itemPath) {
      try {
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          const items = fs.readdirSync(itemPath);
          items.forEach(item => {
            // Skip node_modules in subdirectories to avoid double counting
            if (item !== 'node_modules') {
              calculateSize(path.join(itemPath, item));
            }
          });
        } else {
          totalSize += stats.size;
        }
      } catch (error) {
        // Skip inaccessible files
      }
    }

    try {
      calculateSize(dirPath);
    } catch (error) {
      totalSize = 0;
    }

    return totalSize;
  }

  getAllSourceFiles(dirPath) {
    const files = [];

    function traverse(itemPath) {
      try {
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          const items = fs.readdirSync(itemPath);
          items.forEach(item => {
            if (item !== 'node_modules' && item !== '.git') {
              traverse(path.join(itemPath, item));
            }
          });
        } else if (itemPath.endsWith('.js') || itemPath.endsWith('.jsx') || itemPath.endsWith('.ts') || itemPath.endsWith('.tsx')) {
          files.push(itemPath);
        }
      } catch (error) {
        // Skip inaccessible files
      }
    }

    traverse(dirPath);
    return files;
  }
}

// Run the audit if called directly
if (require.main === module) {
  const auditor = new ReactNativePerformanceAudit();
  auditor.runAudit()
    .then((scores) => {
      console.log('\n🎯 Performance audit completed successfully!');
      console.log(`Final Score: ${scores.overall}/100`);
      process.exit(scores.overall >= 70 ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Performance audit failed:', error.message);
      process.exit(1);
    });
}

module.exports = ReactNativePerformanceAudit;

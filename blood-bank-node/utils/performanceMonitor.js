/**
 * ============================================
 * PERFORMANCE MONITORING
 * ============================================
 * Tracks response times, API performance metrics
 * Integrates with monitoring systems (APM, Datadog, New Relic)
 */

const logger = require('../utils/logger');

/**
 * Performance monitoring middleware
 * Tracks:
 * - Request duration
 * - Response status
 * - Request size
 * - Database query times
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      slowRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0,
      requestsByEndpoint: {},
      requestsByStatus: {}
    };
  }

  /**
   * Express middleware for performance tracking
   */
  middleware() {
    return (req, res, next) => {
      const startTime = process.hrtime.bigint();
      const startCpuUsage = process.cpuUsage();

      // Override res.json to capture response data
      const originalJson = res.json;
      const monitor = this; // Capture monitor context for use inside the function
      
      res.json = function(data) {
        const endTime = process.hrtime.bigint();
        const endCpuUsage = process.cpuUsage(startCpuUsage);

        const durationMs = Number(endTime - startTime) / 1000000; // Convert to ms
        const cpuUser = endCpuUsage.user / 1000; // Convert to ms
        const cpuSystem = endCpuUsage.system / 1000;

        const endpoint = `${req.method} ${req.path}`;
        const status = res.statusCode;
        const isSlowRequest = durationMs > 1000; // > 1 second
        const isError = status >= 400;

        // Update metrics
        monitor.updateMetrics(endpoint, durationMs, status, isSlowRequest, isError);

        // Log slow requests or errors
        if (isSlowRequest || isError) {
          logger.warn('Slow or error request detected', {
            endpoint,
            status,
            duration: `${durationMs.toFixed(2)}ms`,
            cpu: `${cpuUser.toFixed(2)}ms`,
            method: req.method,
            ip: req.ip
          });
        }

        // Include request tracking in response header
        res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
        res.setHeader('X-Request-ID', req.id || 'unknown');

        // Call original res.json with correct context (res, not this)
        return originalJson.call(res, data);
      };

      // Generate unique request ID
      req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      next();
    };
  }

  /**
   * Update metrics for monitoring
   */
  updateMetrics(endpoint, duration, status, isSlowRequest, isError) {
    this.metrics.totalRequests++;

    if (isSlowRequest) {
      this.metrics.slowRequests++;
    }
    if (isError) {
      this.metrics.errorRequests++;
    }

    // Track by endpoint
    if (!this.metrics.requestsByEndpoint[endpoint]) {
      this.metrics.requestsByEndpoint[endpoint] = {
        count: 0,
        totalTime: 0,
        avgTime: 0
      };
    }
    this.metrics.requestsByEndpoint[endpoint].count++;
    this.metrics.requestsByEndpoint[endpoint].totalTime += duration;
    this.metrics.requestsByEndpoint[endpoint].avgTime =
      this.metrics.requestsByEndpoint[endpoint].totalTime /
      this.metrics.requestsByEndpoint[endpoint].count;

    // Track by status
    this.metrics.requestsByStatus[status] =
      (this.metrics.requestsByStatus[status] || 0) + 1;

    // Calculate average response time
    this.updateAverageResponseTime(duration);
  }

  /**
   * Update running average response time
   */
  updateAverageResponseTime(duration) {
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) +
        duration) /
      this.metrics.totalRequests;
  }

  /**
   * Get metrics report
   */
  getMetrics() {
    return {
      ...this.metrics,
      statusCodes: this.metrics.requestsByStatus,
      topEndpoints: Object.entries(this.metrics.requestsByEndpoint)
        .sort(([, a], [, b]) => b.avgTime - a.avgTime)
        .slice(0, 10)
        .reduce((acc, [key, val]) => {
          acc[key] = val;
          return acc;
        }, {})
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      slowRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0,
      requestsByEndpoint: {},
      requestsByStatus: {}
    };
  }

  /**
   * Get health check status
   */
  getHealthStatus() {
    const errorRate =
      (this.metrics.errorRequests / this.metrics.totalRequests) * 100 || 0;
    const slowRate =
      (this.metrics.slowRequests / this.metrics.totalRequests) * 100 || 0;

    return {
      status: errorRate < 5 ? 'healthy' : 'degraded',
      errorRate: `${errorRate.toFixed(2)}%`,
      slowRate: `${slowRate.toFixed(2)}%`,
      avgResponseTime: `${this.metrics.averageResponseTime.toFixed(2)}ms`,
      totalRequests: this.metrics.totalRequests
    };
  }
}

const monitor = new PerformanceMonitor();

module.exports = {
  PerformanceMonitor,
  monitor,
  performanceMiddleware: () => monitor.middleware()
};

/// <reference types="@platformatic/gateway" />
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Collect default metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({ prefix: 'watt_gateway_' });

// Custom metrics
const httpRequestsTotal = new Counter({
  name: 'watt_gateway_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new Histogram({
  name: 'watt_gateway_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpErrorsTotal = new Counter({
  name: 'watt_gateway_http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code', 'error_code'],
});

/**
 * Metrics Plugin - Expose Prometheus metrics endpoint
 *
 * Provides:
 * - Default Node.js metrics (CPU, memory, event loop)
 * - Custom HTTP metrics (requests, duration, errors)
 * - /metrics endpoint for Prometheus scraping
 */
async function metricsPlugin(app: FastifyInstance): Promise<void> {
  // Hook to track all requests
  app.addHook('onRequest', async (request: FastifyRequest) => {
    (request as unknown as Record<string, unknown>).startTime = Date.now();
  });

  // Hook to record metrics after response
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = (request as unknown as Record<string, unknown>).startTime as
      | number
      | undefined;
    const duration = (Date.now() - (startTime ?? Date.now())) / 1000;
    const route = request.routeOptions?.url ?? request.url;
    const method = request.method;
    const statusCode = reply.statusCode.toString();

    // Track request count
    httpRequestsTotal.labels(method, route, statusCode).inc();

    // Track request duration
    httpRequestDuration.labels(method, route, statusCode).observe(duration);

    // Track errors (4xx and 5xx)
    if (reply.statusCode >= 400) {
      const errorCode =
        ((reply as unknown as Record<string, unknown>).errorCode as string | undefined) ??
        'UNKNOWN';
      httpErrorsTotal.labels(method, route, statusCode, errorCode).inc();
    }
  });

  // Expose /metrics endpoint for Prometheus
  app.get('/metrics', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const metrics = await register.metrics();
      reply.header('Content-Type', register.contentType);
      return reply.send(metrics);
    } catch (err) {
      app.log.error({ err }, 'Failed to collect metrics');
      reply.code(500).send({ error: 'Failed to collect metrics' });
    }
  });

  app.log.info('📊 Metrics plugin loaded - endpoint available at /metrics');
}

export default fp(metricsPlugin, {
  name: 'metrics-plugin',
  fastify: '5.x',
});

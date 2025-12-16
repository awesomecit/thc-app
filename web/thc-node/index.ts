import { getGlobal } from '@platformatic/globals';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

const SERVICE_NAME = 'thc-node';

function handleLiveness(res: ServerResponse): void {
  getGlobal()?.logger?.debug?.('Health check: /health/live');
  res.writeHead(200, { 'content-type': 'application/json', connection: 'close' });
  res.end(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: SERVICE_NAME,
    })
  );
}

function handleReadiness(res: ServerResponse): void {
  getGlobal()?.logger?.debug?.('Health check: /health/ready');
  res.writeHead(200, { 'content-type': 'application/json', connection: 'close' });
  res.end(
    JSON.stringify({
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: SERVICE_NAME,
      checks: {
        service: 'ok',
      },
    })
  );
}

function handleDefault(res: ServerResponse): void {
  getGlobal()?.logger?.debug?.('Serving request.');
  res.writeHead(200, { 'content-type': 'application/json', connection: 'close' });
  res.end(JSON.stringify({ hello: 'world' }));
}

export function create(): ReturnType<typeof createServer> {
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

    if (url.pathname === '/health/live') {
      handleLiveness(res);
    } else if (url.pathname === '/health/ready') {
      handleReadiness(res);
    } else {
      handleDefault(res);
    }
  });
}

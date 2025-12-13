import { getGlobal } from '@platformatic/globals';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

export function create(): ReturnType<typeof createServer> {
  const platformatic = getGlobal();

  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

    // Health check endpoints
    if (url.pathname === '/health/ready' || url.pathname === '/health/live') {
      platformatic?.logger?.debug?.(`Health check: ${url.pathname}`);
      res.writeHead(200, { 'content-type': 'application/json', connection: 'close' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    // Default endpoint
    platformatic?.logger?.debug?.('Serving request.');
    res.writeHead(200, { 'content-type': 'application/json', connection: 'close' });
    res.end(JSON.stringify({ hello: 'world' }));
  });
}

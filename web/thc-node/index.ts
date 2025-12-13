import { getGlobal } from '@platformatic/globals';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

export function create() {
  const platformatic = getGlobal();

  return createServer((_: IncomingMessage, res: ServerResponse) => {
    platformatic.logger.debug('Serving request.');
    res.writeHead(200, { 'content-type': 'application/json', connection: 'close' });
    res.end(JSON.stringify({ hello: 'world' }));
  });
}

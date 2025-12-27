/// <reference types="@platformatic/service" />
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const DEFAULT_PORT = 3042;
const HEALTH_READY_ENDPOINT = 'Health Ready';

interface ServiceEndpoint {
  name: string;
  url: string;
}

interface ServiceCredentials {
  username?: string;
  password?: string;
  note?: string;
}

interface Service {
  name: string;
  prefix: string;
  description: string;
  endpoints: ServiceEndpoint[];
  credentials?: ServiceCredentials;
}

interface ServiceWithStatus extends Service {
  status: 'healthy' | 'unhealthy' | 'offline' | 'unknown';
}

function getBaseUrl(request: FastifyRequest): string {
  const address = request.socket.address();
  const port =
    address && typeof address === 'object' && 'port' in address ? address.port : DEFAULT_PORT;
  return `${request.protocol}://${request.hostname}:${port ?? DEFAULT_PORT}`;
}

function getServices(baseUrl: string): Service[] {
  return [
    {
      name: 'Gateway',
      prefix: '',
      description: 'API Gateway - Entry point for all services',
      endpoints: [
        { name: HEALTH_READY_ENDPOINT, url: `${baseUrl}/health/ready` },
        { name: 'Health Live', url: `${baseUrl}/health/live` },
      ],
    },
    // {
    //   name: 'thc-db',
    //   prefix: '/thc-db',
    //   description: 'Database API - Auto-generated CRUD + GraphQL',
    //   endpoints: [
    //     { name: 'Scalar Docs', url: `${baseUrl}/thc-db/documentation` },
    //     { name: 'Swagger UI', url: `${baseUrl}/thc-db/swagger` },
    //     { name: 'GraphiQL', url: `${baseUrl}/thc-db/graphiql` },
    //     { name: 'OpenAPI JSON', url: `${baseUrl}/thc-db/documentation/json` },
    //     { name: 'GraphQL Endpoint', url: `${baseUrl}/thc-db/graphql` },
    //     { name: HEALTH_READY_ENDPOINT, url: `${baseUrl}/thc-db/health/ready` },
    //   ],
    // },
    {
      name: 'Observability',
      prefix: '/observability',
      description: 'Monitoring & Metrics',
      endpoints: [
        {
          name: 'Grafana Dashboards',
          url: `http://localhost:${process.env.GRAFANA_PORT ?? '3001'}`,
        },
        {
          name: 'Prometheus Metrics',
          url: `http://localhost:${process.env.PROMETHEUS_PORT ?? '9090'}`,
        },
        { name: 'Gateway Metrics', url: `${baseUrl}/metrics` },
      ],
      credentials: {
        username: process.env.GRAFANA_ADMIN_USER ?? 'admin',
        password: process.env.GRAFANA_ADMIN_PASSWORD ?? 'admin',
        note: 'Grafana only',
      },
    },
    {
      name: 'Authentication',
      prefix: '/auth',
      description: 'Identity & Access Management',
      endpoints: [
        {
          name: 'Keycloak Admin Console',
          url: `http://localhost:${process.env.KC_HTTP_PORT ?? '8081'}`,
        },
        {
          name: 'TicOps Realm',
          url: `http://localhost:${process.env.KC_HTTP_PORT ?? '8081'}/admin/master/console/#/ticops`,
        },
      ],
      credentials: {
        username: process.env.KEYCLOAK_ADMIN ?? 'admin',
        password: process.env.KEYCLOAK_ADMIN_PASSWORD ?? 'admin_password_CHANGE_IN_PROD',
      },
    },
  ];
}

async function checkServiceHealth(service: Service): Promise<ServiceWithStatus> {
  try {
    const healthUrl = service.endpoints.find((e) => e.name === HEALTH_READY_ENDPOINT)?.url;
    if (!healthUrl) {
      return { ...service, status: 'unknown' };
    }

    const response = await fetch(healthUrl);
    return {
      ...service,
      status: response.ok ? 'healthy' : 'unhealthy',
    };
  } catch {
    return { ...service, status: 'offline' };
  }
}

function renderCredentials(credentials?: ServiceCredentials): string {
  if (!credentials) {
    return '';
  }

  const noteHtml = credentials.note ? `<br><em>(${credentials.note})</em>` : '';

  return `
    <div class="credentials">
      <strong>🔐 Dev Credentials:</strong>
      User: <code>${credentials.username}</code> | 
      Pass: <code>${credentials.password}</code>
      ${noteHtml}
    </div>
  `;
}

function generateHTML(servicesStatus: ServiceWithStatus[], port: number): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>THC App - Service Discovery</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header { text-align: center; color: white; margin-bottom: 3rem; }
    h1 {
      font-size: 3rem;
      margin-bottom: 0.5rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .subtitle { font-size: 1.2rem; opacity: 0.9; }
    .services {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .service-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .service-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.3);
    }
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f0f0f0;
    }
    .service-name { font-size: 1.5rem; font-weight: 700; color: #667eea; }
    .status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status.healthy { background: #d4edda; color: #155724; }
    .status.unhealthy { background: #f8d7da; color: #721c24; }
    .status.offline { background: #e2e3e5; color: #383d41; }
    .service-description {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .credentials {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 0.75rem;
      margin-bottom: 1rem;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .credentials strong {
      color: #856404;
      display: block;
      margin-bottom: 0.25rem;
    }
    .credentials code {
      background: #fff;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      color: #d63384;
    }
    .endpoints { list-style: none; }
    .endpoint-item { margin-bottom: 0.5rem; }
    .endpoint-link {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1rem;
      background: #f8f9fa;
      border-radius: 6px;
      text-decoration: none;
      color: #667eea;
      font-weight: 500;
      transition: all 0.2s;
      width: 100%;
    }
    .endpoint-link:hover {
      background: #667eea;
      color: white;
      transform: translateX(5px);
    }
    .endpoint-link::before {
      content: '→';
      margin-right: 0.5rem;
      font-weight: bold;
    }
    footer {
      text-align: center;
      color: white;
      margin-top: 3rem;
      opacity: 0.8;
    }
    .refresh-btn {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 1rem 2rem;
      background: white;
      border: none;
      border-radius: 50px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.3);
      cursor: pointer;
      font-weight: 600;
      color: #667eea;
      transition: all 0.2s;
    }
    .refresh-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🏥 THC App</h1>
      <p class="subtitle">Service Discovery Dashboard</p>
    </header>
    <div class="services">
      ${servicesStatus
        .map(
          (service) => `
        <div class="service-card">
          <div class="service-header">
            <div class="service-name">${service.name}</div>
            <span class="status ${service.status}">${service.status}</span>
          </div>
          <p class="service-description">${service.description}</p>
          ${renderCredentials(service.credentials)}
          <ul class="endpoints">
            ${service.endpoints
              .map(
                (endpoint) => `
              <li class="endpoint-item">
                <a href="${endpoint.url}" class="endpoint-link" target="_blank">
                  ${endpoint.name}
                </a>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
        )
        .join('')}
    </div>
    <footer>
      <p>Powered by Platformatic Watt • Port ${port}</p>
    </footer>
  </div>
  <button class="refresh-btn" onclick="location.reload()">🔄 Refresh Status</button>
</body>
</html>
  `;
}

export default function dashboardPlugin(app: FastifyInstance): void {
  app.get('/api-docs', async (request: FastifyRequest, reply: FastifyReply) => {
    const baseUrl = getBaseUrl(request);
    const services = getServices(baseUrl);
    const servicesStatus = await Promise.all(services.map(checkServiceHealth));

    const address = request.socket.address();
    const port =
      address && typeof address === 'object' && 'port' in address ? address.port : DEFAULT_PORT;

    const html = generateHTML(servicesStatus, port ?? DEFAULT_PORT);
    return reply.type('text/html').send(html);
  });

  // Log dashboard URL after server starts listening
  app.addHook('onListen', function () {
    const address = this.server.address();
    if (address && typeof address === 'object') {
      const port = address.port;
      this.log.info(`📊 Admin Dashboard available at http://localhost:${port}/api-docs`);
    }
  });
}

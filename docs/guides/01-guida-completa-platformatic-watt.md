# Platformatic Watt - Guida Completa

> **Versione**: 3.0 | **Ultimo aggiornamento**: Dicembre 2024  
> **Autore**: Documentazione interna per formazione sviluppatori

---

## Indice

1. [Overview e Concetti Fondamentali](#capitolo-1-overview-e-concetti-fondamentali)
2. [Quick Start Pratico](#capitolo-2-quick-start-pratico)
3. [Cheatsheet e Reference](#capitolo-3-cheatsheet-e-reference)
4. [Integrazione con NestJS](#capitolo-4-integrazione-con-nestjs)
5. [Porting di Progetti Esistenti](#capitolo-5-porting-di-progetti-esistenti)
6. [Database Application e API Auto-Generate](#capitolo-6-database-application-e-api-auto-generate)
7. [Variabili d'Ambiente e Configurazione](#capitolo-7-variabili-dambiente-e-configurazione)
8. [Roadmap Argomenti Avanzati](#capitolo-8-roadmap-argomenti-avanzati)

---

# Capitolo 1: Overview e Concetti Fondamentali

## Cos'è Watt?

Platformatic Watt è un **Application Server per Node.js** che permette di orchestrare e comporre
multiple applicazioni in un'unica istanza. Pensalo come un "contenitore intelligente" che può
eseguire diverse applicazioni Node.js (e non solo) in worker thread separati, esponendole attraverso
un gateway unificato.

## Architettura Concettuale

```
┌─────────────────────────────────────────────────────────┐
│                    WATT SERVER                          │
│                   (porta 3042)                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Gateway   │  │  Next.js    │  │  Node.js    │     │
│  │  (router)   │  │  Frontend   │  │  Backend    │     │
│  │             │  │  /next      │  │  /node      │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         └────────────────┴────────────────┘             │
│                    Worker Threads                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Concetti Chiave

### Worker Threads Isolati

Ogni applicazione gira nel proprio worker thread, garantendo isolamento e stabilità. Se
un'applicazione crasha, le altre continuano a funzionare.

### Internal Mesh Network

Le applicazioni possono comunicare tra loro usando hostname interni con pattern
`{app-name}.plt.local`. Questo permette chiamate service-to-service senza passare dalla rete
esterna.

### Gateway come Entry Point

Il Platformatic Gateway funge da reverse proxy intelligente, instradando le richieste alle
applicazioni corrette in base al path prefix.

### Hot Reload in Development

In modalità `dev`, Watt monitora i file e riavvia automaticamente le applicazioni modificate senza
riavviare l'intero server.

## Framework Supportati

Watt non è limitato a framework specifici. Supporta nativamente Node.js puro (node:http,
node:https), Express, Fastify, NestJS (particolarmente rilevante per stack enterprise), Koa,
Next.js, Astro, Remix, e Vite.

## Struttura Tipica di un Progetto Watt

```
my-watt-project/
├── package.json           # Root package con scripts watt
├── watt.json              # Configurazione principale Watt
└── web/
    ├── gateway/
    │   ├── package.json
    │   └── platformatic.json
    ├── api/               # Es: NestJS backend
    │   ├── package.json
    │   ├── watt.json
    │   └── src/
    └── frontend/          # Es: Next.js
        ├── package.json
        ├── watt.json
        └── src/
```

## Vantaggi per Architetture Healthcare

Nel contesto di applicazioni sanitarie, Watt offre alcuni vantaggi interessanti. La separazione dei
concern permette di avere moduli separati per cartella clinica, firma digitale, integrazioni
HL7/FHIR, ognuno nel proprio worker. La resilienza garantisce che un problema in un modulo non
abbatte l'intero sistema. Lo sviluppo parallelo consente a team diversi di lavorare su applicazioni
diverse. Il testing isolato permette di testare ogni applicazione indipendentemente. Il deploy
incrementale offre la possibilità di aggiornare singole componenti.

## Comunicazione Interna (plt.local)

Il pattern `http://{service-name}.plt.local` è fondamentale per la comunicazione tra servizi:

```javascript
// Da un'applicazione Next.js, chiama il backend Node.js
const response = await fetch('http://api.plt.local/patients/123');

// Da un servizio NestJS, chiama un altro microservizio
const auditLog = await fetch('http://audit.plt.local/log', {
  method: 'POST',
  body: JSON.stringify({ action: 'patient_view', userId: '...' }),
});
```

Questo hostname risolve internamente senza passare dalla rete, con latenza minima.

---

# Capitolo 2: Quick Start Pratico

## Prerequisiti

Prima di iniziare, assicurati di avere installato Node.js versione 22.19.0 o superiore. Puoi
verificare con `node --version`.

## Creazione del Progetto

Il comando principale per inizializzare un progetto Watt è `npx wattpm create`. Questo wizard
interattivo ti guida nella configurazione iniziale.

```bash
npx wattpm create
```

Il wizard ti chiederà in sequenza dove creare il progetto, quale package manager usare (npm, yarn,
pnpm), che tipo di applicazione creare, il nome dell'applicazione e la porta da utilizzare (default
3042).

## Struttura Generata

Dopo l'esecuzione, avrai una struttura simile a questa nella directory `web/{nome-app}/`:

```
web/node/
├── package.json      # Dipendenze dell'app
├── watt.json         # Config specifica Watt
└── index.js          # Entry point dell'applicazione
```

## Anatomia di un'Applicazione Watt

L'entry point di un'applicazione Node.js per Watt deve esportare una funzione `create()` che
restituisce il server. Ecco un esempio minimale:

```javascript
// web/node/index.js
import { createServer } from 'node:http';

// La funzione create() viene chiamata da Watt per ottenere il server
// Il server verrà eseguito in un worker thread dedicato
export function create() {
  return createServer((req, res) => {
    res.writeHead(200, {
      'content-type': 'application/json',
      connection: 'close',
    });
    res.end(JSON.stringify({ hello: 'world' }));
  });
}
```

Questo pattern è fondamentale perché Watt ha bisogno di istanziare il server nel contesto corretto
del worker thread.

## Comandi Principali

Per avviare il server in produzione, dalla root del progetto esegui `npm start` che internamente
chiama `wattpm start`. Per lo sviluppo con hot reload usa invece `npm run dev` che chiama
`wattpm dev`.

Per testare che tutto funzioni puoi usare curl sulla porta configurata:

```bash
curl http://localhost:3042
```

## Aggiungere il Gateway

Il Gateway è il componente che orchestra e espone le varie applicazioni. Per aggiungerlo, dalla root
del progetto:

```bash
npx wattpm create
```

Seleziona `@platformatic/gateway` come tipo di applicazione. Questo crea una nuova directory
`web/gateway/` con la sua configurazione.

## Configurazione del Gateway

Il file `web/gateway/platformatic.json` definisce come le applicazioni vengono esposte:

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/gateway/3.0.0.json",
  "gateway": {
    "applications": [
      {
        "id": "node",
        "proxy": {
          "prefix": "/node"
        }
      },
      {
        "id": "api",
        "proxy": {
          "prefix": "/api"
        }
      }
    ],
    "refreshTimeout": 1000
  },
  "watch": true
}
```

Ogni applicazione viene mappata a un prefix URL. Le richieste a `http://localhost:3042/node/*`
vengono instradate all'applicazione "node".

## Aggiungere Applicazioni Frontend

Per framework come Next.js, prima crea l'app normalmente poi importala in Watt:

```bash
# Crea l'app Next.js
npx create-next-app web/next

# Importala in Watt (installa dipendenze e genera config)
npx wattpm-utils import
```

Poi configura il basePath nel file `web/next/watt.json`:

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/next/3.0.0.json",
  "application": {
    "basePath": "/next"
  }
}
```

## Comunicazione tra Applicazioni

Dentro Watt, le applicazioni possono chiamarsi usando il dominio interno `.plt.local`. Ad esempio,
da Next.js per chiamare il backend Node.js:

```javascript
// web/next/src/app/page.js
export default async function Home() {
  // Il dominio node.plt.local risolve internamente a Watt
  const data = await fetch('http://node.plt.local', {
    cache: 'no-store', // Disabilita cache Next.js per vedere dati fresh
  });
  const { hello } = await data.json();

  return <main>Hello {hello}</main>;
}
```

## Build e Produzione

Per creare una build ottimizzata per produzione usa `npm run build` che chiama `wattpm build`.
Questo compila Next.js e prepara tutte le applicazioni. Poi avvia con `npm run start`.

## Debug con Chrome DevTools

Per debuggare le singole applicazioni, avvia Watt con il flag inspect:

```bash
npm run start -- --inspect
```

Poi apri `chrome://inspect` in Chrome e vedrai elencate tutte le applicazioni. Clicca "inspect" per
aprire i DevTools dedicati.

## Debug con VS Code

In VS Code puoi usare il debugger integrato. Aggiungi un breakpoint nel codice, apri la Command
Palette (Ctrl+Shift+P / Cmd+Shift+P), cerca "Debug: Toggle Auto Attach" e seleziona "Always". Poi
avvia con `npm run dev` e il debugger si attaccherà automaticamente.

---

# Capitolo 3: Cheatsheet e Reference

## Comandi CLI Essenziali

Il comando `wattpm` (Watt Package Manager) è il cuore dell'interazione con Watt. Di solito viene
esposto tramite npm scripts ma puoi usarlo anche direttamente.

Per creare un nuovo progetto o aggiungere applicazioni usa `npx wattpm create`. Per importare
un'applicazione esistente (come un progetto Next.js già creato) usa `npx wattpm-utils import`. Per
avviare in development con watch mode usa `wattpm dev`, mentre per production usa `wattpm start`.
Infine, per creare la build di produzione usa `wattpm build`.

## File di Configurazione

### watt.json (Root)

Questo file nella root del progetto definisce la configurazione globale di Watt. Contiene
riferimenti a tutte le applicazioni gestite.

```json
{
  "$schema": "https://schemas.platformatic.dev/watt/3.0.0.json",
  "server": {
    "port": 3042,
    "host": "0.0.0.0"
  },
  "applications": [{ "path": "web/gateway" }, { "path": "web/api" }, { "path": "web/frontend" }]
}
```

### platformatic.json (Gateway)

La configurazione del Gateway definisce il routing verso le applicazioni.

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/gateway/3.0.0.json",
  "gateway": {
    "applications": [
      {
        "id": "api",
        "proxy": {
          "prefix": "/api",
          "timeout": 30000
        }
      },
      {
        "id": "frontend",
        "proxy": {
          "prefix": "/"
        }
      }
    ],
    "refreshTimeout": 1000
  },
  "watch": true
}
```

### watt.json (Applicazione)

Ogni applicazione ha il suo `watt.json` che specifica configurazioni particolari.

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/node/3.0.0.json",
  "application": {
    "basePath": "/api"
  }
}
```

## Pattern di Export per Applicazioni

### Node.js Puro

```javascript
import { createServer } from 'node:http';

export function create() {
  return createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  });
}
```

### Express

```javascript
import express from 'express';

export function create() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  return app;
}
```

### Fastify

```javascript
import Fastify from 'fastify';

export async function create() {
  const app = Fastify({ logger: true });

  app.get('/health', async () => {
    return { status: 'healthy' };
  });

  return app;
}
```

## Comunicazione Inter-Service

### Hostname Interni

Ogni applicazione è raggiungibile internamente tramite `{app-id}.plt.local`. Questo dominio risolve
solo all'interno dell'ambiente Watt, non è accessibile dall'esterno.

```javascript
// Chiamata sincrona a un altro servizio
const response = await fetch('http://users-service.plt.local/users/123');
const user = await response.json();

// POST con body JSON
const result = await fetch('http://audit.plt.local/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'user_login',
    userId: user.id,
    timestamp: new Date().toISOString(),
  }),
});
```

### Pattern Service Discovery

Non serve configurazione DNS o service registry esterno. Il nome del servizio corrisponde all'`id`
definito nella configurazione del gateway.

## Variabili d'Ambiente

Watt supporta variabili d'ambiente per configurazioni dinamiche.

```json
{
  "server": {
    "port": "{PLT_SERVER_PORT}",
    "host": "{PLT_SERVER_HOST}"
  }
}
```

Puoi usare un file `.env` nella root del progetto che verrà caricato automaticamente.

## Schema JSON per Autocompletamento

Tutti i file di configurazione supportano JSON Schema per validazione e autocompletamento nell'IDE.
Gli schema sono disponibili su `https://schemas.platformatic.dev/`.

Per @platformatic/node usa `https://schemas.platformatic.dev/@platformatic/node/3.0.0.json`. Per
@platformatic/gateway usa `https://schemas.platformatic.dev/@platformatic/gateway/3.0.0.json`. Per
@platformatic/next usa `https://schemas.platformatic.dev/@platformatic/next/3.0.0.json`.

## Debugging

### Inspector per Chrome DevTools

```bash
npm run start -- --inspect
```

Poi apri `chrome://inspect` e connettiti alle applicazioni.

### VS Code Auto Attach

In VS Code, attiva "Debug: Toggle Auto Attach" su "Always", poi avvia normalmente con `npm run dev`.
I breakpoint funzioneranno automaticamente.

### Log Strutturati

Watt usa Pino per il logging. Puoi controllare il livello con la variabile `LOG_LEVEL` impostata a
debug, info, warn, error, o silent.

## Tips per Produzione

Per il build di produzione ricorda di eseguire sempre `npm run build` prima del deploy. Considera
l'uso di health checks endpoint per orchestratori come Kubernetes o Docker Swarm. Configura
adeguatamente i timeout nel gateway per servizi che potrebbero essere lenti. Usa variabili
d'ambiente per configurazioni ambiente-specifiche come connection string al database, URL di servizi
esterni, e secrets.

---

# Capitolo 4: Integrazione con NestJS

## Perché NestJS con Watt?

NestJS è già un framework enterprise-ready con dependency injection, moduli, e architettura solida.
Integrarlo con Watt aggiunge un layer di orchestrazione che permette di far convivere il tuo backend
NestJS con altri servizi (frontend, microservizi legacy, worker specializzati) in un'unica istanza
coordinata.

Nel contesto healthcare, questo potrebbe tradursi in un'architettura dove il core NestJS gestisce la
business logic (cartelle cliniche, firme digitali), mentre servizi satellite gestiscono integrazioni
specifiche (gateway HL7, adapter FHIR, WebSocket per real-time).

## Setup di un'Applicazione NestJS in Watt

### Passo 1: Crea l'App NestJS

Se parti da zero, puoi creare l'applicazione NestJS direttamente nella struttura Watt.

```bash
# Dalla root del progetto Watt
cd web
npx @nestjs/cli new api
```

### Passo 2: Adatta l'Entry Point

NestJS normalmente usa `bootstrap()` in `main.ts`. Per Watt, devi modificare l'approccio per
esportare una funzione `create()` che restituisce l'app Express/Fastify sottostante.

```typescript
// web/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

// Watt chiamerà questa funzione per ottenere il server
export async function create() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Disabilita il logger in fase di create, Watt gestisce il logging
    logger: ['error', 'warn'],
  });

  // Configura il global prefix se necessario
  // Nota: questo si combina con il prefix del gateway
  app.setGlobalPrefix('v1');

  // Abilita CORS se il frontend è su un dominio diverso in dev
  app.enableCors();

  // Importante: inizializza l'app ma NON chiamare listen()
  // Watt gestirà il binding alla porta
  await app.init();

  // Restituisci l'istanza HTTP sottostante
  return app.getHttpAdapter().getInstance();
}

// Mantieni anche il bootstrap tradizionale per sviluppo standalone
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

// Esegui bootstrap solo se chiamato direttamente (non da Watt)
if (require.main === module) {
  bootstrap();
}
```

### Passo 3: Configura watt.json

Crea il file di configurazione Watt per l'applicazione NestJS.

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/node/3.0.0.json",
  "application": {
    "basePath": "/api"
  }
}
```

### Passo 4: Installa la Dipendenza Watt

```bash
cd web/api
npm install @platformatic/node
```

### Passo 5: Aggiorna il Gateway

Aggiungi l'applicazione NestJS alla configurazione del gateway.

```json
{
  "gateway": {
    "applications": [
      {
        "id": "api",
        "proxy": {
          "prefix": "/api",
          "timeout": 60000
        }
      }
    ]
  }
}
```

## Comunicazione con Altri Servizi

### Da NestJS verso Altri Servizi Watt

Puoi creare un service NestJS dedicato alle chiamate inter-service.

```typescript
// web/api/src/services/internal-http.service.ts
import { Injectable, HttpException } from '@nestjs/common';

@Injectable()
export class InternalHttpService {
  private readonly baseUrls = {
    audit: 'http://audit.plt.local',
    notifications: 'http://notifications.plt.local',
    fhir: 'http://fhir-gateway.plt.local',
  };

  async callService<T>(
    service: keyof typeof this.baseUrls,
    path: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrls[service]}${path}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new HttpException(`Service ${service} returned ${response.status}`, response.status);
      }

      return response.json();
    } catch (error) {
      // Log e rilancia per gestione centralizzata
      throw error;
    }
  }

  // Metodi di convenienza
  async auditLog(action: string, details: Record<string, any>) {
    return this.callService('audit', '/log', {
      method: 'POST',
      body: JSON.stringify({ action, details, timestamp: new Date() }),
    });
  }

  async sendNotification(userId: string, message: string) {
    return this.callService('notifications', '/send', {
      method: 'POST',
      body: JSON.stringify({ userId, message }),
    });
  }
}
```

### Registra il Service nel Modulo

```typescript
// web/api/src/app.module.ts
import { Module, Global } from '@nestjs/common';
import { InternalHttpService } from './services/internal-http.service';

@Global()
@Module({
  providers: [InternalHttpService],
  exports: [InternalHttpService],
})
export class CoreModule {}
```

## Pattern per Healthcare: Separazione dei Concern

Considera un'architettura dove diversi aspetti del sistema sanitario sono servizi separati
all'interno di Watt.

```
watt-healthcare/
├── web/
│   ├── gateway/              # Entry point, routing
│   ├── api-core/             # NestJS - Business logic principale
│   │   └── src/
│   │       ├── patients/     # Gestione pazienti
│   │       ├── procedures/   # Procedure chirurgiche
│   │       └── auth/         # Autenticazione (Keycloak)
│   ├── hl7-adapter/          # Servizio Node.js puro per HL7/MLLP
│   ├── fhir-gateway/         # Adapter FHIR R4
│   ├── ws-collab/            # WebSocket per collaborazione real-time
│   └── frontend/             # Next.js per UI
```

Ogni servizio è isolato ma può comunicare internamente. L'HL7 adapter, per esempio, potrebbe essere
un servizio specializzato che gestisce il protocollo MLLP e traduce i messaggi HL7v2 in chiamate
REST verso api-core.

## Testing in Ambiente Watt

### Test Unitari

I test unitari NestJS rimangono invariati. Non dipendono da Watt.

```bash
npm run test
```

### Test E2E con Watt

Per test end-to-end che verificano l'integrazione completa, avvia Watt e testa gli endpoint esposti.

```typescript
// web/api/test/e2e/watt-integration.e2e-spec.ts
describe('Watt Integration', () => {
  // Assumendo Watt in esecuzione su localhost:3042
  const baseUrl = process.env.WATT_URL || 'http://localhost:3042';

  it('should route to NestJS API', async () => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    expect(response.status).toBe(200);
  });

  it('should allow inter-service communication', async () => {
    // Questo test verifica che api-core possa chiamare audit service
    const response = await fetch(`${baseUrl}/api/v1/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        /* patient data */
      }),
    });

    // Verifica che l'audit log sia stato scritto
    // (dipende dalla tua implementazione)
  });
});
```

## Considerazioni su Fastify vs Express

NestJS supporta sia Express che Fastify come adapter HTTP. Se il tuo progetto usa già Fastify (che è
più performante), l'integrazione è simile ma usa `NestFastifyApplication`.

```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

export async function create() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  await app.init();

  // Per Fastify, restituisci l'istanza Fastify
  return app.getHttpAdapter().getInstance();
}
```

## Note sulla Gestione delle Connessioni

Quando lavori con database (PostgreSQL), Redis, o altre risorse stateful, ricorda che ogni
applicazione in Watt ha il suo pool di connessioni nel worker thread dedicato. Questo è generalmente
desiderabile per l'isolamento, ma significa che devi configurare i pool size considerando il numero
totale di applicazioni.

Se hai 4 applicazioni e ognuna ha un pool di 10 connessioni PostgreSQL, il tuo database vedrà
potenzialmente 40 connessioni da questo nodo Watt.

---

# Capitolo 5: Porting di Progetti Esistenti

## Il Problema che Watt Risolve

Quando hai già un'applicazione Node.js funzionante (che sia Fastify, Express, NestJS, o qualsiasi
altro framework), potresti chiederti: "Perché dovrei cambiarla?". La risposta è che non devi
riscriverla, ma puoi "avvolgerla" in Watt per ottenere gratuitamente una serie di funzionalità
enterprise che altrimenti dovresti implementare manualmente.

Watt ti offre out-of-the-box il multi-threading con worker thread isolati, logging standardizzato e
strutturato, monitoring e metriche pronte all'uso, gestione centralizzata degli environment,
orchestrazione di multiple applicazioni, e un gateway API integrato. Tutto questo senza modificare
una singola riga del tuo codice applicativo esistente.

## Il Processo di Wrapping

Il concetto chiave è che Watt può "avvolgere" la tua applicazione esistente, eseguendola nel suo
ambiente gestito. Non stai facendo un refactoring, stai aggiungendo un layer di orchestrazione
sopra.

```
PRIMA:                          DOPO:
┌──────────────┐               ┌─────────────────────────────┐
│  La tua App  │               │         WATT               │
│  Node.js     │      →        │  ┌──────────────────────┐  │
│  (standalone)│               │  │    La tua App        │  │
└──────────────┘               │  │    (invariata)       │  │
                               │  └──────────────────────┘  │
                               │  + logging + monitoring    │
                               │  + multi-thread + gateway  │
                               └─────────────────────────────┘
```

## Guida Passo-Passo

### Passo 0: Prerequisiti

Assicurati di avere Node.js versione 22.19.0 o superiore. Questa è una requirement importante perché
Watt sfrutta feature recenti di Node.js come i worker thread migliorati e altre ottimizzazioni di
performance.

### Passo 1: Posizionati nella Root del Progetto

Naviga nella directory del tuo progetto esistente. Watt rileverà automaticamente che c'è già
un'applicazione Node.js (cercando il `package.json`).

```bash
cd /path/to/your/existing/project
```

### Passo 2: Esegui il Wizard di Wrapping

Il comando `npm create wattpm` è intelligente: se rileva un progetto esistente, ti proporrà di
avvolgerlo invece di crearne uno nuovo.

```bash
npm create wattpm
```

Il wizard ti chiederà conferma che vuoi wrappare l'applicazione esistente e su quale porta vuoi
esporre Watt (default 3042). Dopo la conferma, Watt creerà automaticamente i file di configurazione
necessari.

I file generati sono tipicamente il file `.env` con le variabili d'ambiente, il file `.env.sample`
come template per altri sviluppatori, il `watt.json` con la configurazione Watt, e un `package.json`
aggiornato con gli script per Watt.

### Passo 3: Configura i Comandi Custom (Se Necessario)

Questo è il passaggio più importante da capire. Watt ha bisogno di sapere come avviare la tua
applicazione nelle diverse modalità (development, build, production). Se usi comandi standard come
`npm start`, potrebbe funzionare automaticamente. Ma se hai comandi personalizzati, devi dirglielo.

Il file `watt.json` ha una sezione `application.commands` dove specifichi esattamente quali comandi
usare in ogni fase del ciclo di vita dell'applicazione.

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/node/3.0.0.json",
  "application": {
    "commands": {
      "development": "npm run dev",
      "build": "npm run build",
      "production": "npm run start"
    }
  },
  "runtime": {
    "logger": {
      "level": "{PLT_SERVER_LOGGER_LEVEL}"
    },
    "server": {
      "hostname": "{PLT_SERVER_HOSTNAME}",
      "port": "{PORT}"
    },
    "managementApi": "{PLT_MANAGEMENT_API}"
  }
}
```

Vediamo cosa significa ogni comando. Il comando `development` è quello che Watt eseguirà quando
lanci `wattpm dev`, tipicamente il tuo script di sviluppo con hot-reload. Il comando `build` viene
eseguito da `wattpm build`, utile per progetti TypeScript o che richiedono una fase di compilazione.
Il comando `production` è quello usato da `wattpm start` per avviare l'applicazione in modalità
produzione.

### Passo 4: Avvia l'Applicazione

Una volta configurato, hai tre comandi principali a disposizione.

Per lo sviluppo con watch mode, usa `wattpm dev`. Questo avvia la tua applicazione in modalità
sviluppo, con hot-reload se il tuo framework lo supporta.

Per creare una build di produzione (se necessario), usa `wattpm build`. Questo è particolarmente
importante per progetti TypeScript che devono essere compilati prima dell'esecuzione.

Per avviare in produzione, usa `wattpm start`. Questo avvia l'applicazione ottimizzata per
l'ambiente di produzione.

## Comprendere la Configurazione Runtime

La sezione `runtime` del `watt.json` merita un'analisi approfondita perché controlla aspetti
fondamentali del comportamento di Watt.

### Logger Configuration

```json
"logger": {
  "level": "{PLT_SERVER_LOGGER_LEVEL}"
}
```

Il logger di Watt usa Pino internamente e supporta i livelli standard: `trace`, `debug`, `info`,
`warn`, `error`, `fatal`, e `silent`. La notazione `{PLT_SERVER_LOGGER_LEVEL}` indica che il valore
viene letto dalla variabile d'ambiente, permettendoti di cambiare il livello di log senza modificare
la configurazione.

### Server Configuration

```json
"server": {
  "hostname": "{PLT_SERVER_HOSTNAME}",
  "port": "{PORT}"
}
```

L'hostname determina su quale interfaccia di rete Watt ascolta. Usa `0.0.0.0` per accettare
connessioni da qualsiasi interfaccia (necessario in container Docker), oppure `127.0.0.1` per
accettare solo connessioni locali (più sicuro in sviluppo).

La porta è dove Watt espone il servizio. Nota che qui si usa `{PORT}` che è una convenzione comune
in ambienti cloud come Heroku o Railway che iniettano la porta da usare.

### Management API

```json
"managementApi": "{PLT_MANAGEMENT_API}"
```

Questa è una feature avanzata che espone un'API interna per monitorare e gestire l'applicazione a
runtime. Utile per health checks, metriche, e debugging in produzione.

## Risoluzione Problemi Comuni

### Conflitti di Porta

Se la porta specificata è già in uso, Watt tenterà automaticamente la porta successiva. Tuttavia,
questo può creare confusione in sviluppo. È meglio assicurarsi che la porta sia libera o
specificarne una diversa nel file `.env`.

Puoi verificare cosa sta usando una porta con il comando `lsof -i :3042` su Linux/Mac o
`netstat -ano | findstr :3042` su Windows.

### Script Mancanti

Se Watt non riesce ad avviare la tua applicazione, il problema più comune è che non trova gli script
giusti. Verifica nel tuo `package.json` quali script hai definito e assicurati che corrispondano a
quelli nel `watt.json`.

Ad esempio, se nel tuo package.json hai `"scripts": { "serve": "node server.js" }` ma nel watt.json
hai `"production": "npm run start"`, Watt non troverà lo script. Correggi in
`"production": "npm run serve"`.

### Progetti TypeScript

Per progetti TypeScript, è fondamentale che la build venga eseguita prima dell'avvio in produzione.
Watt chiama `wattpm build` prima di `wattpm start`, ma devi assicurarti che il comando `build` nel
`watt.json` punti effettivamente al tuo script di compilazione TypeScript.

Un setup tipico sarebbe avere nel package.json gli script `"build": "tsc"` o `"build": "nest build"`
per NestJS, e poi nel watt.json semplicemente `"build": "npm run build"`.

### Variabili d'Ambiente

Watt carica automaticamente il file `.env` dalla root del progetto. Se la tua applicazione dipende
da variabili d'ambiente specifiche (connection string al database, API keys, etc.), assicurati che
siano definite nel `.env`.

La convenzione è usare `.env` per i valori reali (che non va in git) e `.env.sample` come template
con valori placeholder per documentare quali variabili sono necessarie.

## Esempio Pratico: Wrapping di un Progetto Fastify

Immaginiamo di avere un progetto Fastify standard con questa struttura iniziale:

```
my-fastify-app/
├── package.json
├── src/
│   └── server.js
└── .env
```

Dopo aver eseguito `npm create wattpm` e configurato i comandi, la struttura diventa:

```
my-fastify-app/
├── package.json      # Aggiornato con script watt
├── watt.json         # Nuovo - configurazione Watt
├── .env              # Aggiornato con variabili Watt
├── .env.sample       # Nuovo - template per altri dev
└── src/
    └── server.js     # Invariato!
```

Il punto cruciale è che `server.js` rimane identico. Non hai toccato il tuo codice applicativo, hai
solo aggiunto l'infrastruttura Watt attorno ad esso.

## Quando NON Fare il Wrapping

Il wrapping semplice funziona bene per applicazioni standalone. Tuttavia, se il tuo obiettivo è
sfruttare funzionalità avanzate di Watt come la comunicazione inter-service con `.plt.local`, il
gateway per orchestrare multiple applicazioni, o i worker thread separati per servizi diversi,
allora dovrai fare un setup più strutturato come descritto nel Capitolo 4 sull'integrazione NestJS.

Il wrapping è perfetto come primo passo per "assaggiare" Watt senza commitment. Puoi sempre evolvere
verso un'architettura più sofisticata in seguito.

---

# Capitolo 6: Database Application e API Auto-Generate

## La Distinzione Fondamentale: Watt vs Platformatic DB

Prima di procedere, è essenziale comprendere una distinzione architettonica che può creare
confusione iniziale. Watt e Platformatic DB sono due cose diverse che lavorano insieme.

**Watt** è l'Application Server, il "contenitore" che orchestra e gestisce multiple applicazioni.
Pensa a Watt come a un direttore d'orchestra: non suona nessuno strumento, ma coordina tutti i
musicisti.

**Platformatic DB** è una delle applicazioni che può girare dentro Watt. È specializzata nel
connettersi a un database e generare automaticamente API REST e GraphQL dal tuo schema. È uno dei
"musicisti" nell'orchestra.

Questa separazione di responsabilità è fondamentale per capire come costruire applicazioni
complesse:

```
┌─────────────────────────────────────────────────────────────────┐
│                         WATT                                    │
│                   (Application Server)                          │
│                                                                 │
│   Responsabilità:                                               │
│   • Orchestrazione applicazioni                                 │
│   • Configurazione unificata (watt.json, .env condiviso)        │
│   • Logging centralizzato                                       │
│   • Discovery automatico dei servizi                            │
│   • Deploy unificato                                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Platformatic │  │   Custom     │  │   Frontend   │          │
│  │     DB       │  │   HTTP App   │  │   (Next.js)  │          │
│  │              │  │   (NestJS)   │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  Ogni applicazione ha le sue responsabilità specifiche         │
└─────────────────────────────────────────────────────────────────┘
```

## Perché Usare Platformatic DB?

Nel tradizionale sviluppo backend, quando hai bisogno di esporre dati da un database via API, devi
scrivere manualmente ogni endpoint CRUD (Create, Read, Update, Delete) per ogni entità. Per
un'applicazione con 10 tabelle, questo significa scrivere circa 50 endpoint con la relativa logica
di validazione, gestione errori, e documentazione.

Platformatic DB ribalta questo approccio: tu definisci lo schema del database tramite migrazioni
SQL, e lui genera automaticamente tutti gli endpoint REST e GraphQL, completi di documentazione
OpenAPI, validazione dei tipi, e persino i tipi TypeScript per il tuo codice.

Questo non significa che perdi controllo. Puoi sempre aggiungere logica custom, middleware, e
endpoint personalizzati. Ma il boilerplate ripetitivo viene gestito automaticamente.

## Creazione di un'Applicazione DB in Watt

Quando esegui il wizard `npm create wattpm` e scegli `@platformatic/db`, Watt crea una struttura
dedicata nella directory `web/`. Vediamo cosa viene generato e perché.

### La Struttura delle Directory

```
my-watt-project/
├── watt.json                    # Config Watt (application server)
├── .env                         # Variabili condivise tra tutte le app
├── package.json
└── web/
    └── db/                      # La tua applicazione Platformatic DB
        ├── platformatic.json    # Config specifica dell'app DB
        ├── .env                 # Variabili specifiche per il DB
        ├── migrations/          # Le tue migrazioni SQL
        │   ├── 001.do.sql       # Migrazione in avanti
        │   └── 001.undo.sql     # Rollback della migrazione
        ├── plugins/             # Logica custom (hooks, middleware)
        ├── routes/              # Endpoint custom aggiuntivi
        └── types/               # Tipi TypeScript auto-generati
```

Nota la separazione: `watt.json` nella root gestisce l'orchestrazione generale, mentre
`web/db/platformatic.json` gestisce la configurazione specifica del database.

### Il File platformatic.json

Questo file configura come Platformatic DB si comporta. Un esempio tipico:

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/db/3.0.0.json",
  "server": {
    "cors": {
      "origin": "{PLT_SERVER_CORS_ORIGIN}"
    }
  },
  "db": {
    "connectionString": "{DATABASE_URL}"
  },
  "migrations": {
    "dir": "migrations",
    "autoApply": true
  },
  "plugins": {
    "paths": ["plugins/"]
  }
}
```

La sezione `db.connectionString` punta alla variabile d'ambiente che contiene l'URL di connessione
al database. La notazione `{VARIABILE}` indica che il valore viene letto dall'ambiente,
permettendoti di avere configurazioni diverse per sviluppo e produzione senza modificare il file.

## Database Supportati

Platformatic DB supporta tre database relazionali, ognuno con i propri casi d'uso.

**SQLite** è il default ed è perfetto per lo sviluppo locale e prototyping. Non richiede
installazione di server separati perché il database è semplicemente un file. La connection string ha
la forma `sqlite://./db.sqlite`.

**PostgreSQL** è la scelta raccomandata per produzione. Offre robustezza, performance eccellenti con
grandi volumi di dati, e feature avanzate come JSONB per dati semi-strutturati. La connection string
ha la forma `postgres://user:password@host:5432/database`.

**MySQL/MariaDB** è supportato per compatibilità con sistemi esistenti. La connection string ha la
forma `mysql://user:password@host:3306/database`.

La bellezza dell'architettura è che il tuo codice applicativo rimane identico indipendentemente dal
database sottostante. Cambi solo la connection string.

## Il Sistema di Migrazioni

Le migrazioni sono il meccanismo per evolvere lo schema del database in modo controllato e
reversibile. Invece di modificare direttamente le tabelle, scrivi file SQL che descrivono le
modifiche, e Platformatic le applica in sequenza.

### Anatomia di una Migrazione

Ogni migrazione consiste in due file: il file `.do.sql` che contiene le modifiche da applicare (la
migrazione "in avanti"), e il file `.undo.sql` che contiene le istruzioni per annullare quelle
modifiche (il rollback).

La convenzione di naming usa numeri sequenziali: `001.do.sql`, `001.undo.sql`, `002.do.sql`,
`002.undo.sql`, e così via. Platformatic tiene traccia di quali migrazioni sono state applicate e le
esegue nell'ordine corretto.

### Esempio: Creare una Tabella Users

Il file `migrations/001.do.sql` potrebbe contenere:

```sql
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

E il corrispondente `migrations/001.undo.sql`:

```sql
DROP TABLE Users;
```

### Esempio: Creare una Tabella con Foreign Key

Il file `migrations/002.do.sql` per una tabella Todos collegata a Users:

```sql
CREATE TABLE IF NOT EXISTS Todos (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);
```

Con il rollback in `migrations/002.undo.sql`:

```sql
DROP TABLE Todos;
```

### Convenzione sui Nomi delle Tabelle

Platformatic genera endpoint RESTful basandosi sui nomi delle tabelle. Usare nomi plurali (Users
invece di User, Todos invece di Todo) produce endpoint più intuitivi e conformi alle convenzioni
REST: `GET /users` per ottenere tutti gli utenti, `GET /users/123` per un utente specifico.

### Applicare le Migrazioni

Per applicare tutte le migrazioni pendenti, esegui:

```bash
npx wattpm db:migrations:apply
```

Platformatic confronta le migrazioni nel filesystem con quelle già applicate al database (tracciate
in una tabella interna) e applica solo quelle nuove.

## Le API Auto-Generate

Una volta applicate le migrazioni, Platformatic DB genera automaticamente un set completo di
endpoint per ogni tabella.

### Endpoint REST

Per una tabella `Users`, vengono generati i seguenti endpoint. `GET /users` restituisce la lista di
tutti gli utenti, con supporto per paginazione e filtri. `POST /users` crea un nuovo utente,
accettando un body JSON con i campi della tabella. `GET /users/{id}` restituisce un singolo utente
dato il suo ID. `PUT /users/{id}` aggiorna un utente esistente. `DELETE /users/{id}` elimina un
utente.

Lo stesso pattern si applica a ogni tabella nel tuo schema.

### Endpoint GraphQL

Oltre alle API REST, Platformatic genera automaticamente uno schema GraphQL completo, accessibile
all'endpoint `/graphql`. Questo ti permette di fare query flessibili che attraversano le relazioni
tra tabelle, riducendo il numero di richieste necessarie per ottenere dati correlati.

### Documentazione OpenAPI

Platformatic genera automaticamente documentazione OpenAPI (Swagger) per tutte le API REST. Quando
avvii l'applicazione e visiti la root nel browser, trovi un link alla documentazione interattiva
dove puoi esplorare tutti gli endpoint, vedere gli schema di request/response, e testare le API
direttamente dal browser.

## Generazione Automatica dei Tipi TypeScript

Quando applichi le migrazioni, Platformatic genera automaticamente tipi TypeScript che riflettono lo
schema del tuo database. Questi tipi vengono salvati nella directory `types/` e includono interfacce
per ogni tabella con tutti i campi tipizzati correttamente.

Questo significa che quando scrivi plugin custom o logica aggiuntiva, hai autocompletamento e
type-checking per tutte le operazioni sul database. Un errore come tentare di accedere a un campo
inesistente viene catturato a compile-time invece che a runtime.

## Configurazione CORS per Architetture Multi-Applicazione

Quando la tua architettura Watt include un frontend (come Next.js o React) che gira su una porta
diversa durante lo sviluppo, devi configurare CORS (Cross-Origin Resource Sharing) per permettere al
frontend di chiamare le API del backend.

Nel file `.env` dell'applicazione DB, aggiungi:

```
PLT_SERVER_CORS_ORIGIN=http://localhost:3000
```

E nel `platformatic.json`, referenzia questa variabile nella configurazione del server:

```json
{
  "server": {
    "cors": {
      "origin": "{PLT_SERVER_CORS_ORIGIN}"
    }
  }
}
```

Questa configurazione aggiunge gli header CORS appropriati alle risposte, permettendo al browser di
accettare le risposte dalle API anche se provengono da un'origine diversa.

## Logging Unificato

Una delle feature più pratiche di Watt è il logging centralizzato. Quando esegui `npm run dev`,
tutti i log di tutte le applicazioni (il server Watt principale, l'applicazione DB, eventuali altre
applicazioni) appaiono nello stesso stream di output con formattazione consistente.

Questo elimina la necessità di aprire terminali multipli o aggregare log da fonti diverse durante il
debugging. Ogni richiesta può essere tracciata attraverso tutte le applicazioni coinvolte.

## Quando Usare Platformatic DB vs Custom HTTP Application

Platformatic DB è ideale quando hai bisogno di esporre dati relazionali tramite API CRUD standard
con poco o nessun business logic complesso. È perfetto per backend di applicazioni data-driven, MVP
e prototipi, microservizi focalizzati sui dati, e admin panel.

Per logica di business complessa, integrazioni con sistemi esterni (come HL7 nel contesto
healthcare), o pattern architetturali specifici (come quelli offerti da NestJS con dependency
injection), è meglio usare un'applicazione HTTP custom che gira accanto a Platformatic DB nello
stesso ambiente Watt.

La bellezza dell'architettura Watt è che puoi combinare entrambi: Platformatic DB per le operazioni
CRUD standard, e applicazioni NestJS custom per la logica di business complessa, tutti orchestrati
dallo stesso application server.

---

# Capitolo 7: Variabili d'Ambiente e Configurazione

## La Filosofia Twelve-Factor App

Watt abbraccia la metodologia "twelve-factor app", un insieme di best practice per costruire
applicazioni moderne e scalabili. Uno dei principi fondamentali di questa metodologia è la
separazione tra codice e configurazione: il codice dell'applicazione deve essere identico in tutti
gli ambienti (sviluppo, staging, produzione), mentre la configurazione che cambia tra ambienti deve
vivere nelle variabili d'ambiente.

Questo approccio porta benefici concreti che vale la pena comprendere in profondità.

La separazione della configurazione dal codice significa che informazioni sensibili come password
del database, API key, e connection string non finiscono mai nel repository Git. Questo riduce
drasticamente il rischio di leak accidentali e semplifica la gestione della sicurezza.

La portabilità tra ambienti diventa naturale: lo stesso identico codice gira in locale, su un server
di staging, e in produzione. L'unica differenza è il set di variabili d'ambiente che definisce il
comportamento specifico di quell'istanza.

Il deploy diventa più semplice e prevedibile perché non ci sono "build diverse" per ambienti
diversi. Cambiare una configurazione non richiede un nuovo deploy del codice, solo un restart con
variabili diverse.

## Sintassi di Interpolazione

Watt usa una sintassi semplice e intuitiva per referenziare variabili d'ambiente nei file di
configurazione JSON. Le variabili vengono racchiuse tra parentesi graffe singole.

```json
{
  "server": {
    "port": "{PORT}",
    "hostname": "{HOSTNAME}"
  },
  "runtime": {
    "logger": {
      "level": "{LOG_LEVEL}"
    }
  }
}
```

Quando Watt avvia l'applicazione, prima legge e parsa il JSON, poi sostituisce ogni occorrenza di
`{NOME_VARIABILE}` con il valore effettivo della variabile d'ambiente corrispondente. Questa
sostituzione avviene a startup time, quindi i valori sono fissi per tutta la durata del processo.

È importante notare che la sintassi usa parentesi graffe singole `{VAR}` e non la notazione shell
`${VAR}`. Questo è un errore comune quando si proviene da altri sistemi di configurazione.

## File .env e Caricamento Automatico

Watt ha supporto integrato per i file `.env`, che vengono caricati automaticamente all'avvio senza
bisogno di configurazione aggiuntiva o librerie esterne come `dotenv`.

Un file `.env` tipico contiene coppie chiave-valore, una per riga:

```
PORT=3042
HOSTNAME=localhost
LOG_LEVEL=info
DATABASE_URL=sqlite://./dev.db
API_KEY=my-secret-key-for-development
CORS_ORIGIN=http://localhost:3000
```

Watt cerca il file `.env` in due posizioni: nella stessa directory del file di configurazione Watt
(`watt.json` o `platformatic.json`), oppure nella directory di lavoro corrente da cui viene lanciato
il comando. Se trova un file `.env`, lo carica automaticamente rendendo le variabili disponibili per
l'interpolazione.

## Il Pattern .env.sample

Una best practice importante è mantenere un file `.env.sample` (o `.env.example`) nel repository che
documenta quali variabili sono necessarie, senza contenere valori sensibili reali.

```
# .env.sample - Template per le variabili d'ambiente
# Copia questo file in .env e sostituisci i valori

# Server Configuration
PORT=3042
HOSTNAME=localhost

# Database
DATABASE_URL=postgres://user:password@localhost:5432/myapp

# Logging
LOG_LEVEL=info

# Security (generate your own!)
API_KEY=replace-with-real-key
JWT_SECRET=replace-with-strong-secret
```

Questo file va committato nel repository e serve come documentazione vivente di quali variabili
l'applicazione si aspetta. Quando un nuovo sviluppatore clona il progetto, copia `.env.sample` in
`.env` e inserisce i valori appropriati per il suo ambiente locale.

## Configurazione per Ambienti Multipli

Per gestire configurazioni diverse per sviluppo, staging, e produzione, puoi creare file `.env`
specifici per ogni ambiente.

Il file `.env.development` contiene configurazioni ottimizzate per lo sviluppo locale:

```
PORT=3042
HOSTNAME=localhost
LOG_LEVEL=debug
DATABASE_URL=sqlite://./dev.db
CORS_ORIGIN=http://localhost:3000
```

Il file `.env.staging` punta a risorse di test condivise:

```
PORT=3042
HOSTNAME=0.0.0.0
LOG_LEVEL=info
DATABASE_URL=postgres://user:pass@staging-db.internal:5432/myapp_staging
CORS_ORIGIN=https://staging.myapp.com
```

Il file `.env.production` usa configurazioni ottimizzate per produzione:

```
PORT=3000
HOSTNAME=0.0.0.0
LOG_LEVEL=warn
DATABASE_URL=postgres://user:pass@prod-db.internal:5432/myapp
CORS_ORIGIN=https://myapp.com
```

Per usare un file specifico invece del default `.env`, usa il flag `--env` quando avvii Watt:

```bash
# Sviluppo con configurazione esplicita
npx wattpm dev --env .env.development

# Produzione
npx wattpm start --env .env.production
```

È fondamentale ricordare che Watt carica automaticamente solo il file `.env` standard. Per usare
file con nomi diversi come `.env.development` o `.env.production`, devi sempre specificarli
esplicitamente con il flag `--env`.

## Override da Command Line

Le variabili d'ambiente possono essere impostate direttamente dalla command line, e queste hanno
precedenza sui valori definiti nei file `.env`. Questo è utile per test rapidi, override temporanei
in CI/CD, o sessioni di debugging.

```bash
# Override della porta e del livello di log
PORT=4000 LOG_LEVEL=debug npx wattpm dev

# Test con database diverso
DATABASE_URL=postgres://test@localhost/test_db npx wattpm dev
```

La catena di precedenza è: variabili da command line sovrascrivono variabili da file `.env`, che a
loro volta sovrascrivono eventuali default nel codice.

## Pattern di Configurazione Comuni

### Configurazione Database

La connection string del database è il caso d'uso più comune per le variabili d'ambiente, perché
cambia sempre tra ambienti e contiene credenziali sensibili.

```json
{
  "db": {
    "connectionString": "{DATABASE_URL}",
    "pool": {
      "min": "{DB_POOL_MIN}",
      "max": "{DB_POOL_MAX}"
    }
  }
}
```

Con il corrispondente `.env`:

```
DATABASE_URL=postgres://myuser:mypassword@localhost:5432/myapp
DB_POOL_MIN=2
DB_POOL_MAX=10
```

In produzione, il pool size potrebbe essere più alto per gestire più connessioni concorrenti, mentre
in sviluppo locale un pool piccolo è sufficiente e consuma meno risorse.

### Configurazione Server e CORS

La configurazione del server HTTP è un altro caso comune dove i valori cambiano tra ambienti.

```json
{
  "server": {
    "port": "{PORT}",
    "hostname": "{HOSTNAME}"
  },
  "cors": {
    "origin": "{CORS_ORIGIN}"
  }
}
```

In sviluppo, `HOSTNAME` è tipicamente `localhost` o `127.0.0.1` per accettare solo connessioni
locali. In produzione, diventa `0.0.0.0` per accettare connessioni da qualsiasi interfaccia
(necessario quando l'applicazione gira dietro un load balancer o in un container).

`CORS_ORIGIN` cambia in base a dove è hostato il frontend: `http://localhost:3000` in sviluppo,
l'URL di produzione del frontend in produzione.

### Configurazione Logging

Il livello di logging è un classico esempio di configurazione che varia tra ambienti.

```json
{
  "runtime": {
    "logger": {
      "level": "{LOG_LEVEL}"
    }
  }
}
```

In sviluppo usi `debug` per vedere tutti i dettagli, in produzione usi `warn` o `error` per ridurre
il volume di log e i costi di storage/processing.

### Configurazione Feature Flags

Le variabili d'ambiente sono perfette anche per feature flags che abilitano o disabilitano
funzionalità.

```
FEATURE_NEW_DASHBOARD=true
FEATURE_BETA_API=false
ENABLE_METRICS=true
```

Questo permette di testare nuove feature in staging senza modificare il codice, e di abilitarle
gradualmente in produzione.

## Gestione dei Secrets

Per secrets particolarmente sensibili (API key di servizi esterni, JWT secrets, chiavi di
encryption), in produzione è consigliabile non usare file `.env` ma iniettare le variabili
direttamente dall'orchestratore (Kubernetes Secrets, AWS Parameter Store, HashiCorp Vault, etc.).

Watt non fa distinzione sulla provenienza delle variabili: che vengano da un file `.env`, dalla
command line, o dall'ambiente del container, l'interpolazione funziona allo stesso modo.

## Troubleshooting Comune

Se una variabile non viene sostituita correttamente, ci sono alcuni controlli da fare.

Prima di tutto, verifica la sintassi: deve essere `{VARIABILE}` con parentesi graffe singole, non
`${VARIABILE}` o `$VARIABILE`.

Poi controlla che la variabile sia effettivamente definita. Da terminale puoi verificare con
`echo $VARIABILE` (su Linux/Mac) o `echo %VARIABILE%` (su Windows cmd).

Verifica anche la posizione del file `.env`: deve essere nella stessa directory del file di
configurazione Watt o nella directory di lavoro corrente.

Se stai usando un file `.env.production` o simile, ricorda che devi specificarlo esplicitamente con
`--env`. Watt carica automaticamente solo il file chiamato esattamente `.env`.

Infine, ricorda che le variabili da command line hanno precedenza. Se hai impostato `PORT=4000`
nella shell e nel `.env` hai `PORT=3042`, verrà usato 4000.

## Integrazione con Sistemi di Deploy

In ambienti di produzione reali, le variabili d'ambiente vengono tipicamente gestite
dall'infrastruttura di deploy piuttosto che da file `.env`.

In Docker, le variabili si passano con il flag `-e`:

```bash
docker run -e DATABASE_URL=postgres://... -e LOG_LEVEL=warn myapp
```

In Docker Compose, si definiscono nella sezione `environment` del servizio.

In Kubernetes, si usano ConfigMaps per configurazioni non sensibili e Secrets per credenziali.

In piattaforme PaaS come Railway, Render, o Heroku, le variabili si configurano dalla dashboard web
o via CLI.

L'importante è che il codice dell'applicazione rimane identico in tutti questi scenari. Cambia solo
come le variabili vengono fornite all'ambiente di esecuzione.

---

# Capitolo 8: Roadmap Argomenti Avanzati

## Come Usare Questa Guida

Questo capitolo è una mappa ragionata delle funzionalità avanzate di Watt. Non devi studiarle tutte
subito: l'idea è capire cosa esiste e quando diventa rilevante per il tuo progetto. Man mano che
l'applicazione cresce e le esigenze si evolvono, saprai dove cercare.

Gli argomenti sono organizzati per fase di maturità del progetto e per problema che risolvono, con
note specifiche su come si applicano al contesto healthcare.

## Fase 1: Sviluppo dell'Applicazione

### Modular Monolith

Quando ne hai bisogno: quando l'applicazione cresce oltre il semplice CRUD e vuoi organizzare il
codice in moduli logici senza la complessità operativa dei microservizi distribuiti.

Il pattern "modular monolith" è particolarmente interessante per applicazioni healthcare. Puoi avere
moduli separati per la gestione pazienti, le procedure chirurgiche, il sistema di firma digitale, e
le integrazioni HL7, tutti dentro lo stesso deployment Watt ma con confini chiari tra loro. Se in
futuro un modulo deve scalare indipendentemente o essere estratto come microservizio, i confini sono
già definiti.

Watt supporta questo pattern permettendoti di avere multiple applicazioni Platformatic DB (una per
ogni bounded context) coordinate da un Gateway che le espone come API unificata. La comunicazione
tra moduli avviene internamente via `.plt.local` senza overhead di rete.

### Generazione Client Frontend

Quando ne hai bisogno: quando hai un team frontend che consuma le tue API e vuoi garantire
type-safety end-to-end.

Platformatic può generare automaticamente client TypeScript dalle tue API REST. Questo significa che
quando modifichi lo schema del database e le API cambiano di conseguenza, il client generato si
aggiorna e il compilatore TypeScript del frontend segnala immediatamente quali parti del codice
devono essere adattate.

Nel contesto di applicazioni ospedaliere dove gli errori possono avere conseguenze serie, questa
catena di type-safety dal database al frontend è un layer di sicurezza importante.

### Integrazione con Node Config

Quando ne hai bisogno: quando hai configurazioni complesse che vanno oltre semplici variabili
d'ambiente.

Se il tuo progetto già usa `node-config` o pattern simili per gestire configurazioni strutturate con
override per ambiente, Watt può integrarsi con questo sistema invece di richiedere una migrazione
completa al suo approccio.

## Fase 2: Performance e Ottimizzazione

### Caching

Quando ne hai bisogno: quando noti che alcune query o computazioni vengono ripetute frequentemente
con gli stessi parametri.

Il caching diventa critico quando hai dati che cambiano raramente ma vengono letti spesso. In un
sistema di sala operatoria, ad esempio, l'anagrafica del personale medico, i cataloghi dei
dispositivi, o le configurazioni delle procedure standard sono dati relativamente statici che
possono beneficiare enormemente di una cache.

Watt offre strategie di caching integrate che puoi configurare a livello di applicazione, evitando
di implementare manualmente logiche di cache invalidation.

### Profiling

Quando ne hai bisogno: quando l'applicazione è funzionalmente completa ma le performance non sono
soddisfacenti, o prima di andare in produzione per identificare colli di bottiglia.

Il profiling ti permette di capire dove l'applicazione spende il suo tempo: è il database lento? C'è
una funzione JavaScript che fa troppo lavoro? La serializzazione JSON è un problema?

Watt integra strumenti di profiling che funzionano nel contesto multi-applicazione, permettendoti di
tracciare una richiesta attraverso il Gateway, l'applicazione di business logic, e il database per
capire dove si accumula la latenza.

## Fase 3: Scalabilità e Architettura Distribuita

### Multi-Repository

Quando ne hai bisogno: quando team diversi lavorano su parti diverse dell'applicazione e hanno
bisogno di repository separati con cicli di release indipendenti.

In organizzazioni più grandi, potresti avere un team che gestisce il core del sistema di cartella
clinica, un altro team per le integrazioni HL7, e un terzo per il frontend. Ogni team vuole il
proprio repository con la propria CI/CD.

Watt supporta questo scenario permettendo di comporre applicazioni provenienti da repository diversi
in un unico deployment. Ogni team mantiene autonomia sul proprio codice, ma il risultato finale è
un'applicazione Watt coesa.

### Scheduler

Quando ne hai bisogno: quando hai task che devono essere eseguiti periodicamente o in momenti
specifici.

Job schedulati sono comuni in applicazioni healthcare: sincronizzazione notturna con sistemi
esterni, generazione di report giornalieri, pulizia di dati temporanei, invio di reminder per
appuntamenti.

Watt include uno scheduler che permette di definire task cron-like che girano nel contesto
dell'applicazione, con accesso alle stesse risorse (database, servizi) delle richieste HTTP.

## Fase 4: Deploy e Operazioni

### Dockerizzazione

Quando ne hai bisogno: praticamente sempre per deployment moderni.

La guida alla Dockerizzazione ti mostra come creare immagini Docker ottimizzate per applicazioni
Watt. Questo include multi-stage build per ridurre la dimensione dell'immagine, gestione corretta
dei signal per graceful shutdown, e configurazione delle variabili d'ambiente.

Nel contesto ospedaliero dove spesso le applicazioni girano in cluster Kubernetes o Docker Swarm
gestiti dall'IT, avere un Dockerfile ben fatto è il punto di partenza per qualsiasi deployment.

### Kubernetes Readiness e Liveness

Quando ne hai bisogno: quando deplowi su Kubernetes e vuoi che l'orchestratore gestisca
correttamente il ciclo di vita dei pod.

I probe di Kubernetes sono fondamentali per applicazioni production-grade. Il liveness probe dice a
Kubernetes se l'applicazione è ancora viva (se non risponde, il pod viene riavviato). Il readiness
probe dice se l'applicazione è pronta a ricevere traffico (durante lo startup o quando è
sovraccarica, Kubernetes smette di inviarle richieste).

Watt espone endpoint di health check che puoi configurare come probe. La guida spiega come
configurarli correttamente, incluso come verificare che le dipendenze (database, servizi esterni)
siano raggiungibili.

### TypeScript Deployment

Quando ne hai bisogno: quando il tuo progetto usa TypeScript e devi gestire la compilazione nel
processo di build.

Le applicazioni TypeScript richiedono una fase di build prima del deployment. La guida copre come
integrare `tsc` o altri compiler nel workflow Watt, come gestire i source map per debugging in
produzione, e come ottimizzare i tempi di build.

## Fase 5: Observability

### Logging Strutturato

Quando ne hai bisogno: da subito, ma la configurazione avanzata diventa importante in produzione.

Watt usa Pino per il logging, che produce log JSON strutturati. In sviluppo questo può sembrare
verboso, ma in produzione è essenziale perché permette di filtrare, aggregare, e analizzare i log
programmaticamente.

La guida copre come configurare livelli di log diversi per ambienti diversi, come aggiungere
contesto custom ai log (request ID, user ID, operation type), e come escludere informazioni
sensibili.

### Logging su Elasticsearch

Quando ne hai bisogno: quando hai abbastanza traffico che i log diventano difficili da gestire con
semplici file, o quando hai bisogno di cercare pattern nei log storici.

Elasticsearch con Kibana è uno stack comune per centralizzare i log di applicazioni distribuite. La
guida spiega come configurare Watt per inviare i log a Elasticsearch e come creare dashboard Kibana
per monitorare l'applicazione.

In ambito healthcare, avere log centralizzati e ricercabili è spesso un requisito di compliance per
audit trail.

### Metriche con Prometheus e Grafana

Quando ne hai bisogno: quando vuoi monitorare la salute dell'applicazione oltre ai semplici log.

Le metriche ti danno visibilità su aspetti quantitativi: quante richieste al secondo, qual è il
tempo medio di risposta, quanta memoria sta usando l'applicazione, quante connessioni database sono
attive.

Watt può esporre metriche in formato Prometheus, che poi Grafana visualizza in dashboard. Questo ti
permette di impostare alert quando le metriche escono dai range normali, ad esempio se il tempo di
risposta medio supera una soglia o se le connessioni database si stanno esaurendo.

### Distributed Tracing

Quando ne hai bisogno: quando hai architetture multi-servizio e devi debuggare problemi che
attraversano più applicazioni.

In un'architettura Watt con Gateway, applicazione di business logic, e database service, una singola
richiesta utente può attraversare tutti questi componenti. Il distributed tracing ti permette di
seguire il percorso della richiesta attraverso tutti i servizi, vedendo quanto tempo spende in
ognuno.

Questo è particolarmente utile per diagnosticare problemi di performance o errori intermittenti in
sistemi complessi. La guida copre l'integrazione con sistemi di tracing come Jaeger o Zipkin.

## Fase 6: CLI e Tooling

### CLI Management

Quando ne hai bisogno: quando vuoi automatizzare operazioni ripetitive o integrarle in script CI/CD.

La CLI di Watt (`wattpm`) ha molti comandi oltre a `dev`, `build`, e `start`. La guida completa
copre comandi per gestire le migrazioni, generare tipi, ispezionare la configurazione, e altro.

Conoscere bene la CLI ti permette di creare script di automazione più efficaci e di integrare Watt
nei tuoi workflow di CI/CD.

## Priorità Suggerite per Contesto Healthcare

Dato il lavoro su sistemi per sale operatorie con requisiti di real-time, firma digitale, e
integrazioni HL7, ecco come prioritizzare lo studio di questi argomenti.

Nella prima fase, concentrarsi su Dockerizzazione e Kubernetes probes perché sono prerequisiti per
qualsiasi deployment serio in ambiente ospedaliero. Poi il logging strutturato è essenziale per
audit e debugging.

Nella seconda fase, il pattern Modular Monolith aiuta a organizzare codice complesso senza overhead
operativo. Il caching diventa importante per dati che cambiano poco ma sono letti spesso come
anagrafiche e cataloghi.

Nella terza fase, le metriche Prometheus/Grafana danno visibilità sulla salute del sistema in
produzione. Il distributed tracing aiuta a debuggare problemi in architetture complesse.

Le altre funzionalità si possono esplorare quando se ne sente il bisogno specifico. L'importante è
sapere che esistono e dove trovarle.

---

## Appendice: Risorse Ufficiali

Per approfondimenti e documentazione aggiornata, consultare le risorse ufficiali Platformatic:

- **Documentazione Ufficiale**: https://docs.platformatic.dev
- **Repository GitHub**: https://github.com/platformatic
- **Discord Community**: Per supporto e discussioni con la community
- **Blog Platformatic**: https://blog.platformatic.dev per annunci e tutorial

---

_Fine della Guida Completa Platformatic Watt_

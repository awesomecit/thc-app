# Next Programming Session

**Data sessione attuale**: 13 Dicembre 2025  
**Sprint corrente**: Sprint 2 - Code Quality & Versioning (Story 2.1 completata)

## 📍 Punto di arrivo

### ✅ Completato in questa sessione

1. **Integrazione documentazione avanzata**
   - Guide 12 (HTTP Caching) e 13 (Platformatic DB CRUD) integrate
   - README.md e copilot-instructions.md aggiornati
   - Commit: `5b095b2`

2. **Infrastruttura test health check**
   - Struttura test esagonale: test co-locati in ogni app (`web/*/test/integration/`)
   - Test helper creati per thc-gateway, thc-db, thc-service, thc-node
   - 8 test health check scritti (2 per app: /health/ready e /health/live)
   - Framework: `node:test` (built-in Node.js 22)
   - Esecuzione: `node --experimental-strip-types --test` (supporto nativo TypeScript)

3. **Risoluzione problemi tecnici**
   - ❌ tsx: incompatibile con package `unicorn-magic` di Platformatic
   - ✅ Soluzione: Node.js 22 native TypeScript support (`--experimental-strip-types`)
   - ✅ Import ESM: `.ts` extension nei test per supporto nativo
   - ✅ Helper: rimossi `require()`, solo `import` ES modules
   - ⚠️ Package.json warnings: aggiungi `"type": "module"` in `web/*/package.json`

### 🔴 Test status: FAILING (EXPECTED)

```bash
$ npm run test:integration:health

# Risultato: 8/8 test FAILED con 404
# Causa: endpoint /health/ready e /health/live NON implementati nelle app

thc-db        → 404 (endpoint non esistenti)
thc-gateway   → 404 (endpoint non esistenti)
thc-service   → 404 (endpoint non esistenti)
thc-node      → 404 (endpoint non esistenti + test skip logic attiva)
```

**Questo è OK**: i test validano l'infrastruttura, gli endpoint devono essere implementati.

## 🎯 Cosa fare all'inizio della prossima sessione

### Task immediato: Implementare health check endpoints

**Story 2.1 - Subtask finale: Implementazione health endpoints** (~2h)

#### 1. thc-db (Platformatic DB)

```bash
# File: web/thc-db/plugins/health.ts (nuovo)
```

- Crea plugin con route `/health/ready` (check DB connection)
- Crea route `/health/live` (check app alive)
- Pattern: https://docs.platformatic.dev/docs/reference/db/plugin

#### 2. thc-service (Platformatic Service)

```bash
# File: web/thc-service/plugins/health.ts (nuovo)
```

- Route `/health/ready` (dependencies check opzionale)
- Route `/health/live` (check app alive)

#### 3. thc-gateway (Platformatic Gateway)

```bash
# File: web/thc-gateway/plugins/health.ts (nuovo)
```

- Route `/health/ready` (check services reachability)
- Route `/health/live` (check gateway alive)
- Opzionale: aggregate health dai servizi backend

#### 4. thc-node (Custom HTTP server)

```bash
# File: web/thc-node/index.ts (modifica)
```

- Aggiungi route handler per `/health/ready` e `/health/live`
- Rimuovi `t.skip()` da `web/thc-node/test/integration/health.test.ts`

#### 5. Verifica e commit

```bash
npm run test:integration:health  # Dovrebbe passare 8/8 test
git add -A
git commit -m "feat(infrastructure): implement health check endpoints for all Watt components"
git push
```

### Acceptance Criteria (Story 2.1 completa)

- [x] ESLint + SonarJS configurati
- [x] Pre-commit hooks (lint + format + secrets check)
- [x] Test structure esagonale (co-located)
- [ ] **Health check endpoints implementati** ← PROSSIMO STEP
- [ ] **Test integration green** (8/8 passing)
- [ ] Documentazione aggiornata (opzionale ADR)

---

### Story 2.2 - Semantic Versioning Automation (~10h) - DOPO health checks

**Task 2.2.1**: Auto-release script (~6h)

- Parse conventional commits dalla storia git
- Calcola bump semver (feat→MINOR, fix→PATCH, BREAKING→MAJOR)
- Crea git tag con formato `v{major}.{minor}.{patch}`
- Genera CHANGELOG.md (Keep a Changelog format)

**Task 2.2.2**: CHANGELOG generation (~2h)

- Group commits by type (feat, fix, refactor, docs, chore)
- Link commit hashes a GitHub/GitLab
- Detect breaking changes (BREAKING CHANGE footer)

**Task 2.2.3**: Release workflow docs (~2h)

- `RELEASE_PROCESS.md` con workflow manuale e automatico
- Rollback procedures
- Emergency hotfix process

**Riferimento**: `docs/guides/11-automatic-versioning-release-workflow.md`

---

## 📝 Note tecniche importanti

### Test pattern consolidato

```typescript
// Pattern helper (web/*/test/helper.ts)
export async function getServer(t: TestContext) {
  const config = JSON.parse(await readFile(...))
  config.server.logger.level = 'warn'
  config.watch = false
  const server = await create(..., config)
  await server.start({})
  t.after(() => server.stop())  // Auto cleanup
  return server.getApplication()
}

// Pattern test (web/*/test/integration/*.test.ts)
test('App /health/ready', async (t) => {
  const app = await getServer(t)
  const res = await app.inject({ method: 'GET', url: '/health/ready' })
  assert.strictEqual(res.statusCode, 200)
  const body = res.json() as { status: string }
  assert.strictEqual(body.status, 'ok')
})
```

### Comandi test essenziali

```bash
npm run test:integration:health    # Solo health checks (veloce)
npm run test:integration           # Tutti i test integration
npm run test:unit                  # Solo unit tests (non esistenti ancora)
npm test                           # Full suite
npm run test:watch                 # Watch mode per TDD
```

### File da monitorare

- `package.json` - script test aggiornati con `--experimental-strip-types`
- `tsconfig.test.json` - config TypeScript per test (nuovo)
- `web/*/test/helper.ts` - pattern Platformatic consolidato
- `web/*/test/integration/health.test.ts` - test acceptance infrastrutturali

### Problema risolto: TypeScript execution

❌ **Prima**: `tsx` (incompatibile con Platformatic unicorn-magic)  
✅ **Dopo**: `node --experimental-strip-types` (Node.js 22 native)  
📌 **Import**: usa `.ts` extension (non `.js`) per supporto nativo

---

## 🚀 Roadmap Sprint 2 (aggiornata)

- [x] **Story 2.1 - ESLint + SonarJS Setup** (~8h) - 95% DONE
  - [x] ESLint + TypeScript + SonarJS configured
  - [x] Pre-commit hooks (Husky)
  - [x] Test infrastructure (health checks)
  - [ ] Health endpoints implementation ← **NEXT 2h**
- [ ] **Story 2.2 - Semantic Versioning Automation** (~10h) - NOT STARTED
  - [ ] Auto-release script
  - [ ] CHANGELOG generation
  - [ ] Release workflow docs

**Tempo stimato completamento Sprint 2**: ~2h (health) + 10h (versioning) = 12h

---

## 💡 Principi da mantenere (Regola Zero)

Prima di implementare gli health check endpoints, chiediti:

1. **Ne ho davvero bisogno?** → SÌ (Kubernetes liveness/readiness probes)
2. **Perché?** → Deploy automation richiede health checks
3. **Trade-off?** → Pro: deploy sicuri. Contro: 50 righe codice extra
4. **Alternative?** → Platformatic ha health automatici? (verifica docs)

Se Platformatic DB/Service ha già health automatici, **NON reimplementarli**. Usa quello esistente.

---

**Prossimo comando**: `npm run test:integration:health` per vedere i 404, poi implementa plugin
health.

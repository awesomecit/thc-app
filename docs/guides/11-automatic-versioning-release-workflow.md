# Guida 09: Versionamento Automatico IaC-Oriented

> **Filosofia**: Il versionamento non è un'operazione manuale, è un **artefatto derivato** dai commit. La versione del software è l'output di una funzione deterministica applicata alla storia Git.

---

## Indice

1. [Principi Fondamentali](#1-principi-fondamentali)
2. [Architettura del Sistema](#2-architettura-del-sistema)
3. [Stack Tecnologico Consigliato](#3-stack-tecnologico-consigliato)
4. [Flusso di Versionamento](#4-flusso-di-versionamento)
5. [Gestione Monorepo con npm Workspaces](#5-gestione-monorepo-con-npm-workspaces)
6. [Generazione Automatica feature.json](#6-generazione-automatica-featurejson)
7. [Integrazione con BDD](#7-integrazione-con-bdd)
8. [Pipeline CI/CD](#8-pipeline-cicd)
9. [Struttura File e Convenzioni](#9-struttura-file-e-convenzioni)
10. [Checklist Implementazione](#10-checklist-implementazione)

---

## 1. Principi Fondamentali

### 1.1 Il Versionamento come Codice

Il versionamento IaC-oriented si basa su tre assiomi fondamentali. Prima di tutto, ogni versione deve essere **riproducibile**: dato lo stesso stato Git, lo script deve sempre produrre la stessa versione. In secondo luogo, il sistema deve essere **deterministico**, nel senso che nessun input umano è richiesto durante il calcolo della versione. Infine, tutto deve essere **tracciabile**: ogni numero di versione deve poter essere ricondotto ai commit che lo hanno generato.

### 1.2 Single Source of Truth

```
┌─────────────────────────────────────────────────────────────┐
│                    FONTE DI VERITÀ                         │
│                                                             │
│   Git History (Conventional Commits)                       │
│              │                                              │
│              ▼                                              │
│   ┌─────────────────────────────────────────┐              │
│   │         Script Deterministico           │              │
│   └─────────────────────────────────────────┘              │
│              │                                              │
│              ├──────────────┬──────────────┐               │
│              ▼              ▼              ▼               │
│      package.json    CHANGELOG.md    feature.json         │
│       (versione)      (storico)      (manifest)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

La storia Git è l'unica fonte di verità. Tutti gli altri artefatti (versione, changelog, manifest) sono **derivati** e possono essere rigenerati in qualsiasi momento.

### 1.3 Semantic Versioning come Contratto

| Tipo Commit | Impatto API | Bump Versione | Esempio |
|-------------|-------------|---------------|---------|
| `fix:` | Nessun cambiamento API | PATCH | 1.0.0 → 1.0.1 |
| `feat:` | Nuova funzionalità retrocompatibile | MINOR | 1.0.0 → 1.1.0 |
| `feat!:` o `BREAKING CHANGE:` | Cambiamento incompatibile | MAJOR | 1.0.0 → 2.0.0 |
| `docs:`, `style:`, `refactor:`, `test:`, `chore:` | Nessuno | Nessuno | - |

---

## 2. Architettura del Sistema

### 2.1 Diagramma dei Componenti

```mermaid
flowchart TB
    subgraph INPUT["📥 Input Layer"]
        GIT[("Git History")]
        FEAT["features/*.feature"]
        PKG["package.json"]
    end
    
    subgraph ANALYSIS["🔍 Analysis Layer"]
        COMMIT_PARSER["Commit Parser"]
        BDD_EXTRACTOR["BDD Extractor"]
        VERSION_CALC["Version Calculator"]
    end
    
    subgraph OUTPUT["📤 Output Layer"]
        NEW_VERSION["Nuova Versione"]
        CHANGELOG["CHANGELOG.md"]
        FEATURE_JSON["feature.json"]
        GIT_TAG["Git Tag"]
        WORKSPACE_SYNC["Workspace Sync"]
    end
    
    GIT --> COMMIT_PARSER
    FEAT --> BDD_EXTRACTOR
    PKG --> VERSION_CALC
    
    COMMIT_PARSER --> VERSION_CALC
    COMMIT_PARSER --> CHANGELOG
    BDD_EXTRACTOR --> FEATURE_JSON
    VERSION_CALC --> NEW_VERSION
    
    NEW_VERSION --> GIT_TAG
    NEW_VERSION --> WORKSPACE_SYNC
    NEW_VERSION --> FEATURE_JSON
```

### 2.2 Flusso Dati

```mermaid
sequenceDiagram
    participant DEV as Developer
    participant GIT as Git
    participant HOOK as Post-merge Hook
    participant ANALYZER as Release Analyzer
    participant MANIFEST as Manifest Generator
    participant CI as CI/CD
    
    DEV->>GIT: git commit -m "feat(auth): add JWT support"
    DEV->>GIT: git push
    
    Note over GIT,CI: Merge to main
    
    GIT->>HOOK: Trigger post-merge
    HOOK->>ANALYZER: Analyze commits since last tag
    
    ANALYZER->>ANALYZER: Parse conventional commits
    ANALYZER->>ANALYZER: Calculate semver bump
    ANALYZER->>ANALYZER: Generate CHANGELOG entry
    
    ANALYZER->>MANIFEST: Pass release info
    MANIFEST->>MANIFEST: Extract BDD scenarios
    MANIFEST->>MANIFEST: Match commits to features
    MANIFEST->>MANIFEST: Generate feature.json
    
    MANIFEST->>GIT: Create tag vX.Y.Z
    MANIFEST->>CI: Trigger release pipeline
```

---

## 3. Stack Tecnologico Consigliato

### 3.1 Librerie Core (Pronte all'Uso)

| Funzione | Libreria | Motivazione |
|----------|----------|-------------|
| **Parsing Commit** | `conventional-changelog-parser` | Standard de facto, supporta tutti i tipi |
| **Calcolo Versione** | `semver` | Libreria ufficiale semver, battle-tested |
| **Generazione CHANGELOG** | `conventional-changelog` | Integrato con l'ecosistema |
| **Gestione Git** | `simple-git` | API Promise-based, no shell escaping |
| **Parsing Gherkin** | `@cucumber/gherkin` | Parser ufficiale Cucumber |
| **Glob Pattern** | `fast-glob` | Performante per monorepo grandi |
| **Validazione Schema** | `ajv` | Per validare feature.json |

### 3.2 Toolchain Alternativa (All-in-One)

Per chi preferisce una soluzione integrata invece di comporre librerie singole:

| Tool | Descrizione | Pro | Contro |
|------|-------------|-----|--------|
| **semantic-release** | Release automation completa | Zero config, plugin ecosystem | Meno flessibile, opinionated |
| **standard-version** | Versioning + CHANGELOG | Semplice, standalone | Manutenzione rallentata |
| **release-it** | Release toolkit configurabile | Molto flessibile, plugin | Curva apprendimento |
| **changesets** | Pensato per monorepo | Ottimo per workspaces | Workflow diverso |

### 3.3 Matrice Decisionale

```
                    Semplicità
                        ▲
                        │
     semantic-release   │   standard-version
           ●────────────┼────────────●
                        │
    ────────────────────┼──────────────────► Flessibilità
                        │
        changesets      │     release-it
           ●────────────┼────────────●
                        │
                        │
              Script Custom (questa guida)
                        ●
```

**Raccomandazione**: Per questo progetto, dato il requisito di `feature.json` con BDD integration, consiglio un **approccio ibrido**: usare `conventional-changelog` per il parsing e CHANGELOG, ma script custom per il manifest e la sincronizzazione workspaces.

---

## 4. Flusso di Versionamento

### 4.1 Processo Completo

```mermaid
flowchart TD
    START([Developer esegue npm run release]) --> DRY{--dry-run?}
    
    DRY -->|Sì| PREVIEW["Mostra preview:\n- Versione proposta\n- Commits inclusi\n- CHANGELOG preview"]
    DRY -->|No| FETCH["Fetch tags remoti"]
    
    PREVIEW --> END_PREVIEW([Fine preview])
    
    FETCH --> LAST_TAG["Trova ultimo tag\n(git describe --tags)"]
    LAST_TAG --> COMMITS["Raccolta commits\nsince last tag"]
    
    COMMITS --> PARSE["Parse Conventional Commits"]
    PARSE --> CATEGORIZE["Categorizza:\n- feat → features[]\n- fix → fixes[]\n- BREAKING → breaking[]"]
    
    CATEGORIZE --> CALC["Calcola bump:\nbreaking? MAJOR\nfeat? MINOR\nfix? PATCH"]
    
    CALC --> BUMP_TYPE{Tipo bump}
    
    BUMP_TYPE -->|none| NO_RELEASE["Nessun release\n(solo docs/chore)"]
    NO_RELEASE --> END_NO([Fine - no release])
    
    BUMP_TYPE -->|patch/minor/major| NEW_VER["Calcola nuova versione"]
    
    NEW_VER --> UPDATE_PKG["Aggiorna package.json"]
    UPDATE_PKG --> UPDATE_LOCK["npm install\n(aggiorna lock)"]
    UPDATE_LOCK --> GEN_CHANGELOG["Genera CHANGELOG entry"]
    GEN_CHANGELOG --> GEN_MANIFEST["Genera feature.json"]
    GEN_MANIFEST --> SYNC_WS["Sincronizza workspaces"]
    
    SYNC_WS --> COMMIT["git commit -m\n'chore(release): vX.Y.Z'"]
    COMMIT --> TAG["git tag vX.Y.Z"]
    TAG --> PUSH["git push --follow-tags"]
    
    PUSH --> END_OK([✅ Release completato])
```

### 4.2 Pseudocodice Algoritmo Core

```
FUNCTION analyzeRelease():
    lastTag ← getLastGitTag() OR "v0.0.0"
    commits ← getCommitsSince(lastTag)
    
    parsed ← []
    FOR EACH commit IN commits:
        match ← REGEX_MATCH(commit.message, CONVENTIONAL_PATTERN)
        IF match:
            parsed.APPEND({
                hash: commit.sha[0:7],
                type: match.type,
                scope: match.scope OR null,
                breaking: match.bang OR contains(commit.body, "BREAKING CHANGE"),
                description: match.description
            })
    
    RETURN {
        lastTag: lastTag,
        commits: parsed,
        features: FILTER(parsed, type = "feat"),
        fixes: FILTER(parsed, type = "fix"),
        breaking: FILTER(parsed, breaking = true),
        suggestedBump: calculateBump(parsed)
    }

FUNCTION calculateBump(commits):
    IF ANY(commits, breaking = true):
        RETURN "major"
    IF ANY(commits, type = "feat"):
        RETURN "minor"
    IF ANY(commits, type = "fix"):
        RETURN "patch"
    RETURN "none"

FUNCTION calculateNextVersion(currentVersion, bumpType):
    [major, minor, patch] ← PARSE_SEMVER(currentVersion)
    
    SWITCH bumpType:
        CASE "major": RETURN FORMAT("{major+1}.0.0")
        CASE "minor": RETURN FORMAT("{major}.{minor+1}.0")
        CASE "patch": RETURN FORMAT("{major}.{minor}.{patch+1}")
        DEFAULT: RETURN currentVersion
```

---

## 5. Gestione Monorepo con npm Workspaces

### 5.1 Strategia di Versionamento

```mermaid
flowchart LR
    subgraph MONOREPO["Monorepo THC"]
        ROOT["package.json\n(root)"]
        
        subgraph WEB["web/"]
            GW["thc-gateway"]
            DB["thc-db"]
            SVC["thc-service"]
        end
        
        subgraph PKG["packages/"]
            SHARED["@thc/shared"]
            TYPES["@thc/types"]
        end
    end
    
    ROOT -->|"versione master"| WEB
    ROOT -->|"versione master"| PKG
    
    style ROOT fill:#e1f5fe
```

**Modello Scelto: Versione Sincronizzata (Fixed)**

Tutti i package condividono la stessa versione. Questo semplifica la gestione e garantisce coerenza.

### 5.2 Struttura package.json Root

```
{
  workspaces: [
    "web/*",
    "packages/*"
  ],
  
  scripts: {
    "release:analyze"   → Analizza e propone versione
    "release:manifest"  → Genera feature.json
    "release:sync"      → Sincronizza versioni workspaces
    "release"           → Esegue tutto il workflow
  }
}
```

### 5.3 Algoritmo Sincronizzazione Workspaces

```
FUNCTION syncWorkspaceVersions(newVersion):
    workspaces ← GLOB(["web/*/package.json", "packages/*/package.json"])
    
    FOR EACH pkgPath IN workspaces:
        pkg ← READ_JSON(pkgPath)
        pkg.version ← newVersion
        
        // Aggiorna dipendenze interne
        FOR EACH depType IN [dependencies, devDependencies, peerDependencies]:
            IF pkg[depType] EXISTS:
                FOR EACH [name, version] IN pkg[depType]:
                    IF name STARTS_WITH "@thc/" OR "thc-":
                        pkg[depType][name] ← "^{newVersion}"
        
        WRITE_JSON(pkgPath, pkg)
    
    LOG("✅ Sincronizzati {COUNT(workspaces)} packages a v{newVersion}")
```

### 5.4 Dipendenze Interne

```mermaid
graph TD
    GW["thc-gateway"] -->|depends on| SHARED["@thc/shared"]
    GW -->|depends on| TYPES["@thc/types"]
    
    DB["thc-db"] -->|depends on| SHARED
    DB -->|depends on| TYPES
    
    SVC["thc-service"] -->|depends on| SHARED
    SVC -->|depends on| TYPES
    
    SHARED -->|depends on| TYPES
    
    style TYPES fill:#fff3e0
    style SHARED fill:#e8f5e9
```

Quando si rilascia `v1.3.0`, tutte le dipendenze interne vengono aggiornate a `^1.3.0`.

---

## 6. Generazione Automatica feature.json

### 6.1 Struttura Target

```
{
  "$schema": "./feature.schema.json",
  "version": "1.3.0",
  "releaseDate": "2025-01-15T10:30:00.000Z",
  "previousVersion": "1.2.0",
  
  "summary": {
    "featuresCount": 3,
    "fixesCount": 5,
    "breakingChangesCount": 0
  },
  
  "features": [
    {
      "id": "gateway-a1b2c3d",
      "title": "add circuit breaker for patient-api",
      "scope": "gateway",
      "commit": "a1b2c3d",
      "bdd": {
        "feature": "Circuit Breaker Pattern",
        "scenario": "Service degrades gracefully under load",
        "source": "features/resilience/circuit-breaker.feature"
      }
    }
  ],
  
  "fixes": [...],
  
  "breakingChanges": [
    {
      "description": "Token format changed to JWT",
      "scope": "auth",
      "migrationGuide": "docs/migrations/v2-jwt.md"
    }
  ],
  
  "acceptanceCriteria": [
    {
      "feature": "User Authentication",
      "scenarios": ["Valid credentials", "Invalid credentials", "Token refresh"],
      "status": "implemented",
      "source": "features/auth/login.feature"
    }
  ]
}
```

### 6.2 Algoritmo Estrazione BDD

```mermaid
flowchart TD
    START([Inizio]) --> GLOB["Trova tutti *.feature"]
    GLOB --> LOOP{Per ogni file}
    
    LOOP --> PARSE["Parse con @cucumber/gherkin"]
    PARSE --> EXTRACT["Estrai:\n- Feature name\n- Scenario names\n- Tags\n- Steps"]
    
    EXTRACT --> MATCH["Cerca match con commit"]
    MATCH --> MATCH_ALGO{"Algoritmo matching"}
    
    MATCH_ALGO --> M1["1. Tag @commit-hash"]
    MATCH_ALGO --> M2["2. Scope nel path\n(features/auth/ → auth)"]
    MATCH_ALGO --> M3["3. Keyword similarity\n(fuzzy match su description)"]
    
    M1 --> RESULT
    M2 --> RESULT
    M3 --> RESULT
    
    RESULT["Associa commit ↔ BDD"] --> LOOP
    
    LOOP -->|Finito| OUTPUT["Genera feature.json"]
    OUTPUT --> END_OK([✅ Manifest pronto])
```

### 6.3 Pseudocodice Matching

```
FUNCTION matchCommitToBDD(commit, scenarios):
    // Strategia 1: Tag esplicito nel feature file
    FOR EACH scenario IN scenarios:
        IF scenario.tags CONTAINS "@{commit.hash}":
            RETURN scenario
    
    // Strategia 2: Match per scope
    IF commit.scope EXISTS:
        scopeMatches ← FILTER(scenarios, 
            scenario.sourcePath CONTAINS commit.scope)
        IF COUNT(scopeMatches) = 1:
            RETURN scopeMatches[0]
    
    // Strategia 3: Fuzzy match su keywords
    keywords ← TOKENIZE(commit.description)
    bestMatch ← null
    bestScore ← 0
    
    FOR EACH scenario IN scenarios:
        scenarioTokens ← TOKENIZE(scenario.name + scenario.steps)
        score ← JACCARD_SIMILARITY(keywords, scenarioTokens)
        IF score > bestScore AND score > 0.3:
            bestScore ← score
            bestMatch ← scenario
    
    RETURN bestMatch  // può essere null
```

### 6.4 Schema JSON per Validazione

Lo schema `feature.schema.json` garantisce che il manifest sia sempre valido:

```
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "releaseDate", "features", "fixes"],
  
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "features": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "title", "commit"],
        "properties": {
          "bdd": {
            "type": "object",
            "properties": {
              "feature": { "type": "string" },
              "scenario": { "type": "string" },
              "source": { "type": "string" }
            }
          }
        }
      }
    }
  }
}
```

---

## 7. Integrazione con BDD

### 7.1 Flusso Completo AC → BDD → Release

```mermaid
flowchart LR
    subgraph PLANNING["📋 Planning"]
        AC["Acceptance Criteria"]
        GHERKIN["Feature File\n(.feature)"]
    end
    
    subgraph DEV["💻 Development"]
        TDD["TDD Cycle"]
        IMPL["Implementation"]
        COMMIT["Conventional Commit"]
    end
    
    subgraph RELEASE["🚀 Release"]
        ANALYZE["Analyze Commits"]
        MATCH["Match to BDD"]
        MANIFEST["feature.json"]
    end
    
    AC -->|"traduzione"| GHERKIN
    GHERKIN -->|"guida"| TDD
    TDD --> IMPL
    IMPL --> COMMIT
    
    COMMIT --> ANALYZE
    GHERKIN --> MATCH
    ANALYZE --> MATCH
    MATCH --> MANIFEST
```

### 7.2 Convenzione Tagging nei Feature Files

Per facilitare il matching automatico, i feature file possono includere tag di riferimento:

```gherkin
@epic-001 @story-1.2
Feature: Commit Validation
  Come sviluppatore
  Voglio che i miei commit siano validati
  Per mantenere una storia Git pulita

  @task-1.2.1 @implemented
  Scenario: Commit con formato valido
    Given un messaggio "feat(auth): add login"
    When il commit viene creato
    Then il commit deve essere accettato

  @task-1.2.2 @pending
  Scenario: Commit con formato invalido
    Given un messaggio "fixed stuff"
    When il commit viene creato
    Then il commit deve essere rifiutato
```

### 7.3 Mappatura Automatica

```
┌──────────────────────────────────────────────────────────────┐
│                    MAPPATURA AUTOMATICA                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Commit: feat(auth): add JWT token validation                │
│           │     │                                            │
│           │     └──────► Cerca in: features/auth/*.feature   │
│           │                                                  │
│           └────────────► Keywords: "JWT", "token", "valid"   │
│                                    ↓                         │
│                          Fuzzy match su Scenario names       │
│                                    ↓                         │
│                          Match: "JWT token is validated"     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Pipeline CI/CD

### 8.1 Trigger e Fasi

```mermaid
flowchart TD
    subgraph TRIGGERS["🎯 Triggers"]
        PR["Pull Request\n→ main"]
        MERGE["Merge to main"]
        MANUAL["Manual dispatch"]
    end
    
    subgraph PR_CHECKS["PR Checks"]
        LINT["Lint + Format"]
        TEST["Unit + Integration"]
        BUILD["Build"]
        PREVIEW["Release Preview\n(dry-run)"]
    end
    
    subgraph RELEASE_PIPELINE["Release Pipeline"]
        ANALYZE["Analyze commits"]
        VERSION["Calculate version"]
        CHANGELOG["Generate CHANGELOG"]
        MANIFEST["Generate feature.json"]
        TAG["Create Git tag"]
        PUBLISH["Publish artifacts"]
    end
    
    PR --> PR_CHECKS
    MERGE --> RELEASE_PIPELINE
    MANUAL --> RELEASE_PIPELINE
    
    PR_CHECKS --> |"✅ All pass"| MERGE_READY["Ready to merge"]
```

### 8.2 Strategia di Release

| Evento | Azione | Versione |
|--------|--------|----------|
| PR aperta | Preview release (dry-run) | Proposta |
| Merge to main | Auto-release | Effettiva |
| Tag manuale | Skip automation | Come da tag |
| Hotfix branch | Patch release | x.y.Z+1 |

### 8.3 Workflow GitHub Actions (Schema)

```
name: Release

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      dry_run:
        type: boolean
        default: false

jobs:
  release:
    steps:
      1. Checkout (fetch-depth: 0 per storia completa)
      2. Setup Node.js
      3. Install dependencies
      4. Run tests
      5. Analyze commits
      6. IF dry_run: mostra preview e termina
      7. Calculate new version
      8. Update package.json files
      9. Generate CHANGELOG
      10. Generate feature.json
      11. Sync workspace versions
      12. Commit changes
      13. Create and push tag
      14. Create GitHub Release
      15. Upload artifacts (feature.json, CHANGELOG)
```

---

## 9. Struttura File e Convenzioni

### 9.1 Albero Directory

```
thc-app/
├── .github/
│   └── workflows/
│       └── release.yml              # CI/CD pipeline
│
├── scripts/
│   ├── release/
│   │   ├── analyze.js               # Analisi commit
│   │   ├── version.js               # Calcolo versione
│   │   ├── changelog.js             # Generazione CHANGELOG
│   │   ├── manifest.js              # Generazione feature.json
│   │   ├── sync-workspaces.js       # Sincronizzazione versioni
│   │   └── index.js                 # Orchestratore
│   │
│   └── bdd/
│       └── extract-scenarios.js     # Parser Gherkin
│
├── features/                         # BDD scenarios
│   ├── auth/
│   │   └── login.feature
│   ├── gateway/
│   │   └── circuit-breaker.feature
│   └── ...
│
├── schemas/
│   └── feature.schema.json          # JSON Schema validazione
│
├── web/                              # Workspaces
│   ├── thc-gateway/
│   ├── thc-db/
│   └── ...
│
├── packages/
│   ├── @thc/shared/
│   └── @thc/types/
│
├── CHANGELOG.md                      # Generato automaticamente
├── feature.json                      # Manifest release (gitignored in dev)
└── package.json                      # Root con workspaces
```

### 9.2 Convenzioni di Naming

| Tipo | Pattern | Esempio |
|------|---------|---------|
| Tag Git | `v{MAJOR}.{MINOR}.{PATCH}` | `v1.3.0` |
| Branch release | `release/v{VERSION}` | `release/v1.3.0` |
| Branch hotfix | `hotfix/v{VERSION}` | `hotfix/v1.2.1` |
| Commit release | `chore(release): v{VERSION}` | `chore(release): v1.3.0` |
| Feature ID | `{scope}-{short-hash}` | `gateway-a1b2c3d` |

### 9.3 File Generati vs Committed

| File | Stato | Motivazione |
|------|-------|-------------|
| `CHANGELOG.md` | ✅ Committed | Storico permanente |
| `package.json` (versione) | ✅ Committed | Necessario per npm |
| `package-lock.json` | ✅ Committed | Riproducibilità |
| `feature.json` | ⚠️ Committed solo in release | Artefatto di release |
| `.release-info.json` | ❌ Gitignored | Cache temporanea |

---

## 10. Checklist Implementazione

### 10.1 Fase 1: Setup Base (Sprint 1)

| Task | Descrizione | Libreria/Tool |
|:----:|-------------|---------------|
| ☐ | Installare dipendenze release | `semver`, `simple-git`, `conventional-changelog-parser` |
| ☐ | Creare script `scripts/release/analyze.js` | - |
| ☐ | Creare script `scripts/release/version.js` | - |
| ☐ | Aggiungere npm script `release:analyze` | - |
| ☐ | Testare con `--dry-run` su commit esistenti | - |

### 10.2 Fase 2: CHANGELOG e Tag (Sprint 1)

| Task | Descrizione | Libreria/Tool |
|:----:|-------------|---------------|
| ☐ | Creare script `scripts/release/changelog.js` | `conventional-changelog` |
| ☐ | Configurare template CHANGELOG | - |
| ☐ | Implementare creazione tag Git | `simple-git` |
| ☐ | Aggiungere npm script `release` | - |
| ☐ | Testare ciclo completo (analyze → tag) | - |

### 10.3 Fase 3: Workspaces Sync (Sprint 2)

| Task | Descrizione | Libreria/Tool |
|:----:|-------------|---------------|
| ☐ | Creare script `scripts/release/sync-workspaces.js` | `fast-glob` |
| ☐ | Implementare aggiornamento dipendenze interne | - |
| ☐ | Testare con monorepo esistente | - |
| ☐ | Aggiungere npm script `release:sync` | - |

### 10.4 Fase 4: Feature Manifest (Sprint 2)

| Task | Descrizione | Libreria/Tool |
|:----:|-------------|---------------|
| ☐ | Creare script `scripts/bdd/extract-scenarios.js` | `@cucumber/gherkin` |
| ☐ | Creare script `scripts/release/manifest.js` | - |
| ☐ | Definire `schemas/feature.schema.json` | `ajv` |
| ☐ | Implementare algoritmo matching commit↔BDD | - |
| ☐ | Aggiungere npm script `release:manifest` | - |

### 10.5 Fase 5: CI/CD Integration (Sprint 3)

| Task | Descrizione | Libreria/Tool |
|:----:|-------------|---------------|
| ☐ | Creare `.github/workflows/release.yml` | GitHub Actions |
| ☐ | Configurare trigger su merge to main | - |
| ☐ | Aggiungere preview in PR | - |
| ☐ | Configurare GitHub Release automatico | - |
| ☐ | Testare pipeline end-to-end | - |

---

## Diagramma Riassuntivo Finale

```mermaid
flowchart TB
    subgraph DEVELOPER["👩‍💻 Developer Workflow"]
        CODE["Scrivi codice"]
        TEST["Test (TDD)"]
        COMMIT["git commit\n(conventional)"]
        PUSH["git push"]
    end
    
    subgraph AUTOMATION["🤖 Automation"]
        HOOKS["Husky Hooks\n(pre-commit, commit-msg)"]
        CI_CHECK["CI Checks\n(lint, test, build)"]
        RELEASE_ANALYZE["Release Analyzer"]
    end
    
    subgraph ARTIFACTS["📦 Generated Artifacts"]
        VERSION["package.json\n(nuova versione)"]
        CHANGELOG["CHANGELOG.md"]
        MANIFEST["feature.json"]
        TAG["Git Tag\nvX.Y.Z"]
    end
    
    CODE --> TEST
    TEST --> COMMIT
    COMMIT --> HOOKS
    HOOKS -->|"✅"| PUSH
    PUSH --> CI_CHECK
    
    CI_CHECK -->|"merge to main"| RELEASE_ANALYZE
    
    RELEASE_ANALYZE --> VERSION
    RELEASE_ANALYZE --> CHANGELOG
    RELEASE_ANALYZE --> MANIFEST
    VERSION --> TAG
    
    style AUTOMATION fill:#e3f2fd
    style ARTIFACTS fill:#e8f5e9
```

---

## Riferimenti

| Risorsa | URL/Path |
|---------|----------|
| Conventional Commits | https://www.conventionalcommits.org/ |
| Semantic Versioning | https://semver.org/ |
| npm Workspaces | https://docs.npmjs.com/cli/using-npm/workspaces |
| Gherkin Reference | https://cucumber.io/docs/gherkin/reference/ |
| Guide Progetto | `docs/guides/DEVELOPMENT_PRATICAL_GUIDE.md` |
| Roadmap BDD Tasks | `ROADMAP.md` → Story 2.2 |

---

**Creato**: 2025-12-13  
**Autore**: AI Assistant  
**Stato**: Draft per revisione  
**Prossima revisione**: Fine Sprint 2

# Sviluppo Guidato da Acceptance Criteria: BDD + TDD Incrementale

> **La Regola Zero applicata ai requisiti**: Prima di scrivere un test, chiediti: "Questo acceptance
> criterion è veramente necessario? Risolve un problema reale dell'utente? Posso validarlo con il
> cliente prima di implementarlo?"

---

## Indice

1. [La Filosofia: Dal Task al Codice Funzionante](#la-filosofia-dal-task-al-codice-funzionante)
2. [Acceptance Criteria: Il Contratto con il Cliente](#acceptance-criteria-il-contratto-con-il-cliente)
3. [BDD: Behavior-Driven Development con Gherkin](#bdd-behavior-driven-development-con-gherkin)
4. [Feature Files: La Documentazione Vivente](#feature-files-la-documentazione-vivente)
5. [TDD Incrementale: Dal Test Rosso al Verde](#tdd-incrementale-dal-test-rosso-al-verde)
6. [Il Workflow Completo: Task → AC → BDD → TDD → Deploy](#il-workflow-completo-task--ac--bdd--tdd--deploy)
7. [Checklist per Task Atomico](#checklist-per-task-atomico)
8. [Integrazione con Platformatic Watt](#integrazione-con-platformatic-watt)

---

## La Filosofia: Dal Task al Codice Funzionante

### Il Problema che Risolviamo

Troppo spesso lo sviluppo software segue questo anti-pattern: il cliente descrive vagamente cosa
vuole, lo sviluppatore interpreta a modo suo, implementa per settimane, mostra il risultato, e il
cliente dice "non è quello che intendevo". Questo ciclo di incomprensione costa tempo, denaro, e
frustrazione.

Il **Development Driven by Acceptance Criteria** ribalta questo approccio: prima di scrivere una
singola riga di codice, definiamo insieme al cliente cosa significa "fatto". Gli acceptance criteria
diventano test automatizzati che il cliente può vedere, capire, e validare. Quando tutti i test
passano, la feature è completa per definizione.

### La Catena di Trasformazione

```
┌─────────────────┐
│   USER STORY    │  "Come medico, voglio firmare digitalmente
│   (Il Cosa)     │   un documento per certificarne l'autenticità"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ACCEPTANCE    │  Criterio 1: Il documento deve mostrare chi ha firmato
│   CRITERIA      │  Criterio 2: La firma deve avere un timestamp
│   (Il Quando)   │  Criterio 3: Il documento firmato non può essere modificato
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FEATURE FILE  │  Feature: Firma Digitale Documenti
│   (Gherkin)     │  Scenario: Firma con certificato valido
│                 │  Given un documento non firmato
│                 │  When il medico firma con il suo certificato
│                 │  Then il documento mostra la firma del medico
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   STEP          │  Given('un documento non firmato', async () => {
│   DEFINITIONS   │    document = await createUnsignedDocument();
│   (Codice)      │  });
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   UNIT TESTS    │  describe('SignatureService', () => {
│   (TDD)         │    it('should add signer info to document', ...);
│                 │    it('should add timestamp', ...);
│                 │  });
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IMPLEMENTAZIONE│  Il codice che fa passare tutti i test
│   (Il Come)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   VALIDAZIONE   │  Il cliente esegue i test E2E e vede
│   CLIENTE       │  tutti gli scenari passare ✓
└─────────────────┘
```

---

## Acceptance Criteria: Il Contratto con il Cliente

### Cosa Sono gli Acceptance Criteria

Gli acceptance criteria (AC) sono condizioni specifiche e misurabili che una feature deve soddisfare
per essere considerata completa. Non sono descrizioni vaghe ma **affermazioni verificabili** che
possono essere tradotte direttamente in test.

### Il Formato Given-When-Then

Il formato più efficace per scrivere AC è il pattern **Given-When-Then** (GWT), che descrive il
contesto iniziale, l'azione da compiere, e il risultato atteso.

**Esempio: Feature di Firma Digitale**

```
User Story:
Come medico chirurgo
Voglio firmare digitalmente i documenti operatori
Per certificare l'autenticità e la mia responsabilità professionale

Acceptance Criteria:

AC1: Firma con certificato valido
  Given: Un documento operatorio in stato "da firmare"
  And: Un medico autenticato con certificato digitale valido
  When: Il medico richiede la firma del documento
  Then: Il documento viene firmato con successo
  And: Il documento mostra nome e cognome del firmatario
  And: Il documento mostra il timestamp della firma
  And: Lo stato del documento diventa "firmato"

AC2: Rifiuto firma con certificato scaduto
  Given: Un documento operatorio in stato "da firmare"
  And: Un medico con certificato digitale scaduto
  When: Il medico tenta di firmare il documento
  Then: La firma viene rifiutata
  And: Viene mostrato l'errore "Certificato scaduto"
  And: Il documento rimane in stato "da firmare"

AC3: Immutabilità documento firmato
  Given: Un documento operatorio già firmato
  When: Qualcuno tenta di modificare il contenuto
  Then: La modifica viene bloccata
  And: Viene mostrato l'errore "Documento firmato non modificabile"

AC4: Catena di firme multiple
  Given: Un documento che richiede firma di chirurgo e anestesista
  And: Il chirurgo ha già firmato
  When: L'anestesista firma il documento
  Then: Il documento mostra entrambe le firme in ordine cronologico
  And: Lo stato diventa "completamente firmato"
```

### Regole per Scrivere Buoni AC

**Specifici e Misurabili**: "Il sistema deve essere veloce" non è un AC. "Il tempo di risposta deve
essere inferiore a 200ms" lo è.

**Indipendenti**: Ogni AC deve poter essere testato isolatamente. Se AC2 dipende da AC1, c'è un
problema di design.

**Testabili Automaticamente**: Se non puoi scrivere un test automatico per un AC, riscrivilo finché
non ci riesci.

**Comprensibili dal Cliente**: Un AC scritto in linguaggio tecnico che il cliente non capisce non
serve a nulla. Deve poterlo leggere e dire "sì, questo è quello che voglio".

**Completi ma Minimali**: Copri tutti i casi importanti ma non aggiungere AC "per sicurezza". Ogni
AC ha un costo di implementazione e manutenzione.

---

## BDD: Behavior-Driven Development con Gherkin

### Cos'è il BDD

Il Behavior-Driven Development è un'evoluzione del TDD che sposta il focus da "testare il codice" a
"specificare il comportamento". Il BDD usa un linguaggio naturale strutturato (Gherkin) che può
essere letto da tutti gli stakeholder ma eseguito come test automatico.

### Il Linguaggio Gherkin

Gherkin è un linguaggio domain-specific per scrivere specifiche eseguibili. Le keyword principali
sono **Feature** (la funzionalità che stai descrivendo), **Scenario** (un caso d'uso specifico),
**Given** (il contesto iniziale), **When** (l'azione), **Then** (il risultato atteso), **And/But**
(per concatenare step), e **Background** (setup comune a tutti gli scenari).

### Struttura di un Feature File

```gherkin
# language: it
# encoding: UTF-8

@firma-digitale @critico
Feature: Firma Digitale Documenti Operatori
  Come medico chirurgo
  Voglio firmare digitalmente i documenti operatori
  Per certificare l'autenticità e garantire la tracciabilità legale

  Background:
    Given il sistema di firma digitale è operativo
    And esiste un documento operatorio "DOC-2024-001"

  @happy-path @smoke
  Scenario: Firma documento con certificato valido
    Given il documento "DOC-2024-001" è in stato "da_firmare"
    And il medico "Dr. Mario Rossi" è autenticato
    And il medico ha un certificato digitale valido fino al "2025-12-31"
    When il medico richiede la firma del documento "DOC-2024-001"
    Then la firma viene applicata con successo
    And il documento mostra il firmatario "Dr. Mario Rossi"
    And il documento mostra il timestamp della firma
    And lo stato del documento diventa "firmato"

  @error-handling
  Scenario: Rifiuto firma con certificato scaduto
    Given il documento "DOC-2024-001" è in stato "da_firmare"
    And il medico "Dr. Luigi Bianchi" è autenticato
    And il medico ha un certificato digitale scaduto il "2023-06-15"
    When il medico tenta di firmare il documento "DOC-2024-001"
    Then la firma viene rifiutata
    And viene mostrato l'errore "CERT_EXPIRED: Il certificato è scaduto"
    And lo stato del documento rimane "da_firmare"
    And viene registrato un evento di audit "FIRMA_RIFIUTATA"

  @security @immutability
  Scenario: Blocco modifica documento firmato
    Given il documento "DOC-2024-001" è in stato "firmato"
    And il documento è stato firmato da "Dr. Mario Rossi"
    When qualcuno tenta di modificare il campo "diagnosi"
    Then la modifica viene bloccata
    And viene mostrato l'errore "DOC_LOCKED: Documento firmato non modificabile"
    And viene registrato un evento di audit "MODIFICA_BLOCCATA"

  @multi-signature
  Scenario Outline: Catena di firme multiple
    Given il documento "DOC-2024-001" richiede <num_firme> firme
    And il documento ha già <firme_esistenti> firme
    When il medico "<firmatario>" firma il documento
    Then il documento ha <firme_totali> firme
    And lo stato del documento è "<stato_finale>"

    Examples:
      | num_firme | firme_esistenti | firmatario      | firme_totali | stato_finale           |
      | 2         | 0               | Dr. Rossi       | 1            | parzialmente_firmato   |
      | 2         | 1               | Dr. Bianchi     | 2            | completamente_firmato  |
      | 3         | 2               | Dr. Verdi       | 3            | completamente_firmato  |

  @edge-case @concurrent
  Scenario: Gestione firma concorrente
    Given il documento "DOC-2024-001" è in stato "da_firmare"
    And il medico "Dr. Rossi" ha iniziato la procedura di firma
    When il medico "Dr. Bianchi" tenta di firmare contemporaneamente
    Then viene mostrato l'errore "DOC_LOCKED: Documento in fase di firma"
    And la firma di "Dr. Rossi" procede normalmente
```

### Tag per Organizzare i Test

I tag (@smoke, @critico, @security) permettono di eseguire subset di test. Questo è fondamentale per
la CI/CD dove vuoi test veloci sui commit e test completi prima del deploy.

```bash
# Esegui solo test critici (smoke test)
npx cucumber-js --tags "@smoke"

# Esegui test di sicurezza
npx cucumber-js --tags "@security"

# Esegui tutto tranne test lenti
npx cucumber-js --tags "not @slow"

# Combinazioni
npx cucumber-js --tags "@firma-digitale and @happy-path"
```

---

## Feature Files: La Documentazione Vivente

### Struttura delle Directory

```
project/
├── features/
│   ├── support/
│   │   ├── world.ts           # Contesto condiviso tra step
│   │   ├── hooks.ts           # Before/After per setup/teardown
│   │   └── env.ts             # Configurazione ambiente
│   │
│   ├── step_definitions/
│   │   ├── common.steps.ts    # Step riusabili (Given il sistema è operativo)
│   │   ├── auth.steps.ts      # Step di autenticazione
│   │   ├── document.steps.ts  # Step per documenti
│   │   └── signature.steps.ts # Step per firma digitale
│   │
│   ├── firma-digitale/
│   │   ├── firma-documento.feature
│   │   ├── verifica-firma.feature
│   │   └── catena-firme.feature
│   │
│   ├── cartella-clinica/
│   │   ├── creazione-cartella.feature
│   │   └── aggiornamento-cartella.feature
│   │
│   └── cucumber.json          # Report generato (per il cliente)
│
├── cucumber.js                # Configurazione Cucumber
└── package.json
```

### Configurazione Cucumber

```javascript
// cucumber.js
module.exports = {
  default: {
    // Percorsi
    paths: ['features/**/*.feature'],
    require: ['features/step_definitions/**/*.ts', 'features/support/**/*.ts'],

    // TypeScript support
    requireModule: ['ts-node/register'],

    // Report multipli
    format: [
      'progress-bar', // Console durante esecuzione
      'json:features/cucumber.json', // JSON per il cliente
      'html:features/cucumber-report.html', // HTML leggibile
      'junit:features/cucumber-junit.xml', // Per CI/CD
    ],

    // Configurazione
    parallel: 2, // Test paralleli
    retry: 1, // Retry per test flaky
    retryTagFilter: '@flaky', // Solo test marcati flaky

    // Tags di default (escludi WIP)
    tags: 'not @wip and not @manual',
  },

  // Profilo per CI
  ci: {
    parallel: 4,
    format: ['json:features/cucumber.json'],
    tags: 'not @manual',
  },

  // Profilo per smoke test veloci
  smoke: {
    tags: '@smoke',
    parallel: 1,
  },
};
```

### Step Definitions: Il Ponte tra Gherkin e Codice

```typescript
// features/step_definitions/signature.steps.ts
import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from 'chai';
import { World } from '../support/world';

// Contesto condiviso tra step
declare module '@cucumber/cucumber' {
  interface World {
    currentDocument: Document | null;
    currentUser: User | null;
    lastError: Error | null;
    signatureService: SignatureService;
    documentService: DocumentService;
    auditService: AuditService;
  }
}

// Setup prima di ogni scenario
Before(async function (this: World) {
  this.signatureService = new SignatureService();
  this.documentService = new DocumentService();
  this.auditService = new AuditService();
  this.lastError = null;
});

// Cleanup dopo ogni scenario
After(async function (this: World) {
  // Rollback transazioni, cleanup test data
  await this.documentService.cleanup();
});

// GIVEN STEPS

Given(
  'il documento {string} è in stato {string}',
  async function (this: World, docId: string, stato: string) {
    this.currentDocument = await this.documentService.findById(docId);
    expect(this.currentDocument).to.not.be.null;
    expect(this.currentDocument!.stato).to.equal(stato);
  }
);

Given('il medico {string} è autenticato', async function (this: World, nomeMedico: string) {
  this.currentUser = await this.authService.authenticateByName(nomeMedico);
  expect(this.currentUser).to.not.be.null;
  expect(this.currentUser!.ruolo).to.equal('medico');
});

Given(
  'il medico ha un certificato digitale valido fino al {string}',
  async function (this: World, dataScadenza: string) {
    const cert = await this.currentUser!.getCertificato();
    expect(cert.scadenza).to.be.greaterThan(new Date(dataScadenza));
  }
);

Given(
  'il medico ha un certificato digitale scaduto il {string}',
  async function (this: World, dataScadenza: string) {
    // Per test, creiamo un certificato mock scaduto
    await this.currentUser!.setCertificatoScaduto(new Date(dataScadenza));
  }
);

// WHEN STEPS

When(
  'il medico richiede la firma del documento {string}',
  async function (this: World, docId: string) {
    try {
      this.currentDocument = await this.signatureService.sign(
        docId,
        this.currentUser!.id,
        this.currentUser!.certificato
      );
    } catch (error) {
      this.lastError = error as Error;
    }
  }
);

When(
  'il medico tenta di firmare il documento {string}',
  async function (this: World, docId: string) {
    // "tenta" implica che ci aspettiamo un fallimento
    try {
      await this.signatureService.sign(docId, this.currentUser!.id, this.currentUser!.certificato);
    } catch (error) {
      this.lastError = error as Error;
    }
  }
);

When('qualcuno tenta di modificare il campo {string}', async function (this: World, campo: string) {
  try {
    await this.documentService.updateField(this.currentDocument!.id, campo, 'nuovo valore');
  } catch (error) {
    this.lastError = error as Error;
  }
});

// THEN STEPS

Then('la firma viene applicata con successo', function (this: World) {
  expect(this.lastError).to.be.null;
  expect(this.currentDocument!.firme).to.have.length.greaterThan(0);
});

Then('la firma viene rifiutata', function (this: World) {
  expect(this.lastError).to.not.be.null;
});

Then('il documento mostra il firmatario {string}', function (this: World, nomeFirmatario: string) {
  const ultimaFirma = this.currentDocument!.firme.at(-1);
  expect(ultimaFirma?.firmatario.nome).to.equal(nomeFirmatario);
});

Then('il documento mostra il timestamp della firma', function (this: World) {
  const ultimaFirma = this.currentDocument!.firme.at(-1);
  expect(ultimaFirma?.timestamp).to.be.instanceOf(Date);
  // Il timestamp deve essere recente (ultimi 5 secondi)
  const now = new Date();
  const diff = now.getTime() - ultimaFirma!.timestamp.getTime();
  expect(diff).to.be.lessThan(5000);
});

Then('lo stato del documento diventa {string}', async function (this: World, statoAtteso: string) {
  // Ricarica il documento per verificare lo stato persistito
  const doc = await this.documentService.findById(this.currentDocument!.id);
  expect(doc!.stato).to.equal(statoAtteso);
});

Then("viene mostrato l'errore {string}", function (this: World, messaggioErrore: string) {
  expect(this.lastError).to.not.be.null;
  expect(this.lastError!.message).to.include(messaggioErrore);
});

Then(
  'viene registrato un evento di audit {string}',
  async function (this: World, tipoEvento: string) {
    const eventi = await this.auditService.getEventiRecenti(
      this.currentDocument!.id,
      1 // ultimo evento
    );
    expect(eventi[0].tipo).to.equal(tipoEvento);
  }
);
```

### Il Report JSON per il Cliente

Cucumber genera un file `cucumber.json` che può essere trasformato in report leggibili. Questo file
è la **prova tangibile** che tutti gli acceptance criteria sono soddisfatti.

```json
[
  {
    "keyword": "Feature",
    "name": "Firma Digitale Documenti Operatori",
    "description": "Come medico chirurgo...",
    "elements": [
      {
        "keyword": "Scenario",
        "name": "Firma documento con certificato valido",
        "tags": [{ "name": "@happy-path" }, { "name": "@smoke" }],
        "steps": [
          {
            "keyword": "Given",
            "name": "il documento \"DOC-2024-001\" è in stato \"da_firmare\"",
            "result": {
              "status": "passed",
              "duration": 1234567
            }
          }
          // ... altri step
        ]
      }
    ]
  }
]
```

### Generare Report HTML per il Cliente

```bash
# Installa il reporter
npm install --save-dev cucumber-html-reporter

# Script per generare report
node generate-report.js
```

```javascript
// generate-report.js
const reporter = require('cucumber-html-reporter');

const options = {
  theme: 'bootstrap',
  jsonFile: 'features/cucumber.json',
  output: 'features/report/cucumber-report.html',
  reportSuiteAsScenarios: true,
  scenarioTimestamp: true,
  launchReport: false,
  metadata: {
    'App Version': '1.0.0',
    'Test Environment': 'Staging',
    Browser: 'Chrome 120',
    Platform: 'Linux',
    Executed: new Date().toISOString(),
  },
};

reporter.generate(options);
```

---

## TDD Incrementale: Dal Test Rosso al Verde

### Il Ciclo Red-Green-Refactor

Una volta che hai i test E2E che definiscono il comportamento esterno, scendi a livello di unit test
con TDD classico.

```
┌─────────────────────────────────────────────────────────┐
│                    CICLO TDD                            │
│                                                         │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐         │
│   │  RED    │────▶│  GREEN  │────▶│REFACTOR │         │
│   │         │     │         │     │         │         │
│   │ Scrivi  │     │ Scrivi  │     │ Migliora│         │
│   │ un test │     │ codice  │     │ codice  │         │
│   │ che     │     │ minimo  │     │ senza   │         │
│   │ fallisce│     │ per far │     │ cambiare│         │
│   │         │     │ passare │     │ comporta│         │
│   │         │     │ il test │     │ mento   │         │
│   └─────────┘     └─────────┘     └─────────┘         │
│        ▲                               │               │
│        └───────────────────────────────┘               │
│              Ripeti per ogni behavior                  │
└─────────────────────────────────────────────────────────┘
```

### Esempio: Implementare SignatureService con TDD

Partiamo dall'AC1: "La firma deve mostrare chi ha firmato e il timestamp."

**Step 1: RED - Scrivi il test che fallisce**

```typescript
// src/services/__tests__/signature.service.spec.ts
import { SignatureService } from '../signature.service';
import { Document, User, Certificate } from '../../domain';

describe('SignatureService', () => {
  let service: SignatureService;
  let mockDocument: Document;
  let mockUser: User;
  let mockCertificate: Certificate;

  beforeEach(() => {
    service = new SignatureService();
    mockDocument = createMockDocument({ stato: 'da_firmare' });
    mockUser = createMockUser({ nome: 'Dr. Mario Rossi' });
    mockCertificate = createMockCertificate({
      scadenza: new Date('2025-12-31'),
    });
  });

  describe('sign()', () => {
    it('should add signer information to document', async () => {
      // Arrange - già fatto nel beforeEach

      // Act
      const signedDoc = await service.sign(mockDocument, mockUser, mockCertificate);

      // Assert
      expect(signedDoc.firme).toHaveLength(1);
      expect(signedDoc.firme[0].firmatario.nome).toBe('Dr. Mario Rossi');
    });
  });
});
```

**Step 2: GREEN - Scrivi il codice minimo**

```typescript
// src/services/signature.service.ts
export class SignatureService {
  async sign(document: Document, user: User, certificate: Certificate): Promise<Document> {
    const firma: Firma = {
      firmatario: {
        id: user.id,
        nome: user.nome,
      },
      timestamp: new Date(),
      certificatoId: certificate.id,
    };

    document.firme.push(firma);
    return document;
  }
}
```

**Step 3: RED - Aggiungi il prossimo test**

```typescript
it('should add timestamp to signature', async () => {
  const before = new Date();

  const signedDoc = await service.sign(mockDocument, mockUser, mockCertificate);

  const after = new Date();

  expect(signedDoc.firme[0].timestamp).toBeInstanceOf(Date);
  expect(signedDoc.firme[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
  expect(signedDoc.firme[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
});
```

Il test passa già perché abbiamo aggiunto il timestamp. Questo ci dice che stiamo procedendo bene.

**Step 4: RED - Test per validazione certificato**

```typescript
it('should reject signature with expired certificate', async () => {
  const expiredCertificate = createMockCertificate({
    scadenza: new Date('2020-01-01'), // Scaduto
  });

  await expect(service.sign(mockDocument, mockUser, expiredCertificate)).rejects.toThrow(
    'CERT_EXPIRED'
  );
});
```

**Step 5: GREEN - Aggiungi validazione**

```typescript
export class SignatureService {
  async sign(document: Document, user: User, certificate: Certificate): Promise<Document> {
    // Validazione certificato
    if (certificate.scadenza < new Date()) {
      throw new SignatureError('CERT_EXPIRED', 'Il certificato è scaduto');
    }

    const firma: Firma = {
      firmatario: {
        id: user.id,
        nome: user.nome,
      },
      timestamp: new Date(),
      certificatoId: certificate.id,
    };

    document.firme.push(firma);
    return document;
  }
}
```

**Step 6: REFACTOR - Estrai la validazione**

```typescript
export class SignatureService {
  async sign(document: Document, user: User, certificate: Certificate): Promise<Document> {
    this.validateCertificate(certificate);
    this.validateDocument(document);

    const firma = this.createFirma(user, certificate);
    document.addFirma(firma);

    return document;
  }

  private validateCertificate(certificate: Certificate): void {
    if (certificate.isExpired()) {
      throw new SignatureError('CERT_EXPIRED', 'Il certificato è scaduto');
    }
    if (certificate.isRevoked()) {
      throw new SignatureError('CERT_REVOKED', 'Il certificato è stato revocato');
    }
  }

  private validateDocument(document: Document): void {
    if (document.isLocked()) {
      throw new SignatureError('DOC_LOCKED', 'Documento già firmato');
    }
  }

  private createFirma(user: User, certificate: Certificate): Firma {
    return {
      firmatario: user.toFirmatario(),
      timestamp: new Date(),
      certificatoId: certificate.id,
    };
  }
}
```

---

## Il Workflow Completo: Task → AC → BDD → TDD → Deploy

### Fase 1: Analisi del Task

```
┌─────────────────────────────────────────────────────────────────┐
│ TASK: Implementare firma digitale documenti operatori           │
├─────────────────────────────────────────────────────────────────┤
│ Priorità: Alta                                                  │
│ Stima: 5 story points                                           │
│ Sprint: 12                                                       │
├─────────────────────────────────────────────────────────────────┤
│ User Story:                                                     │
│ Come medico chirurgo                                            │
│ Voglio firmare digitalmente i documenti operatori               │
│ Per certificare l'autenticità e la tracciabilità legale        │
├─────────────────────────────────────────────────────────────────┤
│ Acceptance Criteria:                                            │
│ AC1: Firma con certificato valido → documento firmato           │
│ AC2: Certificato scaduto → firma rifiutata                     │
│ AC3: Documento firmato → immutabile                             │
│ AC4: Firme multiple → catena di firme                           │
├─────────────────────────────────────────────────────────────────┤
│ Definition of Done:                                             │
│ ☐ Feature file scritto e validato con PO                        │
│ ☐ Step definitions implementati                                 │
│ ☐ Unit test con copertura > 80%                                 │
│ ☐ Codice revisito (code review)                                │
│ ☐ Test E2E passano in CI                                        │
│ ☐ Documentazione API aggiornata                                 │
│ ☐ Demo al cliente                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Fase 2: Scomposizione in Sub-Task Atomici

```
Task: Implementare firma digitale (5 SP)
│
├── Sub-task 1: Setup infrastruttura test (0.5 SP)
│   ├── ☐ Creare directory features/firma-digitale/
│   ├── ☐ Configurare cucumber.js
│   ├── ☐ Creare world.ts con contesto condiviso
│   └── ☐ Creare hooks.ts per setup/teardown
│
├── Sub-task 2: Feature file AC1 - Firma valida (1 SP)
│   ├── ☐ Scrivere scenario Gherkin
│   ├── ☐ Validare con PO
│   ├── ☐ Implementare step definitions
│   └── ☐ Verificare test fallisce (Red)
│
├── Sub-task 3: Implementare SignatureService (1.5 SP)
│   ├── ☐ TDD: test validazione certificato
│   ├── ☐ TDD: test creazione firma
│   ├── ☐ TDD: test aggiornamento stato documento
│   └── ☐ Refactor ed estrazione interfacce
│
├── Sub-task 4: Feature file AC2 - Certificato scaduto (0.5 SP)
│   ├── ☐ Scrivere scenario Gherkin
│   ├── ☐ Implementare step definitions
│   └── ☐ Verificare test passa (Green)
│
├── Sub-task 5: Feature file AC3 - Immutabilità (0.5 SP)
│   ├── ☐ Scrivere scenario Gherkin
│   ├── ☐ TDD: test blocco modifica
│   └── ☐ Implementare guard nel DocumentService
│
├── Sub-task 6: Feature file AC4 - Firme multiple (1 SP)
│   ├── ☐ Scrivere Scenario Outline
│   ├── ☐ TDD: test catena firme
│   └── ☐ Implementare logica firme multiple
│
└── Sub-task 7: Finalizzazione (0 SP - cleanup)
    ├── ☐ Code review
    ├── ☐ Generare report per cliente
    └── ☐ Demo
```

### Fase 3: Esecuzione con Timebox

Ogni sub-task ha un timebox massimo. Se superi il timebox, fermati e rivaluta.

```
Sub-task 3: Implementare SignatureService
Timebox: 4 ore

Ora 0-1: TDD validazione certificato
  - Test: certificato scaduto → errore ✓
  - Test: certificato revocato → errore ✓
  - Test: certificato valido → procedi ✓

Ora 1-2: TDD creazione firma
  - Test: firma contiene nome firmatario ✓
  - Test: firma contiene timestamp ✓
  - Test: firma collegata a certificato ✓

Ora 2-3: TDD aggiornamento stato
  - Test: stato diventa "firmato" ✓
  - Test: audit log creato ✓

Ora 3-4: Refactor
  - Estrai CertificateValidator ✓
  - Estrai FirmaFactory ✓
  - Verifica tutti i test passano ✓

⏱️ Completato in 3h 45m - Timebox rispettato
```

### Fase 4: Validazione con il Cliente

```bash
# Esegui i test E2E
npm run test:e2e

# Genera report HTML
npm run report:generate

# Il report mostra:
# ✓ Feature: Firma Digitale Documenti Operatori
#   ✓ Scenario: Firma documento con certificato valido
#   ✓ Scenario: Rifiuto firma con certificato scaduto
#   ✓ Scenario: Blocco modifica documento firmato
#   ✓ Scenario Outline: Catena di firme multiple (3 examples)
#
# 6 scenarios (6 passed)
# 24 steps (24 passed)
# 0m12.345s
```

Il cliente può vedere il report HTML, capire esattamente cosa è stato implementato, e validare che
corrisponda alle sue aspettative.

---

## Checklist per Task Atomico

Prima di iniziare qualsiasi sub-task, passa attraverso questa checklist.

### Pre-Implementazione

```
☐ COMPRENSIONE
  ☐ Ho capito chiaramente cosa devo fare?
  ☐ Posso spiegarlo in una frase semplice?
  ☐ Ho identificato input, output, e side effects?

☐ NECESSITÀ (Regola Zero)
  ☐ Questo sub-task è veramente necessario?
  ☐ Contribuisce direttamente a un AC?
  ☐ Qual è il valore aggiunto per l'utente finale?

☐ ALTERNATIVE
  ☐ Esiste già qualcosa che posso riusare?
  ☐ C'è un approccio più semplice?
  ☐ Posso rimandare senza impattare il deliverable?

☐ SCOPE
  ☐ Il sub-task è abbastanza piccolo da completare in max 4 ore?
  ☐ È abbastanza grande da produrre valore tangibile?
  ☐ È indipendente dagli altri sub-task?
```

### Durante l'Implementazione

```
☐ BDD/TDD
  ☐ Ho scritto il feature file / test PRIMA del codice?
  ☐ Il test fallisce per la ragione giusta?
  ☐ Sto scrivendo il codice MINIMO per far passare il test?

☐ INCREMENTALITÀ
  ☐ Posso fare commit di questo pezzo isolatamente?
  ☐ Se interrompo ora, il sistema resta funzionante?
  ☐ Ho fatto commit frequenti (ogni 15-30 minuti)?

☐ QUALITÀ
  ☐ I nomi delle variabili/funzioni comunicano l'intento?
  ☐ Ho gestito i casi di errore?
  ☐ Il codice è leggibile senza commenti?
```

### Post-Implementazione

```
☐ VERIFICA
  ☐ Tutti i test passano (unit + E2E)?
  ☐ Non ho rotto test esistenti?
  ☐ La coverage è accettabile (>80%)?

☐ REFACTOR
  ☐ C'è duplicazione da eliminare?
  ☐ Posso semplificare qualcosa?
  ☐ I test sono ancora verdi dopo il refactor?

☐ DOCUMENTAZIONE
  ☐ Il feature file è aggiornato?
  ☐ Servono note per i colleghi?
  ☐ La documentazione API è aggiornata (se applicabile)?

☐ DEPLOY-READY
  ☐ Il codice può andare in produzione così com'è?
  ☐ Non dipende da altri task non completati?
  ☐ Ho aggiornato il task tracker?
```

---

## Integrazione con Platformatic Watt

### Struttura di un Progetto Watt con BDD

```
watt-healthcare/
├── watt.json
├── package.json
├── cucumber.js                    # Config Cucumber globale
│
├── features/                      # Test E2E BDD (globali)
│   ├── support/
│   │   ├── world.ts
│   │   └── hooks.ts
│   ├── step_definitions/
│   │   └── *.steps.ts
│   ├── firma-digitale/
│   │   └── *.feature
│   └── cucumber.json              # Report per il cliente
│
└── web/
    ├── gateway/
    │
    ├── api-core/                  # NestJS backend
    │   ├── src/
    │   │   ├── domain/
    │   │   │   └── signature/
    │   │   │       ├── signature.service.ts
    │   │   │       └── __tests__/
    │   │   │           └── signature.service.spec.ts  # Unit tests TDD
    │   │   └── ...
    │   └── package.json
    │
    ├── platformatic-db/           # Database service
    │   └── ...
    │
    └── frontend/
        └── ...
```

### Script npm per il Workflow Completo

```json
{
  "scripts": {
    "test:unit": "jest --coverage",
    "test:unit:watch": "jest --watch",

    "test:e2e": "cucumber-js",
    "test:e2e:smoke": "cucumber-js --profile smoke",
    "test:e2e:ci": "cucumber-js --profile ci",

    "test:all": "npm run test:unit && npm run test:e2e",

    "report:generate": "node scripts/generate-cucumber-report.js",
    "report:open": "open features/report/cucumber-report.html",

    "validate": "npm run lint && npm run test:all && npm run report:generate",

    "dev": "wattpm dev",
    "build": "wattpm build",
    "start": "wattpm start"
  }
}
```

### CI/CD Pipeline con BDD

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:unit

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      # Avvia Watt in background
      - name: Start Watt
        run: npm run start &
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test

      # Attendi che sia pronto
      - name: Wait for Watt
        run: npx wait-on http://localhost:3042/health

      # Esegui test E2E
      - run: npm run test:e2e:ci

      # Genera e salva report
      - run: npm run report:generate

      - name: Upload BDD Report
        uses: actions/upload-artifact@v3
        with:
          name: cucumber-report
          path: features/report/
        if: always()

  notify-client:
    runs-on: ubuntu-latest
    needs: e2e-tests
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Download report
        uses: actions/download-artifact@v3
        with:
          name: cucumber-report

      # Notifica il cliente (Slack, email, etc.)
      - name: Notify
        run: |
          echo "BDD Report disponibile: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

---

## Conclusione: La Disciplina che Libera

Il workflow AC → BDD → TDD può sembrare burocratico all'inizio. "Perché devo scrivere tutti questi
test prima del codice?" Ma questa disciplina porta a una libertà profonda: la libertà di modificare
il codice con confidenza, la libertà di dire al cliente "è fatto" e saperlo con certezza, la libertà
di andare in vacanza senza paura che qualcuno rompa tutto.

Il feature file diventa il **contratto vivente** tra te e il cliente. Quando tutti gli scenari
passano, non c'è discussione su cosa significa "fatto". Il report HTML è la prova tangibile che ogni
acceptance criterion è soddisfatto.

Il TDD ti libera dalla paura del refactoring. Puoi migliorare il codice sapendo che se rompi
qualcosa, un test te lo dirà immediatamente.

E la checklist per task atomici ti libera dall'ansia del "dove ero rimasto?". Ogni sub-task è
autocontenuto, ogni commit è deployabile, ogni interruzione è gestibile.

Come dice Kent Beck: **"I'm not a great programmer; I'm just a good programmer with great habits."**
Questo workflow è un insieme di abitudini che, praticate con disciplina, trasformano sviluppatori
buoni in sviluppatori eccellenti.

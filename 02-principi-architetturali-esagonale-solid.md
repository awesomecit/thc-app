# Principi Architetturali e Filosofia di Sviluppo con Platformatic Watt

> **La Regola Zero**: Prima di produrre qualsiasi cosa - che sia un file, una funzione, un'interfaccia, un componente, o anche una singola riga di codice - fermati e chiediti: "Mi serve veramente? Perché? Quali sono i pro e i contro? Esistono alternative?"

---

## Indice

1. [La Regola Zero: Il Filtro Decisionale](#la-regola-zero-il-filtro-decisionale)
2. [Architettura Esagonale (Ports & Adapters)](#architettura-esagonale-ports--adapters)
3. [I Principi Fondamentali](#i-principi-fondamentali)
4. [Clean Architecture e Domain-Driven Design](#clean-architecture-e-domain-driven-design)
5. [Twelve-Factor App](#twelve-factor-app)
6. [Extreme Programming e Timebox](#extreme-programming-e-timebox)
7. [Applicare Tutto con Platformatic Watt](#applicare-tutto-con-platformatic-watt)

---

## La Regola Zero: Il Filtro Decisionale

Questa è la regola più importante di tutte, e deve precedere qualsiasi altra considerazione tecnica. Prima di scrivere codice, creare un file, definire un'interfaccia, o aggiungere una dipendenza, devi passare attraverso questo filtro decisionale.

### Il Processo di Validazione

**Domanda 1: Mi serve veramente?**

Non "potrebbe servirmi in futuro" o "sarebbe carino averlo". La domanda è: risolve un problema reale che ho adesso? Se la risposta è "forse" o "probabilmente", la risposta è no.

**Domanda 2: Perché mi serve?**

Devi essere in grado di articolare chiaramente il problema che stai risolvendo. Se non riesci a spiegarlo in una frase semplice, probabilmente non hai capito bene il problema, e quindi non dovresti ancora scrivere la soluzione.

**Domanda 3: Quali sono i pro e i contro?**

Ogni decisione tecnica ha trade-off. Aggiungere un'astrazione aumenta la flessibilità ma anche la complessità. Aggiungere una dipendenza risolve un problema ma ne introduce di nuovi (manutenzione, sicurezza, compatibilità). Sii onesto sui costi, non solo sui benefici.

**Domanda 4: Quali alternative esistono?**

Prima di costruire, cerca se esiste già qualcosa che risolve il problema. Prima di aggiungere un layer, chiediti se puoi risolvere il problema senza aggiungerlo. Prima di creare un'astrazione, chiediti se la duplicazione controllata sarebbe più chiara.

### Applicazione Pratica

Quando stai per creare un nuovo servizio in Watt, chiediti: questo dominio è davvero separato? Ha un ciclo di vita indipendente? O sto creando complessità artificiale?

Quando stai per aggiungere un'interfaccia TypeScript, chiediti: questa astrazione mi sta aiutando a ragionare meglio sul problema? O sto solo aggiungendo burocrazia al codice?

Quando stai per installare una libreria, chiediti: il problema che risolve è abbastanza complesso da giustificare una dipendenza esterna? Potrei risolverlo con 50 righe di codice ben scritto?

### Il Costo dell'Inutile

Ogni riga di codice che scrivi è codice che qualcuno dovrà leggere, capire, mantenere, testare, e potenzialmente debuggare. Ogni astrazione che aggiungi è un concetto in più che i nuovi membri del team dovranno imparare. Ogni dipendenza che installi è un potenziale punto di rottura quando verrà aggiornata o abbandonata.

Il codice migliore è spesso quello che non scrivi.

---

## Architettura Esagonale (Ports & Adapters)

L'architettura esagonale, conosciuta anche come Ports & Adapters, è un pattern architetturale che isola la logica di business dal mondo esterno. Il concetto centrale è che il cuore dell'applicazione (il dominio) non deve sapere nulla di database, HTTP, messaggistica, o qualsiasi altra tecnologia di infrastruttura.

### Il Concetto Fondamentale

Immagina la tua applicazione come un esagono (la forma è arbitraria, serve solo per la visualizzazione). Al centro c'è la logica di business pura. Sui lati dell'esagono ci sono le "porte" (ports), che sono interfacce astratte. Fuori dall'esagono ci sono gli "adattatori" (adapters), che implementano le porte collegandosi al mondo reale.

```
                    ┌─────────────────────────────────────┐
                    │           MONDO ESTERNO             │
                    └─────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────▼─────┐   ┌──────▼──────┐   ┌─────▼─────┐
              │  HTTP     │   │  Database   │   │  Message  │
              │  Adapter  │   │  Adapter    │   │  Queue    │
              └─────┬─────┘   └──────┬──────┘   └─────┬─────┘
                    │                │                │
              ┌─────▼─────┐   ┌──────▼──────┐   ┌─────▼─────┐
              │   Port    │   │    Port     │   │   Port    │
              │ (input)   │   │  (output)   │   │ (output)  │
              └─────┬─────┘   └──────┬──────┘   └─────┬─────┘
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │                                 │
                    │      DOMINIO / BUSINESS LOGIC   │
                    │                                 │
                    │   • Entità                      │
                    │   • Value Objects               │
                    │   • Use Cases                   │
                    │   • Domain Services             │
                    │                                 │
                    └─────────────────────────────────┘
```

### Ports: Le Interfacce del Dominio

Le porte sono interfacce definite dal dominio che descrivono cosa il dominio ha bisogno dal mondo esterno (output ports) o cosa il mondo esterno può chiedere al dominio (input ports).

Le porte di input (o driving ports) rappresentano i casi d'uso dell'applicazione. Sono le operazioni che il mondo esterno può richiedere, come "crea un paziente", "avvia una procedura chirurgica", "firma un documento".

Le porte di output (o driven ports) rappresentano le dipendenze del dominio. Sono le cose di cui il dominio ha bisogno ma che non vuole implementare direttamente, come "salva i dati del paziente", "invia una notifica", "recupera le credenziali".

```typescript
// Port di Input (cosa il mondo può chiedere al dominio)
// Definita dal dominio, implementata dal dominio
interface PatientUseCases {
  createPatient(data: CreatePatientCommand): Promise<Patient>;
  getPatientById(id: PatientId): Promise<Patient | null>;
  updatePatientRecord(id: PatientId, data: UpdatePatientCommand): Promise<Patient>;
}

// Port di Output (cosa il dominio ha bisogno dal mondo)
// Definita dal dominio, implementata dagli adapter
interface PatientRepository {
  save(patient: Patient): Promise<void>;
  findById(id: PatientId): Promise<Patient | null>;
  findByFiscalCode(fiscalCode: string): Promise<Patient | null>;
}

interface AuditLogger {
  logAccess(userId: string, resource: string, action: string): Promise<void>;
}
```

### Adapters: I Connettori al Mondo Reale

Gli adapter sono implementazioni concrete delle porte che collegano il dominio al mondo esterno. Ci sono due tipi di adapter.

Gli adapter primari (o driving adapters) guidano l'applicazione. Chiamano le porte di input. Esempi sono i controller HTTP, i consumer di messaggi, i job schedulati, le CLI.

Gli adapter secondari (o driven adapters) sono guidati dall'applicazione. Implementano le porte di output. Esempi sono i repository per database, i client HTTP per servizi esterni, gli adapter per code di messaggi.

```typescript
// Adapter Primario: Controller HTTP che chiama la porta di input
// web/api/src/adapters/primary/patient.controller.ts
@Controller('patients')
export class PatientController {
  // Inietta la porta di input, non l'implementazione concreta
  constructor(private readonly patientUseCases: PatientUseCases) {}

  @Post()
  async create(@Body() dto: CreatePatientDto) {
    // Il controller si limita a tradurre HTTP -> Dominio
    const command = this.mapToCommand(dto);
    const patient = await this.patientUseCases.createPatient(command);
    return this.mapToResponse(patient);
  }
}

// Adapter Secondario: Repository PostgreSQL che implementa la porta di output
// web/api/src/adapters/secondary/postgres-patient.repository.ts
export class PostgresPatientRepository implements PatientRepository {
  constructor(private readonly db: DatabaseConnection) {}

  async save(patient: Patient): Promise<void> {
    // L'adapter traduce Dominio -> Infrastruttura
    await this.db.query(
      'INSERT INTO patients (id, fiscal_code, ...) VALUES ($1, $2, ...)',
      [patient.id.value, patient.fiscalCode, ...]
    );
  }

  async findById(id: PatientId): Promise<Patient | null> {
    const row = await this.db.query('SELECT * FROM patients WHERE id = $1', [id.value]);
    return row ? this.mapToDomain(row) : null;
  }
}
```

### Perché l'Architettura Esagonale con Watt?

Platformatic Watt si presta naturalmente all'architettura esagonale perché ogni applicazione nel sistema Watt può rappresentare un adapter o un bounded context.

Puoi avere un'applicazione NestJS che contiene tutto il dominio e i casi d'uso. Puoi avere applicazioni Platformatic DB che fungono da adapter per la persistenza, esponendo API CRUD che il dominio consuma. Puoi avere applicazioni dedicate per integrazioni esterne (HL7 adapter, FHIR adapter) che implementano le porte di output verso sistemi esterni.

```
┌─────────────────────────────────────────────────────────────────┐
│                         WATT SERVER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                           ┌─────────────┐     │
│  │   Gateway   │◄──────────────────────────│  Frontend   │     │
│  │  (routing)  │     HTTP Adapter          │  (Next.js)  │     │
│  └──────┬──────┘                           └─────────────┘     │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              api-core (NestJS)                          │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │                    DOMINIO                       │   │   │
│  │  │  Patients, Procedures, Signatures, AuditLog     │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │         │                    │                    │     │   │
│  │    Port │               Port │               Port │     │   │
│  └─────────┼────────────────────┼────────────────────┼─────┘   │
│            │                    │                    │         │
│            ▼                    ▼                    ▼         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │ Platformatic│     │ HL7 Adapter │     │ Audit       │      │
│  │ DB (CRUD)   │     │ (MLLP)      │     │ Service     │      │
│  └─────────────┘     └─────────────┘     └─────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## I Principi Fondamentali

### SOLID

I principi SOLID sono cinque linee guida per scrivere codice orientato agli oggetti che sia mantenibile e estensibile.

**Single Responsibility Principle (SRP)**: Una classe dovrebbe avere una sola ragione per cambiare. Nel contesto Watt, questo si traduce in: ogni applicazione dovrebbe avere una responsabilità chiara. Non mettere la logica di autenticazione, la business logic, e le integrazioni HL7 nella stessa applicazione.

**Open/Closed Principle (OCP)**: Le entità software dovrebbero essere aperte all'estensione ma chiuse alla modifica. Usa le porte dell'architettura esagonale: puoi aggiungere nuovi adapter senza modificare il dominio.

**Liskov Substitution Principle (LSP)**: Gli oggetti di una superclasse dovrebbero essere sostituibili con oggetti delle sottoclassi senza alterare la correttezza del programma. Se definisci un'interfaccia `Repository`, tutte le implementazioni (PostgreSQL, SQLite, in-memory per test) devono comportarsi in modo consistente.

**Interface Segregation Principle (ISP)**: I client non dovrebbero essere forzati a dipendere da interfacce che non usano. Non creare un'interfaccia `PatientService` con 50 metodi. Crea interfacce piccole e specifiche per ogni caso d'uso.

**Dependency Inversion Principle (DIP)**: I moduli di alto livello non dovrebbero dipendere da moduli di basso livello. Entrambi dovrebbero dipendere da astrazioni. Il dominio definisce le porte (astrazioni), gli adapter (dettagli) le implementano.

### DRY (Don't Repeat Yourself)

Il principio DRY afferma che ogni pezzo di conoscenza deve avere una singola, non ambigua, autorevole rappresentazione nel sistema.

Attenzione però: DRY non significa "elimina ogni duplicazione di codice". DRY riguarda la duplicazione di conoscenza, non di caratteri. Due pezzi di codice che sembrano uguali ma rappresentano concetti diversi non violano DRY. Unirli forzatamente crea accoppiamento artificiale.

Nel contesto Watt, DRY si applica così: se due applicazioni hanno bisogno della stessa logica di validazione di un codice fiscale italiano, quella logica dovrebbe vivere in un pacchetto condiviso, non essere copiata. Ma se due applicazioni hanno validazioni che sembrano simili ma hanno regole di business diverse, tienile separate.

### KISS (Keep It Simple, Stupid)

La semplicità è un valore. La complessità ha un costo. Ogni astrazione, ogni layer, ogni indirezione deve guadagnarsi il suo posto nel codice dimostrando che risolve un problema reale meglio dell'alternativa più semplice.

Prima di aggiungere un pattern, chiediti: sto risolvendo un problema che ho davvero, o sto anticipando un problema che potrei avere? Se stai anticipando, probabilmente stai violando YAGNI (vedi sotto) oltre che KISS.

Nel contesto Watt: non creare 10 microservizi se un modular monolith con 3 applicazioni risolve il problema. La granularità giusta dipende dal contesto, non da un ideale teorico.

### YAGNI (You Ain't Gonna Need It)

Non implementare funzionalità finché non ne hai effettivamente bisogno. Non creare astrazioni "per il futuro". Non aggiungere flessibilità "nel caso servisse".

Il futuro è imprevedibile. Le astrazioni che crei oggi per problemi che pensi di avere domani spesso non si adattano ai problemi che effettivamente avrai. E nel frattempo hai pagato il costo di quella complessità.

Nel contesto Watt: non creare un servizio separato per l'audit logging finché non hai requisiti concreti che lo richiedono. Inizia con un modulo nel servizio principale. Estrailo quando (e se) diventa necessario.

---

## Clean Architecture e Domain-Driven Design

### Clean Architecture

La Clean Architecture di Robert Martin organizza il codice in cerchi concentrici dove le dipendenze puntano sempre verso l'interno, verso le policy di più alto livello.

```
┌─────────────────────────────────────────────────────────────┐
│                    FRAMEWORKS & DRIVERS                     │
│  (HTTP, Database, UI, External Services)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              INTERFACE ADAPTERS                      │   │
│  │  (Controllers, Gateways, Presenters)                 │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │           APPLICATION BUSINESS RULES         │    │   │
│  │  │  (Use Cases)                                 │    │   │
│  │  │  ┌─────────────────────────────────────┐    │    │   │
│  │  │  │    ENTERPRISE BUSINESS RULES        │    │    │   │
│  │  │  │    (Entities)                       │    │    │   │
│  │  │  └─────────────────────────────────────┘    │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

La freccia delle dipendenze punta sempre verso il centro ──►
```

Le Entità (al centro) contengono le regole di business più generali, quelle che non cambiano quando cambia qualcosa di esterno. I Casi d'Uso contengono le regole specifiche dell'applicazione, l'orchestrazione delle entità per risolvere problemi specifici. Gli Interface Adapters traducono tra il formato conveniente per i casi d'uso e il formato conveniente per agenti esterni. I Frameworks & Drivers sono i dettagli: il web framework, il database, tutto ciò che è "esterno".

### Domain-Driven Design

Il DDD è un approccio allo sviluppo software che mette il dominio di business al centro di tutto. I concetti chiave sono:

**Bounded Context**: Un confine esplicito all'interno del quale un modello di dominio è definito e applicabile. In Watt, ogni applicazione può rappresentare un bounded context.

**Ubiquitous Language**: Un linguaggio condiviso tra sviluppatori e esperti di dominio. Se nel dominio sanitario si parla di "intervento chirurgico", il codice deve usare `SurgicalIntervention`, non `Operation` o `Procedure`.

**Aggregates**: Cluster di entità e value objects trattati come unità. Un paziente con i suoi contatti e documenti è un aggregato. Le modifiche all'aggregato passano attraverso la root (il paziente).

**Domain Events**: Qualcosa di significativo che è successo nel dominio. `PatientAdmitted`, `ProcedureCompleted`, `DocumentSigned`. Gli eventi permettono comunicazione loose-coupled tra bounded context.

### Struttura delle Directory in un Bounded Context

```
web/api-core/src/
├── domain/                      # Il cuore: nessuna dipendenza esterna
│   ├── patients/
│   │   ├── patient.entity.ts    # Aggregato root
│   │   ├── patient-id.vo.ts     # Value Object
│   │   ├── fiscal-code.vo.ts    # Value Object con validazione
│   │   ├── patient.repository.ts # Port (interfaccia)
│   │   └── patient.events.ts    # Domain Events
│   ├── procedures/
│   │   └── ...
│   └── shared/                  # Value Objects condivisi nel bounded context
│       └── ...
│
├── application/                 # Casi d'uso: orchestrano il dominio
│   ├── patients/
│   │   ├── create-patient.use-case.ts
│   │   ├── get-patient.use-case.ts
│   │   └── update-patient-record.use-case.ts
│   └── procedures/
│       └── ...
│
├── infrastructure/              # Adapter: implementano le port
│   ├── persistence/
│   │   ├── postgres-patient.repository.ts
│   │   └── typeorm.config.ts
│   ├── http/
│   │   └── patient.controller.ts
│   └── messaging/
│       └── event-bus.adapter.ts
│
└── main.ts                      # Composition root: wiring di tutto
```

---

## Twelve-Factor App

I dodici fattori sono una metodologia per costruire applicazioni software-as-a-service. Watt li supporta nativamente.

**1. Codebase**: Una codebase tracciata in version control, molti deploy. Ogni applicazione Watt può avere il suo repository o stare in un monorepo. In entrambi i casi, lo stesso codice viene deployato in ambienti diversi.

**2. Dependencies**: Dichiara e isola esplicitamente le dipendenze. Ogni applicazione Watt ha il suo `package.json`. Non fare affidamento su pacchetti installati globalmente.

**3. Config**: Memorizza la configurazione nell'ambiente. Watt supporta nativamente i file `.env` e l'interpolazione `{VARIABILE}` nei file di configurazione JSON.

**4. Backing Services**: Tratta i backing service come risorse collegate. Il database è una risorsa collegata tramite `DATABASE_URL`. Puoi passare da un PostgreSQL locale a uno remoto cambiando solo la variabile.

**5. Build, Release, Run**: Separa rigorosamente le fasi di build e run. `wattpm build` crea la build, `wattpm start` la esegue. Sono fasi distinte.

**6. Processes**: Esegui l'applicazione come uno o più processi stateless. Ogni applicazione Watt gira in un worker thread. Non memorizzare stato in memoria tra le richieste.

**7. Port Binding**: Esporta i servizi tramite port binding. Watt espone le applicazioni su una porta configurabile. Non dipendere da un web server esterno.

**8. Concurrency**: Scala tramite il modello di processo. Puoi avere multiple istanze Watt dietro un load balancer. Ogni istanza gestisce i suoi worker thread.

**9. Disposability**: Massimizza la robustezza con avvio rapido e shutdown graceful. Watt gestisce il ciclo di vita delle applicazioni. Implementa handler per SIGTERM per cleanup.

**10. Dev/Prod Parity**: Mantieni sviluppo, staging e produzione il più simili possibile. Usa le stesse versioni di database, lo stesso tipo di backing service. Cambia solo le variabili d'ambiente.

**11. Logs**: Tratta i log come stream di eventi. Watt usa Pino che produce log JSON su stdout. Non scrivere su file. Lascia che l'ambiente gestisca la raccolta dei log.

**12. Admin Processes**: Esegui task di admin/management come processi one-off. Usa `wattpm db:migrations:apply` per le migrazioni. Crea script npm per task amministrativi.

---

## Extreme Programming e Timebox

### La Filosofia XP

L'Extreme Programming enfatizza cicli di feedback brevi, rilasci frequenti, e adattamento continuo. Nel contesto dello sviluppo con Watt, questo si traduce in pratiche concrete.

### Timebox Piccoli e Deployabili

Ogni unità di lavoro dovrebbe essere piccola abbastanza da essere completata, testata, e deployata in un timebox breve (ore, non giorni). Questo richiede una disciplina nel dividere il lavoro.

**Regola del Valore Incrementale**: Ogni deploy deve aggiungere valore. Non "preparare il terreno per la prossima feature". Ogni merge in main deve essere potenzialmente rilasciabile e utile.

**Vertical Slicing**: Invece di costruire layer per layer (prima tutto il database, poi tutta la business logic, poi tutta l'API), costruisci funzionalità complete verticali. Un endpoint che crea un paziente con tutti i layer necessari è meglio di tutto lo schema del database senza API.

```
❌ Horizontal Slicing (anti-pattern)
Sprint 1: Definisci tutto lo schema database
Sprint 2: Implementa tutti i repository
Sprint 3: Implementa tutti i use case
Sprint 4: Implementa tutti i controller
Sprint 5: Finalmente qualcosa di usabile...

✅ Vertical Slicing (pattern corretto)
Timebox 1: Endpoint per creare un paziente (schema + repo + use case + controller)
           → Deployabile, valore immediato per testing
Timebox 2: Endpoint per recuperare un paziente
           → Deployabile, espande le funzionalità
Timebox 3: Validazione avanzata del codice fiscale
           → Deployabile, migliora la qualità
```

### Continuous Integration con Watt

Ogni applicazione Watt può avere la sua pipeline CI. Ma il principio è: integra spesso, deploy spesso.

```yaml
# .github/workflows/api-core.yml
name: API Core CI
on:
  push:
    paths:
      - 'web/api-core/**'
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd web/api-core && npm ci
      - run: cd web/api-core && npm test
      - run: cd web/api-core && npm run build
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: # Deploy solo questa applicazione
```

### Test-Driven Development

TDD non è opzionale in un approccio XP. Il ciclo è: scrivi un test che fallisce, scrivi il codice minimo per farlo passare, refactora.

Nel contesto dell'architettura esagonale, TDD diventa ancora più potente perché puoi testare il dominio in isolamento, senza database, senza HTTP, senza nulla di esterno.

```typescript
// Test del dominio: veloce, isolato, nessuna dipendenza
describe('Patient aggregate', () => {
  it('should validate fiscal code format', () => {
    expect(() => FiscalCode.create('INVALID')).toThrow(InvalidFiscalCodeError);
  });

  it('should create patient with valid data', () => {
    const patient = Patient.create({
      fiscalCode: FiscalCode.create('RSSMRA80A01H501U'),
      firstName: 'Mario',
      lastName: 'Rossi',
    });
    expect(patient.fullName).toBe('Mario Rossi');
  });
});

// Test del use case: ancora veloce, mock del repository
describe('CreatePatientUseCase', () => {
  it('should save patient and emit event', async () => {
    const mockRepo = { save: jest.fn() };
    const mockEventBus = { publish: jest.fn() };
    const useCase = new CreatePatientUseCase(mockRepo, mockEventBus);

    await useCase.execute({ fiscalCode: 'RSSMRA80A01H501U', ... });

    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PatientCreated' })
    );
  });
});
```

---

## Applicare Tutto con Platformatic Watt

### Backend Modulare Multi-Dominio

Watt permette di implementare un backend modulare dove ogni bounded context è un'applicazione separata ma coordinata.

```
watt-healthcare-system/
├── watt.json                    # Orchestrazione globale
├── .env                         # Config condivisa
│
└── web/
    ├── gateway/                 # Entry point, routing, auth
    │
    ├── patients-context/        # Bounded Context: Pazienti
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── watt.json
    │
    ├── procedures-context/      # Bounded Context: Procedure
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── watt.json
    │
    ├── signatures-context/      # Bounded Context: Firme Digitali
    │   └── ...
    │
    ├── hl7-adapter/             # Adapter per integrazioni HL7
    │   └── ...
    │
    └── shared-kernel/           # Codice condiviso tra context
        ├── value-objects/       # FiscalCode, etc.
        └── events/              # Domain events condivisi
```

### UI Ad-Hoc con Frontend Dedicati

Platformatic Watt supporta frontend come applicazioni first-class. Puoi avere UI dedicate per diversi utenti.

```
└── web/
    ├── frontend-clinicians/     # UI per medici e infermieri
    │   └── (Next.js/React)
    │
    ├── frontend-admin/          # UI per amministratori
    │   └── (Next.js/React)
    │
    └── frontend-patients/       # Portale pazienti
        └── (Next.js/React)
```

Ogni frontend consuma le API esposte dal gateway, che orchestra i vari bounded context.

### La Checklist Pre-Sviluppo

Prima di iniziare qualsiasi task, passa attraverso questa checklist:

**Validazione del Bisogno**
- [ ] Ho capito chiaramente il problema da risolvere?
- [ ] Questo problema esiste adesso o sto anticipando?
- [ ] Posso descrivere il valore aggiunto in una frase?

**Valutazione delle Alternative**
- [ ] Ho considerato di non fare nulla?
- [ ] Ho cercato soluzioni esistenti?
- [ ] Ho valutato l'approccio più semplice possibile?

**Design**
- [ ] Rispetta Single Responsibility?
- [ ] È testabile in isolamento?
- [ ] Aggiunge il minimo di complessità necessaria?

**Implementazione**
- [ ] Ho scritto i test prima del codice?
- [ ] È deployabile indipendentemente?
- [ ] Aggiunge valore immediato?

**Review**
- [ ] Il codice è comprensibile senza commenti?
- [ ] I nomi comunicano l'intento?
- [ ] Posso eliminare qualcosa senza perdere valore?

---

## Conclusione: La Disciplina dello Sviluppo Sostenibile

I principi presentati in questo documento non sono regole rigide ma strumenti di pensiero. L'obiettivo non è seguirli ciecamente ma usarli per prendere decisioni consapevoli.

La vera abilità sta nel sapere quando un principio si applica e quando no. YAGNI dice di non costruire per il futuro, ma a volte un po' di astrazione preventiva evita refactoring costosi. DRY dice di non ripetere, ma a volte la duplicazione è preferibile all'accoppiamento. KISS dice di mantenere semplice, ma a volte la complessità è intrinseca al problema.

La chiave è la Regola Zero: prima di qualsiasi decisione, fermati e rifletti. Il codice migliore è spesso quello che non scrivi. La feature migliore è spesso quella che non implementi. La complessità va guadagnata, non data per scontata.

Con Platformatic Watt hai uno strumento potente che supporta questi principi. Usalo con disciplina, e costruirai sistemi che durano.

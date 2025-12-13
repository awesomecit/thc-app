# Sviluppo AI-Assisted: GitHub Copilot e Claude

> **La Regola Zero applicata all'AI**: Prima di accettare qualsiasi suggerimento dell'AI, chiediti:
> "Questo codice mi serve veramente? Capisco cosa fa? Risolve il problema nel modo più semplice
> possibile? Quali sono le alternative?"

---

## Indice

1. [Filosofia dello Sviluppo AI-Assisted](#filosofia-dello-sviluppo-ai-assisted)
2. [GitHub Copilot: Utilizzo Efficace](#github-copilot-utilizzo-efficace)
3. [Claude per Architettura e Design](#claude-per-architettura-e-design)
4. [Workflow Integrato](#workflow-integrato)
5. [Anti-Pattern e Trappole](#anti-pattern-e-trappole)
6. [Checklist per Codice AI-Generated](#checklist-per-codice-ai-generated)

---

## Filosofia dello Sviluppo AI-Assisted

### L'AI come Amplificatore, Non Sostituto

Gli strumenti AI come GitHub Copilot e Claude sono amplificatori delle tue capacità, non sostituti
del tuo giudizio. Un amplificatore prende ciò che hai e lo rende più forte: se hai una buona
comprensione del problema, l'AI ti aiuta a risolverlo più velocemente; se non hai capito il
problema, l'AI ti aiuta a produrre codice sbagliato più velocemente.

La responsabilità del codice rimane tua. L'AI non capisce il contesto del tuo business, non conosce
i requisiti non funzionali impliciti, non sa quali trade-off sono accettabili nel tuo contesto. Tu
sì.

### Il Paradosso della Produttività

L'AI può generare codice molto velocemente. Questa velocità è sia un vantaggio che un pericolo. Il
vantaggio è ovvio: meno tempo a scrivere boilerplate, più tempo per pensare. Il pericolo è meno
ovvio: la velocità può spingerti a produrre più codice del necessario.

Ricorda i principi YAGNI e KISS. Solo perché puoi generare 500 righe di codice in 30 secondi non
significa che dovresti. Spesso la soluzione migliore è ancora quella che richiede meno codice, anche
se l'AI potrebbe generarne di più.

### La Domanda Prima del Prompt

Prima di chiedere all'AI di generare codice, fermati e passa attraverso il filtro decisionale della
Regola Zero.

Prima domanda: ho veramente bisogno di questo codice? Forse il problema si risolve meglio con una
configurazione, o rimuovendo codice esistente, o ripensando l'approccio.

Seconda domanda: capisco abbastanza il problema da valutare la soluzione? Se non capisci cosa
dovrebbe fare il codice, non puoi giudicare se il codice generato è corretto.

Terza domanda: qual è la soluzione più semplice? L'AI tende a generare soluzioni "complete" che
potrebbero essere over-engineered per il tuo caso d'uso.

---

## GitHub Copilot: Utilizzo Efficace

### Come Funziona Copilot

GitHub Copilot è un modello di linguaggio addestrato su codice pubblico. Predice il codice che
probabilmente seguirà in base al contesto: il file corrente, i file aperti, i commenti, i nomi delle
variabili. Non "capisce" il codice nel senso umano del termine; riconosce pattern e genera
continuazioni probabili.

Questo ha implicazioni pratiche. Copilot è eccellente quando il pattern è comune e ben rappresentato
nei dati di training (CRUD operations, utility functions, boilerplate). È meno affidabile quando il
problema è specifico del tuo dominio o richiede ragionamento complesso.

### Tecniche per Suggerimenti Migliori

Il contesto è tutto per Copilot. Più contesto fornisci, migliori saranno i suggerimenti.

**Commenti descrittivi**: Scrivi un commento che descrive cosa vuoi prima di scrivere il codice.
Copilot userà questo come guida.

```typescript
// Valida un codice fiscale italiano.
// Formato: 16 caratteri alfanumerici.
// I primi 6 sono lettere per cognome e nome.
// I successivi 2 sono l'anno di nascita.
// Il carattere 9 è il mese (A-E, H, L, M, P, R-T per i 12 mesi).
// I caratteri 10-11 sono il giorno (01-31, +40 per le donne).
// I caratteri 12-15 sono il codice catastale del comune.
// L'ultimo carattere è il codice di controllo.
function validateFiscalCode(code: string): boolean {
  // Copilot ora ha molto più contesto per generare una validazione corretta
}
```

**Nomi significativi**: I nomi di funzioni, classi e variabili guidano i suggerimenti.
`function processData(d)` darà suggerimenti generici;
`function calculatePatientRiskScore(medicalHistory: PatientMedicalHistory)` darà suggerimenti molto
più specifici.

**Esempi nei commenti**: Se stai implementando qualcosa con input/output specifici, mostra degli
esempi.

```typescript
// Formatta una data italiana.
// Esempio: formatItalianDate(new Date('2024-01-15')) => '15 gennaio 2024'
// Esempio: formatItalianDate(new Date('2024-12-25')) => '25 dicembre 2024'
function formatItalianDate(date: Date): string {
```

**File di riferimento aperti**: Copilot considera i file aperti nell'editor. Se stai implementando
un repository, tieni aperta l'interfaccia del repository. Se stai scrivendo test, tieni aperto il
file che stai testando.

### Copilot per Pattern Comuni in Watt

Copilot eccelle nei pattern ripetitivi. Ecco alcuni casi d'uso dove brilla in un progetto Watt.

**DTO e validazione**: Dopo aver definito un'entità di dominio, Copilot può generare i DTO
corrispondenti con decoratori di validazione.

```typescript
// Prima definisci l'entità
interface Patient {
  id: string;
  fiscalCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email?: string;
}

// Poi chiedi il DTO con un commento
// CreatePatientDto per validare l'input della creazione paziente.
// fiscalCode è obbligatorio e deve essere un codice fiscale italiano valido.
// firstName e lastName sono obbligatori, lunghezza 2-50 caratteri.
// dateOfBirth è obbligatoria e deve essere nel passato.
// email è opzionale ma deve essere valida se presente.
export class CreatePatientDto {
  // Copilot genererà i decoratori class-validator appropriati
}
```

**Mapper tra layer**: La conversione tra entità di dominio, DTO, e record database è boilerplate
puro.

```typescript
// Mapper da Patient entity a PatientResponseDto
// Deve escludere i campi sensibili (password, internalNotes)
// Deve formattare dateOfBirth come stringa ISO
function toPatientResponse(patient: Patient): PatientResponseDto {
  // Copilot gestisce bene questo tipo di mapping
}
```

**Test boilerplate**: La struttura dei test è molto ripetitiva.

```typescript
// Test per CreatePatientUseCase
// Dovrebbe creare un paziente con dati validi
// Dovrebbe fallire se il codice fiscale è già presente
// Dovrebbe fallire se il codice fiscale non è valido
// Dovrebbe emettere un evento PatientCreated dopo la creazione
describe('CreatePatientUseCase', () => {
  // Copilot può generare la struttura dei test
});
```

### Quando NON Usare i Suggerimenti di Copilot

Ci sono situazioni dove dovresti essere particolarmente scettico o ignorare completamente i
suggerimenti.

**Logica di business critica**: Per codice che gestisce dati sanitari, transazioni finanziarie, o
sicurezza, scrivi tu stesso il codice o rivedi ogni singola riga generata.

**Algoritmi complessi**: Copilot può generare algoritmi che sembrano corretti ma hanno bug sottili.
Per algoritmi non banali, preferisci librerie testate o implementazioni verificate.

**Codice di sicurezza**: Autenticazione, autorizzazione, crittografia, validazione di input. Questi
sono troppo critici per fidarsi ciecamente di codice generato.

**Quando non capisci il suggerimento**: Se Copilot suggerisce qualcosa e non capisci come funziona,
non accettarlo. Prima capisci, poi decidi.

---

## Claude per Architettura e Design

### Differenza tra Copilot e Claude

Copilot opera a livello di riga o funzione, generando codice nel flusso della scrittura. Claude
opera a livello di conversazione, permettendo discussioni più ampie su architettura, design, e
problem-solving.

Usa Copilot per: scrivere implementazioni di pattern noti, generare boilerplate, completare codice
meccanico.

Usa Claude per: discutere architetture alternative, fare review di design, esplorare trade-off,
capire codice complesso, imparare nuovi concetti.

### Prompt Efficaci per Decisioni Architetturali

Quando usi Claude per decisioni architetturali, fornisci contesto e chiedi esplicitamente l'analisi
dei trade-off.

**Esempio: Discussione su separazione dei servizi**

```
Sto sviluppando un sistema per sale operatorie con Platformatic Watt.
Attualmente ho tutto in un'unica applicazione NestJS.

Ho questi bounded context:
- Gestione pazienti (anagrafica, cartella clinica)
- Procedure chirurgiche (pianificazione, esecuzione, documentazione)
- Firma digitale (validazione catena di firme, timestamping)
- Integrazioni HL7 (messaggistica con sistemi ospedalieri)

Il sistema deve supportare circa 50 utenti concorrenti, 100 operazioni al giorno.

Domande:
1. Ha senso separare questi in applicazioni Watt distinte?
2. Quali sono i pro e contro di ogni approccio?
3. Se separo, come gestisco le dipendenze tra bounded context?
4. Qual è l'approccio più semplice che funziona per questa scala?
```

**Esempio: Review di un'interfaccia**

```
Sto definendo l'interfaccia per il repository dei pazienti.
Ecco la mia proposta:

interface PatientRepository {
  save(patient: Patient): Promise<void>;
  findById(id: PatientId): Promise<Patient | null>;
  findByFiscalCode(code: string): Promise<Patient | null>;
  findAll(filters: PatientFilters): Promise<Patient[]>;
  delete(id: PatientId): Promise<void>;
  exists(id: PatientId): Promise<boolean>;
}

Domande:
1. Questa interfaccia segue il principio ISP?
2. Ci sono metodi che potrebbero essere problematici?
3. Come gestiresti la paginazione per findAll?
4. Manca qualcosa di importante?
```

### Claude per Code Review

Puoi usare Claude come primo livello di code review prima di coinvolgere colleghi umani. Questo non
sostituisce la review umana ma la rende più efficiente catturando problemi ovvi in anticipo.

**Template per code review con Claude:**

```
Fai una code review di questo codice.

Contesto:
- Fa parte di un sistema sanitario per sale operatorie
- Deve seguire architettura esagonale
- Usa NestJS dentro Platformatic Watt
- I principi che seguiamo: SOLID, DRY, KISS, YAGNI

Codice:
[incolla il codice]

Analizza:
1. Violazioni dei principi SOLID
2. Problemi di sicurezza
3. Opportunità di semplificazione (KISS/YAGNI)
4. Accoppiamento eccessivo
5. Mancanza di gestione errori
6. Naming e leggibilità
```

### Claude per Apprendimento

Uno degli usi migliori di Claude è come tutor personalizzato. Invece di chiedere "scrivi il codice
per X", chiedi "spiegami come funziona X e aiutami a capire come implementarlo".

**Esempio: Imparare un pattern**

```
Non ho mai implementato l'architettura esagonale in un progetto reale.
Sto usando NestJS con Platformatic Watt.

Puoi guidarmi passo passo nella creazione di un bounded context
per la gestione pazienti, spiegando:

1. Come strutturare le directory
2. Dove mettere entità, value objects, repository interfaces
3. Come i controller NestJS diventano "primary adapters"
4. Come implementare un repository come "secondary adapter"
5. Come il dependency injection di NestJS aiuta in questo pattern

Procedi un passo alla volta, assicurandoti che io abbia capito
prima di passare al successivo.
```

---

## Workflow Integrato

### Il Ciclo di Sviluppo AI-Assisted

Un workflow efficace integra gli strumenti AI nei momenti giusti del ciclo di sviluppo.

**Fase 1: Comprensione del problema (Claude)**

Prima di scrivere codice, usa Claude per esplorare il problema, discutere approcci alternativi,
identificare edge cases che potresti non aver considerato. L'output di questa fase è una
comprensione chiara di cosa costruire.

**Fase 2: Design dell'interfaccia (Tu + Claude)**

Definisci le interfacce pubbliche (API, port, contratti). Usa Claude per fare review del design e
identificare problemi potenziali. L'output è un set di interfacce stabili.

**Fase 3: Implementazione (Tu + Copilot)**

Scrivi i test e l'implementazione. Usa Copilot per accelerare il boilerplate. Mantieni il controllo
sulla logica critica. L'output è codice funzionante e testato.

**Fase 4: Review (Claude + Colleghi)**

Fai una prima review con Claude per catturare problemi ovvi. Poi sottoponi ai colleghi per review
umana. L'output è codice pronto per merge.

**Fase 5: Refactoring (Tu + Copilot + Claude)**

Se emergono opportunità di refactoring, usa Claude per discutere l'approccio e Copilot per
implementare le modifiche meccaniche.

### Esempio Pratico: Implementare un Use Case

Vediamo il workflow in azione per implementare un use case "Crea Paziente".

**Passo 1: Discussione con Claude**

```
Devo implementare il caso d'uso "Crea Paziente" nel mio sistema sanitario.

Requisiti:
- Validare codice fiscale italiano
- Verificare che non esista già un paziente con lo stesso codice fiscale
- Salvare il paziente
- Emettere un evento PatientCreated per altri bounded context
- Creare un record di audit

Domande:
- Come struttureresti questo use case seguendo Clean Architecture?
- Quali sono le porte (input/output) necessarie?
- Come gestiresti la transazionalità (save paziente + audit)?
- Quali errori specifici dovrei modellare?
```

**Passo 2: Definizione delle interfacce**

Basandomi sulla discussione con Claude, definisco le interfacce.

```typescript
// application/patients/create-patient.use-case.ts

// Input port (cosa il mondo può chiedere)
export interface CreatePatientUseCase {
  execute(command: CreatePatientCommand): Promise<CreatePatientResult>;
}

// Command (input)
export interface CreatePatientCommand {
  fiscalCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email?: string;
}

// Result (output)
export type CreatePatientResult =
  | { success: true; patientId: string }
  | { success: false; error: CreatePatientError };

export type CreatePatientError =
  | { code: 'INVALID_FISCAL_CODE'; details: string }
  | { code: 'PATIENT_ALREADY_EXISTS'; existingPatientId: string }
  | { code: 'VALIDATION_ERROR'; fields: Record<string, string> };
```

**Passo 3: Scrivo i test (con Copilot per il boilerplate)**

```typescript
// application/patients/create-patient.use-case.spec.ts

describe('CreatePatientUseCase', () => {
  // Setup: Copilot può aiutare con il boilerplate dei mock
  let useCase: CreatePatientUseCaseImpl;
  let mockPatientRepo: jest.Mocked<PatientRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockAuditLogger: jest.Mocked<AuditLogger>;

  beforeEach(() => {
    // Copilot genera il setup dei mock
    mockPatientRepo = {
      save: jest.fn(),
      findByFiscalCode: jest.fn(),
      findById: jest.fn(),
    };
    // ... resto del setup
  });

  // Test case: scrivo io la logica, Copilot aiuta con la struttura
  it('should create patient with valid data', async () => {
    // Arrange
    mockPatientRepo.findByFiscalCode.mockResolvedValue(null);

    const command: CreatePatientCommand = {
      fiscalCode: 'RSSMRA80A01H501U',
      firstName: 'Mario',
      lastName: 'Rossi',
      dateOfBirth: new Date('1980-01-01'),
    };

    // Act
    const result = await useCase.execute(command);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.patientId).toBeDefined();
    }
    expect(mockPatientRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PatientCreated' })
    );
  });

  // Copilot può generare la struttura dei test rimanenti
  // basandosi sul pattern del primo test
  it('should fail if fiscal code is invalid', async () => {
    // ...
  });

  it('should fail if patient already exists', async () => {
    // ...
  });
});
```

**Passo 4: Implementazione (con Copilot per parti meccaniche)**

```typescript
// application/patients/create-patient.use-case.impl.ts

export class CreatePatientUseCaseImpl implements CreatePatientUseCase {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly eventBus: EventBus,
    private readonly auditLogger: AuditLogger
  ) {}

  async execute(command: CreatePatientCommand): Promise<CreatePatientResult> {
    // 1. Validazione del codice fiscale (logica critica - scrivo io)
    const fiscalCodeResult = FiscalCode.create(command.fiscalCode);
    if (!fiscalCodeResult.isValid) {
      return {
        success: false,
        error: { code: 'INVALID_FISCAL_CODE', details: fiscalCodeResult.error },
      };
    }

    // 2. Verifica esistenza (Copilot può aiutare con il pattern)
    const existing = await this.patientRepository.findByFiscalCode(
      fiscalCodeResult.value.toString()
    );
    if (existing) {
      return {
        success: false,
        error: { code: 'PATIENT_ALREADY_EXISTS', existingPatientId: existing.id },
      };
    }

    // 3. Creazione entità (logica di dominio - scrivo io)
    const patient = Patient.create({
      fiscalCode: fiscalCodeResult.value,
      firstName: command.firstName,
      lastName: command.lastName,
      dateOfBirth: command.dateOfBirth,
      email: command.email,
    });

    // 4. Persistenza ed eventi (Copilot per il boilerplate)
    await this.patientRepository.save(patient);

    await this.eventBus.publish({
      type: 'PatientCreated',
      payload: { patientId: patient.id, fiscalCode: patient.fiscalCode },
      timestamp: new Date(),
    });

    await this.auditLogger.log({
      action: 'PATIENT_CREATED',
      entityType: 'Patient',
      entityId: patient.id,
      details: { fiscalCode: patient.fiscalCode },
    });

    return { success: true, patientId: patient.id };
  }
}
```

**Passo 5: Review con Claude**

Prima di sottoporre ai colleghi, faccio una review con Claude incollando il codice completo e
chiedendo feedback specifico su aderenza ai principi, gestione errori, e opportunità di
miglioramento.

---

## Anti-Pattern e Trappole

### La Trappola dell'Accettazione Cieca

L'errore più comune è accettare i suggerimenti dell'AI senza capirli. Copilot suggerisce qualcosa,
funziona, lo accetti. Poi scopri un bug sei mesi dopo e non hai idea di come funzioni quel codice.

**Regola**: Se non puoi spiegare cosa fa il codice e perché, non accettarlo.

### La Trappola dell'Over-Engineering

L'AI può generare soluzioni elaborate a problemi semplici. Chiedi come validare un input e ti
propone un framework di validazione con plugin, estensioni, e configurazione XML.

**Regola**: Chiedi sempre l'approccio più semplice. Se l'AI propone qualcosa di complesso, chiedi se
esiste un'alternativa più semplice.

### La Trappola del Codice Copia-Incolla

Copilot può suggerire codice simile a quello già presente nel progetto, creando duplicazione. Tre
funzioni che fanno quasi la stessa cosa con piccole variazioni.

**Regola**: Prima di accettare codice simile a qualcosa che esiste già, valuta se dovresti estrarre
una funzione comune o se la duplicazione è accettabile.

### La Trappola della Falsa Confidenza

L'AI risponde con sicurezza anche quando è incerta. Claude può spiegare un concetto con autorità
anche se l'informazione non è accurata.

**Regola**: Verifica le informazioni critiche con fonti primarie (documentazione ufficiale, paper,
RFC).

### La Trappola della Perdita di Contesto

Nelle conversazioni lunghe, Claude può "dimenticare" vincoli o requisiti menzionati all'inizio. Può
suggerire soluzioni che contraddicono decisioni prese prima nella conversazione.

**Regola**: Per conversazioni lunghe, ricapitola periodicamente i vincoli chiave. Considera di
iniziare nuove conversazioni per nuovi argomenti.

---

## Checklist per Codice AI-Generated

Prima di accettare qualsiasi codice generato dall'AI, passa attraverso questa checklist.

**Comprensione**

- [ ] Capisco cosa fa ogni riga del codice?
- [ ] Posso spiegare l'algoritmo a un collega?
- [ ] Conosco le librerie/API utilizzate?

**Necessità**

- [ ] Questo codice è necessario per risolvere il problema?
- [ ] È la soluzione più semplice?
- [ ] Potrei ottenere lo stesso risultato con meno codice?

**Correttezza**

- [ ] Gestisce tutti gli edge case del mio contesto?
- [ ] Gestisce correttamente gli errori?
- [ ] È type-safe (se uso TypeScript)?

**Sicurezza**

- [ ] Non introduce vulnerabilità ovvie (injection, XSS, etc.)?
- [ ] Non espone dati sensibili?
- [ ] Valida correttamente gli input?

**Manutenibilità**

- [ ] I nomi sono significativi?
- [ ] Il codice è leggibile senza commenti?
- [ ] Segue i pattern del progetto?

**Testing**

- [ ] Ho scritto test per questo codice?
- [ ] I test coprono i casi edge?
- [ ] I test documentano il comportamento atteso?

---

## Conclusione: L'AI come Partner, Non come Pilota

Gli strumenti AI sono incredibilmente potenti. Possono accelerare significativamente lo sviluppo,
aiutare ad esplorare soluzioni, e ridurre il tempo speso su codice boilerplate. Ma il loro valore
dipende interamente da come li usi.

L'AI è un partner che può darti suggerimenti e aiutarti a pensare, non un pilota a cui delegare le
decisioni. La responsabilità del codice, dell'architettura, e della qualità rimane tua.

Usa Copilot per accelerare la scrittura di codice che hai già progettato nella tua testa. Usa Claude
per esplorare idee, discutere trade-off, e imparare concetti nuovi. Ma non smettere mai di pensare
criticamente a ogni suggerimento.

Il miglior codice rimane quello che capisci completamente, che risolve esattamente il problema che
hai, e che è semplice quanto possibile. L'AI può aiutarti ad arrivarci più velocemente, ma non può
sostituire il giudizio umano su cosa costruire e perché.

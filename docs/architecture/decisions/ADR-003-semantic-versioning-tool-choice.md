# ADR-003: Semantic Versioning Tool Choice

**Status**: Accepted  
**Date**: 2025-12-14  
**Deciders**: Development Team  
**Tags**: `tooling`, `automation`, `release`, `semantic-versioning`

---

## Context

Il progetto richiede un sistema di **semantic versioning automatico** basato su conventional commits
per:

- Calcolare automaticamente la prossima versione (MAJOR.MINOR.PATCH)
- Generare CHANGELOG.md in formato Keep a Changelog
- Creare git tags
- Supportare workflow BDD con generazione `feature.json` (requirement specifico del progetto)

### Opzioni Valutate

Abbiamo analizzato **4 tool all-in-one** e un **approccio ibrido con librerie modulari**.

#### 1. semantic-release (v25.0.2)

**Pro**:

- ✅ Zero config out-of-the-box
- ✅ Ecosystem ricco di plugin (@semantic-release/github, @semantic-release/npm,
  @semantic-release/changelog)
- ✅ Molto popolare (18K+ GitHub stars)
- ✅ Integrazione CI/CD nativa

**Contro**:

- ❌ **Opinionated**: workflow rigido, difficile customizzare
- ❌ Non supporta `feature.json` custom senza plugin complesso
- ❌ Configurazione tramite file separato (`.releaserc`)
- ❌ Overhead per progetti semplici

**Verdict**: ❌ Troppo rigido per il nostro requirement BDD

---

#### 2. standard-version (Deprecated)

**Pro**:

- ✅ Semplice e standalone
- ✅ Supporta conventional-changelog

**Contro**:

- ❌ **Deprecato** - manutenzione rallentata/ferma
- ❌ Raccomanda migrazione a alternative

**Verdict**: ❌ Non usare tool deprecati

---

#### 3. release-it (via @release-it/conventional-changelog)

**Pro**:

- ✅ Molto flessibile con sistema di plugin
- ✅ Supporta conventional-changelog tramite plugin ufficiale
- ✅ Configurazione granulare
- ✅ Attivamente mantenuto

**Contro**:

- ❌ Curva di apprendimento più ripida
- ❌ Richiede comunque customizzazione per `feature.json`
- ❌ Plugin dependency chain complessa

**Verdict**: ⚠️ Possibile ma overkill per le nostre esigenze

---

#### 4. changesets (@changesets/cli v2.29.8)

**Pro**:

- ✅ Eccellente per monorepo con npm workspaces
- ✅ Workflow basato su file `.changeset/` (review-friendly)
- ✅ Usato da progetti enterprise (Remix, Radix UI)

**Contro**:

- ❌ **Workflow completamente diverso**: non usa conventional commits nativamente
- ❌ Richiede file `.changeset/` manuali o tramite CLI interattiva
- ❌ Incompatibile con il nostro workflow Git + commitlint esistente
- ❌ Non analizza direttamente la storia Git

**Verdict**: ❌ Filosofia incompatibile con conventional commits

---

#### 5. Approccio Ibrido: Script Custom + Librerie Standard ✅

**Librerie Core**:

| Libreria                      | Versione | Maintainer               | Uso                     |
| ----------------------------- | -------- | ------------------------ | ----------------------- |
| `conventional-commits-parser` | 6.2.1    | bcoe, dangreen, stevemao | Parsing commit messages |
| `semver`                      | 7.x      | npm team                 | Calcolo versioni        |
| `simple-git`                  | 3.x      | steveukx                 | Operazioni git          |

**Pro**:

- ✅ **Massima flessibilità**: controllo totale su logica custom
- ✅ **Librerie battle-tested**: conventional-changelog ecosystem con milioni di download
- ✅ **No vendor lock-in**: librerie modulari, sostituibili singolarmente
- ✅ **Supporto `feature.json` nativo**: script custom può generare qualsiasi output
- ✅ **Debuggabile**: codice nostro, non black-box
- ✅ **Leggero**: solo 3 dipendenze core, no plugin chain
- ✅ **Manutenibilità**: librerie attivamente mantenute da team riconosciuti
- ✅ **Allineato con Guida 11**: documento di progetto raccomanda questo approccio

**Contro**:

- ⚠️ Richiede scrivere logica orchestrazione (ma abbiamo già pseudocodice in Guida 11)
- ⚠️ Più codice da testare (ma maggiore controllo qualità)

**Verdict**: ✅ **SCELTA MIGLIORE** per questo progetto

---

## Decision

**Implementiamo un sistema di semantic versioning con approccio ibrido**:

1. **Core Libraries**:

   ```bash
   npm install --save-dev conventional-commits-parser semver simple-git
   ```

2. **Script Custom** (`scripts/auto-release.js`):
   - Parsing commit con `conventional-commits-parser`
   - Calcolo semver con libreria `semver`
   - Operazioni git con `simple-git`
   - Generazione CHANGELOG.md (Keep a Changelog format)
   - Generazione `feature.json` per integrazione BDD

3. **Workflow**:

   ```bash
   npm run release:suggest  # Preview (--dry-run)
   npm run release          # Esegui release completa
   ```

### Motivazioni Chiave

1. **Requirement BDD**: Il progetto ha bisogno di `feature.json` custom che mappa commit a scenari
   Gherkin - nessun tool all-in-one supporta questo
2. **Flessibilità vs Semplicità**: Preferenza per controllo totale su workflow rigido
3. **Manutenibilità**: Librerie modulari sono più facili da aggiornare/sostituire
4. **Team familiarity**: Script JavaScript custom è più debuggabile di configurazioni complesse
5. **Allineamento documentazione**: Guida 11 fornisce già pseudocodice e architettura per questa
   soluzione

---

## Consequences

### Positive

- ✅ Controllo totale su generazione changelog e versioning
- ✅ Supporto nativo per `feature.json` e integrazione BDD
- ✅ Nessun vendor lock-in
- ✅ Debuggabilità completa
- ✅ Possibilità di estendere con feature custom future
- ✅ Librerie standard ben mantenute

### Negative

- ⚠️ Dobbiamo mantenere lo script custom (ma con test coverage >70%)
- ⚠️ Più codice da scrivere rispetto a tool all-in-one (compensato da flessibilità)

### Neutral

- ℹ️ Richiede documentazione workflow per team (già in Guida 11)
- ℹ️ CI/CD dovrà invocare script npm invece di tool standard (configurazione minima)

---

## Implementation Plan

### Fase 1 (Sprint 2 - Task 2.2.1)

- [ ] Installare dipendenze: `conventional-commits-parser`, `semver`, `simple-git`
- [ ] Implementare `scripts/auto-release.js` con analisi commit e calcolo versione
- [ ] Aggiungere supporto `--dry-run` per preview
- [ ] Test: validare su commit esistenti del progetto

### Fase 2 (Sprint 2 - Task 2.2.2)

- [ ] Implementare generazione CHANGELOG.md (Keep a Changelog format)
- [ ] Raggruppamento per tipo: Features, Bug Fixes, Breaking Changes
- [ ] Link a commit hash su GitHub

### Fase 3 (Sprint 2 - Task 2.2.3)

- [ ] Documentare workflow in RELEASE_PROCESS.md
- [ ] Procedure rollback
- [ ] Processo hotfix

### Fase 4 (Futuro - quando implementiamo BDD)

- [ ] Estendere script per generazione `feature.json`
- [ ] Parsing file `.feature` Gherkin
- [ ] Correlazione commit → scenari

---

## Alternatives Considered

| Alternative      | Perché Scartata                                                          |
| ---------------- | ------------------------------------------------------------------------ |
| semantic-release | Troppo opinionated, `feature.json` richiederebbe plugin complesso        |
| standard-version | Deprecato, non mantenuto                                                 |
| release-it       | Overkill, curva apprendimento alta per beneficio limitato                |
| changesets       | Workflow incompatibile con conventional commits esistente                |
| Script bash puro | Parsing commit in bash è fragile, meglio JavaScript con librerie testate |

---

## References

- [Guida 11: Versionamento Automatico](../../guides/11-automatic-versioning-release-workflow.md) -
  Architettura e pseudocodice
- [Semantic Versioning 2.0.0](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [conventional-commits-parser](https://www.npmjs.com/package/conventional-commits-parser)
- [semver](https://www.npmjs.com/package/semver)
- [simple-git](https://www.npmjs.com/package/simple-git)

---

**Next Actions**: Proceed with implementation of Task 2.2.1 (auto-release script)

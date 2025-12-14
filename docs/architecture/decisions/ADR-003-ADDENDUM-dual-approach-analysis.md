# ADR-003 Addendum: Dual Approach Analysis

**Date**: 2025-12-14  
**Context**: Post-decision analysis of semantic-release + feature.json dual approach

---

## Question

Dopo aver scelto l'approccio ibrido con script custom, è emersa la domanda:

> Potremmo implementare **entrambi**?
>
> - **semantic-release** per automation standard (CHANGELOG, GitHub releases, npm publish)
> - **feature.json** custom per reporting BDD cliente-friendly

---

## Analysis

### Scenario A: Solo Script Custom (Decisione Attuale ADR-003)

**Implementazione**:

```bash
scripts/auto-release.js →
  - Analizza commit
  - Calcola semver
  - Genera CHANGELOG.md
  - Genera feature.json (BDD)
  - Crea tag Git
```

**Pro**:

- ✅ Un solo script da mantenere
- ✅ Controllo totale su tutto il workflow
- ✅ feature.json integrato nativamente
- ✅ Nessuna dipendenza esterna complessa

**Contro**:

- ⚠️ Dobbiamo implementare CHANGELOG generation da zero
- ⚠️ Dobbiamo implementare GitHub release creation (se vogliamo)
- ⚠️ Più codice da testare

---

### Scenario B: Dual Approach (semantic-release + Script Custom)

**Implementazione**:

```bash
# Release standard automation
semantic-release →
  - Analizza commit (conventional-changelog)
  - Calcola semver
  - Genera CHANGELOG.md (standard)
  - Crea GitHub release
  - Pubblica npm package (opzionale)
  - Trigger webhooks

# BDD custom reporting (parallelo)
scripts/generate-feature-json.js →
  - Estrae scenari Gherkin
  - Correla commit → features
  - Genera feature.json per cliente
```

**Pro**:

- ✅ **semantic-release** è battle-tested (milioni di progetti)
- ✅ **Ecosystem plugin** ricco (@semantic-release/github, @semantic-release/npm,
  @semantic-release/slack, etc.)
- ✅ **CHANGELOG standard** auto-generato (formato universale)
- ✅ **GitHub releases** native (con asset, note, etc.)
- ✅ **CI/CD integration** robusta
- ✅ **Script custom** si concentra SOLO su feature.json (single responsibility)
- ✅ **Best of both worlds**: standard + custom coesistono

**Contro**:

- ⚠️ **Due sistemi paralleli** da orchestrare
- ⚠️ **Dipendenza da semantic-release** (vendor dependency, ma mitigata da popolarità)
- ⚠️ **Configurazione aggiuntiva** (.releaserc.json)
- ⚠️ **Possible race condition** se entrambi modificano package.json

---

## Decision: Approccio Pragmatico Ibrido

**Manteniamo ADR-003 (script custom) MA con strategia evolutiva**:

### Fase 1: MVP Script Custom (Sprint 2 - ORA)

Implementa script semplice che fa:

- ✅ Analisi commit
- ✅ Calcolo semver
- ✅ Aggiornamento package.json
- ✅ Tag Git
- ✅ **CHANGELOG.md basico** (Keep a Changelog format, template semplice)

**Perché**: Velocità di implementazione, controllo totale, nessuna configurazione complessa.

---

### Fase 2: Valutazione Post-MVP (Fine Sprint 2)

Dopo aver usato lo script custom per 2-3 release, **valutiamo** se:

1. **CHANGELOG generation è troppo complesso?**
   - ⚠️ Se sì → Consider semantic-release per CHANGELOG + GitHub releases
   - ✅ Se no → Keep script custom

2. **Vogliamo GitHub releases automatiche?**
   - ⚠️ Se sì → semantic-release ha plugin nativo
   - ✅ Se no → Script custom è sufficiente

3. **feature.json rimane requirement?**
   - ✅ Se sì → Script custom necessario comunque
   - ⚠️ Se no (YAGNI) → semantic-release standalone

---

### Fase 3: Approccio Duale (Se Necessario - Futuro)

Se dopo l'MVP decidiamo che semantic-release vale la complessità:

```json
// .releaserc.json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    [
      "@semantic-release/exec",
      {
        "prepareCmd": "node scripts/generate-feature-json.js ${nextRelease.version}"
      }
    ],
    "@semantic-release/git"
  ]
}
```

**Workflow**:

1. semantic-release fa il pesante (CHANGELOG, GitHub, npm)
2. `@semantic-release/exec` chiama nostro script per `feature.json`
3. Un solo comando: `npx semantic-release`

**Pro di questo approccio**:

- ✅ semantic-release gestisce standard automation
- ✅ Il nostro script si concentra SOLO su BDD correlation
- ✅ Single responsibility per ogni componente
- ✅ Ecosystem semantic-release disponibile (Slack notifications, Discord, etc.)

**Contro**:

- ⚠️ Dipendenza da semantic-release (ma mitigata da popolarità massive)
- ⚠️ Configurazione plugin chain
- ⚠️ Debug più complesso se qualcosa va storto

---

## Recommendation: Start Simple, Evolve If Needed

### Now (Sprint 2)

✅ **Implementa script custom MVP** (ADR-003)

- Reason: Fast, full control, YAGNI
- Deliverable: `npm run release` funzionante

### Later (Post Sprint 2)

🔍 **Valuta semantic-release** se:

- CHANGELOG generation diventa troppo complesso
- Vogliamo GitHub releases automatiche
- Vogliamo plugin ecosystem (Slack, Discord, Docker, etc.)

### Migration Path (Se Decidiamo Dual Approach)

Facile! semantic-release può usare tag esistenti:

```bash
# Script custom ha già creato tag v0.2.0, v0.3.0
# semantic-release li riconosce e parte da lì
npx semantic-release --dry-run  # Preview senza modifiche
```

---

## Answer to Original Question

> **feature.json è inutile e troppo custom?**

**NO**, feature.json ha valore **se**:

- ✅ Cliente richiede report tecnico → business mapping
- ✅ Team QA usa Gherkin per acceptance testing
- ✅ Vogliamo traceability commit → scenari BDD
- ✅ Auditing/compliance richiede feature tracking

**MA**: Possiamo generarlo **accanto** a semantic-release, non invece di.

---

## Conclusion

1. **Keep ADR-003 decision**: Script custom è la scelta giusta per MVP
2. **Document evolution strategy**: semantic-release come possibile Fase 2
3. **YAGNI applies**: Non aggiungere semantic-release finché non serve veramente
4. **Dual approach is valid**: Se feature.json resta requirement, semantic-release + script custom
   coesistono bene

**Status**: ADR-003 rimane **Accepted**, questo addendum documenta strategia evolutiva.

---

## References

- ADR-003: Semantic Versioning Tool Choice
- [semantic-release docs](https://semantic-release.gitbook.io/)
- [semantic-release/exec plugin](https://github.com/semantic-release/exec)
- Guida 11: Section 6 (feature.json generation)

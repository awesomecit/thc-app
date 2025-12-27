# 🎮 Modalità di Gioco Softair - TicOps

> **Versione**: 1.0  
> **Ultima modifica**: Dicembre 2025  
> **Riferimenti**: FIGT, FIPS, ENDAS, Community Italiane

---

## Introduzione

Questo documento presenta tutte le modalità di gioco softair supportate dalla piattaforma TicOps,
suddivise in due macro-categorie:

1. **Modalità Tradizionali** → Già operative con l'app base TicOps (smartphone + autodichiarazione)
2. **Modalità IoT-Enhanced** → Nuove esperienze abilitate dal kit hardware TicOps (LoRa mesh,
   beacon, tracker GPS, tablet field)

La filosofia di TicOps è **"Offline-First, Sync-Smart"**: tutte le partite funzionano anche senza
connessione internet, con sincronizzazione automatica post-partita o in tempo reale quando
disponibile.

---

## Parte 1: Modalità Tradizionali (App Base)

Queste modalità sono già giocate in Italia e sono completamente supportate dall'app TicOps senza
hardware aggiuntivo. Il tracking si basa sull'**autodichiarazione** dei giocatori tramite
smartphone.

---

### 🎯 1.1 Skirmish

**La porta d'ingresso al softair.** Partite brevi e immediate, perfette per chi inizia o per
sessioni veloci tra veterani.

| Caratteristica  | Dettaglio            |
| --------------- | -------------------- |
| **Durata**      | 15-30 minuti         |
| **Giocatori**   | 6-20                 |
| **Complessità** | ⭐ Bassa             |
| **Popolarità**  | ⭐⭐⭐⭐⭐ Altissima |
| **Federazioni** | Tutte                |

**Come funziona**: Due squadre si affrontano in un'area definita. Chi viene colpito si autodichara
"eliminato" e esce dal gioco. Vince la squadra che elimina tutti gli avversari o ha più
sopravvissuti allo scadere del tempo.

**Regole chiave**: Distanza minima di ingaggio 6 metri, ASG con potenza inferiore a 1 Joule,
occhiali protettivi obbligatori.

**Supporto TicOps App**:

- ✅ Prenotazione slot campo
- ✅ Check-in QR all'arrivo
- ✅ Autodichiarazione kill tramite app
- ✅ Punteggio e classifica live
- ✅ Storico partite nel profilo

---

### ⚔️ 1.2 Deathmatch a Squadre

**Il classico scontro tra fazioni.** Modalità molto popolare che introduce elementi tattici come il
medico e le zone di respawn.

| Caratteristica  | Dettaglio            |
| --------------- | -------------------- |
| **Durata**      | 1-2 ore              |
| **Giocatori**   | 8-30                 |
| **Complessità** | ⭐⭐ Media           |
| **Popolarità**  | ⭐⭐⭐⭐⭐ Altissima |
| **Federazioni** | FIGT, FIPS           |

**Come funziona**: Le squadre partono da basi opposte. Ogni giocatore ha un numero limitato di
"vite" (solitamente 3). Quando viene colpito, può essere "rianimato" da un compagno con ruolo medico
o deve tornare al respawn. Vince chi elimina definitivamente tutti gli avversari o ha il maggior
punteggio.

**Ruoli speciali**:

- **Medico** → Può rianimare i compagni colpiti (tempo limitato di intervento)
- **Team Leader** → Coordina la squadra via radio

**Supporto TicOps App**:

- ✅ Assegnazione ruoli pre-partita
- ✅ Contatore vite per giocatore
- ✅ Timer rianimazione medico
- ✅ Leaderboard in tempo reale
- ✅ Canali radio team (audio PTT)

---

### 🚩 1.3 Capture the Flag (CTF)

**Strategia e coordinamento.** Richiede lavoro di squadra per infiltrarsi nella base nemica,
catturare la bandiera e riportarla alla propria.

| Caratteristica  | Dettaglio     |
| --------------- | ------------- |
| **Durata**      | 1-3 ore       |
| **Giocatori**   | 10-40         |
| **Complessità** | ⭐⭐ Media    |
| **Popolarità**  | ⭐⭐⭐⭐ Alta |
| **Federazioni** | Tutte         |

**Come funziona**: Ogni squadra difende una bandiera posizionata nella propria base. L'obiettivo è
catturare la bandiera avversaria e riportarla nella propria base senza farsi eliminare. Se il
portatore viene colpito, la bandiera cade e può essere recuperata.

**Varianti**:

- **Single Flag** → Una sola bandiera al centro, entrambe le squadre cercano di conquistarla
- **Two Flags** → Variante FIGT dove serve conquistare entrambe le bandiere avversarie

**Supporto TicOps App**:

- ✅ Dichiarazione cattura/rilascio bandiera
- ✅ Timer di possesso
- ✅ Notifiche push eventi chiave
- ✅ Mappa con posizione basi

**🔮 Con IoT**: Bandiere RFID con tracking automatico (vedi Parte 2)

---

### 🏚️ 1.4 CQB - Close Quarters Battle

**Combattimento ravvicinato ad alta tensione.** Partite indoor o in strutture urbane che richiedono
riflessi rapidi e controllo degli spazi ristretti.

| Caratteristica  | Dettaglio      |
| --------------- | -------------- |
| **Durata**      | 30 min - 1 ora |
| **Giocatori**   | 4-16           |
| **Complessità** | ⭐⭐⭐ Alta    |
| **Popolarità**  | ⭐⭐⭐ Media   |
| **Federazioni** | FIGT           |

**Come funziona**: Squadre si affrontano in edifici, corridoi stretti o ambienti urbani simulati. La
distanza di ingaggio è ridotta (minimo 3 metri indoor), si privilegiano ASG corte e pistole.
Richiede comunicazione continua e movimento coordinato.

**Equipaggiamento tipico**: ASG compatte, pistole sidearm, torce tattiche, protezioni extra per mani
e viso.

**Supporto TicOps App**:

- ✅ Regole speciali CQB precaricate
- ✅ Timer round brevi
- ✅ Mappa statica della struttura
- ✅ Comunicazione radio team

**🔮 Con IoT**: Mappa 3D con posizioni live dei giocatori (vedi Parte 2)

---

### 🎖️ 1.5 MilSim - Military Simulation

**L'esperienza definitiva.** Simulazione militare immersiva che può durare giorni, con catene di
comando realistiche, logistica e obiettivi complessi.

| Caratteristica  | Dettaglio                       |
| --------------- | ------------------------------- |
| **Durata**      | 8-72 ore                        |
| **Giocatori**   | 20-200+                         |
| **Complessità** | ⭐⭐⭐⭐⭐ Estremamente Alta    |
| **Popolarità**  | ⭐⭐⭐ Media (nicchia dedicata) |
| **Federazioni** | FIPS, FIGT                      |

**Come funziona**: Due o più fazioni si confrontano su scenari che replicano operazioni militari
reali. Esistono catene di comando (comandante, ufficiali, squadre), logistica dei rifornimenti,
obiettivi multipli segreti assegnati dal game master. Le regole di ingaggio variano durante
l'evento.

**Elementi distintivi**:

- **Ruoli specializzati**: Comandante, Ufficiale Intel, Medico avanzato, Geniere, Comunicazioni
- **Logistica**: Munizioni limitate, rifornimenti da conquistare
- **Tempo continuo**: Si gioca anche di notte, con turni di riposo

**Supporto TicOps App**:

- ✅ Struttura gerarchica team
- ✅ Canali radio criptati per fazione
- ✅ Dispatch missioni dal comando
- ✅ Tracking obiettivi completati

**🔮 Con IoT**: Command & Control center completo (vedi Parte 2)

---

### 🔭 1.6 Pattuglia a Lungo Raggio (FIGT)

**Stealth e precisione.** Piccole pattuglie esplorano aree vaste con obiettivi segreti, evitando il
contatto quando possibile.

| Caratteristica  | Dettaglio                  |
| --------------- | -------------------------- |
| **Durata**      | 4-8 ore                    |
| **Giocatori**   | 4-8 per pattuglia          |
| **Complessità** | ⭐⭐⭐ Alta                |
| **Popolarità**  | ⭐⭐ Bassa (specialistica) |
| **Federazioni** | FIGT                       |

**Come funziona**: Le pattuglie ricevono obiettivi segreti (ricognizione, recupero oggetti,
eliminazione target) e devono completarli senza essere individuate. I rapporti radio periodici sono
obbligatori. Richiede navigazione, mimetizzazione e coordinamento silenzioso.

**Supporto TicOps App**:

- ✅ Dispatch missioni criptate
- ✅ Timer rapporti obbligatori
- ✅ Check-in waypoint

**🔮 Con IoT**: GPS tracking pattuglie con heatmap movimenti (vedi Parte 2)

---

### 🎯 1.7 Shooter Recon (Cecchini)

**Pazienza e precisione millimetrica.** Modalità per tiratori scelti che operano in coppia
(shooter + spotter).

| Caratteristica  | Dettaglio                  |
| --------------- | -------------------------- |
| **Durata**      | 2-4 ore                    |
| **Giocatori**   | 4-12                       |
| **Complessità** | ⭐⭐⭐ Alta                |
| **Popolarità**  | ⭐⭐ Bassa (specialistica) |
| **Federazioni** | FIGT                       |

**Come funziona**: Le coppie cecchino/osservatore devono eliminare target specifici a distanza. Dopo
ogni colpo il cecchino non può muoversi per un tempo definito. Lo spotter conferma i kill e fornisce
correzioni.

**Supporto TicOps App**:

- ✅ Conferma kill con timer
- ✅ Comunicazione spotter-shooter
- ✅ Punteggio basato su distanza

**🔮 Con IoT**: Sensori hit automatici e telemetria colpi (vedi Parte 2)

---

### ⚡ 1.8 Speedball Softair

**Velocità pura.** Variante arcade con respawn continui, simile al paintball competitivo.

| Caratteristica  | Dettaglio              |
| --------------- | ---------------------- |
| **Durata**      | 10-20 minuti per round |
| **Giocatori**   | 8-16                   |
| **Complessità** | ⭐ Bassa               |
| **Popolarità**  | ⭐⭐⭐ Media           |
| **Federazioni** | Informale              |

**Come funziona**: Respawn continuo con breve penalità tempo. Il punteggio si basa su kill totali o
tempo di controllo aree. Ritmo frenetico, partite brevi e intense.

**Supporto TicOps App**:

- ✅ Timer respawn automatico
- ✅ Kill counter live
- ✅ Leaderboard istantanea

---

### 🏆 1.9 Pattuglie Combat - FIPS PCS

**Competizione ufficiale.** Campionato nazionale con scenari tattici standardizzati, arbitri
certificati e punteggi federali.

| Caratteristica  | Dettaglio                |
| --------------- | ------------------------ |
| **Durata**      | 6-12 ore (evento)        |
| **Giocatori**   | 5-8 per squadra          |
| **Complessità** | ⭐⭐⭐⭐ Professionale   |
| **Popolarità**  | ⭐⭐ Bassa (competitivo) |
| **Federazioni** | FIPS PCS                 |

**Come funziona**: Squadre affiliate FIPS competono in gironi con scenari definiti dal regolamento
ONASP. Arbitri certificati valutano le prestazioni. I risultati confluiscono nelle classifiche
nazionali.

**Supporto TicOps App**:

- ✅ Integrazione calendario FIPS
- ✅ Iscrizione squadre online
- ✅ Visualizzazione classifiche ufficiali

**🔮 Con IoT**: Video Judge e arbitraggio digitale (vedi Parte 2)

---

## Parte 2: Modalità IoT-Enhanced (TicOps Tracking Kit)

Con l'introduzione del **TicOps IoT Tracking Kit** (previsto Q2 2026), le modalità tradizionali
vengono potenziate e diventano possibili nuove esperienze di gioco impossibili con la sola app.

### 🔧 Hardware del Kit IoT

| Componente         | Funzione                                                | Connettività           |
| ------------------ | ------------------------------------------------------- | ---------------------- |
| **Player Tracker** | Posizione GPS, accelerometro, giroscopio, hit detection | LoRa mesh + BLE        |
| **Smart Target**   | Obiettivi RFID/NFC per CTF, sensori impatto             | LoRa                   |
| **Field Beacon**   | Posizionamento indoor UWB, triangolazione <2m           | BLE 5.0                |
| **Tablet Field**   | Dashboard arbitro/game master, funziona offline         | WiFi/4G + LoRa gateway |
| **LoRa Gateway**   | Raccoglie dati dai dispositivi, sync con cloud          | LoRa + 4G/WiFi         |

### 📡 Architettura Offline-First

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHITETTURA TICOPS IOT                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [Player Tracker] ─────┐                                       │
│   [Player Tracker] ─────┼──── LoRa Mesh ────┐                   │
│   [Player Tracker] ─────┘                    │                  │
│                                              ▼                  │
│   [Smart Target] ────────────────────► [LoRa Gateway]           │
│   [Smart Target] ────────────────────►       │                  │
│                                              │                  │
│   [Field Beacon] ── BLE ── [Smartphone] ◄────┤                  │
│                                              │                  │
│                                              ▼                  │
│                                     [Tablet Field]              │
│                                     (Dashboard Offline)         │
│                                              │                  │
│   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─   │
│   │ SYNC: Live se connesso | Post-partita   │                │  │
│                                              ▼                  │
│                                     ☁️ TicOps Cloud              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Modalità Sync**:

- **Live Sync**: Se il campo ha copertura 4G/WiFi, tutti i dati fluiscono in tempo reale verso il
  cloud
- **Post-Partita Sync**: In assenza di connessione, il tablet e i dispositivi accumulano dati
  localmente. Al termine, collegando il gateway a una rete, tutto viene sincronizzato
  automaticamente

---

### 🚩 2.1 CTF Automatizzato

**Evoluzione del Capture the Flag con tracking oggettivo.**

**Cosa cambia con IoT**:

- Le bandiere sono dotate di **tag RFID** che rilevano automaticamente cattura e rilascio
- **Geofence** attorno alle basi: il sistema sa quando la bandiera entra/esce dalle zone
- **Score automatico**: nessuna dichiarazione manuale, il sistema registra tutto
- **Replay post-partita**: ricostruzione animata dei movimenti bandiera

**Hardware richiesto**: Smart Target (x2 bandiere), Field Beacon (per geofence basi)

---

### 🏚️ 2.2 CQB con Mappa 3D Live

**Controllo totale degli spazi indoor.**

**Cosa cambia con IoT**:

- **Mappa 3D in tempo reale** sul tablet arbitro con posizione di tutti i giocatori
- **Indoor positioning** tramite beacon UWB (precisione <2 metri anche senza GPS)
- **Shot counter**: il tracker rileva gli spari tramite accelerometro
- **Heatmap post-partita**: visualizzazione delle zone più contese

**Hardware richiesto**: Player Tracker (tutti), Field Beacon (rete indoor), Tablet Field

---

### 🎖️ 2.3 MilSim Command & Control

**Il quartier generale diventa digitale.**

**Cosa cambia con IoT**:

- **C2 Dashboard**: il comandante vede in tempo reale posizione di tutte le unità su mappa
- **Drone feed integration**: possibilità di integrare video da droni ricognitori
- **Supply chain tracking**: i rifornimenti hanno tag RFID, il sistema sa dove sono
- **Wearable vitals**: opzionalmente, i tracker possono rilevare "vite" rimanenti
- **Comunicazioni criptate**: canali radio con encryption per fazione

**Hardware richiesto**: Player Tracker (tutti), Smart Target (obiettivi), LoRa Gateway (multipli per
copertura), Tablet Field (comando)

---

### 🔭 2.4 Pattuglia GPS-Tracked

**Ricognizione con telemetria completa.**

**Cosa cambia con IoT**:

- **GPS tracking continuo** delle pattuglie su mappa
- **Heatmap movimenti**: il game master vede dove si sono mosse le pattuglie
- **Rapporti automatici**: check-in ai waypoint senza intervento manuale
- **Allarme perimetro**: notifica se una pattuglia esce dall'area assegnata

**Hardware richiesto**: Player Tracker (tutti i membri pattuglia), LoRa Gateway

---

### 🎯 2.5 Shooter Recon con Hit Detection

**Conferma kill automatica per cecchini.**

**Cosa cambia con IoT**:

- **Hit sensor** sui target: conferma automatica dei colpi a segno
- **Telemetria colpo**: distanza stimata, tempo di volo
- **Classifica precision**: punteggio basato su dati oggettivi
- **Replay ballistica**: ricostruzione grafica delle traiettorie

**Hardware richiesto**: Player Tracker con hit sensor (target), Smart Target (obiettivi fissi)

---

### 🏆 2.6 Arbitraggio Digitale FIPS

**Competizioni con standard broadcast.**

**Cosa cambia con IoT**:

- **Video Judge**: telecamere AI che tracciano i giocatori
- **Score sync FIPS**: punteggi inviati automaticamente ai server federali
- **Tablet arbitri**: interfaccia dedicata per segnalazioni e penalità
- **Instant replay**: contestazioni risolte con video review

**Hardware richiesto**: Player Tracker (tutti), Telecamere campo, Tablet Field (arbitri)

---

### 🆕 2.7 Domination (Nuova Modalità IoT)

**Controllo territoriale dinamico.** Una modalità completamente nuova possibile solo con l'hardware
IoT.

| Caratteristica  | Dettaglio         |
| --------------- | ----------------- |
| **Durata**      | 1-2 ore           |
| **Giocatori**   | 12-40             |
| **Complessità** | ⭐⭐⭐ Media-Alta |
| **Requisiti**   | Kit IoT completo  |

**Come funziona**: Sul campo sono posizionati 3-5 **Smart Target** (punti di controllo). Per
conquistare un punto, un giocatore deve rimanere in prossimità per 30 secondi senza essere
eliminato. Il sistema traccia automaticamente il tempo di possesso per ogni fazione. Vince chi
accumula più tempo totale o raggiunge un punteggio soglia.

**Meccaniche uniche**:

- **Contestazione**: se giocatori di entrambe le fazioni sono vicini, il punto è "contestato" e non
  accumula tempo
- **Bonus catena**: controllare 3+ punti contemporaneamente dà bonus punteggio
- **Notifiche live**: tutti i giocatori ricevono alert quando un punto cambia controllo

**Hardware richiesto**: Smart Target (3-5), Player Tracker (tutti), Tablet Field

---

### 🆕 2.8 Battle Royale Softair (Nuova Modalità IoT)

**Tutti contro tutti con zona che si restringe.** Esperienza ispirata ai videogiochi battle royale,
ora possibile nel softair reale.

| Caratteristica  | Dettaglio                 |
| --------------- | ------------------------- |
| **Durata**      | 30-60 minuti              |
| **Giocatori**   | 20-50 (individuali o duo) |
| **Complessità** | ⭐⭐⭐ Media-Alta         |
| **Requisiti**   | Kit IoT + campo ampio     |

**Come funziona**: I giocatori iniziano sparsi ai bordi del campo. Ogni 5 minuti, la "zona sicura"
si restringe (i confini sono virtuali, tracciati via GPS). Chi rimane fuori zona subisce penalità
(eliminazione dopo 60 secondi). L'ultimo sopravvissuto vince.

**Meccaniche uniche**:

- **Zona dinamica**: i confini sono visualizzati sull'app di ogni giocatore
- **Alert vibrante**: il tracker vibra quando si è vicini al bordo zona
- **Loot virtuale**: in punti specifici, i giocatori possono "raccogliere" bonus (extra vita,
  invisibilità temporanea sulla mappa)
- **Kill feed live**: tutti vedono chi elimina chi

**Hardware richiesto**: Player Tracker (tutti), LoRa Gateway (copertura ampia), Smart Target (punti
loot)

---

### 🆕 2.9 Escort / VIP Protection (Nuova Modalità IoT)

**Proteggere il bersaglio ad alto valore.**

| Caratteristica  | Dettaglio         |
| --------------- | ----------------- |
| **Durata**      | 30-60 minuti      |
| **Giocatori**   | 10-30             |
| **Complessità** | ⭐⭐⭐ Media-Alta |
| **Requisiti**   | Kit IoT           |

**Come funziona**: Una squadra deve scortare un "VIP" (giocatore speciale o manichino con tracker)
da un punto A a un punto B. L'altra squadra deve eliminare il VIP. Il VIP ha regole speciali (non
può sparare, o ha arma limitata).

**Meccaniche uniche**:

- **Tracking VIP**: la posizione del VIP è visibile alla squadra scorta, nascosta agli attaccanti
  (opzionale: visibile a intervalli)
- **Checkpoint bonus**: passare per waypoint intermedi dà punti extra
- **Timer pressione**: limite di tempo per completare la scorta

**Hardware richiesto**: Player Tracker (VIP + tutti), Smart Target (checkpoint), Tablet Field

---

## Parte 3: Matrice Comparativa

| Modalità          | Complessità | IoT Required       | Popolarità | Federazione | Offline Support |
| ----------------- | ----------- | ------------------ | ---------- | ----------- | --------------- |
| Skirmish          | ⭐          | ❌                 | ⭐⭐⭐⭐⭐ | Tutte       | ✅ Full         |
| Deathmatch        | ⭐⭐        | ❌                 | ⭐⭐⭐⭐⭐ | FIGT/FIPS   | ✅ Full         |
| CTF               | ⭐⭐        | ❌ (⚡ enhanced)   | ⭐⭐⭐⭐   | Tutte       | ✅ Full         |
| CQB               | ⭐⭐⭐      | ❌ (⚡ enhanced)   | ⭐⭐⭐     | FIGT        | ✅ Full         |
| MilSim            | ⭐⭐⭐⭐⭐  | ❌ (⚡⚡ enhanced) | ⭐⭐⭐     | FIPS/FIGT   | ✅ Full         |
| Pattuglia LR      | ⭐⭐⭐      | ❌ (⚡ enhanced)   | ⭐⭐       | FIGT        | ✅ Full         |
| Shooter Recon     | ⭐⭐⭐      | ❌ (⚡ enhanced)   | ⭐⭐       | FIGT        | ✅ Full         |
| Speedball         | ⭐          | ❌                 | ⭐⭐⭐     | Informale   | ✅ Full         |
| FIPS PCS          | ⭐⭐⭐⭐    | ❌ (⚡ enhanced)   | ⭐⭐       | FIPS        | ✅ Full         |
| **Domination**    | ⭐⭐⭐      | ✅ Required        | 🆕         | TicOps      | ✅ Full         |
| **Battle Royale** | ⭐⭐⭐      | ✅ Required        | 🆕         | TicOps      | ✅ Full         |
| **Escort VIP**    | ⭐⭐⭐      | ✅ Required        | 🆕         | TicOps      | ✅ Full         |

**Legenda**:

- ❌ = Non richiesto, funziona con app base
- ⚡ enhanced = Funziona senza IoT, ma l'esperienza migliora significativamente con hardware
- ✅ Required = Modalità possibile solo con kit IoT

---

## Parte 4: Roadmap Implementazione

### Fase 1 - App Base (✅ Disponibile)

Tutte le modalità tradizionali con autodichiarazione, radio PTT, classifiche.

### Fase 2 - IoT Beta (Q2 2026)

- Player Tracker MVP
- Smart Target per CTF/Domination
- Tablet Field dashboard

### Fase 3 - IoT Completo (Q4 2026)

- Indoor positioning (beacon network)
- Battle Royale con zona dinamica
- Integrazione video arbitraggio
- Sync federazioni FIPS/FIGT

---

## Note Tecniche per Sviluppatori

### Struttura Dati Modalità

```typescript
interface GameMode {
  id: string;
  name: string;
  description: string;
  duration: string;
  teamSize: string;
  complexity: 'bassa' | 'media' | 'alta' | 'professionale' | 'estremamente_alta';
  equipment: string[];
  rules: string[];
  iotRequired: boolean;
  iotEnhanced: boolean;
  ecosystemNeeds: string[];
  popularity: 'bassa' | 'media' | 'alta' | 'altissima';
  federation: string[];
  offlineSupport: 'full' | 'partial' | 'none';
}
```

### Priorità Sviluppo

1. **80% mercato**: Skirmish + Deathmatch (già in app)
2. **15% mercato**: CTF + CQB con enhancement IoT
3. **5% alto valore**: MilSim completo + Nuove modalità IoT

---

_Documento generato per TicOps Platform - Tutti i diritti riservati_

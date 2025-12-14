# Guida: Pagina di Maintenance con Cloudflare Workers

**Dominio:** tech-citizen.me  
**Tempo stimato:** 10-15 minuti  
**Prerequisiti:** Accesso alla dashboard Cloudflare con permessi di modifica

---

## Fase 1: Attivare il Proxy sui Record DNS

Il Worker funziona solo se il traffico passa attraverso Cloudflare. Dobbiamo attivare il proxy su
tutti i record.

1. Vai su **cloudflare.com** → Login → Seleziona **tech-citizen.me**
2. Nel menu laterale clicca su **DNS** → **Records**
3. Per ogni record nella lista, clicca su **Modifica** (icona matita)
4. Cambia lo **Stato proxy** da "Solo DNS" (nuvola grigia) a "Proxied" (nuvola arancione)
5. Clicca **Salva**

**Record da modificare:**

| Nome            | Tipo | Stato attuale     | Stato richiesto     |
| --------------- | ---- | ----------------- | ------------------- |
| app             | A    | Solo DNS (grigio) | Proxied (arancione) |
| auth            | A    | Solo DNS (grigio) | Proxied (arancione) |
| gateway         | A    | Solo DNS (grigio) | Proxied (arancione) |
| grafana         | A    | Solo DNS (grigio) | Proxied (arancione) |
| tech-citizen.me | A    | Solo DNS (grigio) | Proxied (arancione) |
| www             | A    | Solo DNS (grigio) | Proxied (arancione) |

> ⚠️ **Nota:** L'icona arancione significa che il traffico passa da Cloudflare. L'icona grigia
> significa che va diretto al server.

---

## Fase 2: Creare il Worker

1. Nel menu laterale clicca su **Workers & Pages**
2. Clicca il pulsante blu **Create**
3. Seleziona **Create Worker**
4. Come nome inserisci: `maintenance`
5. Clicca **Deploy** (ignora il codice di default per ora)
6. Dopo il deploy, clicca **Edit code**

---

## Fase 3: Inserire il Codice

Cancella tutto il codice esistente e incolla questo:

```javascript
export default {
  async fetch(request) {
    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};

const HTML = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manutenzione in corso - Tech Citizen</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 500px;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    p {
      color: #a0aec0;
      font-size: 1.1rem;
      line-height: 1.6;
    }
    .status {
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      font-size: 0.9rem;
      color: #68d391;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔧</div>
    <h1>Manutenzione in corso</h1>
    <p>Stiamo effettuando alcuni aggiornamenti per migliorare il servizio. Torneremo online a breve.</p>
    <div class="status">● Lavori in corso</div>
  </div>
</body>
</html>`;
```

Clicca **Deploy** in alto a destra.

---

## Fase 4: Configurare le Route

Ora dobbiamo dire a Cloudflare di usare questo Worker per tutto il traffico del dominio.

1. Dalla pagina del Worker, vai su **Settings** (tab in alto)
2. Scorri fino a **Domains & Routes**
3. Clicca **Add** → **Add route**
4. Aggiungi queste route una alla volta:

| Route                 | Zone            |
| --------------------- | --------------- |
| `*tech-citizen.me/*`  | tech-citizen.me |
| `*.tech-citizen.me/*` | tech-citizen.me |

> **Spiegazione:**
>
> - `*tech-citizen.me/*` cattura il dominio root (con e senza www)
> - `*.tech-citizen.me/*` cattura tutti i sottodomini (app, auth, gateway, grafana)

5. Clicca **Add route** per ciascuna

---

## Fase 5: Verifica

1. Apri il browser in modalità incognito
2. Visita questi URL e verifica che appaia la pagina di maintenance:
   - https://tech-citizen.me
   - https://www.tech-citizen.me
   - https://app.tech-citizen.me
   - https://auth.tech-citizen.me
   - https://gateway.tech-citizen.me
   - https://grafana.tech-citizen.me

---

## Come Disattivare la Maintenance

Quando i lavori sono finiti:

1. Vai su **Workers & Pages** → **maintenance**
2. Vai su **Settings** → **Domains & Routes**
3. Rimuovi entrambe le route (clicca sui tre puntini → **Remove**)

Il traffico tornerà immediatamente al server Hetzner.

> 💡 **Alternativa rapida:** Puoi anche disabilitare temporaneamente il Worker andando su
> **Settings** → **Disable** senza rimuovere le route.

---

## Troubleshooting

| Problema                            | Soluzione                                                         |
| ----------------------------------- | ----------------------------------------------------------------- |
| La pagina non appare                | Verifica che il proxy sia attivo (icona arancione) sui record DNS |
| Errore 1101                         | Il Worker ha un errore di sintassi. Controlla il codice           |
| Funziona solo su alcuni sottodomini | Verifica che la route `*.tech-citizen.me/*` sia configurata       |
| Vedo ancora il sito normale         | Svuota la cache del browser o prova in incognito                  |

---

## Contatti

In caso di problemi, contatta il team lead.

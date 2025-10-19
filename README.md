# 🧮 VisiCalc Tribute — v2.4 (standard PWA)

Foglio elettronico minimale ispirato a VisiCalc. Compatibile desktop e mobile, **offline-ready** con Service Worker.

## Funzioni principali
- Griglia **A..Z × 50 righe**
- **Formule** con operatori `+ - * / ( )` e riferimenti `A1`, `$A$1`, `A$1`, `$A1`
- Funzioni: `SUM`, `AVERAGE`, `MIN`, `MAX`, `IF`, `VLOOKUP` (alias `CERCA_VERT`)
- **Intervalli** rettangolari: es. `A1:B3`
- **Ricalcolo incrementale** (grafo dipendenze)
- **Multi-fogli** con tab (rinomina + aggiungi)
- **CSV import/export**
- **PWA**: `sw.js`, `manifest.webmanifest`

## Esempi rapidi
- `=A1+B1` → somma di due celle
- `=SUM(A1:B3)` → somma su intervallo
- `=AVERAGE(A1:B3)` → media
- `=IF(A1>10, "ALTO", "BASSO")`
- `=VLOOKUP(A1, A1:B9, 2, TRUE)`

## Note
- I valori testuali usati in espressioni vengono interpretati come `0`.
- I numeri con **virgola** (es. `3,5`) sono accettati: la virgola viene normalizzata a punto.
- Gli intervalli devono essere **continui e rettangolari**.

## File
- `index.html` — shell dell’app
- `styles.css` — stile
- `app.v2.4.js` — logica (engine formule, UI)
- `sw.js`, `manifest.webmanifest` — PWA
- `README.md`, `readme.html` — documentazione
- (opzionale) `legacy_ios8/` — build senza SW per Safari 8.4.1

## Licenza
MIT — © Alessandro Pezzali (pezzaliAPP)

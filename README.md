# 🧮 VisiCalc Tribute — PWA (offline)

Un **mini foglio elettronico** ispirato a VisiCalc:
- Griglia **A..Z × 50 righe**
- **Formule**: `=A1+B2`, operatori `+ - * /`, **parentesi**
- **Intervalli** e **SUM(range)** es. `=SUM(A1:B3)`
- **Salvataggio locale** (localStorage)
- **Export/Import CSV**
- **Offline-ready (PWA)** con `sw.js` e `manifest.webmanifest`

## ▶️ Uso rapido
1. Apri `index.html`
2. Seleziona una cella, scrivi nella barra formula (es. `=A1+B2*3`) e premi **↵ Applica**
3. **Freccette** per muoverti
4. Export/Import CSV dal menu in alto

## Limiti (v1)
- Ricalcolo **full-sheet** (semplice, non incrementale)
- Solo funzione **SUM(range)** (espandibile)
- Tratta riferimenti **non numerici** come `0` nelle espressioni

## Licenza
MIT — © Alessandro Pezzali (pezzaliAPP)

# 🧮 VisiCalc Tribute — pezzaliAPP

> Un omaggio interattivo alla **prima killer app** della storia (1979).  
> Il foglio elettronico che ha trasformato il personal computer da hobby a **strumento professionale**.

---

## 🔗 Link utili
- 🌐 **PWA** (demo/installabile): `index.html`
- 📖 **Guida rapida**: [`readme.html`](./readme.html)
- 🧮 **Formule supportate**: [`formulas_guide.html`](./formulas_guide.html)
- 🕰️ **Storia e dettagli tecnici**: [`visicalc_timeline.html`](./visicalc_timeline.html)

> **Offline**: funziona anche senza rete (Service Worker + Cache).

---

## ✨ Caratteristiche principali

| Categoria | Dettagli |
|---|---|
| **Griglia** | 26 colonne (A–Z) × 50 righe |
| **Formule** | `+`, `-`, `*`, `/`, `(`, `)` con riferimenti `A1`, `$A$1`, `A$1`, `$A1` |
| **Funzioni** | `SUM`, `AVERAGE`, `MIN`, `MAX`, `IF`, `VLOOKUP` *(alias IT: `CERCA_VERT` — implementazione minimale)* |
| **Intervalli** | Selezioni rettangolari tipo `A1:B3` |
| **I/O CSV** | **Export** (formule “raw”), **Import** (ricarica il foglio) |
| **Mobile UI** | Tastierino numerico + simboli, lettere **A–Z**, frecce direzionali, **↵ Enter** |
| **PWA** | Manifest + Service Worker, installabile su iOS/Android/Desktop |
| **Compatibilità** | **iOS 8.4.1 → iOS 26**, Android, Safari/Chrome/Edge |

> Le celle **vuote** sono rese **vuote** (niente “0” automatici). Se il valore digitato o il risultato è `0`, viene mostrato `0` correttamente.

---

## 🚀 Come si usa (3 step)

1. **Seleziona** una cella (es. `A1`).  
2. Scrivi nella **barra formula** (in alto) un **valore** o una **formula** e premi **Invio/↵**.  
3. Naviga con **frecce** (tastiera o pulsanti mobile).

**Esempi**:
```text
=A1+B1
=SUM(A1:B3)
=AVERAGE(B2:B10)
=IF(A1>10, "ALTO", "BASSO")
=VLOOKUP(A1, A1:B9, 2, TRUE)
```

---

## 📦 Struttura del progetto
```
VisiCalc-Tribute-PWA/
├── index.html
├── app.v2.6.js
├── sw.js
├── mobile.css
├── mobile-ui.js
├── index_splash_mobile_patch.js
├── readme.html
├── formulas_guide.html
├── visicalc_timeline.html
├── manifest.webmanifest
├── styles.css
├── .version
└── README.md
```

---

## 🛠️ Tecnico

- **JavaScript ES5 puro**, nessuna dipendenza (compatibile **Safari 8** / iOS 8.4.1).
- **PWA**: `manifest.webmanifest` + `sw.js` (cache strategy **cache-first**).
- **Temi**: CSS semplice, colori e layout coerenti con stile storico *VisiCalc*.
- **Prestazioni**: rendering leggero; ricalcolo attuale **full-pass** (semplice e affidabile).

> `VLOOKUP` è volutamente **minimale** per questa build di test; può essere esteso a 2D rigoroso (match esatto/approssimato, selezione della colonna, errori `#N/A`).

---

## 🗂️ Cronologia versioni

| Versione | Data | Note |
|---|---|---|
| **v2.6b4** | 2025‑10‑19 | Mobile UI migliorata, **Home** su tutte le pagine, **Storia** arricchita, celle vuote **senza zeri** |
| **v2.6**   | 2025‑10‑19 | Refactor engine, compatibilità iOS 8.4.1, splash screen |
| **v2.5**   | 2025‑10‑** | CSV I/O, stabilità formule base |
| **v2.1**   | 2025‑**‑** | Legacy iOS 8.4.1 |
| **v1.0**   | 2025‑**‑** | Prototipo desktop-only |

> File `.version` incluso per tracciamento build.

---

## 🧭 Roadmap (idee)

- [ ] **Ricalcolo incrementale** con grafo dipendenze
- [ ] **VLOOKUP** 2D completo (`FALSE/TRUE`, sort, errori)
- [ ] **Assoluti/relativi** raffinati in spostamenti/copia incolla
- [ ] **Multi-sheet** con rinomina schede
- [ ] **Localizzazione** funzioni IT/EN selezionabile da menu

---

## 🕰️ Perché VisiCalc conta ancora (1979 → oggi)

> “VisiCalc era la ragione per cui la gente comprava l’Apple II… la prima app che rese **necessario** avere un personal computer.” — *Steve Jobs (1994)*

Con VisiCalc, la logica aziendale e il pensiero analitico diventano **visibili e dinamici**: è il paradigma che ha dato origine a 1‑2‑3, Excel e agli attuali fogli cloud.

---

## 📜 Licenza

**MIT License**  
© 2025 **Alessandro Pezzali — pezzaliAPP**


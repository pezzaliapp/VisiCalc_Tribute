# 🧮 VisiCalc Tribute v2 — PWA
**Novità**:
- Funzioni: `AVERAGE`, `MIN`, `MAX`, `IF`, `VLOOKUP` (`CERCA_VERT`)
- **Multi-sheets** con rinomina e aggiunta
- **Ricalcolo incrementale** (grafo dipendenze)
- Riferimenti **$A$1** accettati (utile per futuri “fill”)
- Build **Legacy iOS 8** (senza SW/manifest), cartella `legacy_ios8/`

## Uso rapido
- Formula: `=IF(A1>10, SUM(A1:B2), AVERAGE(A1:B2))`
- Lookup: `=VLOOKUP(E2, A1:C20, 3, TRUE)`

## Limiti
- Copia/riempimento non implementati (i `$` sono accettati ma servono soprattutto per compatibilità)

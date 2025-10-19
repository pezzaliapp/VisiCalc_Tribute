VisiCalc Tribute — pezzaliAPP (v2.6 Mobile) — ADD-ON

Cos'è
- Splash screen 2s elegante e silenzioso
- Rilevamento automatico iPhone/Android
- Tastierino mobile con operatori, lettere A–Z e frecce
- Supporto rotazione schermo

Installazione (30 secondi)
1) Copia questi file accanto al tuo index.html della PWA:
   - mobile.css
   - mobile-ui.js
   - index_splash_mobile_patch.js
   - manifest.webmanifest  (se vuoi aggiornare nome/tema)
   - .version
2) In index.html aggiungi PRIMA di </body>:
   <script src="./index_splash_mobile_patch.js"></script>
3) Assicurati che nel <head> tu abbia:
   <link rel="manifest" href="./manifest.webmanifest">
   (se già presente, lascia quello esistente)

Compatibilità
- iOS 8.4.1 → iOS 26, Android Chrome, Safari/Edge/Chrome desktop

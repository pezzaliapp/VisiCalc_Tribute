(function(){
  const UI = {
    play:   document.getElementById('ab-play'),
    pause:  document.getElementById('ab-pause'),
    resume: document.getElementById('ab-resume'),
    stop:   document.getElementById('ab-stop'),
    rate:   document.getElementById('ab-rate'),
    rateVal:document.getElementById('ab-rate-val'),
    mode:   document.getElementById('ab-mode'),
    progress: document.getElementById('ab-progress'),
  };
  const supportsTTS = 'speechSynthesis' in window;
  let audioEl = null;
  async function probeAudioFiles(){
    try{
      const mp3 = await fetch('./readme_it.mp3', {method:'HEAD'});
      if(mp3.ok) return 'readme_it.mp3';
      const wav = await fetch('./readme_it.wav', {method:'HEAD'});
      if(wav.ok) return 'readme_it.wav';
    }catch(e){}
    return null;
  }
  function extractText(){
    const root = document.querySelector('main') || document.body;
    const clone = root.cloneNode(true);
    clone.querySelectorAll('script,style,nav,header,footer').forEach(n=>n.remove());
    return clone.innerText.replace(/\s+\n/g, '\n').replace(/\n{2,}/g, '\n\n').trim();
  }
  function splitIntoSentences(text){
    return text.split(/(?<=[\.\?\!])\s+|\n{2,}/g).map(s => s.trim()).filter(Boolean);
  }
  function highlight(sentence){
    UI.progress.innerHTML = '<em>Leggendo:</em> ' + (sentence||'').replace(/</g,'&lt;');
  }
  function pickItalianVoice(){
    const voices = speechSynthesis.getVoices() || [];
    const pref = ['Luca','Diego','Paolo','Italo','Federico','Maurizio'];
    for(const name of pref){
      const v = voices.find(v => (v.name||'').toLowerCase().includes(name.toLowerCase()) || (v.lang||'').toLowerCase()==='it-it');
      if(v) return v;
    }
    return voices.find(v => (v.lang||'').toLowerCase()==='it-it') || voices[0] || null;
  }
  function speakSentences(sentences, rate){
    let idx = 0;
    const say = () => {
      if(idx >= sentences.length) return;
      const u = new SpeechSynthesisUtterance(sentences[idx]);
      const voice = pickItalianVoice();
      if(voice) u.voice = voice;
      u.lang = (voice && voice.lang) || 'it-IT';
      u.rate = rate || 1.0;
      u.onstart = () => highlight(sentences[idx]);
      u.onend = () => { idx++; say(); };
      speechSynthesis.speak(u);
    };
    say();
  }
  function cancelTTS(){ try{ speechSynthesis.cancel(); }catch(e){} }
  (async function init(){
    const candidate = await probeAudioFiles();
    if(candidate){
      UI.mode.textContent = 'Modalità: file audio locale (' + candidate + ')';
      audioEl = new Audio(candidate);
      setupAudioControls();
    }else if(supportsTTS){
      UI.mode.textContent = 'Modalità: sintesi vocale (Web Speech API)';
      setupTTSControls();
    }else{
      UI.mode.textContent = 'Modalità: nessun supporto audio — aggiungi readme_it.mp3 o .wav';
      disableAll();
    }
  })();
  function setupAudioControls(){
    UI.play.addEventListener('click', () => { try{ audioEl.currentTime = 0; audioEl.play(); }catch(e){} });
    UI.pause.addEventListener('click', () => { try{ audioEl.pause(); }catch(e){} });
    UI.resume.addEventListener('click', () => { try{ audioEl.play(); }catch(e){} });
    UI.stop.addEventListener('click', () => { try{ audioEl.pause(); audioEl.currentTime=0; }catch(e){} });
    UI.rate.addEventListener('input', () => {
      UI.rateVal.textContent = Number(UI.rate.value).toFixed(2)+'×';
      try{ audioEl.playbackRate = parseFloat(UI.rate.value)||1.0; }catch(e){}
    });
    audioEl.addEventListener('timeupdate', () => {
      UI.progress.textContent = 'Posizione: ' + audioEl.currentTime.toFixed(1) + 's';
    });
  }
  function setupTTSControls(){
    UI.play.addEventListener('click', () => {
      cancelTTS();
      const text = extractText();
      const sentences = splitIntoSentences(text);
      highlight('');
      const rate = parseFloat(UI.rate.value)||1.0;
      speakSentences(sentences, rate);
    });
    UI.pause.addEventListener('click', () => { try{ speechSynthesis.pause(); }catch(e){} });
    UI.resume.addEventListener('click', () => { try{ speechSynthesis.resume(); }catch(e){} });
    UI.stop.addEventListener('click', () => { cancelTTS(); UI.progress.textContent = ''; });
    UI.rate.addEventListener('input', () => {
      UI.rateVal.textContent = Number(UI.rate.value).toFixed(2)+'×';
    });
    if ('onvoiceschanged' in speechSynthesis) speechSynthesis.onvoiceschanged = function(){};
  }
  function disableAll(){
    [UI.play, UI.pause, UI.resume, UI.stop, UI.rate].forEach(b => { if(b){ b.disabled = true; } });
  }
})();
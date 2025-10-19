/* mobile-ui.js — VisiCalc Mobile UI (Safari iOS 8.4.1+) */
(function(){
  function getEditorEl(){
    var el = document.getElementById('formula-input') ||
             document.getElementById('formula') ||
             document.getElementById('fx') ||
             document.getElementById('cell-input') ||
             document.querySelector('input[type="text"].formula, .formula input, #formulaBar input');
    if(!el){
      var cand = document.querySelector('header input, .topbar input, input[type="text"]');
      if(cand) el = cand;
    }
    return el || null;
  }
  function dispatchInputEvent(el){
    try{ var e = document.createEvent('Event'); e.initEvent('input', true, true); el.dispatchEvent(e);}catch(_){}
  }
  function insertText(txt){
    var el = getEditorEl(); if(!el) return;
    var s = el.selectionStart, t = el.selectionEnd;
    if(typeof s !== 'number'){ el.value = (el.value || '') + txt; }
    else{
      var v = el.value || '';
      el.value = v.slice(0, s) + txt + v.slice(t);
      el.selectionStart = el.selectionEnd = s + txt.length;
    }
    el.focus(); dispatchInputEvent(el);
  }
  function backspace(){
    var el = getEditorEl(); if(!el) return;
    var v = el.value || ''; var s = el.selectionStart, t = el.selectionEnd;
    if(typeof s !== 'number' || s === t){ el.value = v.slice(0, v.length-1); }
    else{ el.value = v.slice(0, s) + v.slice(t); el.selectionStart = el.selectionEnd = s; }
    el.focus(); dispatchInputEvent(el);
  }
  function clearAll(){
    var el = getEditorEl(); if(!el) return; el.value=''; el.focus(); dispatchInputEvent(el);
  }
  function keyEventToGrid(code, key){
    var target = document.querySelector('.grid, .sheet, table, body') || document.body;
    try{ var e = document.createEvent('KeyboardEvent'); e.initEvent('keydown', true, true);
      e.keyCode = code; e.which = code; e.key = key; target.dispatchEvent(e);}catch(_){}
  }
  function enterCommit(){
    var el = getEditorEl();
    if(el){ try{ var e = document.createEvent('KeyboardEvent'); e.initEvent('keydown', true, true);
      e.keyCode=13; e.which=13; e.key='Enter'; el.dispatchEvent(e);}catch(_){}
      el.blur(); setTimeout(function(){ el.focus(); }, 0);
    }
    keyEventToGrid(13, 'Enter');
  }
  function move(dir){
    var codes = {left:37, up:38, right:39, down:40};
    keyEventToGrid(codes[dir], 'Arrow'+dir.charAt(0).toUpperCase()+dir.slice(1));
  }
  function buildUI(){
    var bar = document.createElement('div');
    bar.className = 'vc-mobile-bar';
    bar.innerHTML =
      '<div class="vc-mobile-top">'+
        '<input id="vc_m_input" class="vc-input" placeholder="Formula / valore..." autocomplete="off">'+
        '<button class="vc-mobile-btn small" id="vc_m_paste">Incolla</button>'+
      '</div>'+
      '<div class="vc-mobile-pane">'+
        '<div class="vc-mobile-row scroll" id="vc_m_letters"></div>'+
        '<div class="vc-mobile-row" id="vc_m_row1"></div>'+
        '<div class="vc-mobile-row" id="vc_m_row2"></div>'+
        '<div class="vc-mobile-row" id="vc_m_row3"></div>'+
        '<div class="vc-mobile-row" id="vc_m_arrows"></div>'+
        '<div class="vc-mobile-label">Suggerimento: usa “$” per riferimenti assoluti, “:” per intervalli.</div>'+
      '</div>';
    document.body.appendChild(bar);
    var letters = document.getElementById('vc_m_letters');
    for(var i=65;i<=90;i++){
      var b = document.createElement('button'); b.className='vc-mobile-btn small';
      b.textContent = String.fromCharCode(i);
      (function(ch){ b.onclick=function(){ insertText(ch); syncInput(); }; })(b.textContent);
      letters.appendChild(b);
    }
    makeButtons('vc_m_row1', ['7','8','9','+','-']);
    makeButtons('vc_m_row2', ['4','5','6','*','/']);
    makeButtons('vc_m_row3', ['1','2','3','(',')','0','.',',','=','$',':','C','AC','↵']);
    var arrows = document.getElementById('vc_m_arrows');
    addBtn(arrows, '↑', function(){ move('up'); });
    addBtn(arrows, '↓', function(){ move('down'); });
    addBtn(arrows, '←', function(){ move('left'); });
    addBtn(arrows, '→', function(){ move('right'); });
    var topInput = document.getElementById('vc_m_input');
    topInput.addEventListener('input', function(){
      var el = getEditorEl(); if(!el) return; el.value = topInput.value; dispatchInputEvent(el);
    });
    var el = getEditorEl(); if(el){ el.addEventListener('input', syncInput); syncInput(); }
    var pasteBtn = document.getElementById('vc_m_paste');
    pasteBtn.onclick = function(){
      var text = window.prompt('Incolla il testo qui e premi OK:','');
      if(text!=null){ insertText(text); syncInput(); }
    };
    function onResize(){
      if(window.innerWidth > window.innerHeight){
        document.body.className += ' vc-landscape';
      }else{
        document.body.className = document.body.className.replace(' vc-landscape','');
      }
    }
    window.addEventListener('resize', onResize, false);
    window.addEventListener('orientationchange', onResize, false);
    onResize();
    function syncInput(){ var e = getEditorEl(); if(!e) return; topInput.value = e.value || ''; }
    function addBtn(row, label, handler){
      var b = document.createElement('button'); b.className='vc-mobile-btn'; b.textContent=label;
      b.onclick=function(){ handler(); }; row.appendChild(b);
    }
    function makeButtons(rowId, labels){
      var row = document.getElementById(rowId);
      for(var i=0;i<labels.length;i++){
        (function(lbl){
          var b = document.createElement('button'); b.className='vc-mobile-btn'; b.textContent = lbl;
          b.onclick=function(){
            if(lbl==='C'){ backspace(); syncInput(); return; }
            if(lbl==='AC'){ clearAll(); syncInput(); return; }
            if(lbl==='↵' || lbl==='=↵'){ enterCommit(); return; }
            insertText(lbl); syncInput();
          };
          row.appendChild(b);
        })(labels[i]);
      }
    }
  }
  function isSmallScreen(){ return Math.min(window.innerWidth, window.innerHeight) <= 820; }
  var touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if(touch && isSmallScreen()){
    if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', buildUI); }
    else{ buildUI(); }
  }
})();
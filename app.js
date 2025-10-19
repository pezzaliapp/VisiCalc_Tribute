/* VisiCalc Tribute — app.js — ES5 compatible — MIT
 * Funzioni principali:
 * - Griglia A..Z x 50
 * - Formule: =A1+B2, numeri, + - * /, parentesi
 * - SUM(range) con range tipo A1:B3
 * - Ricalcolo completo (semplice) ad ogni modifica
 * - Salvataggio in localStorage
 * - Import/Export CSV
*/
(function(){
  var COLS = 26; // A..Z
  var ROWS = 50;
  var STORAGE_KEY = 'visicalc_worksheet_v1';

  var sheetEl = document.getElementById('sheet');
  var formulaEl = document.getElementById('formula');
  var labelCellEl = document.getElementById('label-cell');
  var statusEl = document.getElementById('status-text');

  var btnApply = document.getElementById('apply');
  var btnNew = document.getElementById('btn-new');
  var btnExport = document.getElementById('btn-export');
  var fileImport = document.getElementById('file-import');
  var btnHelp = document.getElementById('btn-help');

  // Modello dati: per ogni cella salviamo {v: valore_calcolato, f: formula_testuale}
  var data = createEmptyData();

  // ---- Utility lettere colonne ----
  function colName(index){ return String.fromCharCode(65 + index); } // 0 -> A
  function isCellRef(tok){
    return /^[A-Z][1-9]\d*$/.test(tok);
  }
  function parseCellRef(ref){
    var m = /^([A-Z])([1-9]\d*)$/.exec(ref);
    if(!m) return null;
    var col = m[1].charCodeAt(0) - 65;
    var row = parseInt(m[2],10) - 1;
    return {col:col,row:row};
  }
  function inBounds(rc){ return rc && rc.col>=0 && rc.col<COLS && rc.row>=0 && rc.row<ROWS; }

  function createEmptyData(){
    var arr = new Array(ROWS);
    for(var r=0;r<ROWS;r++){
      arr[r] = new Array(COLS);
      for(var c=0;c<COLS;c++){
        arr[r][c] = { v: '', f: '' };
      }
    }
    return arr;
  }

  function save(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      status('Salvato.');
    }catch(e){ status('⚠️ Salvataggio non riuscito'); }
  }
  function load(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        var obj = JSON.parse(raw);
        if(obj && obj.length === ROWS){
          data = obj;
        }
      }
    }catch(e){ /* ignore */ }
  }

  // ---- CSV ----
  function exportCSV(){
    var lines = [];
    for(var r=0;r<ROWS;r++){
      var rowVals = [];
      for(var c=0;c<COLS;c++){
        var f = data[r][c].f;
        var out = f ? f : (data[r][c].v + '');
        // Quote se contiene virgole o virgolette
        if(/[",\n]/.test(out)){
          out = '"' + out.replace(/"/g,'""') + '"';
        }
        rowVals.push(out);
      }
      lines.push(rowVals.join(','));
    }
    var blob = new Blob([lines.join('\n')], {type:'text/csv'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'visicalc_tribute.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importCSV(text){
    var rows = parseCSV(text);
    var maxR = Math.min(rows.length, ROWS);
    for(var r=0;r<maxR;r++){
      var cols = rows[r];
      var maxC = Math.min(cols.length, COLS);
      for(var c=0;c<maxC;c++){
        var val = cols[c];
        // Se inizia con '=' trattiamo come formula, altrimenti valore
        if(typeof val === 'string' && val.length>0 && val[0] === '='){
          data[r][c].f = val;
        }else{
          data[r][c].f = '';
          data[r][c].v = val;
        }
      }
    }
    recalcAll();
    renderValues();
    save();
  }

  function parseCSV(text){
    // Parser CSV semplice (virgolette e separatore ,)
    var res = [];
    var i=0, cur='', row=[], inQuotes=false;
    while(i<text.length){
      var ch = text[i++];
      if(inQuotes){
        if(ch === '"'){
          if(i<text.length && text[i] === '"'){ cur+='"'; i++; }
          else inQuotes=false;
        }else cur += ch;
      }else{
        if(ch === '"'){ inQuotes=true; }
        else if(ch === ','){ row.push(cur); cur=''; }
        else if(ch === '\n'){ row.push(cur); res.push(row); row=[]; cur=''; }
        else if(ch === '\r'){ /* ignore */ }
        else cur += ch;
      }
    }
    row.push(cur); res.push(row);
    return res;
  }

  // ---- Formula engine (semplice) ----
  // Supporto: numeri, + - * /, (), riferimenti cella (es. A1), SUM(A1:B3)
  function evalCell(r, c, visiting){
    var cell = data[r][c];
    if(!cell) return '';
    if(cell.f && cell.f.charAt(0) === '='){
      try{
        // Rilevamento loop
        var key = r+':'+c;
        if(visiting[key]) throw new Error('Riferimenti circolari');
        visiting[key] = 1;

        var expr = cell.f.substring(1);
        var val = evalExpr(expr, visiting);
        visiting[key] = 0;
        return val;
      }catch(e){
        return 'ERR';
      }
    }
    // valore diretto
    var num = parseFloat(cell.v);
    if(!isNaN(num) && (cell.v === 0 || (typeof cell.v === 'number') || /^[\+\-]?\d+(\.\d+)?$/.test(cell.v+''))){
      return num;
    }
    return cell.v || '';
  }

  function evalExpr(expr, visiting){
    // Tokenizzazione molto semplice: sostituiamo riferimenti cella e SUM()
    expr = expr.toUpperCase();
    // Gestione SUM(range)
    expr = expr.replace(/SUM\(\s*([A-Z][1-9]\d*):([A-Z][1-9]\d*)\s*\)/g, function(_, a, b){
      var rng = expandRange(a,b);
      var sum = 0;
      for(var i=0;i<rng.length;i++){
        var rc = rng[i];
        var v = evalCell(rc.row, rc.col, visiting);
        var n = parseFloat(v);
        if(!isNaN(n)) sum += n;
      }
      return String(sum);
    });

    // Rimpiazza riferimenti singoli (A1) con i valori
    expr = expr.replace(/\b([A-Z][1-9]\d*)\b/g, function(_, ref){
      var rc = parseCellRef(ref);
      if(!inBounds(rc)) return '0';
      var v = evalCell(rc.row, rc.col, visiting);
      var n = parseFloat(v);
      if(!isNaN(n)) return String(n);
      // se non numerico, lo trattiamo come 0
      return '0';
    });

    // Ora l'espressione contiene solo numeri, + - * / e parentesi.
    // Usiamo Function per valutare in modo sicuro? Manteniamo whitelist:
    if(!/^[0-9\.\+\-\*\/\(\)\s]+$/.test(expr)) throw new Error('Espressione non valida');
    // Eval aritmetico
    /* eslint no-new-func: "off" */
    return Function('"use strict";return (' + expr + ')')();
  }

  function expandRange(a, b){
    var A = parseCellRef(a), B = parseCellRef(b);
    if(!inBounds(A) || !inBounds(B)) return [];
    var r0 = Math.min(A.row, B.row), r1 = Math.max(A.row, B.row);
    var c0 = Math.min(A.col, B.col), c1 = Math.max(A.col, B.col);
    var out = [];
    for(var r=r0;r<=r1;r++){
      for(var c=c0;c<=c1;c++){
        out.push({row:r,col:c});
      }
    }
    return out;
  }

  function recalcAll(){
    // Ricalcolo semplice: visita ogni cella ed eval
    for(var r=0;r<ROWS;r++){
      for(var c=0;c<COLS;c++){
        var val = evalCell(r,c,{});
        data[r][c].v = val;
      }
    }
  }

  // ---- Rendering ----
  var current = {row:0,col:0};
  function render(){
    var table = document.createElement('table');
    table.className = 'grid';

    var thead = document.createElement('thead');
    var trh = document.createElement('tr');
    var thCorner = document.createElement('th'); thCorner.className='corner'; thCorner.textContent='';
    trh.appendChild(thCorner);
    for(var c=0;c<COLS;c++){
      var th = document.createElement('th');
      th.textContent = colName(c);
      trh.appendChild(th);
    }
    thead.appendChild(trh);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    for(var r=0;r<ROWS;r++){
      var tr = document.createElement('tr');
      var thRow = document.createElement('th');
      thRow.className='rowhead';
      thRow.textContent = (r+1);
      tr.appendChild(thRow);
      for(var c=0;c<COLS;c++){
        var td = document.createElement('td');
        td.tabIndex = 0;
        td.className = 'cell';
        td.setAttribute('data-r', r);
        td.setAttribute('data-c', c);
        td.textContent = displayValue(data[r][c]);
        td.addEventListener('focus', onCellFocus);
        td.addEventListener('dblclick', onCellEdit);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    sheetEl.innerHTML = '';
    sheetEl.appendChild(table);
    updateIndicator();
  }

  function displayValue(cell){
    if(cell.f && cell.f.charAt(0)==='='){
      // Mostra valore calcolato
      return (cell.v === undefined || cell.v === null) ? '' : String(cell.v);
    }else{
      return (cell.v === undefined || cell.v === null) ? '' : String(cell.v);
    }
  }

  function renderValues(){
    var tds = sheetEl.querySelectorAll('.cell');
    for(var i=0;i<tds.length;i++){
      var td = tds[i];
      var r = parseInt(td.getAttribute('data-r'),10);
      var c = parseInt(td.getAttribute('data-c'),10);
      td.textContent = displayValue(data[r][c]);
    }
  }

  function onCellFocus(e){
    var r = parseInt(this.getAttribute('data-r'),10);
    var c = parseInt(this.getAttribute('data-c'),10);
    current.row = r; current.col = c;
    updateIndicator();
    // Aggiorna formula bar
    var f = data[r][c].f;
    if(f){ formulaEl.value = f; }
    else formulaEl.value = String(data[r][c].v || '');
  }

  function onCellEdit(e){
    // Doppio click: metti formula nell'input e focus
    var r = parseInt(this.getAttribute('data-r'),10);
    var c = parseInt(this.getAttribute('data-c'),10);
    var f = data[r][c].f;
    if(f){ formulaEl.value = f; }
    else formulaEl.value = String(data[r][c].v || '');
    formulaEl.focus();
    formulaEl.select();
  }

  function updateIndicator(){
    labelCellEl.textContent = colName(current.col) + (current.row+1);
  }

  function setCellFromFormulaBar(){
    var text = formulaEl.value || '';
    var r = current.row, c = current.col;
    if(text.length>0 && text.charAt(0) === '='){
      data[r][c].f = text;
    }else{
      data[r][c].f = '';
      data[r][c].v = text;
    }
    recalcAll();
    renderValues();
    save();
    status('Aggiornato ' + colName(c)+(r+1));
    // Focus torna alla cella
    focusCell(r,c);
  }

  function focusCell(r,c){
    var td = sheetEl.querySelector('.cell[data-r="'+r+'"][data-c="'+c+'"]');
    if(td) td.focus();
  }

  function status(t){
    statusEl.textContent = t;
    setTimeout(function(){ statusEl.textContent = 'Pronto.'; }, 2000);
  }

  // Tasti: Invio applica, frecce muovono
  formulaEl.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
      setCellFromFormulaBar();
      e.preventDefault();
    }
  });
  btnApply.addEventListener('click', setCellFromFormulaBar);

  document.addEventListener('keydown', function(e){
    var r = current.row, c = current.col;
    if(e.key === 'ArrowRight'){ c = Math.min(COLS-1, c+1); }
    else if(e.key === 'ArrowLeft'){ c = Math.max(0, c-1); }
    else if(e.key === 'ArrowDown'){ r = Math.min(ROWS-1, r+1); }
    else if(e.key === 'ArrowUp'){ r = Math.max(0, r-1); }
    else if(e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey){
      // Inserimento diretto
      formulaEl.value = e.key;
      formulaEl.focus();
      formulaEl.select();
      return;
    }else{
      return;
    }
    current.row=r; current.col=c; updateIndicator();
    focusCell(r,c);
    e.preventDefault();
  });

  // Nuovo (svuota)
  btnNew.addEventListener('click', function(){
    if(confirm('Sicuro di voler svuotare il foglio?')){
      data = createEmptyData();
      recalcAll(); renderValues(); save();
    }
  });

  // Export / Import
  btnExport.addEventListener('click', exportCSV);
  fileImport.addEventListener('change', function(){
    var f = fileImport.files[0];
    if(!f) return;
    var reader = new FileReader();
    reader.onload = function(){ importCSV(String(reader.result||'')); };
    reader.readAsText(f);
    fileImport.value = '';
  });

  // Help
  btnHelp.addEventListener('click', function(){
    alert([
      'VisiCalc Tribute — comandi rapidi:',
      '- Seleziona una cella (freccette per muoverti).',
      '- Scrivi nel campo formula:',
      '  · Numeri:  123  o  3.14',
      '  · Formule: =A1+B2*3',
      '  · Somma:   =SUM(A1:B3)',
      '- Invio o pulsante "Applica" per salvare.',
      '- Export/Import CSV dal menu in alto.',
      '',
      'Dati salvati automaticamente in locale (localStorage).'
    ].join('\n'));
  });

  // ---- Boot ----
  load();
  recalcAll();
  render();
  renderValues();
})();
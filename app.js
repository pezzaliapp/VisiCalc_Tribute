/* VisiCalc Tribute v2 — app.js — ES5 — MIT
 * - Multi-sheets con tab, rinomina e aggiunta
 * - Engine formule esteso: SUM, AVERAGE, MIN, MAX, IF, VLOOKUP (alias CERCA_VERT)
 * - Riferimenti $A$1, A$1, $A1 accettati (per ora usati solo in parsing; il "fill" non è implementato)
 * - Ricalcolo incrementale con grafo di dipendenze
*/
(function(){
  var COLS = 26; // A..Z
  var ROWS = 50;
  var STORAGE_KEY = 'visicalc_v2_book';

  var sheetEl = document.getElementById('sheet');
  var formulaEl = document.getElementById('formula');
  var labelCellEl = document.getElementById('label-cell');
  var statusEl = document.getElementById('status-text');
  var tabsEl = document.getElementById('tabs');

  var btnApply = document.getElementById('apply');
  var btnNew = document.getElementById('btn-new');
  var btnExport = document.getElementById('btn-export');
  var fileImport = document.getElementById('file-import');
  var btnHelp = document.getElementById('btn-help');

  // Cartella di lavoro: array di sheets
  // each sheet: { name, data[ROWS][COLS]: {v, f}, deps: Map dep->setOfDependents }
  var book = [];
  var active = 0;
  var current = {row:0,col:0};

  // ---- Utility colonne/righe ----
  function colName(index){ return String.fromCharCode(65 + index); } // 0 -> A
  function isCellRef(tok){
    return /^\$?[A-Z]\$?[1-9]\d*$/.test(tok);
  }
  function normalizeRef(ref){ // remove $ for evaluation (copy-fill not implemented)
    return ref.replace(/\$/g,'');
  }
  function parseCellRef(ref){
    ref = normalizeRef(ref);
    var m = /^([A-Z])([1-9]\d*)$/.exec(ref);
    if(!m) return null;
    var col = m[1].charCodeAt(0) - 65;
    var row = parseInt(m[2],10) - 1;
    return {col:col,row:row};
  }
  function inBounds(rc){ return rc && rc.col>=0 && rc.col<COLS && rc.row>=0 && rc.row<ROWS; }

  function createEmptySheet(name){
    var data = new Array(ROWS);
    for(var r=0;r<ROWS;r++){
      data[r] = new Array(COLS);
      for(var c=0;c<COLS;c++){
        data[r][c] = { v:'', f:'' };
      }
    }
    return { name: name||('Foglio '+(book.length+1)), data: data, deps: {} };
  }

  function load(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        var obj = JSON.parse(raw);
        if(obj && obj.book && obj.book.length){
          book = obj.book;
          active = obj.active||0;
          // ensure deps exist
          for(var i=0;i<book.length;i++){ if(!book[i].deps) book[i].deps = {}; }
          return;
        }
      }
    }catch(e){}
    book = [ createEmptySheet('Foglio 1') ];
    active = 0;
  }
  function save(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify({book:book, active:active}));
      status('Salvato.');
    }catch(e){ status('⚠️ Salvataggio non riuscito'); }
  }

  // ---- Tabs UI ----
  function renderTabs(){
    tabsEl.innerHTML='';
    for(var i=0;i<book.length;i++){
      (function(i){
        var t = document.createElement('div');
        t.className = 'tab'+(i===active?' active':'');
        var name = document.createElement('span');
        name.className='name';
        name.textContent = book[i].name;
        t.appendChild(name);
        var rn = document.createElement('button');
        rn.className='rename';
        rn.textContent='✎';
        rn.title='Rinomina foglio';
        rn.addEventListener('click', function(e){
          e.stopPropagation();
          var nn = prompt('Nuovo nome foglio:', book[i].name);
          if(nn){ book[i].name = nn; renderTabs(); save(); }
        });
        t.appendChild(rn);
        t.addEventListener('click', function(){
          active = i; render(); renderValues(); renderTabs(); save();
        });
        tabsEl.appendChild(t);
      })(i);
    }
    // Add tab
    var add = document.createElement('button');
    add.className='tab';
    add.textContent='+ Nuovo foglio';
    add.addEventListener('click', function(){
      book.push(createEmptySheet());
      active = book.length-1;
      rebuildDeps(active);
      renderTabs(); render(); renderValues(); save();
    });
    tabsEl.appendChild(add);
  }

  // ---- CSV (opera sul foglio attivo) ----
  function exportCSV(){
    var sheet = book[active].data;
    var lines = [];
    for(var r=0;r<ROWS;r++){
      var rowVals = [];
      for(var c=0;c<COLS;c++){
        var cell = sheet[r][c];
        var out = cell.f ? cell.f : (cell.v + '');
        if(/[",\n]/.test(out)){ out = '"' + out.replace(/"/g,'""') + '"'; }
        rowVals.push(out);
      }
      lines.push(rowVals.join(','));
    }
    var blob = new Blob([lines.join('\n')], {type:'text/csv'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = (book[active].name||'foglio') + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function importCSV(text){
    var rows = parseCSV(text);
    var sheet = book[active].data;
    var maxR = Math.min(rows.length, ROWS);
    for(var r=0;r<maxR;r++){
      var cols = rows[r];
      var maxC = Math.min(cols.length, COLS);
      for(var c=0;c<maxC;c++){
        var val = cols[c];
        if(typeof val === 'string' && val.length>0 && val[0] === '='){ sheet[r][c].f = val; }
        else{ sheet[r][c].f = ''; sheet[r][c].v = val; }
      }
    }
    rebuildDeps(active);
    recalcAll(active);
    renderValues();
    save();
  }
  function parseCSV(text){
    var res = [], i=0, cur='', row=[], inQ=false;
    while(i<text.length){
      var ch = text[i++];
      if(inQ){
        if(ch === '"'){ if(i<text.length && text[i] === '"'){ cur+='"'; i++; } else inQ=false; }
        else cur += ch;
      }else{
        if(ch === '"') inQ=true;
        else if(ch === ','){ row.push(cur); cur=''; }
        else if(ch === '\n'){ row.push(cur); res.push(row); row=[]; cur=''; }
        else if(ch === '\r'){}
        else cur += ch;
      }
    }
    row.push(cur); res.push(row);
    return res;
  }

  // ---- Dependency graph and incremental recalc ----
  function keyOf(r,c){ return r+':'+c; }
  function registerDep(sheetIdx, fromRC, toRC){
    var deps = book[sheetIdx].deps;
    var k = keyOf(fromRC.row, fromRC.col);
    if(!deps[k]) deps[k] = {};
    var depKey = keyOf(toRC.row, toRC.col);
    deps[k][depKey] = 1;
  }
  function clearDepsOf(sheetIdx, r, c){
    var deps = book[sheetIdx].deps;
    var k = keyOf(r,c);
    delete deps[k];
    // also remove reverse edges? not necessary for forward traversal
  }
  function rebuildDeps(sheetIdx){
    book[sheetIdx].deps = {};
    var sheet = book[sheetIdx].data;
    for(var r=0;r<ROWS;r++){
      for(var c=0;c<COLS;c++){
        if(sheet[r][c].f && sheet[r][c].f.charAt(0)==='='){
          // scan refs in formula
          var refs = findRefs(sheetIdx, sheet[r][c].f);
          for(var i=0;i<refs.length;i++){
            registerDep(sheetIdx, refs[i], {row:r,col:c});
          }
        }
      }
    }
  }
  function findRefs(sheetIdx, f){
    var out = [];
    var expr = f.substring(1).toUpperCase();
    // ranges: A1:B3
    var m, reRange = /([\$]?[A-Z][\$]?[1-9]\d*):([\$]?[A-Z][\$]?[1-9]\d*)/g;
    while((m = reRange.exec(expr))){
      var A = parseCellRef(m[1]), B = parseCellRef(m[2]);
      if(inBounds(A) && inBounds(B)){
        var r0=Math.min(A.row,B.row), r1=Math.max(A.row,B.row);
        var c0=Math.min(A.col,B.col), c1=Math.max(A.col,B.col);
        for(var r=r0;r<=r1;r++) for(var c=c0;c<=c1;c++) out.push({row:r,col:c});
      }
    }
    // singles
    var reCell = /\b([\$]?[A-Z][\$]?[1-9]\d*)\b/g;
    while((m = reCell.exec(expr))){
      var rc = parseCellRef(m[1]);
      if(inBounds(rc)) out.push(rc);
    }
    return out;
  }

  function affectedCells(sheetIdx, startRC){
    // BFS over dep graph
    var deps = book[sheetIdx].deps;
    var q = [ keyOf(startRC.row,startRC.col) ];
    var seen = {};
    var result = [];
    while(q.length){
      var k = q.shift();
      if(seen[k]) continue;
      seen[k]=1;
      result.push(k);
      var children = deps[k];
      if(children){
        for(var ch in children){ if(children.hasOwnProperty(ch)) q.push(ch); }
      }
    }
    return result;
  }

  // ---- Formula engine ----
  function evalCell(sheetIdx, r, c, visiting){
    var sheet = book[sheetIdx].data;
    var cell = sheet[r][c];
    if(!cell) return '';
    if(cell.f && cell.f.charAt(0) === '='){
      try{
        var k = keyOf(r,c);
        if(visiting[k]) throw new Error('Riferimenti circolari');
        visiting[k] = 1;
        var expr = cell.f.substring(1);
        var val = evalExpr(sheetIdx, expr, visiting);
        visiting[k] = 0;
        return val;
      }catch(e){
        return 'ERR';
      }
    }
    var num = parseFloat(cell.v);
    if(!isNaN(num) && (cell.v === 0 || (typeof cell.v === 'number') || /^[\+\-]?\d+(\.\d+)?$/.test(cell.v+''))){
      return num;
    }
    return cell.v || '';
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

  function getRangeValues(sheetIdx, a, b){
    var rng = expandRange(a,b);
    var vals = [];
    for(var i=0;i<rng.length;i++){
      var rc = rng[i];
      var v = evalCell(sheetIdx, rc.row, rc.col, {});
      vals.push(v);
    }
    return vals;
  }

  function replaceFunctions(sheetIdx, expr, visiting){
    expr = expr.toUpperCase();

    // SUM, AVERAGE, MIN, MAX for ranges
    expr = expr.replace(/\b(SUM|AVERAGE|MIN|MAX)\(\s*([\$]?[A-Z][\$]?[1-9]\d*)\s*:\s*([\$]?[A-Z][\$]?[1-9]\d*)\s*\)/g, function(_, fn, a, b){
      var vals = getRangeValues(sheetIdx, a, b);
      var nums = []; for(var i=0;i<vals.length;i++){ var n=parseFloat(vals[i]); if(!isNaN(n)) nums.push(n); }
      if(fn==='SUM'){
        var s=0; for(var j=0;j<nums.length;j++) s+=nums[j];
        return String(s);
      }else if(fn==='AVERAGE'){
        if(nums.length===0) return '0';
        var s2=0; for(var k=0;k<nums.length;k++) s2+=nums[k];
        return String(s2/nums.length);
      }else if(fn==='MIN'){
        if(nums.length===0) return '0';
        var m=nums[0]; for(var x=1;x<nums.length;x++) if(nums[x]<m) m=nums[x];
        return String(m);
      }else if(fn==='MAX'){
        if(nums.length===0) return '0';
        var M=nums[0]; for(var y=1;y<nums.length;y++) if(nums[y]>M) M=nums[y];
        return String(M);
      }
      return '0';
    });

    // IF(condition, then, else) — condition allows numbers/refs with comparisons
    expr = expr.replace(/\bIF\(\s*(.+?)\s*,\s*(.+?)\s*,\s*(.+?)\s*\)/g, function(_, cond, tval, fval){
      try{
        var c = substituteRefs(sheetIdx, cond, visiting);
        if(!/^[0-9\.\+\-\*\/\(\)\s\<\>\=\!]+$/.test(c)) throw new Error('Condizione non valida');
        var ok = Function('"use strict";return (('+c+')?1:0)')();
        return ok ? '('+substituteRefs(sheetIdx, tval, visiting)+')' : '('+substituteRefs(sheetIdx, fval, visiting)+')';
      }catch(e){
        return '0';
      }
    });

    // VLOOKUP(key, A1:B9, index, [approx]) — alias CERCA_VERT
    expr = expr.replace(/\b(VLOOKUP|CERCA_VERT)\(\s*(.+?)\s*,\s*([\$]?[A-Z][\$]?[1-9]\d*)\s*:\s*([\$]?[A-Z][\$]?[1-9]\d*)\s*,\s*([0-9]+)\s*(?:,\s*(TRUE|FALSE))?\s*\)/g,
      function(_, fn, keyExpr, a, b, idxStr, approxTok){
        try{
          var keyValExpr = substituteRefs(sheetIdx, keyExpr, visiting);
          var keyVal = Function('"use strict";return ('+keyValExpr+')')();
          var vals = expandRange(a,b);
          // build 2D array by rows
          var rows = {};
          for(var i=0;i<vals.length;i++){
            var rc = vals[i];
            if(!rows[rc.row]) rows[rc.row]=[];
            rows[rc.row].push(rc);
          }
          var table = []; var rkeys = Object.keys(rows).sort(function(a,b){return a-b;});
          for(var r=0;r<rkeys.length;r++){
            var rr = rows[rkeys[r]];
            rr.sort(function(p,q){return p.col-q.col;});
            var rowVals = [];
            for(var c=0;c<rr.length;c++){
              var v = evalCell(sheetIdx, rr[c].row, rr[c].col, {});
              var n = parseFloat(v); rowVals.push(isNaN(n)? v : n);
            }
            table.push(rowVals);
          }
          var idx = parseInt(idxStr,10);
          if(idx<1) return '0';
          var approx = (approxTok===undefined ? true : (approxTok==='TRUE'));
          // search on first column
          var found = null;
          if(approx){
            // approximate: last <= key
            var best = null;
            for(var t=0;t<table.length;t++){
              var v = table[t][0];
              if(v<=keyVal) best = table[t];
            }
            found = best;
          }else{
            for(var t2=0;t2<table.length;t2++){ if(table[t2][0]===keyVal){ found=table[t2]; break; } }
          }
          if(!found) return '0';
          return String(found[idx-1]!==undefined ? found[idx-1] : 0);
        }catch(e){
          return '0';
        }
      });

    return expr;
  }

  function substituteRefs(sheetIdx, expr, visiting){
    var up = expr.toUpperCase();
    up = up.replace(/\b([\$]?[A-Z][\$]?[1-9]\d*)\b/g, function(_, ref){
      var rc = parseCellRef(ref);
      if(!inBounds(rc)) return '0';
      var v = evalCell(sheetIdx, rc.row, rc.col, visiting);
      var n = parseFloat(v);
      if(!isNaN(n)) return String(n);
      // strings: quote
      if(typeof v === 'string'){
        // escape quotes
        return '"'+v.replace(/"/g,'\\"')+'"';
      }
      return '0';
    });
    return up;
  }

  function evalExpr(sheetIdx, expr, visiting){
    var ex = replaceFunctions(sheetIdx, expr, visiting);
    // After function replacements, replace remaining single refs with numeric/strings
    ex = substituteRefs(sheetIdx, ex, visiting);
    // Allow + - * / ( ) whitespace and comparisons for nested IF results
    if(!/^[0-9\.\+\-\*\/\(\)\s\<\>\=\!\"\,]+$/.test(ex)) throw new Error('Espressione non valida');
    return Function('"use strict";return (' + ex + ')')();
  }

  // ---- Recalc ----
  function recalcAll(sheetIdx){
    var sheet = book[sheetIdx].data;
    for(var r=0;r<ROWS;r++){
      for(var c=0;c<COLS;c++){
        sheet[r][c].v = evalCell(sheetIdx, r,c,{});
      }
    }
  }
  function recalcFrom(sheetIdx, rc){
    // recompute start and all dependents
    var keys = affectedCells(sheetIdx, rc);
    // convert keys to RC and compute in BFS order
    for(var i=0;i<keys.length;i++){
      var parts = keys[i].split(':');
      var r = parseInt(parts[0],10), c = parseInt(parts[1],10);
      book[sheetIdx].data[r][c].v = evalCell(sheetIdx, r,c,{});
    }
  }

  // ---- Rendering ----
  function displayValue(cell){
    return (cell.v===undefined || cell.v===null) ? '' : String(cell.v);
  }

  function render(){
    var table = document.createElement('table');
    table.className = 'grid';

    var thead = document.createElement('thead');
    var trh = document.createElement('tr');
    var thCorner = document.createElement('th'); thCorner.className='corner'; thCorner.textContent='';
    trh.appendChild(thCorner);
    for(var c=0;c<COLS;c++){ var th=document.createElement('th'); th.textContent=colName(c); trh.appendChild(th); }
    thead.appendChild(trh); table.appendChild(thead);

    var tbody = document.createElement('tbody');
    for(var r=0;r<ROWS;r++){
      var tr = document.createElement('tr');
      var thRow = document.createElement('th'); thRow.className='rowhead'; thRow.textContent=(r+1); tr.appendChild(thRow);
      for(var c=0;c<COLS;c++){
        var td=document.createElement('td'); td.tabIndex=0; td.className='cell'; td.setAttribute('data-r',r); td.setAttribute('data-c',c);
        td.textContent = displayValue(book[active].data[r][c]);
        td.addEventListener('focus', onCellFocus);
        td.addEventListener('dblclick', onCellEdit);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    sheetEl.innerHTML='';
    sheetEl.appendChild(table);
    updateIndicator();
  }

  function renderValues(){
    var tds = sheetEl.querySelectorAll('.cell');
    for(var i=0;i<tds.length;i++){
      var td = tds[i];
      var r = parseInt(td.getAttribute('data-r'),10);
      var c = parseInt(td.getAttribute('data-c'),10);
      td.textContent = displayValue(book[active].data[r][c]);
    }
  }

  function onCellFocus(){
    var r = parseInt(this.getAttribute('data-r'),10);
    var c = parseInt(this.getAttribute('data-c'),10);
    current.row=r; current.col=c; updateIndicator();
    var f = book[active].data[r][c].f;
    if(f){ formulaEl.value = f; } else formulaEl.value = String(book[active].data[r][c].v || '');
  }
  function onCellEdit(){
    var r = parseInt(this.getAttribute('data-r'),10);
    var c = parseInt(this.getAttribute('data-c'),10);
    var f = book[active].data[r][c].f;
    if(f){ formulaEl.value = f; } else formulaEl.value = String(book[active].data[r][c].v || '');
    formulaEl.focus(); formulaEl.select();
  }

  function updateIndicator(){ labelCellEl.textContent = colName(current.col)+(current.row+1) + ' — ' + (book[active].name||('Foglio '+(active+1))); }

  function setCellFromFormulaBar(){
    var text = formulaEl.value || '';
    var r = current.row, c = current.col;
    // update deps: clear old deps, then after setting formula, re-scan and register
    clearDepsOf(active, r, c);
    if(text.length>0 && text.charAt(0) === '='){ book[active].data[r][c].f = text; }
    else{ book[active].data[r][c].f=''; book[active].data[r][c].v=text; }
    // register new deps
    if(book[active].data[r][c].f){
      var refs = findRefs(active, book[active].data[r][c].f);
      for(var i=0;i<refs.length;i++){ registerDep(active, refs[i], {row:r,col:c}); }
    }
    // incremental recalc
    recalcFrom(active, {row:r,col:c});
    renderValues(); save();
    status('Aggiornato '+colName(c)+(r+1));
    focusCell(r,c);
  }

  function focusCell(r,c){
    var td = sheetEl.querySelector('.cell[data-r="'+r+'"][data-c="'+c+'"]');
    if(td) td.focus();
  }

  function status(t){
    statusEl.textContent = t;
    setTimeout(function(){ statusEl.textContent='Pronto.'; }, 2000);
  }

  // Keyboard
  
  // Live preview while typing
  formulaEl.addEventListener('input', function(){
    var r = current.row, c = current.col;
    var td = sheetEl.querySelector('.cell[data-r="'+r+'"][data-c="'+c+'"]');
    if(td){ td.textContent = formulaEl.value; }
  });

formulaEl.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ setCellFromFormulaBar(); e.preventDefault(); }
  });
  document.addEventListener('keydown', function(e){
    var r=current.row, c=current.col;
    if(e.key === 'ArrowRight'){ c=Math.min(COLS-1,c+1); }
    else if(e.key === 'ArrowLeft'){ c=Math.max(0,c-1); }
    else if(e.key === 'ArrowDown'){ r=Math.min(ROWS-1,r+1); }
    else if(e.key === 'ArrowUp'){ r=Math.max(0,r-1); }
    else if(e.key.length===1 && !e.ctrlKey && !e.metaKey && !e.altKey){ formulaEl.value=e.key; formulaEl.focus(); /* no select, allow typing to append */ return; }
    else return;
    current.row=r; current.col=c; updateIndicator(); focusCell(r,c); e.preventDefault();
  });

  // Buttons
  btnApply.addEventListener('click', setCellFromFormulaBar);
  btnNew.addEventListener('click', function(){
    if(confirm('Svuotare il foglio attivo?')){
      book[active].data = createEmptySheet().data;
      book[active].deps = {};
      recalcAll(active); renderValues(); save();
    }
  });
  btnExport.addEventListener('click', exportCSV);
  fileImport.addEventListener('change', function(){
    var f = fileImport.files[0]; if(!f) return;
    var reader = new FileReader();
    reader.onload = function(){ importCSV(String(reader.result||'')); };
    reader.readAsText(f); fileImport.value='';
  });
  btnHelp.addEventListener('click', function(){
    alert([
      'VisiCalc Tribute v2 — funzioni:',
      '  · SUM(A1:B3), AVERAGE(A1:B3), MIN(A1:B3), MAX(A1:B3)',
      '  · IF(condizione, valore_se_vero, valore_se_falso)',
      '  · VLOOKUP(chiave, A1:B9, indice_colonna, [TRUE|FALSE]) alias CERCA_VERT',
      '  · Operatori: + - * / ( ) e confronti in IF: < > <= >= = <> !',
      '  · Riferimenti: A1, $A$1, A$1, $A1 (accettati)',
      '',
      'Multi-sheets: clic sulle TAB per cambiare, ✎ per rinominare, + per aggiungere.',
      'Dati salvati in locale (localStorage).'
    ].join('\\n'));
  });

  // ---- Boot ----
  load(); renderTabs();
  // build deps for all sheets and recalc
  for(var s=0;s<book.length;s++){ rebuildDeps(s); recalcAll(s); }
  render(); renderValues();
})();
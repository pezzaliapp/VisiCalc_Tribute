/* app.v2.6.js — lightweight grid + formulas (ES5, iOS 8 compatible)
   Changes vs v2.5:
   - No more "0" spam: empty cells render as blank. If the user typed "0" or a formula returns 0, it still shows 0.
*/
var App = (function(){
  var ROWS = 50, COLS = 26; // A..Z × 50
  var state = {};           // { "A1": {raw:"=A1+B1", val:9}, ... }
  var sel = "A1";

  function colToName(c){ return String.fromCharCode(65 + c); } // 0->A
  function nameToCol(n){ return n.charCodeAt(0) - 65; }
  function clamp(v,min,max){ return v<min?min:v>max?max:v; }

  function buildGrid(){
    var grid = document.getElementById('grid');
    var html = '<tr><th></th>';
    for(var c=0;c<COLS;c++) html += '<th>'+colToName(c)+'</th>';
    html += '</tr>';
    for(var r=1;r<=ROWS;r++){
      html += '<tr><th class="rowhdr">'+r+'</th>';
      for(var c=0;c<COLS;c++){
        var id = colToName(c)+r;
        html += '<td data-id="'+id+'"></td>';
      }
      html += '</tr>';
    }
    grid.innerHTML = html;
  }

  function get(id){
    var o = state[id];
    if(!o) return 0;
    if(typeof o.val === "number") return o.val;
    if(typeof o.val === "string") return NaN;
    return 0;
  }
  function getRaw(id){ var o = state[id]; return o?o.raw:''; }

  function setCell(id, raw){
    if(!state[id]) state[id]={raw:"",val:0, deps:[]};
    state[id].raw = raw;
    recalc();
    render();
  }

  function expandRange(rng){
    var m = rng.match(/^(\$?[A-Z]\$?[0-9]+):(\$?[A-Z]\$?[0-9]+)$/);
    if(!m) return [];
    var a = normalizeRef(m[1]), b = normalizeRef(m[2]);
    var c1 = nameToCol(a[0]), r1 = parseInt(a.slice(1),10);
    var c2 = nameToCol(b[0]), r2 = parseInt(b.slice(1),10);
    var cs = Math.min(c1,c2), ce = Math.max(c1,c2);
    var rs = Math.min(r1,r2), re = Math.max(r1,r2);
    var out = [];
    for(var r=rs;r<=re;r++) for(var c=cs;c<=ce;c++) out.push(colToName(c)+r);
    return out;
  }
  function normalizeRef(ref){ return ref.replace(/\$/g,''); }

  function evalCell(id){
    var raw = getRaw(id);
    if(raw==null || raw===""){ return 0; }
    if(typeof raw === "number") return raw;
    if(typeof raw === "string" && raw.charAt(0) !== '='){
      var num = numParse(raw);
      return isNaN(num) ? raw : num;
    }
    var expr = raw.slice(1);
    expr = expr.replace(/(\$?[A-Z]\$?[0-9]+:\$?[A-Z]\$?[0-9]+)/g, function(m){ return 'R("'+m+'")'; });
    expr = expr.replace(/(\$?[A-Z]\$?[0-9]+)/g, function(m){ return 'V("'+m+'")'; });
    expr = expr.replace(/\bSUM\s*\(/gi, 'FUN.sum(')
               .replace(/\bAVERAGE\s*\(/gi, 'FUN.avg(')
               .replace(/\bMIN\s*\(/gi, 'FUN.min(')
               .replace(/\bMAX\s*\(/gi, 'FUN.max(')
               .replace(/\bIF\s*\(/gi, 'FUN.ifc(')
               .replace(/\bVLOOKUP\s*\(/gi, 'FUN.vlookup(')
               .replace(/\bCERCA_VERT\s*\(/gi, 'FUN.vlookup(');
    expr = expr.replace(/(\d),(\d)/g, '$1.$2');
    try{
      var val = Function('V','R','FUN', '"use strict"; return ('+expr+');')(V,R,FUN);
      return sanitize(val);
    }catch(e){
      return 'ERR';
    }
  }

  function sanitize(v){
    if(typeof v==="number"){ if(!isFinite(v)) return 'ERR'; return v; }
    if(typeof v==="string") return v;
    if(v==null) return 0;
    return v;
  }
  function numParse(s){
    if(typeof s==="number") return s;
    if(!s) return 0;
    var t = (s+'').trim();
    t = t.replace(/\./g,'').replace(/,/,'.');
    var n = parseFloat(t);
    return isNaN(n) ? NaN : n;
  }
  function V(ref){
    ref = normalizeRef(ref);
    var v = get(ref);
    return (typeof v==="string") ? numParse(v)||0 : (v||0);
  }
  function R(rng){
    var refs = expandRange(rng);
    var arr = [];
    for(var i=0;i<refs.length;i++) arr.push(V(refs[i]));
    return arr;
  }
  var FUN = {
    sum: function(){
      var a=[].slice.call(arguments), s=0;
      for(var i=0;i<a.length;i++){
        if(a[i] && a[i].splice){
          for(var j=0;j<a[i].length;j++) s += (+a[i][j]||0);
        } else s += (+a[i]||0);
      }
      return s;
    },
    avg: function(){
      var a=[].slice.call(arguments), s=0, n=0;
      function add(x){ s+= (+x||0); n++; }
      for(var i=0;i<a.length;i++){
        if(a[i] && a[i].splice){ for(var j=0;j<a[i].length;j++) add(a[i][j]); }
        else add(a[i]);
      }
      return n? s/n : 0;
    },
    min: function(){ var m=+Infinity, a=arguments;
      for(var i=0;i<a.length;i++){
        if(a[i] && a[i].splice){ for(var j=0;j<a[i].length;j++) m=Math.min(m,(+a[i][j]||0)); }
        else m=Math.min(m,(+a[i]||0));
      } return m; },
    max: function(){ var m=-Infinity, a=arguments;
      for(var i=0;i<a.length;i++){
        if(a[i] && a[i].splice){ for(var j=0;j<a[i].length;j++) m=Math.max(m,(+a[i][j]||0)); }
        else m=Math.max(m,(+a[i]||0));
      } return m; },
    ifc: function(cond, a, b){ return cond ? a : b; },
    vlookup: function(key, rangeArr, colIndex, approx){ return 'NA'; }
  };

  function recalc(){
    for(var r=1;r<=ROWS;r++){
      for(var c=0;c<COLS;c++){
        var id = colToName(c)+r;
        var raw = getRaw(id);
        if(raw==null) continue;
        state[id] = state[id] || {raw:"", val:0};
        state[id].val = evalCell(id);
      }
    }
  }

  function render(){
    var grid = document.getElementById('grid');
    var cells = grid.querySelectorAll('td[data-id]');
    for(var i=0;i<cells.length;i++){
      var td = cells[i], id = td.getAttribute('data-id');
      var o = state[id], raw = o ? o.raw : '';
      if(!raw){ td.textContent = ''; } // empty stays empty
      else{
        var val = o.val;
        td.textContent = (val==null?'':val);
      }
      td.className = (id===sel?'sel':'');
    }
    document.getElementById('cellName').textContent = sel;
    var rawSel = getRaw(sel)||"";
    document.getElementById('formula-input').value = rawSel;
  }

  function pickCell(id){ sel = id; render(); }

  function onClickGrid(e){
    var td = e.target;
    while(td && td.tagName && td.tagName.toLowerCase()!=='td'){ td = td.parentNode; }
    if(!td || !td.getAttribute) return;
    var id = td.getAttribute('data-id');
    if(!id) return;
    pickCell(id);
  }

  function onKeydown(e){
    var code = e.keyCode||e.which;
    var c = nameToCol(sel[0]), r = parseInt(sel.slice(1),10);
    if(code>=37 && code<=40){
      if(code===37) c--; if(code===39) c++; if(code===38) r--; if(code===40) r++;
      c = c<0?0:(c>=COLS?COLS-1:c); r = r<1?1:(r>ROWS?ROWS:r);
      pickCell(colToName(c)+r);
      e.preventDefault();
    }else if(code===13){
      commitFormulaInput();
      e.preventDefault();
    }
  }

  function onFormulaInput(e){ /* live preview optional */ }
  function commitFormulaInput(){
    var val = document.getElementById('formula-input').value;
    setCell(sel, val);
  }

  function exportCSV(){
    var lines = [];
    for(var r=1;r<=ROWS;r++){
      var row = [];
      for(var c=0;c<COLS;c++){
        var id = colToName(c)+r;
        var raw = getRaw(id)||"";
        row.push('"' + (raw.replace(/"/g,'""')) + '"');
      }
      lines.push(row.join(','));
    }
    var blob = new Blob([lines.join('\n')], {type:'text/csv'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'visicalc.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }

  function importCSV(evt){
    var f = evt.target.files[0]; if(!f) return;
    var r = new FileReader();
    r.onload = function(){
      var text = r.result || '';
      var rows = text.split(/\r?\n/);
      for(var y=0;y<Math.min(rows.length, ROWS); y++){
        var cols = rows[y].split(',');
        for(var x=0;x<Math.min(cols.length, COLS); x++){
          var cell = cols[x].replace(/^"(.*)"$/,'$1').replace(/""/g,'"');

          setCell(colToName(x)+(y+1), cell);
        }
      }
      render();
    };
    r.readAsText(f);
  }

  function init(){
    buildGrid();
    document.getElementById('grid').addEventListener('click', onClickGrid, false);
    document.addEventListener('keydown', onKeydown, false);
    document.getElementById('formula-input').addEventListener('input', onFormulaInput, false);
    document.getElementById('formula-input').addEventListener('keydown', function(e){
      if((e.keyCode||e.which)===13){ commitFormulaInput(); e.preventDefault(); }
      e.stopPropagation();
    }, false);
    // demo values
    setCell('A1','4'); setCell('B1','5'); setCell('C1','=A1+B1');
  }

  return { init: init, exportCSV: exportCSV, importCSV: importCSV };
})();
(function(){ if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', App.init); } else { App.init(); } })();

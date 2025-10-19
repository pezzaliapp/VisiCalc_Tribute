(function(){
  function ensureButton(){
    var btn = document.getElementById('btn-info');
    if(btn) return btn;
    var help = document.getElementById('btn-help');
    if(help && help.parentNode){
      btn = document.createElement('button');
      btn.id = 'btn-info';
      btn.textContent = 'Info (Audio)';
      help.parentNode.appendChild(btn);
    }
    return btn;
  }
  function wire(btn){
    if(!btn) return;
    btn.addEventListener('click', function(){
      window.open('./readme.html#listen', '_blank');
    });
  }
  var btn = ensureButton(); wire(btn);
  if(localStorage.getItem('vc_heard_readme')) return;
  var bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;inset:auto 12px 12px 12px;padding:10px;border:1px solid #1d244a;border-radius:10px;background:#0d1430;color:#eaf1ff;z-index:9999;display:flex;gap:8px;align-items:center;flex-wrap:wrap';
  bar.innerHTML = '<span>Vuoi ascoltare una guida di 2 minuti?</span>' +
                  '<button id="hear-go" style="background:#2dd4bf;border:0;padding:6px 10px;border-radius:8px;color:#062121;cursor:pointer">Ascolta</button>' +
                  '<button id="hear-no" style="background:#101739;border:1px solid #1d244a;padding:6px 10px;border-radius:8px;color:#eaf1ff;cursor:pointer">No, grazie</button>';
  document.body.appendChild(bar);
  document.getElementById('hear-go').onclick = function(){
    localStorage.setItem('vc_heard_readme', '1');
    window.open('./readme.html#listen', '_blank');
    bar.remove();
  };
  document.getElementById('hear-no').onclick = function(){
    localStorage.setItem('vc_heard_readme', '1');
    bar.remove();
  };
})();
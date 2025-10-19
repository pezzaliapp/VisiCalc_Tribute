// history_patch.js — open timeline page from header button
(function(){
  var btn = document.getElementById('btn-history');
  if(!btn){
    // create it next to Help if missing
    var help = document.getElementById('btn-help');
    if(help && help.parentNode){
      btn = document.createElement('button');
      btn.id = 'btn-history';
      btn.textContent = 'Storia';
      help.parentNode.appendChild(btn);
    }
  }
  if(btn){
    btn.addEventListener('click', function(){
      try{ window.open('./visicalc_timeline.html','_blank'); }catch(e){ }
    });
  }
})();
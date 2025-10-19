// index_splash_mobile_patch.js — splash (2s) + mobile bootstrap + manifest assurance
(function(){
  // Splash overlay
  var splash = document.createElement('div');
  splash.id = 'vc-splash';
  splash.innerHTML = '<div class="box"><h1>🧮 VisiCalc Tribute — pezzaliAPP</h1><p>powered by pezzaliAPP.com</p></div>';
  document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(splash); });
  window.addEventListener('load', function(){ setTimeout(function(){ splash.style.opacity='0'; setTimeout(function(){ if(splash && splash.parentNode) splash.parentNode.removeChild(splash); }, 400); }, 2000); });

  // Detect mobile and load mobile UI
  function isMobile(){
    var ua = navigator.userAgent || '';
    var touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return touch && /(iphone|ipod|ipad|android)/i.test(ua);
  }
  if(isMobile()){
    // CSS
    var l = document.createElement('link'); l.rel='stylesheet'; l.href='./mobile.css'; document.head.appendChild(l);
    // JS
    var s = document.createElement('script'); s.src='./mobile-ui.js'; document.body.appendChild(s);
  }
})();
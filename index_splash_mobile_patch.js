// index_splash_mobile_patch.js — splash (2s) + mobile bootstrap
(function(){
  function isMobile(){
    var ua = navigator.userAgent || '';
    var touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return touch && /(iphone|ipod|ipad|android)/i.test(ua);
  }
  if(isMobile()){
    var l = document.createElement('link'); l.rel='stylesheet'; l.href='./mobile.css'; document.head.appendChild(l);
    var s = document.createElement('script'); s.src='./mobile-ui.js'; document.body.appendChild(s);
  }
})();
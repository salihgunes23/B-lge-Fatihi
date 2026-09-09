/* ================= Açılış =================
   Oyunun sunum katmanına ait, gameplay motoruna (game.js) hiç dokunmaz.
   game.js zaten sayfa yüklenirken haritayı üretip #app'i (gizliyken bile)
   hazırlıyor — burada tek iş: açılış ekranını (BAŞLAT / Mağaza) yönetmek. */
(function(){
  "use strict";

  var lobby=document.getElementById("lobby");
  var app=document.getElementById("app");

  document.getElementById("play-campaign").addEventListener("click", function(){
    lobby.classList.add("leaving");
    setTimeout(function(){
      lobby.hidden=true;
      app.hidden=false;
      // game.js haritayı #app gizliyken de üretti ama sarmalayıcı 0x0
      // olduğu için "ekranı doldur" hesabı bekletildi — şimdi tetikle.
      if(window.__bfOnShow) window.__bfOnShow();
      // Talimat modalı da tam bu anda (ilk kez oyuna girerken) açılır.
      if(window.__bfShowInstructions) window.__bfShowInstructions();
    }, 260);
  });

  // Arka plandaki loş harita: dashboard'daki küçük özet değil, gerçek kara
  // siluetinin tam ekran, düşük saturasyonlu bir önizlemesi — açılışın
  // "bir SAVAŞ HARİTASI açılıyor" hissi vermesi için.
  var splashMap=document.getElementById("splash-map");
  function paintSplash(){
    if(!window.__bfPaintMiniMap) return;
    var dpr=Math.min(window.devicePixelRatio||1, 2);
    splashMap.width=Math.round(window.innerWidth*dpr);
    splashMap.height=Math.round(window.innerHeight*dpr);
    window.__bfPaintMiniMap(splashMap);
  }
  paintSplash();
  window.addEventListener("resize", paintSplash);

  // Yerel sefer günlüğü: ilk açılışta hiç oynanmamışsa göstermeye değer
  // bir şey yok, o yüzden yalnızca en az bir sefer oynanmışsa görünür.
  if(window.__bfStats){
    var s=window.__bfStats();
    if(s.sefer>0){
      var el=document.getElementById("splash-stat");
      el.hidden=false;
      el.textContent=s.sefer+" sefer · "+s.fetih+" il fethedildi"+(s.kazanildi?" · "+s.kazanildi+" zafer":"");
    }
  }

  // Mağaza: ayrı bir sayfa/dashboard yerine mevcut modal kutusu yeniden
  // kullanılıyor (oyun içindeki talimat/zafer/yenilgi ekranlarıyla aynı
  // mekanizma) — yeni bir UI sistemi icat etmiyoruz.
  document.getElementById("open-store").addEventListener("click", function(){
    var overlay=document.getElementById("modal-overlay");
    var box=document.getElementById("modal-box");
    var tpl=document.getElementById("store-template");
    box.className="modal-box";
    box.innerHTML="";
    box.appendChild(tpl.content.cloneNode(true));
    overlay.classList.add("show");
    document.getElementById("store-close").addEventListener("click", function(){
      overlay.classList.remove("show");
    });
  });
})();

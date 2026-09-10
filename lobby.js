/* ================= Açılış =================
   Sunum katmanı; kuralları game.js belirliyor.

   Üç sütun: solda durum ve pafta, ortada oyun modları (öne çıkan mod büyük
   kart + diğerleri altta), sağda mağaza ve yol haritası.

   Haritalar dekor değil, modun zafer koşulunu gösteriyor: Geçit modunda
   Anadolu'nun altı gerçek geçidi ve üzerlerinden akan ticaret yolları,
   klasik modlarda karargâh→hedef. Çizim motorun kıyı POLİGONLARINDAN
   yapılıyor (piksel ızgarasından değil) — lobide temiz bir siluet için. */
(function(){
  "use strict";

  var lobby=document.getElementById("lobby");
  var app=document.getElementById("app");
  var data=window.__bfLobbyData ? window.__bfLobbyData() : null;

  /* Açık atlas paleti — referanstaki gibi: koyu panelin içinde AÇIK renkli
     gerçek bir harita. Koyu siluet cansız duruyordu.
     Renk indeksleri harita-tr.js'te önceden hesaplandı (komşu iller farklı
     renk alsın diye açgözlü graf boyama), o yüzden burada sabit bir sıra. */
  var IL_RENK=["#9aafc0","#cbc0a0","#c5a892","#a6b6a1","#bd9d95","#aaa2b3"];
  var C={
    /* Ekranda en çok yer kaplayan alan burası. Belirsiz bir gri-yeşildi ve
       neye baktığın okunmuyordu; gerçek bir deniz tonuna çekildi — hem harita
       gibi duruyor hem pastel illere zemin oluyor. */
    deniz:"#8fb0c4",
    sinir:"rgba(255,255,255,0.62)",   // il sınırı
    kontur:"#3f5f75",         // ülke konturu
    gecit:"#0f7a58", gold:"#a8690f", foe:"#b0342a",
    baskentDolgu:"#d9bd83", hedefDolgu:"#c99187"
  };

  /* Ticaret yolları: kuzeyde Karadeniz, güneyde Akdeniz güzergâhı. Ara
     noktalar gerçek şehirler (Bolu, Samsun, İzmir, Antalya) — düz çizgi
     Anadolu'yu ortadan kesiyordu; yol karayı takip edince "neden bu
     geçitler" sorusunu harita kendisi cevaplıyor. [enlem, boylam] */
  var YOLLAR=[
    [[41.10,29.05],[40.74,31.61],[41.29,36.33],[40.65,39.40],[40.05,40.35]],
    [[40.20,26.40],[38.42,27.14],[36.90,30.70],[37.28,34.78],[36.49,36.20]]
  ];

  var ILLER=window.__TR_ILLER||[];
  function norm(x){
    x=(x||"").toLocaleLowerCase("tr");
    return x.replace(/ı/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g")
            .replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c")
            .replace(/â/g,"a").replace(/[^a-z]/g,"");
  }
  // Oyun "Afyonkarahisar" diyor, harita verisi "Afyon" — tek istisna.
  var TAKMA={afyonkarahisar:"afyon"};
  function ayniIl(a,b){
    var x=norm(a), y=norm(b);
    return x===y || TAKMA[x]===y || TAKMA[y]===x;
  }

  /* ---------------- Atlas haritası ---------------- */
  function olcek(cv, pad){
    var r=cv.getBoundingClientRect();
    var W=Math.max(20,Math.round(r.width)), H=Math.max(20,Math.round(r.height));
    var dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    var g=cv.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0);
    g.clearRect(0,0,W,H);
    var lo0=1e9,lo1=-1e9,la0=1e9,la1=-1e9;
    ILLER.forEach(function(il){ il.p.forEach(function(h){ h.forEach(function(q){
      if(q[0]<lo0)lo0=q[0]; if(q[0]>lo1)lo1=q[0];
      if(q[1]<la0)la0=q[1]; if(q[1]>la1)la1=q[1];
    });});});
    var w=lo1-lo0, h=la1-la0;
    var s=Math.min((W-pad*2)/w,(H-pad*2)/h);
    return {g:g,W:W,H:H,s:s,
      x:function(lon){ return (W-w*s)/2+(lon-lo0)*s; },
      y:function(lat){ return (H-h*s)/2+(la1-lat)*s; }};
  }

  function ilYolu(L, il){
    var g=L.g;
    g.beginPath();
    il.p.forEach(function(h){
      h.forEach(function(q,i){
        var X=L.x(q[0]), Y=L.y(q[1]);
        if(i===0) g.moveTo(X,Y); else g.lineTo(X,Y);
      });
      g.closePath();
    });
  }

  /* Üç geçiş: (1) bütün illeri kalın koyu konturla çiz — bu, ülkenin dış
     hattında bir hale bırakır; (2) dolguları üstüne bas, iç kontur kapanır,
     yalnızca dış kontur kalır; (3) il sınırlarını ince beyazla çiz.
     Gerçek atlaslardaki görünüm bu sırayla çıkıyor. */
  function atlas(L, ince){
    var g=L.g;
    g.fillStyle=C.deniz; g.fillRect(0,0,L.W,L.H);
    var bas=data&&data.baskent?data.baskent.name:null;
    var hed=data&&data.hedef?data.hedef.name:null;

    g.strokeStyle=C.kontur; g.lineWidth=ince?2:3.2; g.lineJoin="round";
    ILLER.forEach(function(il){ ilYolu(L,il); g.stroke(); });

    ILLER.forEach(function(il){
      ilYolu(L,il);
      g.fillStyle = (bas&&ayniIl(il.a,bas)) ? C.baskentDolgu
                  : (hed&&ayniIl(il.a,hed)) ? C.hedefDolgu
                  : IL_RENK[il.c%IL_RENK.length];
      g.fill();
    });

    g.strokeStyle=C.sinir; g.lineWidth=ince?0.6:0.9;
    ILLER.forEach(function(il){ ilYolu(L,il); g.stroke(); });
  }

  function yollar(L,t){
    var g=L.g; g.save(); g.lineCap="round"; g.lineJoin="round";
    YOLLAR.forEach(function(yol){
      var n=yol.map(function(k){ return {x:L.x(k[1]), y:L.y(k[0])}; });
      g.beginPath(); g.moveTo(n[0].x,n[0].y);
      for(var i=1;i<n.length-1;i++){
        var mx=(n[i].x+n[i+1].x)/2, my=(n[i].y+n[i+1].y)/2;
        g.quadraticCurveTo(n[i].x,n[i].y,mx,my);
      }
      g.lineTo(n[n.length-1].x,n[n.length-1].y);
      // Açık harita üstünde: beyaz kılıf → koyu yeşil hat → akan kesikler.
      g.setLineDash([]);
      g.strokeStyle="rgba(255,255,255,0.85)"; g.lineWidth=5.5; g.stroke();
      g.strokeStyle=C.gecit;                  g.lineWidth=2.6; g.stroke();
      g.strokeStyle="rgba(255,255,255,0.9)";  g.lineWidth=1.4;
      g.setLineDash([5,12]); g.lineDashOffset=-(t/40)%17; g.stroke();
    });
    g.restore();
  }

  function nokta(L,x,y,renk,r){
    var g=L.g;
    g.beginPath(); g.arc(x,y,r,0,Math.PI*2);
    g.fillStyle="#ffffff"; g.fill();
    g.strokeStyle=renk; g.lineWidth=r>3?2.2:1.6; g.stroke();
    g.beginPath(); g.arc(x,y,r*0.36,0,Math.PI*2); g.fillStyle=renk; g.fill();
  }
  function etiket(L,txt,x,y,renk){
    var g=L.g;
    g.font='700 11.5px -apple-system,"SF Pro Text",Inter,sans-serif';
    g.textAlign="center"; g.textBaseline="middle";
    g.lineWidth=3.4; g.lineJoin="round"; g.strokeStyle="rgba(255,255,255,0.95)";
    g.strokeText(txt,x,y); g.fillStyle=renk; g.fillText(txt,x,y);
  }
  function yer(L,o){
    if(o.lat!=null && o.lon!=null) return {x:L.x(o.lon), y:L.y(o.lat)};
    var geo=data.geo;                                   // ızgaradan çevir
    return {x:L.x(geo.lon0+(o.x+0.5)/data.gridW*(geo.lon1-geo.lon0)),
            y:L.y(geo.lat1-(o.y+0.5)/data.gridH*(geo.lat1-geo.lat0))};
  }
  function isaretler(L,gecitModu,t,buyuk){
    if(gecitModu){
      if(buyuk) yollar(L,t);
      (data.gecitler||[]).forEach(function(gc){
        var p=yer(L,gc);
        nokta(L,p.x,p.y,C.gecit,buyuk?5.5:2.8);
        if(buyuk) etiket(L,gc.kisa,Math.min(Math.max(p.x,30),L.W-30),p.y-15,C.gecit);
      });
    }
    if(data.baskent){
      var b=yer(L,data.baskent);
      nokta(L,b.x,b.y,C.gold,buyuk?5.5:2.8);
      if(buyuk&&!gecitModu) etiket(L,data.baskent.name,b.x,b.y-15,C.gold);
    }
    if(!gecitModu&&data.hedef){
      var h=yer(L,data.hedef);
      nokta(L,h.x,h.y,C.foe,buyuk?5.5:2.8);
      if(buyuk) etiket(L,data.hedef.name,Math.min(h.x,L.W-32),h.y-15,C.foe);
    }
  }

  /* ---------------- Sefer ayarları ----------------
     Lobideki her seçim motoru gerçekten yeniden kuruyor: rakip sayısı,
     zorluk dağılımı ve harita tohumu __bfSeferKur ile dünyaya yazılıyor,
     dönen künye de doğrudan haritadan okunuyor. Kilitli/"yakında" seçenek
     yok — burada görünen her şey çalışıyor (şartname Faz 4, B26). */
  var modes=window.__bfModes ? window.__bfModes() : [];
  var secili=(modes.filter(function(m){return m.active;})[0]||modes[0]||{}).key;
  var ayar={botSayisi:3, zorluk:"karisik", tohum:null};
  var ozet=null;

  function mod(k){ return modes.filter(function(m){ return m.key===(k||secili); })[0]; }
  function gecitMi(m){ return !!(m && m.hedef && m.hedef.tip==="gecit"); }

  /* Dünyayı seçilen ayarlarla yeniden üret ve lobiyi tazele. */
  function seferKur(){
    if(!window.__bfSeferKur) return;
    ozet=window.__bfSeferKur({
      mod:secili, botSayisi:ayar.botSayisi, zorluk:ayar.zorluk, tohum:ayar.tohum
    });
    if(window.__bfLobbyData) data=window.__bfLobbyData();
    if(window.__bfModes) modes=window.__bfModes();
    ayar.tohum=ozet?ozet.tohum:null;
    var giris=document.getElementById("tohum-giris");
    if(giris && ozet) giris.value=ozet.tohum;
    ciz();
  }

  function hero(){
    var m=mod(); if(!m) return;
    document.getElementById("hero-n").textContent=m.name+" Seferi";
    document.getElementById("hero-d").textContent=m.desc;
    var hedefEl=document.getElementById("hero-hedef");
    if(hedefEl) hedefEl.textContent=ozet ? ozet.hedef : "";
    var cv=document.getElementById("lo-hero");
    var L=olcek(cv,22); atlas(L,false); isaretler(L,gecitMi(m),0,true);
  }

  /* Rakip komutanlar: adı, doktrini, zorluğu — hepsi haritada atanmış
     gerçek botlardan geliyor, uydurma liste değil. */
  function komutanlar(){
    var host=document.getElementById("komutan-liste");
    if(!host) return;
    if(!ozet || !ozet.komutanlar.length){ host.innerHTML=""; return; }
    host.innerHTML=ozet.komutanlar.map(function(k){
      return '<div class="kmt">'+
        '<span class="kmt-nokta" style="background:'+k.renk+'"></span>'+
        '<div class="kmt-govde">'+
          '<div class="kmt-bas"><b>'+k.ad+'</b><em>'+k.unvan+'</em>'+
            '<span class="kmt-zor">'+k.zorluk+'</span></div>'+
          '<div class="kmt-dok">“'+k.doktrin+'”</div>'+
          '<div class="kmt-imza">'+k.imza+'</div>'+
        '</div></div>';
    }).join("");
  }

  /* Sefer künyesi: kiminle, nerede, ne kadar sürede. */
  function kunye(){
    var host=document.getElementById("sefer-kunye");
    if(!host || !ozet) return;
    var satirlar=[
      ["Cephe", ozet.ilSayisi+" il"],
      ["Karargâhın", ozet.baskent],
      ["Zafer", ozet.hedefTip==="gecit" ? ozet.gecitler.length+" geçitten "+
        (mod()&&mod().hedef?mod().hedef.gerek:4)+" tanesi" : ozet.dusmanBaskenti],
      ["Rakip", ozet.komutanlar.length+" ordu"],
      ["Tempo", (ozet.tempo===1?"normal":ozet.tempo+"× hız")],
      ["Baskın", "her "+ozet.baskinAralik+" sn"],
      ["Açılış", ozet.acilisAltin+" altın"],
      ["Tahminî süre", "~"+ozet.tahminiSure+" dk"]
    ];
    host.innerHTML=satirlar.map(function(s){
      return "<div class='kunye-satir'><dt>"+s[0]+"</dt><dd>"+s[1]+"</dd></div>";
    }).join("");

    var gec=document.getElementById("gecit-ozet");
    if(gec){
      gec.innerHTML = ozet.hedefTip==="gecit"
        ? "<div class='go-bas'>Geçitler</div>"+ozet.gecitler.map(function(g){
            return "<div class='go-satir'><b>"+g.kisa+"</b><span>"+g.ad+"</span><em>"+g.il+"</em></div>";
          }).join("")
        : "<div class='go-not'>Bu modda geçitler zafer koşulu değil, ama geçiş vergisi ve savunma avantajı yine geçerli.</div>";
    }
  }

  /* Öne çıkan modun dışındakiler altta: adı, kısa künyesi ve "SEÇ". */
  function digerleri(){
    var host=document.getElementById("subrow");
    host.innerHTML="";
    modes.filter(function(m){ return m.key!==secili; }).forEach(function(m){
      var rakip=(m.stats||[]).filter(function(x){ return x.k==="Rakip"; })[0];
      var tempo=(m.stats||[]).filter(function(x){ return x.k==="Tempo"; })[0];
      var el=document.createElement("div");
      el.className="sub";
      el.innerHTML='<h3>'+m.name+'</h3>'+
        '<p>'+(gecitMi(m)
          ? "Altı geçidin "+m.hedef.gerek+" tanesini tut."
          : "Düşman başkentini ele geçir.")+'</p>'+
        '<div class="meta">'+(rakip?rakip.v:"")+(tempo?' · '+tempo.v:'')+'</div>'+
        '<button class="btn btn-alt">SEÇ</button>';
      el.querySelector("button").addEventListener("click", function(){ sec(m.key); });
      host.appendChild(el);
    });
  }

  function sec(key){
    secili=key;
    seferKur();          // mod değişince dünya da o modun kurallarıyla kurulur
  }

  /* ---------------- Ayar düğmeleri ---------------- */
  function secenekKur(kapId, uygula){
    var kap=document.getElementById(kapId);
    if(!kap) return;
    kap.addEventListener("click", function(e){
      var b=e.target.closest ? e.target.closest("button") : null;
      if(!b || !b.dataset.v) return;
      var dugmeler=kap.querySelectorAll("button");
      for(var i=0;i<dugmeler.length;i++) dugmeler[i].classList.remove("acik");
      b.classList.add("acik");
      uygula(b.dataset.v);
      seferKur();
    });
  }
  secenekKur("sec-bot", function(v){ ayar.botSayisi=parseInt(v,10); });
  secenekKur("sec-zorluk", function(v){ ayar.zorluk=v; });

  (function tohumKur(){
    var giris=document.getElementById("tohum-giris");
    var yeni=document.getElementById("tohum-yeni");
    if(yeni){
      yeni.addEventListener("click", function(){ ayar.tohum=null; seferKur(); });
    }
    if(giris){
      var uygula=function(){
        var v=parseInt(giris.value,10);
        ayar.tohum = isNaN(v) ? null : v;
        seferKur();
      };
      giris.addEventListener("change", uygula);
      giris.addEventListener("keydown", function(e){ if(e.key==="Enter") uygula(); });
    }
  })();

  /* ---------------- Kimlik ---------------- */
  function sakla(k,v){
    try{ if(v===undefined) return localStorage.getItem("bf_"+k); localStorage.setItem("bf_"+k,v); }
    catch(e){ return null; }
  }
  function kimlik(){
    var tag=document.getElementById("me-tag"), ad=document.getElementById("me-name");
    tag.value=sakla("tag")||"TR"; ad.value=sakla("ad")||"Komutan";
    tag.addEventListener("input",function(){
      tag.value=tag.value.replace(/\s/g,"").toLocaleUpperCase("tr"); sakla("tag",tag.value);
    });
    ad.addEventListener("input",function(){ sakla("ad",ad.value); });
    tag.addEventListener("blur",function(){ if(!tag.value.trim()){ tag.value="TR"; sakla("tag","TR"); } });
    ad.addEventListener("blur",function(){ if(!ad.value.trim()){ ad.value="Komutan"; sakla("ad","Komutan"); } });
  }

  var tt=null;
  function lobiToast(metin){
    var t=document.getElementById("lo-toast");
    if(!t) return;
    t.innerHTML=metin;
    t.hidden=false;
    requestAnimationFrame(function(){ t.classList.add("show"); });
    clearTimeout(tt);
    tt=setTimeout(function(){ t.classList.remove("show"); setTimeout(function(){ t.hidden=true; },170); },1700);
  }

  /* ---------------- Bağlantılar ---------------- */
  /* Kaydedilmiş sefer varsa lobide "Devam et" görünür; yoksa düğme hiç
     yer kaplamaz. Sahte/kilitli seçenek göstermiyoruz (şartname B26). */
  (function devamKur(){
    var btn=document.getElementById("play-continue");
    var ozetEl=document.getElementById("devam-ozet");
    if(!btn || !window.__bfKayitOzet) return;
    var ozet=window.__bfKayitOzet();
    if(!ozet) return;
    if(ozetEl) ozetEl.textContent=ozet.mod+" · "+ozet.tur+". tur · "+ozet.il+" il";
    btn.hidden=false;
    btn.addEventListener("click", function(){
      lobby.classList.add("leaving");
      setTimeout(function(){
        lobby.hidden=true; app.hidden=false;
        if(raf){ cancelAnimationFrame(raf); raf=null; }
        if(window.__bfOnShow) window.__bfOnShow();
        if(window.__bfDevamEt) window.__bfDevamEt();
      },190);
    });
  })();

  document.getElementById("play-campaign").addEventListener("click", function(){
    try{ localStorage.removeItem("bf_sefer"); }catch(e){}
    lobby.classList.add("leaving");
    setTimeout(function(){
      lobby.hidden=true; app.hidden=false;
      if(raf){ cancelAnimationFrame(raf); raf=null; }
      // game.js haritayı #app gizliyken üretti ama sarmalayıcı 0x0 olduğu
      // için "ekranı doldur" hesabı bekletildi — şimdi tetikle.
      if(window.__bfOnShow) window.__bfOnShow();
      if(window.__bfShowInstructions) window.__bfShowInstructions();
    },190);
  });

  /* Yalnızca büyük karttaki yol akışı canlı; küçük pafta sabit. */
  var raf=null;
  function kare(t){
    raf=requestAnimationFrame(kare);
    if(lobby.hidden||!data) return;
    var m=mod(); if(!gecitMi(m)) return;
    var cv=document.getElementById("lo-hero");
    var L=olcek(cv,22); atlas(L,false); isaretler(L,true,t,true);
  }

  function ciz(){
    if(!data) return;
    hero(); digerleri(); komutanlar(); kunye();
  }

  kimlik();
  seferKur();                    // ilk dünya lobinin ayarlarıyla kurulur
  if(!ozet) ciz();               // motor yoksa da lobi çizilsin
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(ciz);
  window.addEventListener("resize", ciz);
  if(data && !raf) raf=requestAnimationFrame(kare);
})();

/* ================= SES MOTORU =================
   Şartname §08'in uygulaması. Hiçbir ses dosyası indirilmez: her ses
   WebAudio ile anlık sentezlenir. Sebep üç tane —
     1) CSP altında harici ses barındırılamıyor,
     2) paket boyutu büyümüyor (oyun hâlâ tek klasör, sıfır bağımlılık),
     3) her sesin parametresi denge sabiti gibi tek yerden ayarlanabiliyor.

   Dış dünyaya açılan üç kapı:
     window.__bfSes(ad)        — bir olayın sesini çal
     window.__bfSesAyar(...)   — açık/kapalı ve seviye
     window.__bfSesDurum()     — mevcut ayar

   Tarayıcı politikası gereği AudioContext ilk kullanıcı jestinde açılır;
   o ana kadar çağrılar sessizce yutulur, hata verilmez. */
(function(){
  "use strict";

  var ctx=null, ana=null, buslar={}, hazir=false;
  var ayar={acik:true, seviye:0.7};
  var sonCalma={};

  /* Üç bus: arayüz sesleri kısık, alarm en yüksek. Kritik bir olay
     duyulmadan geçmesin diye alarm çalarken gameplay bus'ı kısılır. */
  var BUS_SEVIYE={ui:0.35, gameplay:0.6, alarm:0.85};

  /* Ses paleti — tamamı tablo. Ton eğrisi kod değiştirmeden ayarlanabilir. */
  var PALET={
    uiTik:      {bus:"ui",       tip:"square",   f:[520,440],  sure:0.06, gain:0.30, kis:60},
    uiKisa:     {bus:"ui",       tip:"sine",     f:[880,880],  sure:0.04, gain:0.22, kis:80},
    uiRed:      {bus:"ui",       tip:"square",   f:[220,160],  sure:0.12, gain:0.30, kis:200},
    insa:       {bus:"gameplay", tip:"triangle", f:[300,600],  sure:0.18, gain:0.40, kis:200},
    yikim:      {bus:"gameplay", tip:"sawtooth", f:[300,120],  sure:0.22, gain:0.35, kis:250},
    taarruz:    {bus:"gameplay", tip:"sawtooth", f:[180,90],   sure:0.32, gain:0.42, kis:250, gurultu:0.5},
    savunma:    {bus:"gameplay", tip:"square",   f:[240,320],  sure:0.20, gain:0.34, kis:250},
    kesif:      {bus:"gameplay", tip:"sine",     f:[660,990],  sure:0.16, gain:0.28, kis:300},
    diplomasi:  {bus:"gameplay", tip:"triangle", f:[392,523],  sure:0.26, gain:0.32, kis:300},
    fetih:      {bus:"gameplay", akor:[392,523,659], sure:0.52, gain:0.34, kis:400},
    gecit:      {bus:"alarm",    akor:[330,494],     sure:0.70, gain:0.38, kis:800},
    ikmal:      {bus:"alarm",    tip:"sine",     f:[440,180],  sure:0.42, gain:0.36, kis:800},
    kayip:      {bus:"alarm",    tip:"sawtooth", f:[220,70],   sure:0.60, gain:0.44, kis:600, gurultu:0.35},
    nukleer:    {bus:"alarm",    tip:"sine",     f:[90,45],    sure:1.40, gain:0.55, kis:1000, gurultu:0.9},
    zafer:      {bus:"alarm",    akor:[392,523,659,784], sure:1.60, gain:0.42, kis:0, sirali:true},
    yenilgi:    {bus:"alarm",    akor:[330,262,196],     sure:1.60, gain:0.42, kis:0, sirali:true}
  };

  function depoOku(){
    try{
      var a=localStorage.getItem("bf_ses");
      var s=localStorage.getItem("bf_sesSeviye");
      if(a!==null) ayar.acik = a==="1";
      if(s!==null){ var n=parseFloat(s); if(!isNaN(n)) ayar.seviye=Math.max(0,Math.min(1,n)); }
    }catch(e){ /* localStorage kapalıysa varsayılanla devam */ }
  }
  function depoYaz(){
    try{
      localStorage.setItem("bf_ses", ayar.acik?"1":"0");
      localStorage.setItem("bf_sesSeviye", String(ayar.seviye));
    }catch(e){}
  }

  function kur(){
    if(hazir) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return false;
    try{
      ctx=new AC();
      ana=ctx.createGain();
      ana.gain.value=ayar.seviye;
      ana.connect(ctx.destination);
      Object.keys(BUS_SEVIYE).forEach(function(k){
        var g=ctx.createGain();
        g.gain.value=BUS_SEVIYE[k];
        g.connect(ana);
        buslar[k]=g;
      });
      hazir=true;
      return true;
    }catch(e){ return false; }
  }

  /* Tarayıcı, ses bağlamını ancak bir kullanıcı jestinden sonra çalıştırır. */
  function ac(){
    if(!kur()) return;
    if(ctx.state==="suspended"){ ctx.resume().catch(function(){}); }
  }
  ["pointerdown","keydown","touchstart"].forEach(function(t){
    document.addEventListener(t, ac, {passive:true});
  });

  function zarf(g, t0, sure, tepe){
    var atak=Math.min(0.012, sure*0.2);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002,tepe), t0+atak);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+sure);
  }

  function ton(bus, tip, f0, f1, sure, tepe, gecikme){
    var t0=ctx.currentTime+(gecikme||0);
    var osc=ctx.createOscillator(), g=ctx.createGain();
    osc.type=tip||"sine";
    osc.frequency.setValueAtTime(f0, t0);
    if(f1 && f1!==f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20,f1), t0+sure);
    zarf(g, t0, sure, tepe);
    osc.connect(g); g.connect(bus);
    osc.start(t0); osc.stop(t0+sure+0.03);
  }

  function gurultu(bus, sure, tepe, kesim){
    var t0=ctx.currentTime;
    var uzunluk=Math.floor(ctx.sampleRate*sure);
    var tampon=ctx.createBuffer(1, uzunluk, ctx.sampleRate);
    var veri=tampon.getChannelData(0);
    for(var i=0;i<uzunluk;i++) veri[i]=(Math.random()*2-1)*(1-i/uzunluk);
    var kaynak=ctx.createBufferSource(); kaynak.buffer=tampon;
    var filtre=ctx.createBiquadFilter();
    filtre.type="lowpass"; filtre.frequency.value=kesim||900;
    var g=ctx.createGain();
    zarf(g, t0, sure, tepe);
    kaynak.connect(filtre); filtre.connect(g); g.connect(bus);
    kaynak.start(t0); kaynak.stop(t0+sure+0.02);
  }

  /* Alarm çalarken oyun sesleri 200 ms kısılır — kritik bilgi bastırılmasın. */
  function kisma(){
    if(!buslar.gameplay) return;
    var t=ctx.currentTime;
    buslar.gameplay.gain.cancelScheduledValues(t);
    buslar.gameplay.gain.setValueAtTime(BUS_SEVIYE.gameplay, t);
    buslar.gameplay.gain.linearRampToValueAtTime(BUS_SEVIYE.gameplay*0.6, t+0.05);
    buslar.gameplay.gain.linearRampToValueAtTime(BUS_SEVIYE.gameplay, t+0.45);
  }

  function cal(ad){
    if(!ayar.acik || !PALET[ad]) return;
    if(document.hidden) return;                 // arka plan sekmede ses yok
    if(!hazir && !kur()) return;
    if(ctx.state!=="running") return;           // jest gelmemiş

    var p=PALET[ad], simdi=Date.now();
    if(p.kis && sonCalma[ad] && simdi-sonCalma[ad] < p.kis) return;   // spam koruması
    sonCalma[ad]=simdi;

    var bus=buslar[p.bus]||buslar.gameplay;
    if(p.bus==="alarm") kisma();

    if(p.akor){
      p.akor.forEach(function(f, i){
        var gec = p.sirali ? i*(p.sure/p.akor.length)*0.85 : i*0.035;
        var sure = p.sirali ? p.sure/p.akor.length : p.sure;
        ton(bus, "triangle", f, f, sure, p.gain*(p.sirali?1:0.7), gec);
      });
    } else {
      ton(bus, p.tip, p.f[0], p.f[1], p.sure, p.gain);
    }
    if(p.gurultu) gurultu(bus, p.sure*0.8, p.gain*p.gurultu, p.bus==="alarm"?500:1200);
  }

  depoOku();

  window.__bfSes=cal;
  window.__bfSesAyar=function(yeni){
    if(!yeni) return;
    if(typeof yeni.acik==="boolean") ayar.acik=yeni.acik;
    if(typeof yeni.seviye==="number") ayar.seviye=Math.max(0,Math.min(1,yeni.seviye));
    if(hazir && ana) ana.gain.value=ayar.seviye;
    depoYaz();
    if(ayar.acik) cal("uiKisa");
  };
  window.__bfSesDurum=function(){ return {acik:ayar.acik, seviye:ayar.seviye}; };
})();

(function(){
  "use strict";

  /* ================= Config ================= */
  // Türkiye haritası. Izgara, dikey ekranda okunabilsin diye enlemde biraz gerilir.
  var GRID_W=140, GRID_H=80, CELL=3;
  var REGION_COUNT=81;      // 81 il

  /* Kıyı çizgisi boylam/enlem çokgeni olarak tanımlı: çözünürlükten bağımsız. */
  var GEO={lon0:25.4, lon1:45.3, lat0:35.5, lat1:42.5};

  var ANATOLIA=[
    [29.05,41.15],[30.50,41.02],[31.80,41.32],[33.30,41.88],[34.20,41.75],[35.15,42.03],
    [36.00,41.45],[36.90,41.05],[38.40,40.92],[39.70,41.02],[41.00,41.38],[41.55,41.50],
    [42.60,41.10],[43.45,40.60],[43.65,40.10],[44.80,39.72],[44.40,38.35],[44.05,37.55],
    [44.35,37.20],[42.90,37.32],[42.35,37.25],[41.20,37.08],[40.20,36.85],[38.80,36.70],
    [37.50,36.62],[36.65,36.15],[36.15,35.85],[36.30,36.55],[35.75,36.78],[34.95,36.80],
    [34.55,36.28],[33.70,36.12],[33.05,36.05],[32.55,36.10],[32.00,36.30],[31.30,36.18],
    [30.70,36.98],[30.20,36.28],[29.60,36.18],[29.10,36.68],[28.45,36.75],[28.05,36.58],
    [27.40,36.70],[27.75,37.08],[27.25,37.05],[27.60,37.48],[27.15,37.62],[27.35,38.05],
    [26.85,38.18],[27.25,38.45],[26.72,38.60],[27.05,38.95],[26.62,39.25],[26.98,39.55],
    [26.20,39.62],[26.15,40.10],[27.00,40.28],[28.10,40.30],[29.10,40.42]
  ];

  var THRACE=[
    [26.30,40.15],[26.35,40.65],[26.05,40.80],[26.35,41.30],[26.60,41.68],[27.55,42.02],
    [28.15,41.98],[28.90,41.15],[28.70,40.92],[27.90,40.88],[27.10,40.82],[26.65,40.55]
  ];

  // Boğaz oyun ölçeğinde bir hücreden ince; iki yakayı bağlı sayıyoruz.
  var BOSPHORUS=[[28.75,40.86],[29.20,40.86],[29.20,41.30],[28.75,41.30]];

  /* Gürültü sonrası zorla uygulanan maskeler: bunlar olmadan kıyı düzeltmesi
     Marmara'yı doldurup Van Gölü'nü kapatıyor, siluet tanınmaz hâle geliyor. */
  var SEA_MASKS=[
    [[26.60,40.20],[29.15,40.30],[29.20,40.84],[27.00,40.86],[26.55,40.55]]   // Marmara
  ];
  var LAKES=[{lon:43.00, lat:38.62, r:0.36}];   // Van Gölü

  /* Türkiye'nin 81 ili, il merkezi koordinatlarıyla. Bölge sınırları bu
     merkezlerden Voronoi ile üretilir — gerçek il sınırlarının iyi bir
     yaklaşımıdır, çünkü sınırlar zaten büyük ölçüde merkezlere eşit uzaklıkta
     oluşmuştur. Elimizde resmi sınır verisi yok; bu bilinçli bir yaklaşım. */
  var ILLER=[
    ["İstanbul",41.01,28.98],["Ankara",39.93,32.86],["İzmir",38.42,27.14],
    ["Bursa",40.19,29.06],["Antalya",36.90,30.70],["Adana",37.00,35.32],
    ["Konya",37.87,32.48],["Şanlıurfa",37.17,38.79],["Gaziantep",37.07,37.38],
    ["Kocaeli",40.77,29.92],["Mersin",36.81,34.64],["Diyarbakır",37.91,40.24],
    ["Kayseri",38.73,35.49],["Eskişehir",39.78,30.52],["Samsun",41.29,36.33],
    ["Denizli",37.78,29.09],["Şanlıurfa2",0,0],
    ["Kahramanmaraş",37.58,36.94],["Malatya",38.35,38.31],["Erzurum",39.90,41.27],
    ["Van",38.49,43.38],["Batman",37.88,41.13],["Elazığ",38.68,39.22],
    ["Sivas",39.75,37.02],["Manisa",38.62,27.43],["Tekirdağ",40.98,27.51],
    ["Balıkesir",39.65,27.89],["Sakarya",40.78,30.40],["Aydın",37.85,27.84],
    ["Muğla",37.22,28.36],["Afyonkarahisar",38.76,30.54],["Trabzon",41.00,39.72],
    ["Ordu",40.98,37.88],["Tokat",40.31,36.55],["Mardin",37.31,40.74],
    ["Adıyaman",37.76,38.28],["Zonguldak",41.45,31.79],["Osmaniye",37.07,36.25],
    ["Çorum",40.55,34.95],["Kütahya",39.42,29.98],["Hatay",36.20,36.16],
    ["Ağrı",39.72,43.05],["Isparta",37.77,30.55],["Yozgat",39.82,34.81],
    ["Aksaray",38.37,34.03],["Edirne",41.68,26.56],["Düzce",40.84,31.16],
    ["Muş",38.73,41.49],["Kırklareli",41.74,27.22],["Uşak",38.68,29.41],
    ["Niğde",37.97,34.68],["Bitlis",38.40,42.11],["Rize",41.02,40.52],
    ["Amasya",40.65,35.83],["Siirt",37.93,41.94],["Giresun",40.91,38.39],
    ["Çanakkale",40.15,26.41],["Karaman",37.18,33.22],["Kastamonu",41.39,33.78],
    ["Kırıkkale",39.85,33.51],["Nevşehir",38.62,34.71],["Bolu",40.74,31.61],
    ["Erzincan",39.75,39.49],["Kars",40.60,43.10],["Şırnak",37.52,42.46],
    ["Burdur",37.72,30.29],["Bingöl",38.88,40.50],["Kırşehir",39.15,34.16],
    ["Bilecik",40.14,29.98],["Yalova",40.66,29.28],["Karabük",41.20,32.63],
    ["Sinop",42.03,35.15],["Çankırı",40.60,33.62],["Hakkâri",37.57,43.74],
    ["Bartın",41.64,32.34],["Kilis",36.72,37.12],["Gümüşhane",40.46,39.48],
    ["Iğdır",39.92,44.04],["Ardahan",41.11,42.70],["Artvin",41.18,41.82],
    ["Bayburt",40.26,40.23],["Tunceli",39.11,39.55]
  ].filter(function(p){ return p[1]!==0; });
  /* ================= Geçitler =================
     Tasarımın kalbi: kazanmak toprak toplamak değil, ORDULARIN VE TİCARETİN
     geçmek zorunda olduğu daracık yerleri tutmak. Bunlar uydurulmuş kareler
     değil, Anadolu'nun gerçek boğaz ve dağ geçitleri — tarih boyunca da bu
     yüzden savaşılan yerler. Dünya haritasına geçildiğinde aynı liste
     Süveyş / Panama / Cebelitarık / Malakka / Hürmüz olacak. */
  var GECITLER=[
    {ad:"İstanbul Boğazı",  kisa:"BOĞAZ",   lat:41.10, lon:29.05},
    {ad:"Çanakkale Boğazı", kisa:"ÇANAK",   lat:40.20, lon:26.40},
    {ad:"Gülek Boğazı",     kisa:"GÜLEK",   lat:37.28, lon:34.78},
    {ad:"Belen Geçidi",     kisa:"BELEN",   lat:36.49, lon:36.20},
    {ad:"Zigana Geçidi",    kisa:"ZİGANA",  lat:40.65, lon:39.40},
    {ad:"Kop Geçidi",       kisa:"KOP",     lat:40.05, lon:40.35}
  ];

  var SEA_FILL="#0d1922";
  /* Palet artık gameplay anlamı taşıyor: lacivert=sen, bordo=düşman,
     mat gri-taş=nötr, amber=kaynak/aksiyon. Yeşil bilinçli olarak
     neredeyse hiç kullanılmıyor — sahiplik rengi karıştırılmasın diye. */
  var CATEGORY_COLORS={
    player:[54,84,124],
    enemy:[120,42,54],
    enemyCapital:[148,36,50],
    resource:[150,112,48],
    empty:[80,84,90],
    obstacle:[68,70,76],
    flashHit:[196,84,54],
    wall:[176,166,142],
    hover:[214,164,58],
    scorched:[52,46,44],
    selected:[112,172,232]
  };

  var BUILDINGS={
    tufek:{name:"Tüfek Mevzisi", cost:30, def:5, desc:"+5 savunma · piyadeyi ×1.5 durdurur · hava akınına çaresiz"},
    duvar:{name:"Duvar", cost:65, def:8, desc:"+8 savunma · piyadeyi ×1.8 durdurur · topçu barajı etkisiz kılar"},
    hava:{name:"Hava Savunması", cost:130, def:14, sam:true, desc:"+14 savunma · hava akınını ×2.4 ezer · gelen füzeyi önleyebilir"},
    fabrika:{name:"Fabrika", cost:70, gold:4, desc:"+4 altın / tur · Topçu Barajı ve Hava Akını saldırılarını açar"},
    kent:{name:"Kent", cost:140, gold:2, army:2, popCap:35, desc:"+2 altın, +2 asker/tur · asker tavanını +35 yükseltir"},
    silo:{name:"Füze Silosu", cost:160, desc:"Nükleer fırlatma için şart · üretim vermez"}
  };

  /* Bina ve tahkimat işaretleri — askeri harita sembolojisi gibi çizgi tabanlı.
     Her sembol birim kare (0..1) üzerinde tanımlanır, bu yüzden haritada 14px,
     panelde 40px olarak aynı netlikte çizilir. Amaç tek bakışta tanınmak. */
  var SYMBOLS={
    // Tüfek Mevzisi — çatılı ev, penceresinden dışarı uzanan namlular
    tufek:function(p){
      p.poly([.10,.44, .50,.17, .90,.44]);          // çatı
      p.rect(.17,.44,.66,.38);                       // gövde
      p.rect(.50,.52,.24,.16);                       // pencere
      p.line(.54,.57,.97,.48);                       // namlu 1
      p.line(.54,.64,.97,.58);                       // namlu 2
      p.rect(.27,.62,.14,.20);                       // kapı
    },
    // Duvar — mazgallı taş sur
    duvar:function(p){
      p.poly([.08,.46, .08,.28, .26,.28, .26,.46, .40,.46, .40,.28, .58,.28,
              .58,.46, .72,.46, .72,.28, .90,.28, .90,.46]);
      p.rect(.08,.46,.82,.32);
      p.line(.08,.62,.90,.62);                       // taş sırası
      p.line(.49,.46,.49,.62);                       // derz
      p.line(.29,.62,.29,.78);
      p.line(.69,.62,.69,.78);
    },
    // Hava Savunması — rampa kutusunun içinde füze
    hava:function(p){
      p.rect(.14,.30,.72,.50);                       // atış kutusu
      p.poly([.50,.34, .40,.50, .60,.50, .50,.34]);  // füze başlığı
      p.rect(.42,.50,.16,.18);                       // füze gövdesi
      p.line(.42,.62,.33,.74);                       // kanatçık
      p.line(.58,.62,.67,.74);
      p.line(.06,.86,.94,.86);                       // taban
    },
    // Fabrika — testere dişli çatı, bacadan tüten duman
    fabrika:function(p){
      p.poly([.10,.52, .10,.42, .28,.52, .28,.42, .46,.52, .46,.42, .64,.52]);
      p.rect(.10,.52,.78,.30);
      p.rect(.70,.20,.13,.32);                       // baca
      p.arc(.83,.14,.09, Math.PI*0.85, Math.PI*2.15);// duman
      p.rect(.20,.64,.12,.18);                       // kapı
    },
    // Füze Silosu — açılmış kapak, yükselen füze
    silo:function(p){
      p.rect(.24,.52,.52,.30);
      p.line(.18,.52,.36,.40);          // açılan kapak
      p.line(.82,.52,.64,.40);
      p.poly([.50,.14, .42,.30, .58,.30, .50,.14]);   // başlık
      p.rect(.43,.30,.14,.22);          // gövde
      p.line(.08,.86,.92,.86);
    },
    // Kent — pencereli, farklı yükseklikte binalar
    kent:function(p){
      p.rect(.08,.48,.24,.34);
      p.rect(.38,.24,.24,.58);
      p.rect(.68,.58,.24,.24);
      p.line(.44,.36,.56,.36);                       // pencere sırası
      p.line(.44,.48,.56,.48);
      p.line(.14,.58,.26,.58);
      p.line(.04,.82,.96,.82);                       // zemin
    }
  };
  /* Savunma yapıları: hem oyuncunun kurdukları hem düşman bölgelerinde
     hazır bulunanlar. Her biri saldırı tipine göre farklı çarpan uygular. */
  var DEFENSIVE=["duvar","tufek","hava"];

  /* Saldırı tipleri. İki kaldıraç var:
       bypass — bu yapının savunma katkısı hiç sayılmaz (karşı-saldırı onu etkisizleştirir)
       vs     — bu yapı saldırıya direniyorsa savunmayı katlar (daima >= 1)
     Çarpanlar asla 1'in altına inmez: tahkimat kurmak bir bölgeyi hiçbir saldırı
     tipine karşı zayıflatmamalı, yalnızca doğru araçla etkisiz kılınabilmeli. */
  var ATTACKS={
    piyade:{
      name:"Piyade Taarruzu", icon:"⚔️", gold:0, requires:null,
      lootMult:1.0, garrisonMult:1.0, softenMult:0.8,
      bypass:[], vs:{duvar:1.8, tufek:1.5},
      desc:"Bedava ama kaba. Duvar ve tüfek mevzisi karşısında ağır bedel ödersin."
    },
    bombardiman:{
      name:"Topçu Barajı", icon:"💣", gold:40, requires:"fabrika",
      lootMult:0.45, garrisonMult:0.5, softenMult:1.2,
      bypass:["duvar"], vs:{tufek:1.15}, destroys:"duvar",
      desc:"Duvarı yerle bir eder — savunmasına hiç sayılmaz. Ama bölgeyi de harap eder: ganimetin yarısı kül olur."
    },
    akin:{
      name:"Hava Akını", icon:"🛩️", gold:60, requires:"fabrika",
      lootMult:1.0, garrisonMult:0.6, softenMult:1.5,
      bypass:["duvar","tufek"], vs:{hava:2.4},
      desc:"Duvarın ve siperin üstünden uçar, ganimete dokunmaz. Hava savunmasına yakalanırsa felaket."
    }
  };
  var ATTACK_KEYS=Object.keys(ATTACKS);

  /* Nükleer saldırılar. Konvansiyonel saldırılardan farklı bir kategoridir:
     bölge ele geçirmez, sadece yakar. Üçünü ayıran şey patlama alanı —
     halka sayısı arttıkça daha çok bölgeye ulaşır ama kendi toprağın da
     alana girebilir. Dağlar patlamayı keser. */
  var NUKES={
    taktik:{
      name:"Taktik Başlık", cost:170, rings:0, power:0.55,
      desc:"Tek bölgeyi vurur. Cerrahi darbe: sınırdaki sert bir karakolu yumuşatmak için."
    },
    stratejik:{
      name:"Stratejik Başlık", cost:310, rings:1, power:0.70,
      desc:"Hedefi ve bütün komşularını vurur. Komşulara hasar daha az iner."
    },
    termo:{
      name:"Termonükleer", cost:520, rings:2, power:0.85,
      desc:"İki halka boyunca yayılır. En yıkıcısı — ama alana giren kendi bölgelerin de yanar."
    }
  };
  var NUKE_KEYS=Object.keys(NUKES);
  var NUKE_REQUIRES="silo";            // fırlatma silosu olmadan füze atılamaz
  var RING_FALLOFF=[1, 0.6, 0.35];     // merkezden uzaklaştıkça hasar oranı
  var SCORCH_TURNS=8;                  // kavrulmuş toprak kaç tur üretimsiz kalır

  var RESOURCE_KINDS={
    maden:{raw:"⛏️", built:"⚒️", label:"Maden Bölgesi"},
    tarim:{raw:"🌾", built:"🚜", label:"Tarım Bölgesi"},
    odun:{raw:"🌲", built:"🪓", label:"Orman Bölgesi"}
  };
  var RESOURCE_KEYS=Object.keys(RESOURCE_KINDS);

  /* Yayılma şansları 81 illik haritaya göre düşürüldü: eski 20 bölgeli haritada
     boş toprak azdı, burada 20+ boş il var ve botlar eski hızla oynarsa
     oyuncuya genişleyecek yer bırakmıyorlar. */
  var BOT_DIFF={
    kolay:{label:"Kolay", basePower:5, growthStep:1, expandChance:0.18, reinforceStep:1},
    orta:{label:"Orta", basePower:9, growthStep:2, expandChance:0.30, reinforceStep:2},
    zor:{label:"Zor", basePower:14, growthStep:3, expandChance:0.46, reinforceStep:3}
  };
  var BOT_DIFF_KEYS=Object.keys(BOT_DIFF);
  var bots=[];
  // Skorbord çipleri zorluk seviyesine göre sabit renk taşır: sarımsı=kolay,
  // mor=orta, kırmızı=zor — hangi cephenin ne kadar tehlikeli olduğu renkten
  // bile anlaşılsın diye harita paletinden bağımsız, kendi ailesinde tutarlı.
  var BOT_COLORS={kolay:"#a8863f", orta:"#7a5a94", zor:"#b5432f"};
  var BOSS_COLOR="#82283a";

  /* ================= Denge sabitleri (v0.2) =================
     Üçü de tek bir sorunu çözüyor: eski sürümde oyun ne sömürüye kapalıydı
     ne de kaybedilebilirdi.
       MIN_TAARRUZ  — 1 askerle sonsuz aşındırma sömürüsünü kapatır.
       BAKIM_BOLEN  — altın biriktirmenin bedeli olur; "bekle ve büyü" biter.
       GECIT_TUTMA  — geçit zaferi anlık değil, tutmaya dayalı hale gelir. */
  var MIN_TAARRUZ=0.20;          // hedefin etkin savunmasının en az %20'si
  var BAKIM_BOLEN=8;             // ordu bakımı = ceil(ordu / 8) altın/tur
  var GECIT_TUTMA=8;             // geçit hedefini kaç tur tutmak gerekir
  var BASKENT_KAYIP=0.6;         // başkent kuşatmasında eriyen garnizon oranı

  /* ================= Sefer modları =================
     Lobideki kartlar süs değil: her biri gerçekten motoru değiştiriyor —
     botların zorluğu, tur/baskın/bot saatlerinin hızı ve açılış altını.
     Kurallar burada duruyor (motorun işi), lobi yalnızca okuyup gösteriyor. */
  var MODES={
    gecit:{
      name:"Geçit", tag:"YENİ",
      desc:"4/6 geçidi kontrol et. Rotanı koru, rakibin ikmalini kes.",
      hedef:{tip:"gecit", gerek:4, tut:GECIT_TUTMA},
      bots:null,
      gold:70, tick:2000, raid:24000, bot:6000
    },
    sefer:{
      name:"Sefer", tag:"KLASİK",
      desc:"Rakip karargâhına ulaş. Haritayı boydan boya geçmen gerekir.",
      hedef:{tip:"baskent"},
      bots:null,                       // null = rastgele karışık zorluk
      gold:60, tick:2000, raid:28000, bot:7000
    },
    kusatma:{
      name:"Kuşatma", tag:"ZOR",
      desc:"Dar alanda savunmayı kır. Üç cephe de zor, baskınlar sık.",
      hedef:{tip:"baskent"},
      bots:["zor","zor","zor"],
      gold:40, tick:2000, raid:18000, bot:5000
    },
    blitz:{
      name:"Blitz", tag:"HIZLI",
      desc:"Rakip hazırlanırken üstünlüğü ele geçir. Saat iki kat hızlı.",
      hedef:{tip:"baskent"},
      bots:["orta","orta","zor"],
      gold:95, tick:1000, raid:16000, bot:3800
    }
  };
  var activeMode="gecit";
  var LOOP={tick:2000, raid:28000, bot:7000};

  var state={gold:60, army:10, maxArmy:60, turn:0, gameOver:false, started:false, raidCount:0, lastExpansionBonus:0,
             ticaret:0, konvoyKaybi:0, fetih:0,
             /* v0.2: ekonomi dökümü, zafer sayacı, olay günlüğü, duraklatma */
             sonUretim:0, sonBakim:0, sonGelir:0, bakimToplam:0,
             gecitSayaci:null, baskentUyari:-99, olaylar:[], durakladi:false};

  var pixelRegionId=[];      // [y][x] -> region id or -1
  var landPixelsList=[];     // flat {x,y,regionId,noise,isBorder}
  var regions=[];
  var ilSirasi=[];           // bölgelerin il karşılıkları (0=İstanbul, 1=düşman başkenti)
  var animating=null;        // {region, flipped:Set}
  var flashRegionId=null;
  var dragHoverRegionId=null;
  var blastPreview=null;      // nükleer patlama alanı önizlemesi (bölge id listesi)
  var currentSel=null;
  var lbAnchors={};          // skorbord satırı -> haritada odaklanılacak nokta

  var canvas=document.getElementById("map");
  var ctx=canvas.getContext("2d");
  var LOGICAL_W=GRID_W*CELL, LOGICAL_H=GRID_H*CELL;
  var DPR=Math.min(window.devicePixelRatio||1, 3);
  canvas.width=Math.round(LOGICAL_W*DPR);
  canvas.height=Math.round(LOGICAL_H*DPR);
  ctx.scale(DPR,DPR);

  /* ---- Yerel sefer günlüğü ----
     Sunucu/hesap yok, o yüzden "çevrimiçi sıralama" gibi bir şey uydurmak
     yerine bu tarayıcıya özel, gerçek ve kalıcı üç sayaç tutuyoruz. Lobi
     (lobby.js) bunları okuyup gösteriyor. */
  function bfStatGet(key){
    try{ return parseInt(localStorage.getItem("bf_"+key),10) || 0; }
    catch(e){ return 0; }
  }
  function bfStatBump(key, by){
    try{ localStorage.setItem("bf_"+key, String(bfStatGet(key)+(by||1))); }
    catch(e){ /* localStorage kapalıysa sessizce yok say */ }
  }
  window.__bfStats=function(){
    return { sefer:bfStatGet("seferSayisi"), fetih:bfStatGet("toplamFetih"), kazanildi:bfStatGet("kazanildi") };
  };

  /* ================= Olay günlüğü ve seviyeli bildirim =================
     Eski sürümde "bina kuruldu" ile "BÖLGE DÜŞTÜ" aynı kutuda, aynı renkte,
     aynı süreyle çıkıyordu. Artık dört seviye var ve her seviyenin kendi
     görsel ağırlığı, kendi sesi ve kendi kalıcılığı var:
       1 mikro     — sessiz, kısa toast
       2 normal    — toast
       3 kritik    — kırmızı bant, uzun, sarsıntı + alarm sesi
       4 stratejik — pirinç bant + günlüğe yazılır (sefer kroniği)
     Günlük yalnızca 3 ve 4. seviyeyi saklar; sonuç ekranı bunları gösterir. */
  var OLAY_TAVAN=40;
  function olayEkle(seviye, metin){
    state.olaylar.push({tur:state.turn, seviye:seviye, metin:metin});
    if(state.olaylar.length>OLAY_TAVAN) state.olaylar.shift();
  }

  function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function clampByte(v){return Math.max(0,Math.min(255,Math.round(v)));}
  function dist2(ax,ay,bx,by){var dx=ax-bx, dy=ay-by; return dx*dx+dy*dy;}

  /* ================= World generation ================= */
  function generateWorld(){
    var land=[];
    for(var y=0;y<GRID_H;y++){ land.push(new Array(GRID_W).fill(false)); }

    /* Boylam/enlem -> ızgara. Nokta-çokgen testiyle Türkiye'nin silueti basılır,
       sonra kıyıya hafif gürültü eklenerek piksel-art dokusu verilir. */
    function lonToX(lon){ return (lon-GEO.lon0)/(GEO.lon1-GEO.lon0)*GRID_W; }
    function latToY(lat){ return (GEO.lat1-lat)/(GEO.lat1-GEO.lat0)*GRID_H; }

    function toGrid(poly){
      return poly.map(function(p){ return [lonToX(p[0]), latToY(p[1])]; });
    }
    function inPoly(x, y, poly){
      var inside=false;
      for(var a=0, b=poly.length-1; a<poly.length; b=a++){
        var xi=poly[a][0], yi=poly[a][1], xj=poly[b][0], yj=poly[b][1];
        if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside;
      }
      return inside;
    }

    var parcalar=[toGrid(ANATOLIA), toGrid(THRACE), toGrid(BOSPHORUS)];
    var goller=LAKES.map(function(l){
      return {x:lonToX(l.lon), y:latToY(l.lat),
              rx:l.r/(GEO.lon1-GEO.lon0)*GRID_W, ry:l.r/(GEO.lat1-GEO.lat0)*GRID_H};
    });

    for(var y=0;y<GRID_H;y++){
      for(var x=0;x<GRID_W;x++){
        var px=x+0.5, py=y+0.5, kara=false;
        for(var pi=0; pi<parcalar.length; pi++){
          if(inPoly(px, py, parcalar[pi])){ kara=true; break; }
        }
        if(kara){
          for(var li=0; li<goller.length; li++){
            var g=goller[li];
            if(Math.pow((px-g.x)/g.rx,2)+Math.pow((py-g.y)/g.ry,2) < 1){ kara=false; break; }
          }
        }
        land[y][x]=kara;
      }
    }

    // Kıyıya doğal düzensizlik: yalnızca tek hücrelik boşluklar doldurulur,
    // yoksa dar boğazlar ve göller kapanıp siluet tanınmaz oluyor.
    var kopya=land.map(function(row){ return row.slice(); });
    function komsuKara(x,y){
      var n=0, nb=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
      for(var i=0;i<nb.length;i++){
        var nx=nb[i][0], ny=nb[i][1];
        if(nx<0||nx>=GRID_W||ny<0||ny>=GRID_H) continue;
        if(kopya[ny][nx]) n++;
      }
      return n;
    }
    for(var y3=0;y3<GRID_H;y3++){
      for(var x3=0;x3<GRID_W;x3++){
        var k=komsuKara(x3,y3);
        if(kopya[y3][x3]){ if(k<=2 && Math.random()<0.30) land[y3][x3]=false; }
        else if(k>=4 && Math.random()<0.55){ land[y3][x3]=true; }
      }
    }

    /* Maskeleri gürültüden sonra tekrar bas: Marmara ve Van Gölü her hâlükârda
       deniz, Boğaz köprüsü her hâlükârda kara kalsın (yoksa Trakya kopar ve
       en-büyük-kütle kuralıyla haritadan silinir). */
    var denizler=SEA_MASKS.map(toGrid), kopru=toGrid(BOSPHORUS);
    for(var my=0; my<GRID_H; my++){
      for(var mx=0; mx<GRID_W; mx++){
        var qx=mx+0.5, qy=my+0.5;
        for(var di=0; di<denizler.length; di++){
          if(inPoly(qx, qy, denizler[di])){ land[my][mx]=false; }
        }
        for(var gi=0; gi<goller.length; gi++){
          var gg=goller[gi];
          if(Math.pow((qx-gg.x)/gg.rx,2)+Math.pow((qy-gg.y)/gg.ry,2) < 1){ land[my][mx]=false; }
        }
        if(inPoly(qx, qy, kopru)){ land[my][mx]=true; }
      }
    }

    /* En büyük bağlı kara kütlesini tut. Merkezden başlamak yerine bunu
       yapıyoruz çünkü ızgara merkezi denize düşebilir ve kopuk adacıklar
       (kıyı gürültüsünden doğan) haritada ulaşılamaz bölge bırakır. */
    var etiket=[];
    for(var yy=0;yy<GRID_H;yy++){ etiket.push(new Array(GRID_W).fill(-1)); }
    var parcaListesi=[];
    for(var sy=0; sy<GRID_H; sy++){
      for(var sx=0; sx<GRID_W; sx++){
        if(!land[sy][sx] || etiket[sy][sx]!==-1) continue;
        var id=parcaListesi.length, hucreler=[], stack=[[sx,sy]];
        etiket[sy][sx]=id;
        while(stack.length){
          var cur=stack.pop();
          hucreler.push(cur);
          var nb=[[cur[0]-1,cur[1]],[cur[0]+1,cur[1]],[cur[0],cur[1]-1],[cur[0],cur[1]+1]];
          for(var i=0;i<nb.length;i++){
            var nx=nb[i][0], ny=nb[i][1];
            if(nx<0||nx>=GRID_W||ny<0||ny>=GRID_H) continue;
            if(!land[ny][nx] || etiket[ny][nx]!==-1) continue;
            etiket[ny][nx]=id;
            stack.push([nx,ny]);
          }
        }
        parcaListesi.push(hucreler);
      }
    }
    var mainland=[];
    parcaListesi.forEach(function(p){ if(p.length>mainland.length) mainland=p; });
    for(var y2=0;y2<GRID_H;y2++){
      for(var x2=0;x2<GRID_W;x2++){
        if(land[y2][x2] && etiket[y2][x2]!==etiket[mainland[0][1]][mainland[0][0]]) land[y2][x2]=false;
      }
    }

    // seeds: capital (bottom), boss capital (top), then scattered
    function nearestMainland(tx,ty){
      var best=null, bestD=Infinity;
      for(var i=0;i<mainland.length;i++){
        var mx=mainland[i][0], my=mainland[i][1];
        var d=dist2(tx,ty,mx,my);
        if(d<bestD){ bestD=d; best=[mx,my]; }
      }
      return best;
    }
    /* Tohumlar il merkezleri. Denize düşen merkez en yakın kara hücresine
       çekilir; iki il aynı hücreye düşerse ikincisi bir sonraki boş hücreye
       kaydırılır, yoksa o il piksel alamaz ve haritadan silinir. */
    var kullanilan={};
    function serbestKara(tx,ty){
      var sirali=mainland.slice().sort(function(a,b){
        return dist2(tx,ty,a[0],a[1]) - dist2(tx,ty,b[0],b[1]);
      });
      for(var i=0;i<sirali.length;i++){
        var k=sirali[i][0]+","+sirali[i][1];
        if(!kullanilan[k]){ kullanilan[k]=true; return sirali[i]; }
      }
      return mainland[0];
    }

    // Oyuncu İstanbul'da, düşman başkenti en doğudaki ilde.
    var sirakli=ILLER.slice();
    var istIdx=0;
    var doguIdx=0;
    for(var q=0;q<sirakli.length;q++){
      if(sirakli[q][0]==="İstanbul") istIdx=q;
      if(sirakli[q][2]>sirakli[doguIdx][2]) doguIdx=q;
    }
    var ist=sirakli.splice(istIdx,1)[0];
    if(doguIdx>istIdx) doguIdx--;
    var dogu=sirakli.splice(doguIdx,1)[0];
    sirakli.unshift(dogu);
    sirakli.unshift(ist);
    ilSirasi=sirakli;

    var seeds=sirakli.map(function(il){
      return serbestKara(lonToX(il[2]), latToY(il[1]));
    });

    // voronoi assignment
    for(var y3=0;y3<GRID_H;y3++){ pixelRegionId.push(new Array(GRID_W).fill(-1)); }
    for(var i2=0;i2<mainland.length;i2++){
      var px=mainland[i2][0], py=mainland[i2][1];
      var bestS=0, bestSD=Infinity;
      for(var s2=0;s2<seeds.length;s2++){
        var d2=dist2(px,py,seeds[s2][0],seeds[s2][1]);
        if(d2<bestSD){ bestSD=d2; bestS=s2; }
      }
      pixelRegionId[py][px]=bestS;
    }

    // build region objects
    for(var r=0;r<REGION_COUNT;r++){
      regions.push({
        id:r, pixels:[], neighbors:new Set(), building:null,
        type: r===0?"capital": (r===1?"enemyCapital":null),
        owner: r===0?"player": (r===1?"enemy":"neutral"),
        name: (ilSirasi[r]?ilSirasi[r][0]:("Bölge "+r)),
        defense: r===1?44:null, garrison:0, defenses:[], botId:null, resKind:null, cost:null, goldBonus:null, anchor:{x:seeds[r][0],y:seeds[r][1]}
      });
    }

    for(var i3=0;i3<mainland.length;i3++){
      var px2=mainland[i3][0], py2=mainland[i3][1];
      var rid=pixelRegionId[py2][px2];
      var isBorder=false;
      var nbb=[[px2-1,py2],[px2+1,py2],[px2,py2-1],[px2,py2+1]];
      for(var k=0;k<nbb.length;k++){
        var nx2=nbb[k][0], ny2=nbb[k][1];
        if(nx2<0||nx2>=GRID_W||ny2<0||ny2>=GRID_H){ isBorder=true; continue; }
        var otherRid = pixelRegionId[ny2][nx2];
        if(otherRid===-1){ isBorder=true; continue; }
        if(otherRid!==rid){
          isBorder=true;
          regions[rid].neighbors.add(otherRid);
          regions[otherRid].neighbors.add(rid);
        }
      }
      var pxObj={x:px2,y:py2,regionId:rid,noise:randInt(-9,9),isBorder:isBorder};
      regions[rid].pixels.push(pxObj);
      landPixelsList.push(pxObj);
    }

    // proper anchor = pixel closest to centroid
    regions.forEach(function(region){
      if(!region.pixels.length) return;
      var sx=0, sy=0;
      region.pixels.forEach(function(p){ sx+=p.x; sy+=p.y; });
      var avx=sx/region.pixels.length, avy=sy/region.pixels.length;
      var best=region.pixels[0], bestD=Infinity;
      region.pixels.forEach(function(p){
        var d=dist2(p.x,p.y,avx,avy);
        if(d<bestD){ bestD=d; best=p; }
      });
      region.anchor={x:best.x, y:best.y};
    });

    // graph distance from capital
    var dist=new Array(regions.length).fill(Infinity);
    dist[0]=0;
    var q=[0];
    while(q.length){
      var c=q.shift();
      regions[c].neighbors.forEach(function(nid){
        if(dist[nid]===Infinity){ dist[nid]=dist[c]+1; q.push(nid); }
      });
    }

    // assign remaining region types
    for(var r2=2;r2<REGION_COUNT;r2++){
      var region=regions[r2];
      var rnd=Math.random();
      var gd = dist[r2]===Infinity ? 6 : dist[r2];
      if(rnd<0.11){
        region.type="obstacle"; region.owner="neutral";
      } else if(rnd<0.38){
        region.type="resource"; region.owner="neutral";
        region.resKind = RESOURCE_KEYS[randInt(0,RESOURCE_KEYS.length-1)];
        region.cost = 30 + Math.floor(region.pixels.length/12);
        region.goldBonus = 3 + Math.floor(region.pixels.length/40);
      } else if(rnd<0.72){
        region.type="enemy"; region.owner="enemy";
        region.defense = clamp(4 + Math.round(gd*2.4) + randInt(0,4), 3, 46);
        region.defenses = rollDefenses(gd);
      } else {
        region.type="empty"; region.owner="neutral";
        region.cost = 15 + Math.floor(region.pixels.length/15);
      }
    }

    // Düşman başkenti üç savunmayı da barındırır: tek bir saldırı tipiyle düşmez.
    regions[1].defenses = DEFENSIVE.slice();

    // safety: never let capital or boss capital be fully walled in by obstacles
    [0,1].forEach(function(rid){
      var nbIds=Array.from(regions[rid].neighbors);
      var allBlocked = nbIds.length>0 && nbIds.every(function(id){ return regions[id].type==="obstacle"; });
      if(allBlocked){
        var freed=regions[nbIds[0]];
        freed.type="empty"; freed.owner="neutral";
        freed.cost = 15 + Math.floor(freed.pixels.length/15);
      }
    });

    assignBots();

    /* Her geçidi, koordinatının düştüğü ile bağla. Denize düşerse en yakın
       kara hücresine çekilir — Voronoi bölgeleri il merkezlerinden üretildiği
       için boğazlar sahil illerine oturuyor. */
    GECITLER.forEach(function(g){
      var gx=Math.round(lonToX(g.lon)), gy=Math.round(latToY(g.lat));
      var rid = (gy>=0&&gy<GRID_H&&gx>=0&&gx<GRID_W) ? pixelRegionId[gy][gx] : -1;
      if(rid<0){
        var yakin=nearestMainland(gx,gy);
        rid = yakin ? pixelRegionId[yakin[1]][yakin[0]] : -1;
      }
      g.gx=gx; g.gy=gy; g.regionId=rid;
      if(rid>=0 && regions[rid]) regions[rid].gecit=g;
    });
  }

  function assignBots(){
    var enemyRegions=regions.filter(function(r){ return r.id!==1 && r.type==="enemy"; });
    if(!enemyRegions.length){ bots=[]; return; }
    var seedCount=Math.min(3, enemyRegions.length);
    var shuffled=enemyRegions.slice().sort(function(){ return Math.random()-0.5; });
    var seeds=shuffled.slice(0, seedCount);

    var assign={};
    var queue=[];
    seeds.forEach(function(s, bi){ assign[s.id]=bi; queue.push(s.id); });
    var qi=0;
    while(qi<queue.length){
      var curId=queue[qi++];
      var curBot=assign[curId];
      regions[curId].neighbors.forEach(function(nid){
        var nr=regions[nid];
        if(nr.type==="enemy" && nid!==1 && !(nid in assign)){
          assign[nid]=curBot;
          queue.push(nid);
        }
      });
    }
    enemyRegions.forEach(function(r){
      if(!(r.id in assign)) assign[r.id]=randInt(0,seedCount-1);
    });

    var diffs=BOT_DIFF_KEYS.slice().sort(function(){ return Math.random()-0.5; });
    bots=[];
    for(var i=0;i<seedCount;i++){
      var diffKey=diffs[i % diffs.length];
      bots.push({id:i, difficulty:diffKey, power:BOT_DIFF[diffKey].basePower, ateskes:0});
    }
    enemyRegions.forEach(function(r){ r.botId=assign[r.id]; });
  }

  /* ================= Helpers ================= */
  function categoryForType(type){
    if(type==="obstacle") return "obstacle";
    if(type==="enemyCapital") return "enemyCapital";
    if(type==="enemy") return "enemy";
    if(type==="resource") return "resource";
    return "empty";
  }
  function categoryForRegion(region){
    if(isScorched(region)) return "scorched";
    if(region.owner==="player") return "player";
    return categoryForType(region.type);
  }
  function isScorched(region){ return !!region.scorched && region.scorched>state.turn; }
  function pixelFillStyle(cat,noise,isBorder){
    var b=CATEGORY_COLORS[cat];
    var d=isBorder?24:0;
    var r=clampByte(b[0]+noise-d), g=clampByte(b[1]+noise-d), bl=clampByte(b[2]+noise-d);
    return "rgb("+r+","+g+","+bl+")";
  }
  function isAdjacentToPlayer(region){
    var found=false;
    region.neighbors.forEach(function(nid){ if(regions[nid].owner==="player") found=true; });
    return found;
  }
  function isAdjacentToEnemy(region){
    var found=false;
    region.neighbors.forEach(function(nid){ if(regions[nid].owner==="enemy") found=true; });
    return found;
  }
  /* ---- Savunma yapıları ---- */

  // Derinlere gidildikçe düşman daha iyi tahkim edilmiş olur.
  function rollDefenses(gd){
    var out=[];
    var count = Math.random() < clamp(0.18+gd*0.09, 0.18, 0.72) ? (Math.random()<0.30 ? 2 : 1) : 0;
    var pool=DEFENSIVE.slice();
    for(var i=0;i<count && pool.length;i++){
      out.push(pool.splice(randInt(0,pool.length-1),1)[0]);
    }
    return out;
  }

  // Bir bölgede savunmaya katkı veren tüm yapılar (düşmanınki + oyuncunun kurduğu).
  function defenseStructures(region){
    var list=(region.defenses||[]).slice();
    if(region.building && list.indexOf(region.building)<0) list.push(region.building);
    return list.filter(function(k){ return DEFENSIVE.indexOf(k)>=0; });
  }
  function hasStructure(region, key){ return defenseStructures(region).indexOf(key)>=0; }

  /* ---- Nükleer ---- */

  /* Patlama alanı: hedeften başlayıp halka halka dışa yayılır.
     Dağlar (obstacle) patlamayı keser — arazi ilk kez saldırıyı şekillendirir. */
  function blastRegions(center, rings){
    var seen={}, out=[{region:center, ring:0}], frontier=[center];
    seen[center.id]=true;
    for(var r=1; r<=rings; r++){
      var next=[];
      frontier.forEach(function(reg){
        reg.neighbors.forEach(function(nid){
          if(seen[nid]) return;
          var nr=regions[nid];
          seen[nid]=true;
          if(nr.type==="obstacle") return;      // dağ silsilesi patlamayı durdurur
          out.push({region:nr, ring:r});
          next.push(nr);
        });
      });
      frontier=next;
    }
    return out;
  }

  function nukeAvailability(key){
    var n=NUKES[key];
    if(!regions.some(function(r){ return r.owner==="player" && r.building===NUKE_REQUIRES; })){
      return {ok:false, reason:BUILDINGS[NUKE_REQUIRES].name+" kurman gerek"};
    }
    if(state.gold<n.cost) return {ok:false, reason:"Yetersiz altın"};
    return {ok:true, reason:""};
  }

  /* Nükleer saldırı bölge ele geçirmez; garnizonu eritir, tahkimatı yıkar ve
     toprağı belirli bir süre üretimsiz bırakır. Kendi bölgen alandaysa o da yanar. */
  /* Hedefin çevresindeki düşman Hava Savunmaları SAM görevi görür. Yazı-tura
     değil, belirlenimli: SAM füzeyi önler ve bu işlemde kendisi tükenir.
     Termonükleer tek bir SAM'i doyurur — onu durdurmak için iki SAM gerekir.
     Böylece kural bir denemede öğrenilir: önce kalkanı sustur, sonra vur. */
  function samsInRange(target){
    var bulunan=[];
    var bak=function(r){
      if(r.owner!=="enemy") return;
      if((r.defenses||[]).indexOf("hava")>=0) bulunan.push({region:r, from:"defenses"});
      else if(r.building==="hava") bulunan.push({region:r, from:"building"});
    };
    bak(target);
    target.neighbors.forEach(function(nid){ bak(regions[nid]); });
    return bulunan;
  }

  // Bu başlığı durdurmak için gereken SAM sayısı
  function samNeeded(key){ return key==="termo" ? 2 : 1; }

  function launchNuke(target, key){
    var n=NUKES[key];
    if(!nukeAvailability(key).ok) return false;
    state.gold-=n.cost;

    var sams=samsInRange(target);
    if(sams.length>=samNeeded(key)){
      // Önleyen SAM kendini harcar: bir sonraki füzen daha kolay geçer.
      var harcanan=sams[0];
      if(harcanan.from==="defenses"){
        harcanan.region.defenses=harcanan.region.defenses.filter(function(k){ return k!=="hava"; });
      } else {
        harcanan.region.building=null;
      }
      var ic=regionCenter(target);
      addShake(3);
      addBurst(ic.x, ic.y-8, 20, ["#63b394","#cfc4a4","#5aa285"], 1.7, 750);
      addFloater(ic.x, ic.y-14, "ÖNLENDİ", "#63b394");
      invalidateRoutes();
      drawMap();
      showToast("🛡️ Füzen havada vuruldu — Hava Savunması önledi ve bu işte tükendi. "+
        n.cost+" altın gitti, ama menzilde "+(sams.length-1)+" SAM kaldı.");
      return true;
    }

    var hits=blastRegions(target, n.rings);
    var foeHit=0, ownHit=0, razed=0, troopsLost=0;

    hits.forEach(function(h){
      var reg=h.region, frac=n.power*(RING_FALLOFF[h.ring]||0.2);
      if(reg.owner==="enemy"){
        var before=reg.defense;
        reg.defense=Math.max(1, Math.round(reg.defense*(1-frac)));
        if(reg.defense<before) foeHit++;
      } else if(reg.owner==="player"){
        var lost=Math.round((reg.garrison||0)*frac);
        reg.garrison=Math.max(0,(reg.garrison||0)-lost);
        troopsLost+=lost;
        ownHit++;
      }
      // Merkez her şeyi siler; ilk halkada tahkimat yarı yarıya ayakta kalır.
      if(h.ring===0 || (h.ring===1 && Math.random()<0.5)){
        if(reg.defenses && reg.defenses.length){ reg.defenses=[]; razed++; }
        if(reg.building && DEFENSIVE.indexOf(reg.building)>=0){ reg.building=null; razed++; }
      }
      reg.scorched=state.turn+SCORCH_TURNS;
    });

    flashRegion(target.id);
    invalidateRoutes();
    drawMap();

    // Patlama alanı: merkez en şiddetli, dış halkalar giderek sönük.
    addShake(4 + n.rings*4.5);
    hits.forEach(function(h){
      var c=regionCenter(h.region);
      var f=RING_FALLOFF[h.ring]||0.2;
      addBurst(c.x, c.y, Math.round(34*f)+8, ["#f0c944","#e0603c","#8d8266","#3a322c"], 2.4*f+0.7, 1100);
    });
    var tc=regionCenter(target);
    addFloater(tc.x, tc.y-10, "☢ "+hits.length+" bölge", "#f0c944");

    showToast("☢️ "+n.name+" · "+hits.length+" bölge vuruldu"+
      (razed>0?" · "+razed+" tahkimat yıkıldı":"")+
      (ownHit>0?" · ⚠️ kendi "+ownHit+" bölgen de yandı ("+troopsLost+" asker)":"")+
      " · toprak "+SCORCH_TURNS+" tur üretimsiz.");
    return true;
  }

  // Tahkimat yalnızca sınırına dayandığın bölgede görünür: genişleme sırası da bir karar.
  /* ---- KEŞİF (Phase 3) ----
     Tek mekanik, üç kademe:
       0 bilinmiyor — menzil dışı, hiçbir sayı yok
       1 tahmini    — komşusun; savunmayı ARALIK olarak görürsün, tipleri değil
       2 kesin      — keşif yaptın; gerçek sayı ve tahkimat tipleri açık
     Böylece "saldırayım mı, önce keşif mi yapayım?" gerçek bir karar olur. */
  var KESIF_BEDEL=35, KESIF_SURE=12;

  function istihbarat(region){
    if(region.owner==="player") return 2;
    if(region.kesif && region.kesif>state.turn) return 2;
    var komsu=false;
    region.neighbors.forEach(function(nid){ if(regions[nid].owner==="player") komsu=true; });
    return komsu ? 1 : 0;
  }
  function isScouted(region){ return istihbarat(region)>=1; }

  // Tahmini kademede gösterilen aralık — uydurma kesinlik yok.
  function savunmaAraligi(region, atkKey){
    var v=defenseAgainst(region, atkKey).value;
    return {alt:Math.max(1,Math.round(v*0.75)), ust:Math.round(v*1.25)};
  }

  // Bölgenin ham asker gücü — tahkimat katkısı hariç. Başarısız saldırılar bunu aşındırır.
  function troopStrength(region){
    if(region.owner==="enemy") return region.defense;
    return 2+(region.garrison||0);
  }

  /* Savaşın tek matematik kaynağı: önizleme, saldırı çözümü ve bot kararları
     hepsi buradan geçer, böylece gösterilen sonuç ile olan sonuç ayrışamaz. */
  /* Cephe analizi: bir bölgeye kaç yönden dayandığın ve çevresinin ne kadar
     dağlık olduğu. Savaşın sonucunu yalnızca asker sayısı değil, KONUM da
     belirlesin diye. Aynı orduyla tek cepheden saldırmak ile üç cepheden
     kuşatmak arasında ciddi fark olmalı. */
  function cepheAnalizi(region, saldiran){
    var cephe=0, gecilirKomsu=0, dag=0;
    region.neighbors.forEach(function(nid){
      var n=regions[nid];
      if(n.type==="obstacle"){ dag++; return; }   // dağ: yaklaşma yolu değil
      gecilirKomsu++;
      if(n.owner===saldiran) cephe++;
    });

    /* Kuşatma: tek cepheden saldırı normal. İkinci cephe savunmayı böler,
       üçüncüsü çember daraltır. Tavan var — kuşatma tek başına savaş kazanmasın. */
    var kusatma = cephe<=1 ? 1 : (cephe===2 ? 0.82 : (cephe===3 ? 0.68 : 0.58));

    /* Arazi: çevresi dağlarla çevrili bölgeye yaklaşma yolu azdır, savunan
       dar geçidi tutar. Doğu illeri bu yüzden gerçekten zor olur. */
    var arazi = 1 + Math.min(0.30, dag*0.10);

    return {cephe:cephe, gecilirKomsu:gecilirKomsu, dag:dag, kusatma:kusatma, arazi:arazi};
  }

  function defenseAgainst(region, attackKey, saldiran){
    var atk=ATTACKS[attackKey];
    saldiran = saldiran || (region.owner==="enemy" ? "player" : "enemy");
    var base=troopStrength(region), mult=1, notes=[], bypassed=[];
    defenseStructures(region).forEach(function(k){
      if(atk.bypass.indexOf(k)>=0){ bypassed.push(k); return; }  // katkısı hiç sayılmaz
      base += BUILDINGS[k].def || 0;
      var m=atk.vs[k];
      if(m && m>1){ mult*=m; notes.push({key:k, mult:m}); }
    });

    var cep=cepheAnalizi(region, saldiran);
    /* İkmal: tam beslenen cepheden saldırı normal, kesik bir çıkıntıdan
       saldırı %50'ye kadar pahalı. Zincirin son halkası —
       Bölge → Rota → İkmal → Geçit → Tahkimat → Saldırı. */
    var ik=saldiriIkmali(region, saldiran);
    var ikmalCarpani = 1 + (1 - ik/100)*0.5;
    var toplam = mult * cep.kusatma * cep.arazi * ikmalCarpani;

    return {
      base:base, mult:mult, notes:notes, bypassed:bypassed, cephe:cep,
      ikmal:ik, ikmalCarpani:ikmalCarpani,
      value:Math.max(1, Math.round(base*toplam))
    };
  }

  /* Bir taarruzun anlamlı sayılması için gereken en küçük kuvvet.
     Bunun altındaki "saldırılar" artık hiç gerçekleşmiyor: eskiden 1 asker
     göndermek garnizonu 1 düşürüyordu ve bu, bütün saldırı-tahkimat
     bilmecesini bedelsiz biçimde baypas etmenin yoluydu. */
  function taarruzEsigi(deger){ return Math.max(2, Math.ceil(deger*MIN_TAARRUZ)); }

  // Haritadaki rozet için: hiçbir yapının aşılmadığı varsayımıyla kaba savunma.
  function effectiveDefense(region){
    var base=troopStrength(region);
    defenseStructures(region).forEach(function(k){ base += BUILDINGS[k].def || 0; });
    return base;
  }

  // Bu saldırı tipi şu an kullanılabilir mi? (gerekli bina + altın)
  function attackAvailability(attackKey){
    var atk=ATTACKS[attackKey];
    if(atk.requires && !regions.some(function(r){ return r.owner==="player" && r.building===atk.requires; })){
      return {ok:false, reason:BUILDINGS[atk.requires].name+" kurman gerek"};
    }
    if(state.gold<atk.gold) return {ok:false, reason:"Yetersiz altın ("+atk.gold+"💰)"};
    return {ok:true, reason:""};
  }

  /* ================= Render ================= */
  /* ================= Bina / tahkimat işaretleri ================= */

  // Birim kareyi (0..1) piksele çeviren küçük çizim kalemi.
  function symbolPen(g, x0, y0, size, lw){
    function X(u){ return x0+u*size; }
    function Y(v){ return y0+v*size; }
    g.lineWidth=lw; g.lineCap="round"; g.lineJoin="round";
    return {
      line:function(a,b,c,d){ g.beginPath(); g.moveTo(X(a),Y(b)); g.lineTo(X(c),Y(d)); g.stroke(); },
      rect:function(a,b,w,h){ g.beginPath(); g.rect(X(a),Y(b),w*size,h*size); g.stroke(); },
      poly:function(pts){
        g.beginPath();
        for(var i=0;i<pts.length;i+=2){
          if(i) g.lineTo(X(pts[i]),Y(pts[i+1])); else g.moveTo(X(pts[0]),Y(pts[1]));
        }
        g.stroke();
      },
      arc:function(a,b,r,s,e){ g.beginPath(); g.arc(X(a),Y(b),r*size,s,e); g.stroke(); },
      dot:function(a,b,r){ g.beginPath(); g.arc(X(a),Y(b),r*size,0,Math.PI*2); g.fill(); }
    };
  }

  /* ---- Sayaç (counter) çizimi ----
     Referans düzen: açık zeminli kare karo + üstüne binen koyu sayı rozeti.
     Asker ikonu yok; bölgenin gücünü sayı, tahkimatını karolar anlatır. */
  var TILE=13;                       // haritadaki karo kenarı (mantıksal px)
  var BADGE_H=11;
  var TILE_FILL="#c7d3e2", TILE_FILL_FOE="#e2c4c8";
  var TILE_EDGE="#0b1215";
  var TILE_INK="#182636",  TILE_INK_FOE="#3c1922";
  var BADGE_BG="#0b1215",  BADGE_TX="#f4efe0";
  // Çubuk her iki tarafta da amber: "güç" tek bir dilde okunsun, taraf
  // rengiyle karışmasın. Zemin koyu olduğu için amber her yerde okunur kalır.
  var BAR_OWN="#e3b23c",   BAR_FOE="#d4834a";

  // Sembolün yalnızca çizgilerini basar; zemini karo sağlar.
  function paintSymbol(g, key, x0, y0, size, ink){
    var fn=SYMBOLS[key];
    if(!fn) return;
    g.strokeStyle=ink; g.fillStyle=ink;
    fn(symbolPen(g, x0, y0, size, Math.max(1, size*0.09)));
  }

  function drawTile(g, x, y, key, size, foe){
    g.fillStyle = foe ? TILE_FILL_FOE : TILE_FILL;
    g.fillRect(x, y, size, size);
    g.strokeStyle=TILE_EDGE; g.lineWidth=1;
    g.strokeRect(x+0.5, y+0.5, size-1, size-1);
    var inset=size*0.10;
    paintSymbol(g, key, x+inset, y+inset, size-inset*2, foe ? TILE_INK_FOE : TILE_INK);
  }

  // Koyu sayı rozeti — referanstaki gibi karonun sol üst köşesine biner.
  function drawBadge(g, x, y, txt){
    g.font="bold 9px ui-monospace, monospace";
    g.textAlign="left"; g.textBaseline="middle";
    var w=Math.ceil(g.measureText(txt).width)+7;
    g.fillStyle=BADGE_BG;
    g.fillRect(x, y, w, BADGE_H);
    g.strokeStyle="rgba(0,0,0,0.85)"; g.lineWidth=1;
    g.strokeRect(x+0.5, y+0.5, w-1, BADGE_H-1);
    g.fillStyle=BADGE_TX;
    g.fillText(txt, x+3.5, y+BADGE_H/2+0.5);
    g.textAlign="center"; g.textBaseline="middle";
    return w;
  }

  /* Bir bölgenin sayacı: tahkimat karoları yan yana, sayı rozeti sol üste biner.
     Tahkimat yoksa yalnızca rozet çizilir — "sadece sayı" hâli. */
  /* Sayacın altındaki güç çubuğu — referanstaki gibi. Sayıyı okumadan
     "bu cephe ne kadar sert" bilgisini verir; oran haritadaki en güçlü
     garnizona göre, yani ölçek oyun ilerledikçe kendini ayarlar. */
  function drawBar(g, x, y, w, ratio, foe){
    var h=3;
    g.fillStyle=BADGE_BG;
    g.fillRect(x-1, y-1, w+2, h+2);
    g.fillStyle = foe ? BAR_FOE : BAR_OWN;
    g.fillRect(x, y, Math.max(1, Math.round(w*clamp(ratio,0,1))), h);
  }

  function drawCounter(g, cx, cy, structs, num, foe, ratio, showNum){
    var n=structs.length;
    var totalW = n ? n*TILE + (n-1)*2 : TILE;
    var x0=Math.round(cx-totalW/2), y0=Math.round(cy-TILE/2);
    for(var i=0;i<n;i++){ drawTile(g, x0+i*(TILE+2), y0, structs[i], TILE, foe); }
    if(ratio!==null && ratio!==undefined){
      drawBar(g, x0, y0+TILE+3, totalW, ratio, foe);
    }
    // Sayı rozeti artık her karoda değil, yalnızca o an seçili/incelenen
    // bölgede basılır — haritanın geri kalanı sayıyı değil gücü (çubuk +
    // tahkimat karoları) gösterir. Kesin rakamı isteyen dokunur.
    if(showNum && num!==null && num!==undefined){
      if(n) drawBadge(g, x0-4, y0-BADGE_H+4, String(num));
      else  drawBadge(g, Math.round(cx-9), Math.round(cy-BADGE_H/2), String(num));
    }
  }

  var symbolUrlCache={};
  function symbolDataURL(key, px, foe){
    var id=key+"@"+px+"@"+(foe?"f":"p");
    if(symbolUrlCache[id]) return symbolUrlCache[id];
    var cv=document.createElement("canvas");
    var scale=2;
    cv.width=cv.height=px*scale;
    var g=cv.getContext("2d");
    g.scale(scale,scale);
    drawTile(g, 0.5, 0.5, key, px-1, foe);
    symbolUrlCache[id]=cv.toDataURL();
    return symbolUrlCache[id];
  }

  function symbolImg(key, cls, foe){
    return "<img class='"+cls+"' alt='' src='"+symbolDataURL(key,40,foe)+"'>";
  }

  /* ================= Efektler =================
     Arazi ayrı bir tuvalde tutulur. Efekt karelerinde binlerce piksel yeniden
     çizilmez, hazır görüntü kopyalanır — parçacıklar 60 fps akabilsin diye. */
  var terrainCv=document.createElement("canvas");
  terrainCv.width=canvas.width; terrainCv.height=canvas.height;
  var tctx=terrainCv.getContext("2d");
  tctx.scale(DPR,DPR);

  var REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var particles=[], floaters=[], shakeMag=0, fxRunning=false, lastFX=0;

  function addShake(mag){
    if(REDUCED) return;
    shakeMag=Math.max(shakeMag, mag);
    startFX();
  }

  var MAX_PARTICLES=420;      // sekme sırasında birikmesin diye tavan

  function addBurst(cx, cy, count, colors, speed, life){
    if(REDUCED) return;
    if(particles.length>MAX_PARTICLES) particles.splice(0, particles.length-MAX_PARTICLES);
    for(var i=0;i<count;i++){
      var a=Math.random()*Math.PI*2, s=speed*(0.35+Math.random()*0.65);
      particles.push({
        x:cx, y:cy, vx:Math.cos(a)*s, vy:Math.sin(a)*s-speed*0.3,
        life:life*(0.6+Math.random()*0.7), age:0,
        color:colors[randInt(0,colors.length-1)],
        size:Math.random()<0.28?2:1
      });
    }
    startFX();
  }

  function addFloater(cx, cy, text, color){
    floaters.push({x:cx, y:cy, text:text, color:color, age:0, life:1200});
    startFX();
  }

  function startFX(){
    if(fxRunning) return;
    fxRunning=true; lastFX=0;
    requestAnimationFrame(fxTick);
  }

  function fxTick(now){
    var dt = lastFX ? Math.min(50, now-lastFX) : 16;
    lastFX=now;
    var step=dt/16;
    for(var i=particles.length-1;i>=0;i--){
      var p=particles[i];
      p.age+=dt;
      if(p.age>=p.life){ particles.splice(i,1); continue; }
      p.x+=p.vx*step; p.y+=p.vy*step;
      p.vy+=0.17*step;          // yerçekimi
      p.vx*=0.985;
    }
    for(var j=floaters.length-1;j>=0;j--){
      var f=floaters[j];
      f.age+=dt;
      if(f.age>=f.life){ floaters.splice(j,1); continue; }
      f.y-=0.032*dt;
    }
    stepWorkers(dt);
    shakeMag = shakeMag>0.06 ? shakeMag*Math.pow(0.87, step) : 0;
    applyTransform();
    composite();
    if(particles.length || floaters.length || shakeMag>0 || workers.length){
      requestAnimationFrame(fxTick);
    } else {
      fxRunning=false; lastFX=0; applyTransform();
    }
  }

  /* Görünüm: 81 il küçük olduğu için harita yakınlaştırılıp kaydırılabilir.
     Dönüşüm CSS transform ile yapılır — böylece regionAtPoint hesabı bozulmaz,
     çünkü getBoundingClientRect dönüşmüş kutuyu verir. */
  var view={scale:1, tx:0, ty:0};
  // MIN_SCALE artık sabit 1 değil: harita "ana kahraman" olsun ve dikey
  // telefonda bile kutuyu doldursun diye fitMapToScreen() bunu her seferinde
  // "haritanın kendi oranıyla bu sarmalayıcıyı tam kaplamak için gereken
  // asgari yakınlaşma" olacak şekilde yeniden hesaplıyor. Tek dönüşüm katmanı
  // (view.scale/tx/ty) korunduğu için regionAtPoint()'in düz-orantı hesabı
  // hep doğru kalır — CSS object-fit gibi ikinci, bağımsız bir ölçek katmanı
  // yok, dolayısıyla clampView() ile çakışma da yok.
  var MIN_SCALE=1, MAX_SCALE=14;
  var mapWrap=document.getElementById("map-wrap");

  // mapWrap'in dolgusunu (padding) çıkarınca kalan gerçek içerik kutusu —
  // canvas tam bunun içine oturuyor. getBoundingClientRect() dolguyu da
  // sayar; bunu kullanmak clampView'ı ~16px yanlış hesaplatıp dikeyde kayma
  // payını sıfıra düşürebiliyordu (ty her seferinde 0'a kelepçeleniyordu).
  function wrapContentBox(){
    var cs=getComputedStyle(mapWrap);
    var padX=parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight);
    var padY=parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom);
    return {w:Math.max(0,mapWrap.clientWidth-padX), h:Math.max(0,mapWrap.clientHeight-padY)};
  }

  function clampView(){
    view.scale=clamp(view.scale, MIN_SCALE, MAX_SCALE);
    var box=wrapContentBox();
    var sw=canvas.offsetWidth*view.scale, sh=canvas.offsetHeight*view.scale;
    var maxX=Math.max(0,(sw-box.w)/2), maxY=Math.max(0,(sh-box.h)/2);
    view.tx=clamp(view.tx,-maxX,maxX);
    view.ty=clamp(view.ty,-maxY,maxY);
  }

  // Sarmalayıcı (mapWrap) haritanın 140:80 oranından daha dikeyse, canvas
  // (width:100%;height:auto olduğu için) doğal halinde kutunun tamamını
  // dolduramaz — üstte/altta boşluk kalır. Bu fonksiyon o boşluğu kapatacak
  // asgari view.scale değerini hesaplar; MAX_SCALE'i aşmaz, yatay/kısa
  // ekranlarda (harita zaten genişliği dolduruyorsa) 1'in altına inmez.
  function fitMapToScreen(){
    if(!canvas.offsetWidth || !canvas.offsetHeight) return;
    var box=wrapContentBox();
    if(!box.w || !box.h) return;
    var need = clamp(box.h/canvas.offsetHeight, 1, MAX_SCALE);
    MIN_SCALE = need;
    if(view.scale<MIN_SCALE) view.scale=MIN_SCALE;
    clampView();
    applyTransform();
  }
  window.addEventListener("resize", fitMapToScreen);

  function applyTransform(){
    var dx=0, dy=0;
    if(shakeMag>0){ dx=(Math.random()*2-1)*shakeMag; dy=(Math.random()*2-1)*shakeMag; }
    canvas.style.transform="translate("+(view.tx+dx).toFixed(2)+"px,"+(view.ty+dy).toFixed(2)+"px) scale("+view.scale.toFixed(3)+")";
  }

  function zoomAt(faktor, cx, cy){
    var wrap=mapWrap.getBoundingClientRect();
    var mx=cx-(wrap.left+wrap.width/2)-view.tx;
    var my=cy-(wrap.top+wrap.height/2)-view.ty;
    var onceki=view.scale;
    view.scale=clamp(view.scale*faktor, MIN_SCALE, MAX_SCALE);
    var oran=view.scale/onceki;
    view.tx-=mx*(oran-1);
    view.ty-=my*(oran-1);
    clampView();
    applyTransform();
  }

  /* Skorbord satırına dokununca kullanılır: haritayı verilen ızgara noktasının
     (anchor) ortasına kaydırır ve biraz yakınlaştırır — çipe her dokunuşta o
     gücün toprağı ekranın tam ortasına gelir, aramak gerekmez. */
  function centerOnAnchor(anchor){
    if(!anchor || !canvas.offsetWidth || !canvas.offsetHeight) return;
    var c=regionCenter({anchor:anchor});
    var cssW=canvas.offsetWidth, cssH=canvas.offsetHeight;
    var ox=(c.x/LOGICAL_W)*cssW - cssW/2;
    var oy=(c.y/LOGICAL_H)*cssH - cssH/2;
    // clampView, mevcut ölçekte kutunun dışına taşan boşluk göstermez — yani
    // MIN_SCALE'in hemen üstünde kayma payı neredeyse sıfırdır. Hedefi
    // gerçekten ortalayabilmek için, o nokta merkezden ne kadar uzaktaysa
    // (kutunun kenarına ne kadar yakınsa) o kadar fazla yakınlaşmak gerekir;
    // bunu sabit bir çarpanla tahmin etmek yerine gereken ölçeği doğrudan
    // hesaplıyoruz (kayma payı = hedefe yetecek kadar).
    var box=wrapContentBox();
    var needX = (2*Math.abs(ox) < cssW) ? box.w/(cssW-2*Math.abs(ox)) : MAX_SCALE;
    var needY = (2*Math.abs(oy) < cssH) ? box.h/(cssH-2*Math.abs(oy)) : MAX_SCALE;
    var targetScale=clamp(Math.max(view.scale, MIN_SCALE, needX, needY, 2.2), MIN_SCALE, MAX_SCALE);
    view.scale=targetScale;
    view.tx=-ox*targetScale;
    view.ty=-oy*targetScale;
    clampView();
    applyTransform();
  }

  /* ---- İşçi konvoyları ----
     Fabrikaların ile kentlerin arasında gidip gelen işçiler. Tamamen görsel
     ama uydurma değil: yalnızca gerçekten sahip olduğun binalar arasında
     işler ve kavrulmuş (nükleer vurulmuş) bölgeye giden hat durur. */
  var workers=[], workerRoutes=[], routesDirty=true;
  var WORKER_SPEED=0.030;          // birim yol / ms

  function invalidateRoutes(){ routesDirty=true; startFX(); }

  /* ---- ROTA SİSTEMİ (Phase 1) ----
     Eski hâli sahteydi: her fabrikayı en yakın kente DÜZ ÇİZGİYLE bağlıyor,
     hat başına sabit +4 altın veriyordu. Toprakla ilgisi yoktu, kesilemezdi.

     Artık rota, başkentten üretim bölgelerine giden GERÇEK bir yol: mevcut
     regions[].neighbors grafiği üzerinde, yalnızca senin toprağından geçerek
     BFS ile bulunuyor. Yeni bir veri modeli kurulmadı; graf zaten vardı.

     Üç durum:
       güvenli — yol var, üstündeki hiçbir bölge düşmana komşu değil
       riskli  — yol var ama bir düğüm düşman sınırında
       kesildi — kendi toprağından yol kalmamış (bölge düştü ya da kavruldu)

     Ve oyunun kimliği burada mekanikleşiyor: yolun üstündeki her GEÇİT
     geliri artırıyor. "Toprağı değil, geçişi kontrol et." */
  var ROTA_GELIR={guvenli:5, riskli:2, kesildi:0};
  var GECIT_GELIR=3;               // yolun üstündeki her kendi geçidin

  function benimMi(r){ return r && r.owner==="player" && !isScorched(r); }

  // Başkentten hedefe, yalnızca kendi toprağından geçen en kısa yol.
  function yolBul(hedefId){
    if(!benimMi(regions[0]) || !benimMi(regions[hedefId])) return null;
    if(hedefId===0) return [0];
    var onceki={0:-1}, kuyruk=[0], i=0;
    while(i<kuyruk.length){
      var cur=kuyruk[i++];
      var komsular=Array.from(regions[cur].neighbors);
      for(var k=0;k<komsular.length;k++){
        var nid=komsular[k];
        if(nid in onceki || !benimMi(regions[nid])) continue;
        onceki[nid]=cur;
        if(nid===hedefId){
          var yol=[], c=nid;
          while(c!==-1){ yol.unshift(c); c=onceki[c]; }
          return yol;
        }
        kuyruk.push(nid);
      }
    }
    return null;
  }

  /* ---- İKMAL (Phase 2) ----
     Tek kaynak, tek sayı. Başkentten kendi toprağın üzerinden kaç adım
     uzaktaysan ikmalin o kadar düşer; hiç ulaşılamıyorsa kesiktir.
     Ayrı bir zamanlayıcı yok — rota önbelleğiyle aynı anda hesaplanıyor. */
  var IKMAL_ADIM=12, IKMAL_TABAN=15;

  function hesaplaIkmal(){
    regions.forEach(function(r){ if(r.owner==="player") r.ikmal=0; else r.ikmal=null; });
    if(!benimMi(regions[0])) return;
    regions[0].ikmal=100;
    var kuyruk=[0], i=0, derinlik={0:0};
    while(i<kuyruk.length){
      var cur=kuyruk[i++];
      regions[cur].neighbors.forEach(function(nid){
        if(nid in derinlik || !benimMi(regions[nid])) return;
        derinlik[nid]=derinlik[cur]+1;
        regions[nid].ikmal=Math.max(IKMAL_TABAN, 100-derinlik[nid]*IKMAL_ADIM);
        kuyruk.push(nid);
      });
    }
  }

  // Genel ikmal: HUD'da tek yüzde olarak görünen sayı.
  function genelIkmal(){
    if(routesDirty) rebuildRoutes();
    var top=0, adet=0;
    regions.forEach(function(r){
      if(r.owner!=="player") return;
      adet++; top+=(r.ikmal||0);
    });
    return adet ? Math.round(top/adet) : 0;
  }

  /* Saldırıya çıkarken: hedefe komşu kendi bölgelerinin EN İYİ ikmali.
     İkmalsiz bir çıkıntıdan saldırmak pahalıya patlıyor. */
  function saldiriIkmali(region, saldiran){
    if(saldiran!=="player") return 100;              // botlar bu kuraldan muaf
    var en=0;
    region.neighbors.forEach(function(nid){
      var n=regions[nid];
      if(n.owner==="player" && (n.ikmal||0)>en) en=n.ikmal||0;
    });
    return en;
  }

  function rebuildRoutes(){
    routesDirty=false;
    hesaplaIkmal();
    workerRoutes=[];
    workers=[];

    // Üretim düğümleri: fabrika ve kentler. Başkent hub.
    var hedefler=[];
    regions.forEach(function(r){
      if(r.owner!=="player") return;
      if(r.building==="fabrika" || r.building==="kent") hedefler.push(r.id);
    });
    if(!hedefler.length) return;

    hedefler.forEach(function(hid){
      var yol=yolBul(hid);
      if(!yol){
        // Yol kesildi: gelir yok ama oyuncu bunu görsün diye kayıt kalıyor.
        workerRoutes.push({nodes:[hid], pts:[regionCenter(regions[hid])],
                           segLen:[], uzunluk:0, durum:"kesildi", gecit:0, gelir:0});
        return;
      }
      var riskli=false, gecitSayisi=0;
      yol.forEach(function(rid){
        var reg=regions[rid];
        if(reg.gecit) gecitSayisi++;
        reg.neighbors.forEach(function(nid){
          var nb=regions[nid];
          if(nb.owner==="enemy") riskli=true;
        });
      });
      var durum = riskli ? "riskli" : "guvenli";
      var pts=yol.map(function(rid){ return regionCenter(regions[rid]); });
      var segLen=[], toplam=0;
      for(var i=0;i<pts.length-1;i++){
        var d=Math.hypot(pts[i+1].x-pts[i].x, pts[i+1].y-pts[i].y);
        segLen.push(d); toplam+=d;
      }
      workerRoutes.push({
        nodes:yol, pts:pts, segLen:segLen, uzunluk:toplam,
        durum:durum, gecit:gecitSayisi,
        gelir: ROTA_GELIR[durum] + gecitSayisi*GECIT_GELIR
      });
    });

    // Kesik olmayan her hatta iki işçi, zıt yönlerde.
    workerRoutes.forEach(function(rt, ri){
      if(rt.durum==="kesildi" || rt.uzunluk<=0) return;
      workers.push({route:ri, t:Math.random(), dir:1});
      workers.push({route:ri, t:Math.random(), dir:-1});
    });
    if(workers.length) startFX();
  }

  // Rota özeti: HUD ve maç sonu raporu bunu okuyor.
  function rotaDurumu(){
    if(routesDirty) rebuildRoutes();
    var o={guvenli:0, riskli:0, kesildi:0, gelir:0, toplam:workerRoutes.length};
    workerRoutes.forEach(function(rt){ o[rt.durum]++; o.gelir+=rt.gelir; });
    return o;
  }

  function stepWorkers(dt){
    if(routesDirty) rebuildRoutes();
    for(var i=0;i<workers.length;i++){
      var w=workers[i];
      w.t += w.dir*WORKER_SPEED*dt/16;
      if(w.t>1){ w.t=1; w.dir=-1; }
      else if(w.t<0){ w.t=0; w.dir=1; }
    }
  }

  // Çok parçalı yol üzerinde t (0..1) konumunu bul.
  function yolNoktasi(rt, t){
    if(rt.pts.length<2) return rt.pts[0];
    var hedef=t*rt.uzunluk, birikim=0;
    for(var i=0;i<rt.segLen.length;i++){
      if(birikim+rt.segLen[i]>=hedef || i===rt.segLen.length-1){
        var k=rt.segLen[i]>0 ? (hedef-birikim)/rt.segLen[i] : 0;
        k=Math.max(0,Math.min(1,k));
        return {x:rt.pts[i].x+(rt.pts[i+1].x-rt.pts[i].x)*k,
                y:rt.pts[i].y+(rt.pts[i+1].y-rt.pts[i].y)*k};
      }
      birikim+=rt.segLen[i];
    }
    return rt.pts[rt.pts.length-1];
  }

  var ROTA_RENK={guvenli:"rgba(240,201,68,0.30)", riskli:"rgba(224,138,114,0.34)"};

  function paintWorkers(){
    if(!workerRoutes.length) return;
    // Yol izi artık düz çizgi değil, bölgeden bölgeye geçen gerçek güzergâh.
    ctx.lineWidth=1;
    for(var r=0;r<workerRoutes.length;r++){
      var rt=workerRoutes[r];
      if(rt.durum==="kesildi" || rt.pts.length<2) continue;
      ctx.strokeStyle=ROTA_RENK[rt.durum];
      ctx.setLineDash(rt.durum==="riskli" ? [3,3] : []);
      ctx.beginPath();
      ctx.moveTo(rt.pts[0].x, rt.pts[0].y);
      for(var i=1;i<rt.pts.length;i++) ctx.lineTo(rt.pts[i].x, rt.pts[i].y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for(var j=0;j<workers.length;j++){
      var w=workers[j], rt2=workerRoutes[w.route];
      if(!rt2 || rt2.durum==="kesildi") continue;
      var p=yolNoktasi(rt2, w.t);
      ctx.fillStyle="#0b1215";
      ctx.fillRect(Math.round(p.x)-1, Math.round(p.y)-1, 4, 4);
      ctx.fillStyle = w.dir>0 ? "#f0c944" : "#cfc4a4";   // dolu giden / boş dönen
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }
  }

  // Bölgenin harita üzerindeki merkezi (efektleri doğru yere koymak için)
  function regionCenter(reg){
    return {x:reg.anchor.x*CELL+CELL/2, y:reg.anchor.y*CELL+CELL/2};
  }

  function paintTerrain(){
    tctx.fillStyle=SEA_FILL;
    tctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);
    for(var i=0;i<landPixelsList.length;i++){
      var p=landPixelsList[i];
      var region=regions[p.regionId];
      var cat;
      var wallRing=false, hoverRing=false, selRing=false;
      if(animating && p.regionId===animating.region.id){
        var key=p.y*GRID_W+p.x;
        cat = animating.flipped.has(key) ? "player" : categoryForType(region.type);
      } else if(p.regionId===flashRegionId){
        cat="flashHit";
      } else {
        cat=categoryForRegion(region);
        if(blastPreview && blastPreview.indexOf(p.regionId)>=0) cat="flashHit";
        if(p.isBorder){
          // Seçim halkası her şeyin önünde gelir: "şu an incelediğin bölge
          // bu" bilgisi, duvar/hover tonlarından daha güçlü okunmalı.
          if(currentSel && p.regionId===currentSel.id) selRing=true;
          else if(p.regionId===dragHoverRegionId) hoverRing=true;
          else if(hasStructure(region,"duvar")) wallRing=true;
        }
      }
      tctx.fillStyle = selRing ? pixelFillStyle("selected", p.noise, false)
        : hoverRing ? pixelFillStyle("hover", p.noise, false)
        : (wallRing ? pixelFillStyle("wall", p.noise, false) : pixelFillStyle(cat,p.noise,p.isBorder));
      tctx.fillRect(p.x*CELL, p.y*CELL, CELL, CELL);
    }

  }

  function paintEffects(){
    paintWorkers();
    for(var i=0;i<particles.length;i++){
      var p=particles[i];
      var k=1-p.age/p.life;
      ctx.globalAlpha=Math.max(0, Math.min(1, k*1.4));
      ctx.fillStyle=p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha=1;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    for(var j=0;j<floaters.length;j++){
      var f=floaters[j];
      var t=f.age/f.life;
      ctx.globalAlpha = t<0.15 ? t/0.15 : Math.max(0, 1-(t-0.15)/0.85);
      ctx.font="bold 12px ui-monospace, monospace";
      ctx.lineWidth=3; ctx.strokeStyle="rgba(6,10,12,0.85)";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle=f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha=1;
  }

  function paintOverlay(){    // Güç çubuklarının ölçeği: haritadaki en güçlü savunma 1.0 kabul edilir.
    var peak=1;
    for(var pi=0; pi<regions.length; pi++){
      var pr=regions[pi];
      if(!pr.pixels.length) continue;
      var pv = pr.owner==="enemy" ? pr.defense : (pr.owner==="player" ? effectiveDefense(pr) : 0);
      if(pv>peak) peak=pv;
    }

    ctx.textAlign="center"; ctx.textBaseline="middle";
    for(var ri=0; ri<regions.length; ri++){
      var reg=regions[ri];
      if(!reg.pixels.length) continue;
      var cx=reg.anchor.x*CELL+CELL/2, cy=reg.anchor.y*CELL+CELL/2;
      if(reg.type==="obstacle"){
        ctx.font=Math.floor(CELL*2.0)+"px sans-serif";
        ctx.fillText("⛰️", cx, cy);
        continue;
      }
      /* Bölge işareti — referans düzen: tahkimat karoları + üstüne binen sayı rozeti.
         Asker/bayrak ikonu yok; sahiplik zaten bölge renginden okunuyor. Yalnızca
         renkle anlaşılmayan şeyler (başkent, kaynak türü) ikon olarak kalır. */
      var landmark="";
      if(reg.type==="capital") landmark="🏰";
      else if(reg.type==="enemyCapital") landmark = reg.owner==="player" ? "🏰" : "👑";
      else if(reg.type==="resource") landmark = reg.owner==="player" ? RESOURCE_KINDS[reg.resKind].built : RESOURCE_KINDS[reg.resKind].raw;

      // Haritada gösterilecek tahkimat: düşmanınki ancak keşfedilmişse görünür.
      var shown=[];
      if(reg.owner==="enemy"){ if(isScouted(reg)) shown=reg.defenses.slice(); }
      else if(reg.owner==="player"){ shown=defenseStructures(reg); }

      var badgeNum=null;
      if((reg.type==="enemy"||reg.type==="enemyCapital") && reg.owner==="enemy"){
        badgeNum=reg.defense;
      } else if(reg.owner==="player" && reg.type!=="capital"){
        var ed=effectiveDefense(reg);
        if(ed>2) badgeNum=ed;
      }

      // Başkent / kaynak simgesi sayacın üstünde durur.
      if(landmark){
        ctx.font=Math.floor(CELL*1.7)+"px sans-serif";
        ctx.fillText(landmark, cx, cy-(shown.length||badgeNum!==null ? CELL*1.9 : 0));
      }
      if(shown.length || badgeNum!==null){
        var ratio = badgeNum!==null ? badgeNum/peak : null;
        var showNum = !!(currentSel && currentSel.id===reg.id);
        drawCounter(ctx, cx, cy, shown, badgeNum, reg.owner==="enemy", ratio, showNum);
      }
    }

    paintEffects();
  }

  // Hazır araziyi kopyalar, üstüne sayaçları ve efektleri çizer.
  function composite(){
    ctx.clearRect(0,0,LOGICAL_W,LOGICAL_H);
    ctx.drawImage(terrainCv, 0, 0, LOGICAL_W, LOGICAL_H);
    paintOverlay();
  }

  // Salt sunum katmanı: tur sayacını gerçek bir takvim hissi versin diye
  // yıl/çeyreğe çeviriyoruz. Tur mekanizmasının kendisi (state.turn) hiç
  // değişmiyor — bu yalnızca aynı sayının okunuş biçimi.
  function zamanEtiketi(turn){
    var ceyrekIdx=Math.floor(turn/3);
    var yil=2026+Math.floor(ceyrekIdx/4);
    var ceyrek=(ceyrekIdx%4)+1;
    return "YIL "+yil+" · Ç"+ceyrek;
  }

  function drawMap(){
    paintTerrain();
    composite();
    document.getElementById("gold-val").textContent=state.gold;
    document.getElementById("army-val").textContent=state.army+"/"+state.maxArmy;
    document.getElementById("turn-val").textContent=zamanEtiketi(state.turn);
    var ik=genelIkmal();
    var ikEl=document.getElementById("supply-val");
    if(ikEl){
      ikEl.textContent=ik+"%";
      var kap=ikEl.parentNode;
      if(kap && kap.classList){
        kap.classList.toggle("warn", ik<70 && ik>=45);
        kap.classList.toggle("bad", ik<45);
      }
    }
    var gd=gecitDurumu();
    var gEl=document.getElementById("gate-val");
    if(gEl){
      gEl.textContent=gd.tut+"/"+gd.toplam+
        (state.gecitSayaci!=null ? " · "+state.gecitSayaci+" tur" : "");
      var gKap=gEl.parentNode;
      if(gKap){
        gKap.classList.toggle("hedefte", gd.gerek>0 && gd.tut>=gd.gerek);
        gKap.classList.toggle("eksik", gd.gerek>0 && gd.tut<gd.gerek);
      }
    }
    renderScoreboard();
    updateControlBar();
    }

  // Alt yüzen çubuk: kaç bölgenin sende olduğu, gerçek bir yüzde olarak.
  function updateControlBar(){
    var fill=document.getElementById("control-fill");
    var val=document.getElementById("control-val");
    if(!fill || !val || !regions.length) return;
    var owned=0;
    regions.forEach(function(r){ if(r.owner==="player") owned++; });
    var pct=Math.round(owned/regions.length*100);
    fill.style.width=pct+"%";
    val.textContent=pct+"%";
  }

  /* ================= Skorbord ================= */
  /* Üstteki şerit: sen, düşman başkumandanlığı ve her bot kaç il tutuyor,
     gücü ne — openfront.io tarzı oyunlardaki "leaderboard"un kısa özeti.
     Bir satıra dokunmak haritayı o gücün topraklarının ortasına kaydırır. */
  function scoreboardRows(){
    var rows=[];
    var playerCount=0;
    regions.forEach(function(r){ if(r.owner==="player") playerCount++; });
    rows.push({
      key:"player", name:"Sen", color:"var(--player)", you:true,
      bolge:playerCount, guc:state.army, altin:state.gold, altinBilinir:true,
      anchor: regions[0] ? regions[0].anchor : null
    });
    if(regions[1] && regions[1].owner==="enemy"){
      rows.push({
        key:"boss", name:regions[1].name+" 👑", color:BOSS_COLOR,
        bolge:1, guc:regions[1].defense||44, altin:null, altinBilinir:false,
        anchor: regions[1].anchor
      });
    }
    bots.forEach(function(bot){
      var owned=regions.filter(function(r){ return r.botId===bot.id && r.owner==="enemy"; });
      if(!owned.length) return;
      var sx=0, sy=0;
      owned.forEach(function(r){ sx+=r.anchor.x; sy+=r.anchor.y; });
      rows.push({
        key:"bot"+bot.id, name:BOT_DIFF[bot.difficulty].label+" Cephesi", color:BOT_COLORS[bot.difficulty],
        bolge:owned.length, guc:bot.power, altin:null, altinBilinir:false,
        anchor:{x:sx/owned.length, y:sy/owned.length}
      });
    });
    // Sıralama il sayısına göre — hangi gücün haritada en geniş yeri
    // tuttuğu, yani asıl tehdit kim, en üstte çıksın.
    rows.sort(function(a,b){
      if(b.bolge!==a.bolge) return b.bolge-a.bolge;
      return b.guc-a.guc;
    });
    return rows;
  }

  /* Panel sol üstte kapalı başlar; açık/kapalı durumu #lb-panel üzerindeki
     "open" sınıfıyla tutulur. Bu render her drawMap()'te çağrıldığı için
     yalnızca içeriği (satırlar + kapalı rozetin sıra yazısı) tazeler, panel
     kutusuna dokunmaz — açıkken tur ilerledi diye kendiliğinden kapanmaz. */
  function renderScoreboard(){
    var panel=document.getElementById("lb-panel");
    var body=document.getElementById("lb-body");
    var toggleTxt=document.getElementById("lb-toggle-txt");
    if(!panel || !body || !regions.length) return;
    var rows=scoreboardRows();

    var youIdx=-1;
    rows.forEach(function(row,i){ if(row.you) youIdx=i; });
    toggleTxt.textContent = youIdx>=0 ? ("#"+(youIdx+1)+"/"+rows.length) : "Sıralama";

    var html="";
    rows.forEach(function(row,i){
      html += "<button class='lb-row lb-grid"+(row.you?" lb-you":"")+"' data-lb='"+row.key+"'>"+
        "<span class='lb-rank'>"+(i+1)+"</span>"+
        "<span class='lb-dot' style='background:"+row.color+"'></span>"+
        "<span class='lb-name'>"+row.name+"</span>"+
        "<span class='lb-val' title='İl sayısı'>"+row.bolge+"</span>"+
        "<span class='lb-val' title='Güç'>"+row.guc+"</span>"+
        "<span class='lb-val"+(row.altinBilinir?"":" lb-unknown")+"' title='"+(row.altinBilinir?"Altın":"Bilinmiyor")+"'>"+(row.altinBilinir?row.altin:"?")+"</span>"+
      "</button>";
    });
    body.innerHTML=html;
    lbAnchors={};
    rows.forEach(function(row){ lbAnchors[row.key]=row.anchor; });
    body.querySelectorAll(".lb-row").forEach(function(btn){
      btn.addEventListener("click", function(){
        centerOnAnchor(lbAnchors[btn.dataset.lb]);
        panel.classList.remove("open");
        toggleBtn.setAttribute("aria-expanded","false");
      });
    });
  }

  var toggleBtn=document.getElementById("lb-toggle");
  toggleBtn.addEventListener("click", function(){
    var panel=document.getElementById("lb-panel");
    var willOpen=!panel.classList.contains("open");
    panel.classList.toggle("open", willOpen);
    toggleBtn.setAttribute("aria-expanded", willOpen?"true":"false");
  });
  // Panel açıkken haritaya ya da başka bir yere dokununca kapansın.
  document.addEventListener("pointerdown", function(e){
    var panel=document.getElementById("lb-panel");
    if(panel.classList.contains("open") && !panel.contains(e.target)){
      panel.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded","false");
    }
  });

  /* ================= Pixel-by-pixel capture animation ================= */
  function animateCapture(region, doneCallback){
    invalidateRoutes();
    var flipped=new Set();
    var queue=[];
    region.pixels.forEach(function(p){
      var nb=[[p.x-1,p.y],[p.x+1,p.y],[p.x,p.y-1],[p.x,p.y+1]];
      for(var i=0;i<nb.length;i++){
        var nx=nb[i][0], ny=nb[i][1];
        if(nx<0||nx>=GRID_W||ny<0||ny>=GRID_H) continue;
        var nrid=pixelRegionId[ny][nx];
        if(nrid!==-1 && nrid!==region.id && regions[nrid].owner==="player"){
          queue.push(p); break;
        }
      }
    });
    if(!queue.length && region.pixels.length) queue=[region.anchor];

    region.owner="capturing";
    animating={region:region, flipped:flipped};
    var total=region.pixels.length;
    var perTick=Math.max(4, Math.ceil(total/16));

    var timer=setInterval(function(){
      var released=0;
      while(queue.length && released<perTick){
        var p=queue.shift();
        var key=p.y*GRID_W+p.x;
        if(flipped.has(key)) continue;
        flipped.add(key); released++;
        var nb=[[p.x-1,p.y],[p.x+1,p.y],[p.x,p.y-1],[p.x,p.y+1]];
        for(var i=0;i<nb.length;i++){
          var nx=nb[i][0], ny=nb[i][1];
          if(nx<0||nx>=GRID_W||ny<0||ny>=GRID_H) continue;
          var nrid=pixelRegionId[ny][nx];
          if(nrid===region.id){
            var k2=ny*GRID_W+nx;
            if(!flipped.has(k2)) queue.push({x:nx,y:ny});
          }
        }
      }
      drawMap();
      if(flipped.size>=total || !queue.length){
        clearInterval(timer);
        region.owner="player";
        animating=null;
        bfStatBump("toplamFetih");
        state.fetih++;
        drawMap();
        // Geçit ele geçtiyse oyuncu bunu ANINDA bilmeli — modun tek ölçüsü bu.
        if(region.gecit){
          var gd=gecitDurumu();
          bildir(4, "⛰ "+region.gecit.ad+" senin"+
            (gd.gerek ? " — "+gd.tut+"/"+gd.gerek+" geçit" : ""), "gecit");
        }
        doneCallback && doneCallback();
        checkVictory();
      }
    }, 45);
  }

  /* Kaç geçit sende? Hem zafer kontrolü hem arayüz bunu okuyor. */
  function gecitDurumu(){
    var tut=0, toplam=0;
    GECITLER.forEach(function(g){
      if(g.regionId<0) return;
      toplam++;
      if(regions[g.regionId] && regions[g.regionId].owner==="player") tut++;
    });
    var h=(MODES[activeMode]||{}).hedef||{};
    return {tut:tut, toplam:toplam, gerek:h.gerek||0};
  }

  /* Zafer artık tek bir ile bağlı değil: seçilen modun hedefine bakıyor.
     Geçit modunda "haritayı süpür" yok — dar noktaları tutmak yetiyor. */
  /* Fetih anında yalnızca başkent hedefi denetlenir. Geçit hedefi artık
     tur döngüsünde (gecitZaferKontrol) izleniyor — çünkü kazanmak "almak"
     değil "tutmak". */
  function checkVictory(){
    if(state.gameOver) return;
    var h=(MODES[activeMode]||{}).hedef||{tip:"baskent"};
    if(h.tip==="gecit"){ gecitZaferKontrol(); return; }
    if(regions[1] && regions[1].owner==="player") setTimeout(showVictory, 400);
  }

  function flashRegion(rid){
    flashRegionId=rid;
    drawMap();
    setTimeout(function(){ flashRegionId=null; drawMap(); }, 600);
  }

  /* ================= Toast ================= */
  /* Aynı mesajın üst üste yığılmasını engelleyen küçük bir tampon: eski
     sürümde bot tahkimatı ve konvoy baskını art arda gelince ekran
     toast duvarına dönüşüyordu. */
  var TOAST_TAVAN=3, sonToast={metin:null, zaman:0};
  function showToast(msg){
    var zone=document.getElementById("toast-zone");
    if(!zone) return;
    var simdi=Date.now();
    if(sonToast.metin===msg && simdi-sonToast.zaman<3000) return;   // spam koruması
    sonToast={metin:msg, zaman:simdi};
    while(zone.children.length>=TOAST_TAVAN) zone.removeChild(zone.firstChild);
    var t=document.createElement("div");
    t.className="toast";
    t.textContent=msg;
    zone.appendChild(t);
    setTimeout(function(){
      t.classList.add("fade");
      setTimeout(function(){ if(t.parentNode) t.remove(); }, 350);
    }, 2400);
  }

  /* Kritik ve stratejik olaylar toast değil BANT alır: haritanın üstünde,
     geniş, renk kodlu ve daha uzun süreli. Oyuncunun kaçırmaması gereken
     tek şey budur. */
  var bantZaman=null;
  function bantGoster(seviye, metin){
    var el=document.getElementById("bant");
    if(!el){ showToast(metin); return; }
    el.className = seviye>=4 ? "bant bant-strateji" : "bant bant-kritik";
    el.textContent=metin;
    el.hidden=false;
    // Yeniden akmasını tetiklemek için sınıfı bir kare sonra ekliyoruz.
    el.classList.remove("gir");
    void el.offsetWidth;
    el.classList.add("gir");
    clearTimeout(bantZaman);
    bantZaman=setTimeout(function(){
      el.classList.remove("gir");
      setTimeout(function(){ el.hidden=true; }, 260);
    }, seviye>=4 ? 5200 : 4200);
  }

  /* Tek giriş kapısı: oyunun her bildirimi buradan geçer, seviyesine göre
     kanalı, sesi ve günlüğe yazılıp yazılmayacağı burada belirlenir. */
  function bildir(seviye, metin, sesAdi){
    if(seviye>=3) olayEkle(seviye, metin);
    if(sesAdi && window.__bfSes) window.__bfSes(sesAdi);
    if(seviye<=2) showToast(metin);
    else bantGoster(seviye, metin);
  }

  /* ================= Duraklatma =================
     Gerçek zamanlı bir oyunda duraklatmanın olmaması eksik özellik değil,
     hatadır: telefon çalar, panel okunur, harita incelenir. Üç saatin de
     tek kapısı burası. */
  function duraklatmaAyarla(deger){
    if(state.gameOver) return;
    state.durakladi=!!deger;
    var el=document.getElementById("pause-flag");
    if(el) el.hidden=!state.durakladi;
    var btn=document.getElementById("pause-btn");
    if(btn){
      btn.setAttribute("aria-pressed", state.durakladi?"true":"false");
      btn.textContent = state.durakladi ? "▶" : "❚❚";
      btn.setAttribute("aria-label", state.durakladi ? "Devam et" : "Duraklat");
      btn.title = state.durakladi ? "Devam et (P)" : "Duraklat (P)";
    }
    if(state.durakladi) showToast("⏸ Sefer duraklatıldı — P ile devam et.");
  }
  function duraklatmaCevir(){ duraklatmaAyarla(!state.durakladi); }

  /* ================= Sheet ================= */
  var overlay=document.getElementById("overlay");
  var sheet=document.getElementById("sheet");

  function openSheet(icon,title,sub,actionsHtml){
    document.getElementById("sheet-icon").textContent=icon;
    document.getElementById("sheet-title").textContent=title;
    document.getElementById("sheet-sub").textContent=sub;
    document.getElementById("sheet-actions").innerHTML=actionsHtml;
    overlay.classList.add("show");
    sheet.classList.add("open");
  }
  function closeSheet(){
    overlay.classList.remove("show");
    sheet.classList.remove("open");
    if(blastPreview) blastPreview=null;
    currentSel=null;          // seçim halkası ve gizli rakam da paneli kapatınca gider
    drawMap();
  }
  overlay.addEventListener("click", closeSheet);
  document.getElementById("sheet-close").addEventListener("click", closeSheet);

  /* ================= Interaction ================= */
  function onRegionTap(rid){
    if(state.gameOver) return;
    if(animating){ showToast("⏳ Fetih devam ediyor, bekle..."); return; }
    var region=regions[rid];

    if(region.type==="obstacle"){
      showToast("⛰️ Bu bölgeden geçilmez.");
      return;
    }
    if(region.owner==="player"){
      openBuildPanel(region);
      return;
    }
    // Uzaktaki bölgeyi de incelemeye izin ver: bağlama menüsünden "bilgi"
    // seçildiğinde oyuncu boş bir uyarı yerine bildiği kadarını görsün.
    if(!isAdjacentToPlayer(region) && istihbarat(region)>=1){
      openAttackPanel(region);
      return;
    }
    if(!isAdjacentToPlayer(region)){
      showToast("⚠️ Önce komşu bölgeleri ele geçirmelisin.");
      return;
    }
    if(region.type==="empty"){
      openCapturePanel(region, {cost:region.cost, icon:"🟩", label:region.name, desc:"Sahipsiz toprak. Ele geçirip genişleyebilirsin."});
    } else if(region.type==="resource"){
      var rk=RESOURCE_KINDS[region.resKind];
      openCapturePanel(region, {cost:region.cost, icon:rk.raw, label:region.name+" · "+rk.label, desc:"Ele geçirilince otomatik "+rk.built+" kurulur, +"+region.goldBonus+" altın/tur pasif üretim sağlar."});
    } else if(region.type==="enemy" || region.type==="enemyCapital"){
      openAttackPanel(region);
    }
  }

  function openCapturePanel(region, opts){
    currentSel=region;
    drawMap();
    var canAfford = state.gold>=opts.cost;
    var html = "<button class='action-btn primary' id='do-capture' "+(canAfford?"":"disabled")+">"+
      "<span><span class='a-name'>Ele Geçir</span><span class='a-desc'>"+opts.desc+"</span></span>"+
      "<span class='a-cost'>💰"+opts.cost+"</span></button>";
    openSheet(opts.icon, opts.label, opts.desc, html);
    document.getElementById("do-capture").addEventListener("click", function(){
      if(state.gold<opts.cost) return;
      state.gold-=opts.cost;
      closeSheet();
      animateCapture(region, function(){
        drawMap();
        showToast("🎉 "+region.name+" ele geçirildi, sınırın ilerledi.");
      });
    });
  }

  function openAttackPanel(region){
    currentSel=region;
    drawMap();
    var isBoss = region.type==="enemyCapital";
    var seviye = istihbarat(region);
    var known = seviye>=1;
    var kesin = seviye>=2;
    var structs = defenseStructures(region);
    var atkKey = "piyade";

    var sub = "Garnizon gücü: "+region.defense+" 🪖 · Elindeki asker: "+state.army+" 🪖";

    // Bölgenin tahkimatı: keşfedilmemişse gizli kalır, saldırı tipini körlemesine seçersin.
    var defHtml;
    if(!known){
      defHtml="<div class='def-row unknown'>❓ <span>Bu bölge menzilinin dışında — tahkimatını göremiyorsun. "+
        "Komşusunu ele geçirirsen savunması ortaya çıkar.</span></div>";
    } else if(!structs.length){
      defHtml="<div class='def-row'><span class='def-none'>Tahkimat yok — açık hedef.</span></div>";
    } else {
      defHtml="<div class='def-row'>"+structs.map(function(k){
        return "<span class='def-chip'>"+symbolImg(k,"sym-img def-sym",true)+BUILDINGS[k].name+"</span>";
      }).join("")+"</div>";
    }

    var typeHtml="<div class='atk-label'>Saldırı tipini seç — <b>gereken asker</b> tahkimata göre değişir</div>"+
      "<div class='atk-types' id='atk-types'></div>"+
      "<div class='atk-desc' id='atk-desc'></div>";

    var ratioPct=50;
    var sendAmt = Math.max(1, Math.round(state.army*ratioPct/100));

    var html =
      defHtml + typeHtml +
      "<div class='ratio-row'>"+
        "<div class='ratio-head'>"+
          "<span class='ratio-pct' id='ratio-pct'>50%</span>"+
          "<span class='ratio-abs'>ordunun <b id='qty-value'>0</b> askeri</span>"+
        "</div>"+
        "<input type='range' id='ratio-slider' min='1' max='100' value='50'>"+
      "</div>"+
      "<div class='qty-presets'>"+
        "<button class='qty-preset' data-pct='10'>%10</button>"+
        "<button class='qty-preset' data-pct='25'>%25</button>"+
        "<button class='qty-preset' data-pct='50'>%50</button>"+
        "<button class='qty-preset' id='qty-min'>Tam yetecek</button>"+
        "<button class='qty-preset' data-pct='100'>%100</button>"+
      "</div>"+
      "<div class='outcome-preview' id='outcome-preview'></div>"+
      "<button class='action-btn danger-action' id='do-attack'>"+
        "<span><span class='a-name'>Saldır</span><span class='a-desc'>Seçtiğin kadar askeri gönder</span></span>"+
        "<span class='a-cost' id='attack-cost-tag'></span></button>";

    openSheet(isBoss?"👑":(structs.length&&known?"🧱":"🪖"), region.name+(isBoss?" · Düşman Başkenti":""), sub, html);

    var qtyValEl=document.getElementById("qty-value");
    var previewEl=document.getElementById("outcome-preview");
    var attackBtn=document.getElementById("do-attack");
    var costTag=document.getElementById("attack-cost-tag");
    var descEl=document.getElementById("atk-desc");
    var typesEl=document.getElementById("atk-types");

    function clampAmt(v){ return Math.max(0, Math.min(state.army, v)); }

    function refresh(){
      var atk=ATTACKS[atkKey];
      var d=defenseAgainst(region, atkKey);
      renderTypes();
      sendAmt=clampAmt(sendAmt);
      qtyValEl.textContent=sendAmt;
      if(pctEl) pctEl.textContent="%"+ratioPct;
      costTag.textContent="🪖"+sendAmt+(atk.gold?" 💰"+atk.gold:"");
      /* Alt sınır bilinen en iyi tahmine göre hesaplanır: kesin istihbarat
         varsa gerçek değere, yoksa aralığın alt ucuna. Böylece keşif yapmamış
         oyuncu haksız yere engellenmez ama "1 asker gönder" de mümkün olmaz. */
      var esik=taarruzEsigi(kesin ? d.value
                : (known ? savunmaAraligi(region,atkKey).alt : region.defense));
      attackBtn.disabled = sendAmt<esik || !attackAvailability(atkKey).ok;

      // Tahkimatın bu saldırı tipine etkisi — keşfedilmemiş bölgede gizli.
      var effTxt;
      if(!known){
        effTxt="Etkin savunma: <b>?</b> — körlemesine saldırıyorsun.";
      } else {
        effTxt="Etkin savunma: <b>"+d.value+"</b> 🪖";
        if(d.notes.length){
          effTxt += " <span class='eff-note'>("+d.notes.map(function(n){
            return BUILDINGS[n.key].name+" ×"+n.mult;
          }).join(", ")+")</span>";
        }
      }

      // Konumun savaşa etkisi — asker sayısından bağımsız, kalıcı görünür
      var c=d.cephe;
      var konum="<div class='konum-satir'>";
      konum += "<span class='ks "+(c.cephe>1?"iyi":"")+"'>⚔ "+c.cephe+"/"+c.gecilirKomsu+" cephe"+
               (c.kusatma<1 ? " · kuşatma ×"+c.kusatma.toFixed(2) : " · cepheden") + "</span>";
      if(c.dag) konum += "<span class='ks kotu'>⛰ "+c.dag+" dağ · savunma ×"+c.arazi.toFixed(2)+"</span>";
      konum += "</div>";
      if(c.cephe<=1 && c.gecilirKomsu>1){
        konum += "<div class='konum-ipucu'>Bu ile başka bir komşusundan da dayanırsan savunması ×0.82'ye düşer.</div>";
      }
      effTxt += konum;
      descEl.innerHTML="<div class='atk-line'>"+atk.desc+"</div><div class='atk-line'>"+effTxt+"</div>";

      if(sendAmt<1){
        previewEl.className="outcome-preview";
        previewEl.textContent="Gönderecek askerin yok.";
        return;
      }
      /* Eskiden 1 asker göndermek garnizonu 1 düşürüyordu; bu, saldırı tipi
         seçmeyi ve keşfi tamamen gereksiz kılan bir sömürüydü. Artık bir
         taarruzun anlamlı sayılması için asgari kuvvet gerekiyor. */
      if(sendAmt<esik){
        previewEl.className="outcome-preview bad";
        previewEl.innerHTML="⚠️ Bu kuvvetle taarruz düzenlenemez — küçük bir kol "+
          "garnizonu aşındırmaz. En az <b>"+esik+"</b> asker gerekiyor.";
        return;
      }
      if(!known){
        previewEl.className="outcome-preview";
        previewEl.textContent="❓ Tahkimatı bilmeden sonucu kestiremezsin. Önce komşu bir bölgeyi al, sonra doğru saldırı tipini seç.";
        return;
      }
      if(sendAmt>=d.value){
        var leftover=Math.floor((sendAmt-d.value)*atk.garrisonMult);
        var loot=Math.floor(region.defense*2.5*atk.lootMult);
        previewEl.className="outcome-preview ok";
        previewEl.innerHTML="✅ Bölgeyi fethedersin · "+loot+" 💰 ganimet"+
          (atk.lootMult<1?" <span class='eff-note'>(bombardıman ganimeti yaktı)</span>":"")+
          (atk.destroys&&hasStructure(region,atk.destroys)?" · "+BUILDINGS[atk.destroys].name+" yıkılır":"")+
          (leftover>0?(" · "+leftover+" asker garnizon kalır 🛡️"):" · geriye garnizon kalmaz");
      } else {
        var afterDef=Math.max(1, region.defense-Math.max(1,Math.floor(sendAmt*atk.softenMult)));
        previewEl.className="outcome-preview bad";
        previewEl.innerHTML="⚠️ Yetersiz — "+sendAmt+" askerin de gider"+(atk.gold?" ve "+atk.gold+"💰 boşa gider":"")+
          ". Garnizon "+region.defense+" → ~"+afterDef+" düşer."+
          (d.mult>1?" <span class='eff-note'>Tahkimatı bu saldırıya karşı çok güçlü — tipi değiştir.</span>":"");
      }
    }

    /* Her tipin bu bölgeye karşı gerçek maliyetini düğmenin üstünde gösterir:
       oyuncu üç sayıyı yan yana görüp karşılaştırır, tahmin etmek zorunda kalmaz. */
    function renderTypes(){
      typesEl.innerHTML=ATTACK_KEYS.map(function(k){
        var a=ATTACKS[k], av=attackAvailability(k), d=defenseAgainst(region,k);
        var tag;
        if(!known) tag="<span class='at-eff'>tahkimat bilinmiyor</span>";
        else if(!kesin) tag="<span class='at-eff'>tahkimat tipi belirsiz — keşif gerek</span>";
        else if(d.bypassed.length) tag="<span class='at-eff good'>"+d.bypassed.map(function(n){ return BUILDINGS[n].name; }).join(", ")+" aşılır</span>";
        else if(d.notes.length) tag="<span class='at-eff bad'>"+d.notes.map(function(n){ return BUILDINGS[n.key].name+" ×"+n.mult; }).join(" · ")+"</span>";
        else tag="<span class='at-eff'>engel yok</span>";
        return "<button class='atk-type"+(k===atkKey?" sel":"")+"' data-atk='"+k+"'"+(av.ok?"":" disabled")+">"+
          "<span class='at-head'><span class='at-icon'>"+a.icon+"</span><span class='at-name'>"+a.name+"</span></span>"+
          "<span class='at-need'>"+(kesin ? d.value
              : (known ? (function(a){ return a.alt+"–"+a.ust; })(savunmaAraligi(region,k)) : "?"))+
          "<span class='at-need-u'>🪖 gerek</span></span>"+
          tag+
          "<span class='at-cost'>"+(a.gold?("💰"+a.gold+(a.lootMult<1?" · ganimet ½":"")):"bedava")+"</span>"+
          (av.ok?"":"<span class='at-lock'>🔒 "+av.reason+"</span>")+
        "</button>";
      }).join("");
    }

    function setAtk(k){
      if(!attackAvailability(k).ok) return;
      atkKey=k;
      refresh();
    }

    typesEl.addEventListener("click", function(e){
      var btn=e.target.closest ? e.target.closest(".atk-type") : null;
      if(btn && !btn.disabled) setAtk(btn.dataset.atk);
    });

    /* Oran çubuğu: mutlak sayı yerine ordunun yüzdesini gönderirsin.
       Ordu büyüdükçe aynı oran daha çok asker demek — karar ölçekten bağımsız. */
    var slider=document.getElementById("ratio-slider");
    var pctEl=document.getElementById("ratio-pct");
    function setPct(p){
      ratioPct=clamp(Math.round(p),1,100);
      slider.value=ratioPct;
      sendAmt=Math.max(1, Math.round(state.army*ratioPct/100));
      refresh();
    }
    slider.addEventListener("input", function(){ setPct(parseInt(slider.value,10)); });
    document.getElementById("qty-min").addEventListener("click", function(){
      // Kesin bilgi yoksa aralığın ÜST ucunu al — oyuncu eksik göndermesin.
      var need=kesin ? defenseAgainst(region,atkKey).value
               : (known ? savunmaAraligi(region,atkKey).ust : region.defense);
      setPct(state.army>0 ? Math.min(100,Math.ceil(need/state.army*100)) : 100);
    });
    document.querySelectorAll(".qty-preset[data-pct]").forEach(function(btn){
      btn.addEventListener("click", function(){ setPct(parseInt(btn.dataset.pct,10)); });
    });

    attackBtn.addEventListener("click", function(){
      var atk=ATTACKS[atkKey];
      if(!attackAvailability(atkKey).ok) return;
      var sent=clampAmt(sendAmt);
      if(sent<1) return;
      var d=defenseAgainst(region, atkKey);
      var esikSon=taarruzEsigi(kesin ? d.value
                  : (known ? savunmaAraligi(region,atkKey).alt : region.defense));
      if(sent<esikSon){
        bildir(2, "⚠️ Bu kuvvetle taarruz düzenlenemez — en az "+esikSon+" asker gerekiyor.");
        return;
      }
      state.army-=sent;
      state.gold-=atk.gold;
      closeSheet();
      if(sent>=d.value){
        var leftover=Math.floor((sent-d.value)*atk.garrisonMult);
        var loot=Math.floor(region.defense*2.5*atk.lootMult);
        var razed = atk.destroys && hasStructure(region, atk.destroys);
        animateCapture(region, function(){
          region.garrison=leftover;
          // Fethedilen tahkimat sana kalır; bombardımanla yıktığın kısım gider.
          if(razed){ region.defenses=region.defenses.filter(function(k){ return k!==atk.destroys; }); }
          state.gold+=loot;
          drawMap();
          var vc=regionCenter(region);
          addShake(2.2);
          addBurst(vc.x, vc.y, 26, ["#f0c944","#d4a72c","#cfc4a4"], 1.7, 900);
          addFloater(vc.x, vc.y-6, "+"+loot+" 💰", "#f0c944");
          showToast(atk.icon+" Zafer! "+loot+" altın ganimet"+
            (razed?" · "+BUILDINGS[atk.destroys].name+" yıkıldı":"")+
            (leftover>0?(" · "+leftover+" asker garnizon 🛡️"):"")+".");
          // Zafer kontrolü artık animateCapture içinde, moda göre yapılıyor.
        });
      } else {
        /* Aşındırma artık orantılı: sabit "en az 1" tabanı kaldırıldı,
           yerini asgari kuvvet şartı aldı (bkz. taarruzEsigi). */
        var reduction=Math.floor(sent*atk.softenMult);
        region.defense=Math.max(1, region.defense-reduction);
        drawMap();
        flashRegion(region.id);
        var fc=regionCenter(region);
        addShake(3.5);
        addBurst(fc.x, fc.y, 16, ["#c9c0a4","#8d8266","#b5432f"], 1.5, 620);
        addFloater(fc.x, fc.y-6, "-"+sent+" 🪖", "#e08a72");
        var why = d.mult>1 ? " Tahkimatı bu saldırıyı katladı (×"+d.mult.toFixed(1)+")." : "";
        showToast("💥 Saldırı püskürtüldü, "+sent+" asker gitti."+why+" Garnizon "+region.defense+".");
      }
    });

    refresh();
  }

  function tryBuild(region, key){
    var b=BUILDINGS[key];
    if(!region || region.owner!=="player" || region.type==="capital"){
      showToast("❌ Bina yalnızca kendi bölgelerine kurulabilir.");
      return {ok:false};
    }
    if(region.building){
      showToast("❌ Burada zaten "+BUILDINGS[region.building].name+" var.");
      return {ok:false};
    }
    if(state.gold<b.cost){
      showToast("❌ Yetersiz altın ("+b.cost+"💰 gerekiyor).");
      return {ok:false};
    }
    state.gold-=b.cost;
    region.building=key;
    invalidateRoutes();
    drawMap();
    showToast("🏗️ "+b.name+" inşa edildi.");
    return {ok:true};
  }

  /* Garnizon artık yalnızca baskınlarla erimiyor — ulusal ordundan bu
     bölgeye asker aktarabilirsin. Tek yeni sayı yok: aynı garrison alanı,
     aynı defenseAgainst() matematiği (tryRaid zaten bunu okuyor) üzerinden
     işliyor, yani takviye doğrudan "bu bölge bir sonraki baskını atlatır
     mı" sorusunu etkiliyor. Başkent de dahil — son savunma hattı odur. */
  function tryReinforce(region, amount){
    if(!region || region.owner!=="player"){
      showToast("❌ Takviye yalnızca kendi bölgene gönderilebilir.");
      return {ok:false};
    }
    amount=Math.max(0, Math.min(Math.round(amount), state.army));
    if(amount<1){
      showToast("❌ Gönderecek asker yok.");
      return {ok:false};
    }
    state.army-=amount;
    region.garrison=(region.garrison||0)+amount;
    drawMap();
    showToast("🪖 "+region.name+"'e "+amount+" asker takviye edildi — garnizon "+region.garrison+".");
    return {ok:true};
  }

  // Bölgenin stratejik durumu: tek satır, ikmal ve rota. (madde 20)
  function bolgeDurumSatiri(region){
    if(routesDirty) rebuildRoutes();
    var ik=region.ikmal==null?0:region.ikmal;
    var ikEtiket = ik>=70?"İyi" : (ik>=40?"Zayıf" : (ik>0?"Kritik":"Kesik"));
    var uzerinde=false;
    workerRoutes.forEach(function(rt){
      if(rt.durum!=="kesildi" && rt.nodes.indexOf(region.id)>=0) uzerinde=true;
    });
    return "<div class='stat-row'><span>İkmal</span><b>"+ikEtiket+" · %"+ik+"</b></div>"+
           "<div class='stat-row'><span>Rota</span><b>"+(uzerinde?"Üzerinde":"Dışında")+"</b></div>"+
           (region.gecit ? "<div class='stat-row'><span>Geçit</span><b>"+region.gecit.ad+"</b></div>" : "");
  }

  function openBuildPanel(region){
    currentSel=region;
    drawMap();

    var isCapital = region.type==="capital";
    var reinforceHtml =
      "<div class='ratio-row'>"+
        "<div class='ratio-head'>"+
          "<span class='ratio-pct' id='ratio-pct'>0%</span>"+
          "<span class='ratio-abs'>ordunun <b id='qty-value'>0</b> askeri</span>"+
        "</div>"+
        "<input type='range' id='ratio-slider' min='0' max='100' value='0'>"+
      "</div>"+
      "<button class='action-btn primary' id='do-reinforce' disabled>"+
        "<span><span class='a-name'>Takviye Gönder</span>"+
        "<span class='a-desc'>Garnizon: "+(region.garrison||0)+" 🪖 — baskınlara karşı kalıcı savunma</span></span>"+
      "</button>";

    var bodyHtml=bolgeDurumSatiri(region)+"<div class='sheet-divider'></div>";
    if(isCapital){
      bodyHtml += "<div class='built-row'><span style='font-size:22px'>🏰</span>"+
        "<span>Asker ve altın üretiminin kalbi. Her tur otomatik üretim yapar. <b>Düşerse sefer biter</b> — garnizonunu boş bırakma.</span></div>";
    } else if(region.building){
      var b=BUILDINGS[region.building];
      bodyHtml += "<div class='built-row'>"+symbolImg(region.building,"sym-img built-sym")+
        "<span>Bu bölgede zaten <b>"+b.name+"</b> inşa edilmiş.<br><span class='built-desc'>"+b.desc+"</span></span></div>";
    } else {
      Object.keys(BUILDINGS).forEach(function(key){
        var b=BUILDINGS[key];
        var canAfford = state.gold>=b.cost;
        bodyHtml += "<button class='action-btn build-btn' data-key='"+key+"' "+(canAfford?"":"disabled")+">"+
          "<span><span class='a-name'>"+symbolImg(key,"sym-img a-sym")+b.name+"</span><span class='a-desc'>"+b.desc+"</span></span>"+
          "<span class='a-cost'>💰"+b.cost+"</span></button>";
      });
    }

    openSheet(isCapital?"🏰":"🏗️", region.name,
      isCapital?"":"Bu bölgede bir yapı kurabilirsin, ya da bina panelinden sürükleyip bırakabilirsin.",
      reinforceHtml+"<div class='sheet-divider'></div>"+bodyHtml);

    var slider=document.getElementById("ratio-slider");
    var pctEl=document.getElementById("ratio-pct");
    var absEl=document.getElementById("qty-value");
    var sendBtn=document.getElementById("do-reinforce");
    function refreshReinforce(){
      var pct=parseInt(slider.value,10);
      var amt=state.army>0 ? Math.round(state.army*pct/100) : 0;
      pctEl.textContent=pct+"%";
      absEl.textContent=amt;
      sendBtn.disabled = amt<1;
    }
    slider.addEventListener("input", refreshReinforce);
    refreshReinforce();
    sendBtn.addEventListener("click", function(){
      var amt=Math.round(state.army*parseInt(slider.value,10)/100);
      if(tryReinforce(region, amt).ok) closeSheet();
    });

    if(!isCapital && !region.building){
      document.querySelectorAll(".build-btn").forEach(function(btn){
        btn.addEventListener("click", function(){
          if(tryBuild(region, btn.dataset.key).ok) closeSheet();
        });
      });
    }
  }

  function regionAtPoint(clientX, clientY){
    var rect=canvas.getBoundingClientRect();
    if(clientX<rect.left||clientX>rect.right||clientY<rect.top||clientY>rect.bottom) return null;
    var scaleX=LOGICAL_W/rect.width;
    var scaleY=LOGICAL_H/rect.height;
    var gx=Math.floor((clientX-rect.left)*scaleX/CELL);
    var gy=Math.floor((clientY-rect.top)*scaleY/CELL);
    if(gx<0||gx>=GRID_W||gy<0||gy>=GRID_H) return null;
    var rid=pixelRegionId[gy][gx];
    return rid===-1 ? null : regions[rid];
  }

  /* Harita etkileşimi: tek parmak kaydırır, iki parmak yakınlaştırır,
     hareketsiz dokunuş il seçer. Sürükleyip bıraktığında seçim tetiklenmez. */
  var aktifPtr={}, ptrSayi=0, sonPan=null, pinchBase=null, hareket=0;

  function ptrMerkez(){
    var xs=[], ys=[];
    for(var k in aktifPtr){ xs.push(aktifPtr[k].x); ys.push(aktifPtr[k].y); }
    var sx=0, sy=0;
    xs.forEach(function(v){ sx+=v; }); ys.forEach(function(v){ sy+=v; });
    return {x:sx/xs.length, y:sy/ys.length};
  }
  function ptrMesafe(){
    var a=null,b=null;
    for(var k in aktifPtr){ if(!a) a=aktifPtr[k]; else if(!b) b=aktifPtr[k]; }
    if(!a||!b) return 0;
    return Math.sqrt(dist2(a.x,a.y,b.x,b.y));
  }

  mapWrap.addEventListener("pointerdown", function(e){
    // Liderlik paneli haritanın üzerinde yüzen bir arayüz — dokunuşunu
    // kaydırma/yakınlaştırma sistemi yutmasın, buton kendi click'ini alsın.
    if(e.target.closest && e.target.closest("#lb-panel")) return;
    if(aktifPtr[e.pointerId]) return;
    aktifPtr[e.pointerId]={x:e.clientX, y:e.clientY};
    ptrSayi++;
    hareket=0;
    sonPan=ptrMerkez();
    pinchBase = ptrSayi>=2 ? {d:ptrMesafe(), s:view.scale} : null;
    try{ mapWrap.setPointerCapture(e.pointerId); }catch(err){}
  });

  mapWrap.addEventListener("pointermove", function(e){
    if(!aktifPtr[e.pointerId]) return;
    aktifPtr[e.pointerId]={x:e.clientX, y:e.clientY};
    var merkez=ptrMerkez();
    if(sonPan){
      var dx=merkez.x-sonPan.x, dy=merkez.y-sonPan.y;
      hareket+=Math.abs(dx)+Math.abs(dy);
      view.tx+=dx; view.ty+=dy;
    }
    sonPan=merkez;
    if(pinchBase && ptrSayi>=2){
      var d=ptrMesafe();
      if(d>0 && pinchBase.d>0){
        view.scale=clamp(pinchBase.s*(d/pinchBase.d), MIN_SCALE, MAX_SCALE);
        hareket+=8;
      }
    }
    clampView();
    applyTransform();
  });

  function ptrBitti(e){
    if(!aktifPtr[e.pointerId]) return;
    delete aktifPtr[e.pointerId];
    ptrSayi=Math.max(0, ptrSayi-1);
    if(ptrSayi===0){
      sonPan=null; pinchBase=null;
      if(hareket<9){                       // kaydırma değil, dokunuş
        var region=regionAtPoint(e.clientX, e.clientY);
        if(!region){ showToast("🌊 Bu alan deniz, buradan geçemezsin."); }
        else { onRegionTap(region.id); }
      }
    } else {
      sonPan=ptrMerkez();
      pinchBase = ptrSayi>=2 ? {d:ptrMesafe(), s:view.scale} : null;
    }
  }
  mapWrap.addEventListener("pointerup", ptrBitti);
  mapWrap.addEventListener("pointercancel", ptrBitti);

  /* ================= Bağlama menüsü =================
     Sol tık bilgi verir, sağ tık EYLEM verir. Menü sabit değil: bir bölgede
     yapılamayan eylem hiç listelenmez, böylece oyuncu ölü satıra bakmaz.
     Dokunmatikte aynı menü basılı tutunca açılır. */
  var ctxMenu=document.getElementById("ctx-menu");
  var ctxBasili=null;

  function ctxKapat(){ if(ctxMenu) ctxMenu.hidden=true; }

  function ateskesBedeli(bot){
    // Zor bot pahalı barış ister; sayı okunur kalsın diye kabaca ölçekli.
    return 40 + (BOT_DIFF[bot.difficulty] ? BOT_DIFF[bot.difficulty].basePower*4 : 20);
  }

  function ctxAc(region, cx, cy){
    if(!ctxMenu || state.gameOver) return;
    var benim = region.owner==="player";
    var komsu = isAdjacentToPlayer(region);
    var bot = (region.owner==="enemy" && region.botId!=null) ? bots[region.botId] : null;

    var sahip = benim ? "Senin" : (region.owner==="enemy" ? "Düşman" : "Boş");
    var alt = sahip + (region.gecit ? " · Geçit: "+region.gecit.ad : "");
    if(benim && region.ikmal!=null) alt += " · İkmal %"+region.ikmal;

    var h='<div class="cx-head"><div class="cx-ad">'+region.name+'</div>'+
          '<div class="cx-alt">'+alt+'</div></div>';
    var eylemler=[];

    if(benim){
      if(region.type!=="capital" || true) eylemler.push(["takviye","Takviye gönder",""]);
      if(!region.building) eylemler.push(["bina","Bina kur",""]);
    } else if(komsu){
      eylemler.push(["saldir", region.owner==="enemy" ? "Saldır" : "Ele geçir", ""]);
    }
    if(!benim && region.owner==="enemy"){
      var sv=istihbarat(region);
      eylemler.push(["kesif",
        sv>=2 ? "Keşif geçerli ("+(region.kesif-state.turn)+" tur)" : "Keşif yap",
        sv>=2 ? "" : KESIF_BEDEL+" 🪙",
        sv>=2 || state.gold<KESIF_BEDEL]);
    }
    if(bot){
      var bedel=ateskesBedeli(bot);
      var aktif = bot.ateskes>state.turn;
      eylemler.push(["ateskes",
        aktif ? "Ateşkes sürüyor ("+(bot.ateskes-state.turn)+" tur)" : "Ateşkes öner",
        aktif ? "" : bedel+" 🪙", aktif || state.gold<bedel]);
    }
    eylemler.push(["bilgi","Bölge bilgisi",""]);

    h += eylemler.map(function(e){
      return '<button data-cx="'+e[0]+'"'+(e[3]?' disabled':'')+
             (e[0]==="saldir"?' class="cx-danger"':'')+'>'+
             '<span>'+e[1]+'</span>'+(e[2]?'<em>'+e[2]+'</em>':'')+'</button>';
    }).join("");

    ctxMenu.innerHTML=h;
    ctxMenu.hidden=false;
    // Ekran dışına taşmasın
    var kutu=ctxMenu.getBoundingClientRect();
    var ax=Math.min(cx, window.innerWidth-kutu.width-8);
    var ay=Math.min(cy, window.innerHeight-kutu.height-8);
    ctxMenu.style.left=Math.max(6,ax)+"px";
    ctxMenu.style.top=Math.max(6,ay)+"px";

    ctxMenu.querySelectorAll("[data-cx]").forEach(function(b){
      b.addEventListener("click", function(){
        var k=b.dataset.cx;
        ctxKapat();
        if(k==="bilgi" || k==="takviye" || k==="saldir") onRegionTap(region.id);
        else if(k==="bina"){
          menuSheet.classList.add("open"); setActiveTab("menu");
          showToast("🏗️ Kartı bu bölgeye sürükle.");
        }
        else if(k==="kesif"){
          if(state.gold<KESIF_BEDEL){ showToast("🪙 Yeterli altının yok."); return; }
          state.gold-=KESIF_BEDEL;
          region.kesif=state.turn+KESIF_SURE;
          showToast("🔭 "+region.name+" keşfedildi — tahkimatı "+KESIF_SURE+" tur açık.");
          drawMap();
        }
        else if(k==="ateskes" && bot){
          var bedel=ateskesBedeli(bot);
          if(state.gold<bedel){ showToast("🪙 Yeterli altının yok."); return; }
          state.gold-=bedel;
          bot.ateskes=state.turn+10;
          showToast("🤝 Ateşkes kuruldu — bu cephe 10 tur baskın yapmayacak.");
          drawMap();
        }
      });
    });
  }

  mapWrap.addEventListener("contextmenu", function(e){
    var region=regionAtPoint(e.clientX, e.clientY);
    if(!region) return;
    e.preventDefault();
    ctxAc(region, e.clientX, e.clientY);
  });
  // Dokunmatik: basılı tutunca aynı menü.
  mapWrap.addEventListener("pointerdown", function(e){
    if(e.pointerType==="mouse") return;
    clearTimeout(ctxBasili);
    var x=e.clientX, y=e.clientY;
    ctxBasili=setTimeout(function(){
      if(hareket<9){
        var region=regionAtPoint(x,y);
        if(region) ctxAc(region,x,y);
      }
    }, 480);
  });
  ["pointerup","pointercancel","pointermove"].forEach(function(t){
    mapWrap.addEventListener(t, function(){ if(hareket>9) clearTimeout(ctxBasili); });
  });
  mapWrap.addEventListener("pointerup", function(){ clearTimeout(ctxBasili); });
  document.addEventListener("pointerdown", function(e){
    if(ctxMenu && !ctxMenu.hidden && !ctxMenu.contains(e.target)) ctxKapat();
  }, true);
  document.addEventListener("keydown", function(e){ if(e.key==="Escape") ctxKapat(); });

  mapWrap.addEventListener("wheel", function(e){
    e.preventDefault();
    zoomAt(e.deltaY<0 ? 1.15 : 1/1.15, e.clientX, e.clientY);
  }, {passive:false});

  mapWrap.addEventListener("dblclick", function(e){
    zoomAt(view.scale<2.4 ? 2 : 1/view.scale, e.clientX, e.clientY);
  });

  /* ================= Bina paneli: sürükle-bırak ================= */
  var dragState=null;

  function renderBuildTray(){
    var tray=document.getElementById("build-tray");
    var html="";
    Object.keys(BUILDINGS).forEach(function(key){
      var b=BUILDINGS[key];
      html += "<div class='build-card' data-key='"+key+"'>"+
        "<div class='bc-icon'>"+symbolImg(key,"sym-img")+"</div>"+
        "<div class='bc-name'>"+b.name+"</div>"+
        "<div class='bc-cost'>💰"+b.cost+"</div>"+
      "</div>";
    });
    // Füzeler aynı tepsiden fırlatılır ama ayrı bir bölümde durur:
    // bina kurmakla toprak yakmak aynı kutuya girmesin.
    html += "<div class='tray-split'></div>";
    NUKE_KEYS.forEach(function(key){
      var n=NUKES[key];
      html += "<div class='build-card nuke-card' data-nuke='"+key+"'>"+
        "<div class='bc-icon nuke-icon'>☢</div>"+
        "<div class='bc-name'>"+n.name+"</div>"+
        "<div class='bc-cost'>💰"+n.cost+"</div>"+
      "</div>";
    });

    tray.innerHTML=html;
    tray.querySelectorAll(".build-card").forEach(function(cardEl){
      cardEl.addEventListener("pointerdown", function(e){
        e.preventDefault();
        var nk=cardEl.dataset.nuke;
        startDrag(nk||cardEl.dataset.key, e.pointerId, cardEl, e.clientX, e.clientY, !!nk);
      });
    });
  }

  function positionGhost(x,y){
    if(!dragState) return;
    dragState.ghostEl.style.left=x+"px";
    dragState.ghostEl.style.top=y+"px";
  }

  function startDrag(key, pointerId, cardEl, x, y, isNuke){
    if(dragState) return;
    var ghost=document.createElement("div");
    ghost.id="drag-ghost";
    var face = isNuke ? "<div class='dg-icon nuke-icon'>☢</div>"
                      : "<div class='dg-icon'>"+symbolImg(key,"sym-img")+"</div>";
    ghost.innerHTML=face+"<div class='dg-hint' id='drag-hint'>"+
      (isNuke?"Hedef bölgeye sürükle":"Bir bölgeye sürükle")+"</div>";
    document.body.appendChild(ghost);
    dragState={key:key, cardEl:cardEl, ghostEl:ghost, nuke:!!isNuke};
    cardEl.classList.add("dragging");
    try{ cardEl.setPointerCapture(pointerId); }catch(err){}
    positionGhost(x,y);
    cardEl.addEventListener("pointermove", onDragMove);
    cardEl.addEventListener("pointerup", onDragEnd);
    cardEl.addEventListener("pointercancel", onDragEnd);
  }

  function onDragMove(e){
    if(!dragState) return;
    positionGhost(e.clientX, e.clientY);
    var region=regionAtPoint(e.clientX, e.clientY);
    var newHoverId = region ? region.id : null;
    var hint=document.getElementById("drag-hint");

    /* Füze sürüklenirken patlama alanı haritada canlı boyanır — nereyi
       yakacağını bırakmadan önce görürsün. Komşuluk şartı yok: menzil serbest. */
    if(dragState.nuke){
      var n=NUKES[dragState.key];
      var ids=null, own=0, total=0;
      if(region && region.type!=="obstacle"){
        var hits=blastRegions(region, n.rings);
        ids=hits.map(function(h){ return h.region.id; });
        own=hits.filter(function(h){ return h.region.owner==="player"; }).length;
        total=hits.length;
      }
      var changed = newHoverId!==dragHoverRegionId ||
        (ids||[]).join(",")!==(blastPreview||[]).join(",");
      dragHoverRegionId=newHoverId;
      blastPreview=ids;
      if(changed) drawMap();
      if(!hint) return;
      var av=nukeAvailability(dragState.key);
      if(!region){
        hint.className="dg-hint"; hint.textContent="📍 Haritanın üzerine getir";
      } else if(region.type==="obstacle"){
        hint.className="dg-hint bad"; hint.textContent="❌ Dağa fırlatılamaz";
      } else if(!av.ok){
        hint.className="dg-hint bad"; hint.textContent="❌ "+av.reason;
      } else {
        var sam=samsInRange(region).length, need=samNeeded(dragState.key);
        if(sam>=need){
          hint.className="dg-hint bad";
          hint.textContent="🛡️ "+sam+" SAM menzilde — önlenir";
        } else if(own>0){
          hint.className="dg-hint bad";
          hint.textContent="⚠️ "+total+" bölge yanar · "+own+" tanesi senin";
        } else {
          hint.className="dg-hint ok";
          hint.textContent="☢ "+total+" bölgeyi yak"+(sam?" · "+sam+" SAM yetmez":"");
        }
      }
      return;
    }

    if(newHoverId!==dragHoverRegionId){
      dragHoverRegionId=newHoverId;
      drawMap();
    }
    var b=BUILDINGS[dragState.key];
    if(!hint) return;
    if(!region){
      hint.className="dg-hint"; hint.textContent="📍 Haritanın üzerine getir";
    } else if(region.owner!=="player" || region.type==="capital"){
      hint.className="dg-hint bad"; hint.textContent="❌ Kendi bölgen değil";
    } else if(region.building){
      hint.className="dg-hint bad"; hint.textContent="❌ Zaten bina var";
    } else if(state.gold<b.cost){
      hint.className="dg-hint bad"; hint.textContent="❌ Yetersiz altın";
    } else {
      hint.className="dg-hint ok"; hint.textContent="✅ Buraya bırak";
    }
  }

  function onDragEnd(e){
    if(!dragState) return;
    var key=dragState.key;
    var cardEl=dragState.cardEl;
    var region=regionAtPoint(e.clientX, e.clientY);
    cardEl.classList.remove("dragging");
    try{ cardEl.releasePointerCapture(e.pointerId); }catch(err){}
    cardEl.removeEventListener("pointermove", onDragMove);
    cardEl.removeEventListener("pointerup", onDragEnd);
    cardEl.removeEventListener("pointercancel", onDragEnd);
    var wasNuke=dragState.nuke;
    dragState.ghostEl.remove();
    dragState=null;
    dragHoverRegionId=null;
    blastPreview=null;
    drawMap();
    if(wasNuke){
      if(!region){ showToast("Fırlatma iptal edildi."); return; }
      if(region.type==="obstacle"){ showToast("⛰️ Dağa fırlatılamaz."); return; }
      var av=nukeAvailability(key);
      if(!av.ok){ showToast("❌ "+av.reason+"."); return; }
      launchNuke(region, key);
      return;
    }
    if(region){ tryBuild(region, key); }
    else { showToast("İnşa iptal edildi."); }
  }

  /* ================= Game loops ================= */
  var tickTimer=null, raidTimer=null, botTimer=null;

  function tick(){
    if(state.gameOver || state.durakladi) return;
    var goldGain=0, armyGain=0, ownedCount=0;
    if(routesDirty) rebuildRoutes();      // ikmal de burada tazeleniyor
    regions.forEach(function(t){
      if(t.type==="capital"){ goldGain+=5; armyGain+=2; }
      if(t.owner==="player"){
        ownedCount++;
        if(isScorched(t)) return;          // kavrulmuş toprak üretim yapmaz
        // Beslenmeyen bölge tam üretmez; kesik bölge hiç üretmez.
        var ik=(t.ikmal==null?100:t.ikmal)/100;
        if(t.type==="resource") goldGain+=t.goldBonus*ik;
        if(t.building){
          var b=BUILDINGS[t.building];
          if(b.gold) goldGain+=b.gold*ik;
          if(b.army) armyGain+=b.army*ik;
        }
      }
    });
    // Ticaret geliri artık hat SAYISINDAN değil, hatların durumundan geliyor:
    // güvenli yol tam, riskli yol az, kesik yol hiç kazandırmıyor — ve yolun
    // üstündeki her geçit geliri artırıyor.
    var rd=rotaDurumu();
    goldGain+=rd.gelir;
    state.ticaret+=rd.gelir;

    /* Phase 4: riskli hat bir tehdittir, sadece az kazandırmaz. Her riskli
       konvoy turda küçük bir ihtimalle vurulur ve yükünü kaybeder. Oyuncunun
       kararı: hattı koru mu, riski göze al mı? */
    if(rd.riskli>0 && Math.random() < Math.min(0.35, 0.10*rd.riskli)){
      var kayip=Math.min(state.gold, 6+randInt(0,8));
      if(kayip>0){
        state.gold-=kayip; state.konvoyKaybi+=kayip;
        bildir(3, "🚚 Konvoy baskına uğradı — "+kayip+" altın gitti. Riskli hattı koru.", "ikmal");
      }
    }

    var expansionBonus=Math.floor(ownedCount/3);
    armyGain += expansionBonus;

    /* Asker tavanı: taban + fethedilen toprak + Kent'ler. Tavana yaklaştıkça
       üretim yavaşlar (OpenFront'un nüfus eğrisi gibi) — sonsuz yığınak yok,
       ordu büyütmek için toprak ya da Kent gerekir. */
    var cap=40 + ownedCount*6;
    regions.forEach(function(r){
      if(r.owner==="player" && r.building && BUILDINGS[r.building].popCap && !isScorched(r)){
        cap += BUILDINGS[r.building].popCap;
      }
    });
    state.maxArmy=cap;
    var doluluk=state.army/cap;
    if(doluluk>=1){ armyGain=0; }
    else { armyGain=Math.max(0, Math.round(armyGain*(1-doluluk))); }
    if(expansionBonus>state.lastExpansionBonus){
      state.lastExpansionBonus=expansionBonus;
      showToast("🎖️ Fethedilen topraklar büyüdükçe asker üretimin hızlandı! (+"+expansionBonus+"/tur)");
    }
    goldGain=Math.round(goldGain);          // ikmal çarpanı kesirli üretebilir

    /* ---- Ordu bakımı (v0.2) ----
       Eski sürümde altın biriktirmenin hiçbir bedeli yoktu; en güvenli
       strateji beklemek, biriktirmek ve tek hamlede ezmekti. Bakım gideri
       bu dengesizliği kırar: büyük ordu tutmak artık bir karar. */
    var bakim=Math.ceil(state.army/BAKIM_BOLEN);
    var net=goldGain-bakim;
    state.sonUretim=goldGain; state.sonBakim=bakim; state.sonGelir=net;
    state.bakimToplam+=bakim;

    if(state.gold+net < 0){
      /* Hazine bakımı karşılamıyor: fark kadar asker firar eder.
         Ceza gizli değil, açıkça bildirilir. */
      var acik=Math.abs(state.gold+net);
      var firar=Math.max(1, Math.ceil(acik/2));
      state.army=Math.max(0, state.army-firar);
      state.gold=0;
      bildir(3, "💸 Hazine bakımı karşılamıyor — "+firar+" asker firar etti. "+
                "Orduyu küçült ya da geliri artır.", "kayip");
    } else {
      state.gold+=net;
    }

    state.army=Math.min(state.maxArmy, state.army+armyGain);
    state.turn+=1;
    invalidateRoutes();          // kavrulma süresi dolmuş olabilir
    if(net>0) showGoldPopup(net);
    gecitZaferKontrol();
    drawMap();
  }

  /* ---- Geçit zaferi artık ANLIK DEĞİL, TUTMAYA dayalı ----
     Eski sürümde 4. geçit alındığı an oyun bitiyordu; geçidi kaybetmenin ise
     hiçbir sonucu yoktu. Artık hedefe ulaşınca bir sayaç başlıyor: o kadar tur
     boyunca ağı elinde tutabilirsen sefer senin. Bir geçit düşerse sayaç
     sıfırlanır — oyunun en gergin anı burada doğuyor. */
  function gecitZaferKontrol(){
    if(state.gameOver) return;
    var h=(MODES[activeMode]||{}).hedef||{};
    if(h.tip!=="gecit") return;
    var gd=gecitDurumu();
    if(gd.tut>=h.gerek){
      if(state.gecitSayaci==null){
        state.gecitSayaci=h.tut||GECIT_TUTMA;
        bildir(4, "⛰ Geçit ağı sende ("+gd.tut+"/"+gd.toplam+") — "+
                  state.gecitSayaci+" tur tutarsan sefer kazanılır.", "gecit");
      } else {
        state.gecitSayaci--;
        if(state.gecitSayaci<=0){ state.gecitSayaci=0; showVictory(); return; }
        if(state.gecitSayaci<=3){
          bildir(4, "⛰ Zafere "+state.gecitSayaci+" tur — geçitleri bırakma.", "gecit");
        }
      }
    } else if(state.gecitSayaci!=null){
      state.gecitSayaci=null;
      bildir(3, "⛰ Geçit ağı kırıldı — zafer sayacı sıfırlandı.", "gecit");
    }
  }

  function showGoldPopup(amount){
    var zone=document.getElementById("gold-popup-zone");
    if(!zone) return;
    var el=document.createElement("span");
    el.className="gold-popup";
    el.textContent="+"+amount;
    zone.appendChild(el);
    setTimeout(function(){ el.remove(); }, 1350);
  }

  /* ================= BASKIN (v0.2) =================
     Eski sürümde baskın yalnızca sınır illerini vuruyordu; düşmanla teması
     olmayan oyuncu hiç baskın yemiyor, sınırsız altın biriktirip istediği an
     çıkabiliyordu. Ayrıca gücü yalnızca geçen zamana bağlıydı ve düşen bölge
     rastgele bir bota geçiyordu. Üçü de burada düzeltildi. */

  /* Hedef havuzu: sınır illeri + ikmali kesilmiş/çok düşük iç bölgeler.
     Böylece uzun ve beslenmeyen çıkıntı yapmak gerçek bir risk taşır. */
  function baskinHedefleri(){
    var sinir=[], zayif=[];
    regions.forEach(function(r){
      if(r.owner!=="player" || r.type==="capital") return;
      if(isAdjacentToEnemy(r)) sinir.push(r);
      else if((r.ikmal==null?100:r.ikmal) < 40) zayif.push(r);
    });
    return {sinir:sinir, zayif:zayif};
  }

  /* Hedefe komşu düşman illerinin sahibi olan botlar; ateşkesi olanlar elenir.
     Eski kod yalnızca İLK komşuya bakıyordu, bu yüzden birden fazla cepheye
     komşu bir ilde ateşkes yanlış bota uygulanıyordu — ödenen bedelin
     karşılığı gelmiyordu. */
  function saldirabilecekBotlar(target){
    var out=[], gorulen={};
    target.neighbors.forEach(function(nid){
      var n=regions[nid];
      if(n.owner!=="enemy" || n.botId==null) return;
      var b=bots[n.botId];
      if(!b || gorulen[b.id]) return;
      gorulen[b.id]=true;
      if(b.ateskes>state.turn) return;
      out.push(b);
    });
    return out;
  }

  /* Baskın gücü artık oyuncunun gerçek gücüyle ölçekleniyor: pasif oyuncu
     ezilmiyor, büyüyen oyuncu da rahatlamıyor. */
  function baskinGucu(){
    var sahip=0;
    regions.forEach(function(r){ if(r.owner==="player") sahip++; });
    return Math.max(4, Math.round(6 + state.raidCount*0.5 + state.army*0.20 + sahip*0.5));
  }

  function tryRaid(){
    if(state.gameOver || state.durakladi || animating) return;

    var havuz=baskinHedefleri();
    var target=null, lastStand=false, icBaskin=false;
    if(havuz.sinir.length && (!havuz.zayif.length || Math.random()<0.75)){
      target=havuz.sinir[randInt(0,havuz.sinir.length-1)];
    } else if(havuz.zayif.length){
      target=havuz.zayif[randInt(0,havuz.zayif.length-1)];
      icBaskin=true;                       // ikmalsiz iç bölgeye sızma
    } else {
      var cap=regions[0];
      if(cap.owner!=="player" || !isAdjacentToEnemy(cap)) return;
      target=cap; lastStand=true;
    }

    var adaylar=saldirabilecekBotlar(target);
    var saldiranBot=adaylar.length ? adaylar[randInt(0,adaylar.length-1)] : null;
    if(!saldiranBot){
      if(!icBaskin) return;                // komşu cephelerin hepsiyle ateşkes var
      var serbest=bots.filter(function(b){ return b.ateskes<=state.turn; });
      if(!serbest.length) return;
      saldiranBot=serbest[randInt(0,serbest.length-1)];
    }

    state.raidCount+=1;
    var power=baskinGucu();

    /* Düşman zamanla akıllanır: tahkimatına en az takılan tipi seçme olasılığı
       yükselir (tavan %75 — kurduğun savunma hep bir şans taşır). */
    var smartChance=Math.min(0.75, 0.25+state.raidCount*0.05);
    var pick;
    if(Math.random()<smartChance){
      var best=Infinity;
      ATTACK_KEYS.forEach(function(k){
        var v=defenseAgainst(target,k).value;
        if(v<best){ best=v; pick=k; }
      });
    } else {
      pick=ATTACK_KEYS[randInt(0,ATTACK_KEYS.length-1)];
    }
    var atk=ATTACKS[pick];
    var def=defenseAgainst(target, pick);
    var c=regionCenter(target);

    if(def.value>=power){
      state.gold+=8;
      addBurst(c.x, c.y, 10, ["#5fa87f","#cfc4a4"], 1.1, 520);
      showToast("🛡️ "+atk.icon+" "+atk.name+" püskürtüldü! "+
        (def.notes.length?BUILDINGS[def.notes[0].key].name+" işini gördü. ":"")+"(+8 altın)");
      drawMap();
      return;
    }

    /* Başkent artık tek vuruşta düşmüyor. Önce kuşatılıyor: garnizon eriyor,
       oyuncu net bir uyarı alıyor ve takviye gönderme şansı buluyor. Ancak
       başkent tamamen çıplakken gelen baskın seferi bitiriyor. Yenilgi
       böylece hem ulaşılabilir hem adil oluyor. */
    if(lastStand){
      flashRegion(target.id);
      var korumaVar=(target.garrison>0) || defenseStructures(target).length>0;
      if(korumaVar){
        var kayip=Math.max(1, Math.round((target.garrison||0)*BASKENT_KAYIP));
        target.garrison=Math.max(0,(target.garrison||0)-kayip);
        state.baskentUyari=state.turn;
        addShake(7);
        addBurst(c.x, c.y, 30, ["#b5432f","#e0603c","#8d8266"], 2.1, 1000);
        addFloater(c.x, c.y-8, "-"+kayip+" 🪖", "#e08a72");
        bildir(3, "🚨 BAŞKENT KUŞATMA ALTINDA — "+kayip+" asker kaybettin. "+
                  "Garnizon "+target.garrison+". Takviye gönder, yoksa sefer biter.", "kayip");
        drawMap();
        return;
      }
      addShake(9);
      addBurst(c.x, c.y, 46, ["#b5432f","#e0603c","#8d8266"], 2.4, 1200);
      olayEkle(4, "Başkent düştü — sefer "+state.turn+". turda sona erdi.");
      drawMap();
      setTimeout(showDefeat, 500);
      return;
    }

    // Bölge hâlâ direniyorsa yıpranır; çıplak kalmışsa el değiştirir.
    var stripped = !(target.garrison>0) && defenseStructures(target).length===0;
    flashRegion(target.id);

    if(stripped){
      var gecitMi=!!target.gecit;
      target.owner="enemy";
      target.type="enemy";
      target.building=null;
      target.defenses=[];
      target.garrison=0;
      // Bölge, baskını yapan cepheye geçer — cephe hattı tutarlı kalsın diye.
      target.botId = saldiranBot ? saldiranBot.id : null;
      target.defense = clamp(power + randInt(-2,3), 3, 52);
      state.army=Math.max(0, state.army-3);
      addShake(6);
      addBurst(c.x, c.y, 34, ["#b5432f","#e0603c","#8d8266"], 2.1, 1000);
      addFloater(c.x, c.y-8, "BÖLGE DÜŞTÜ", "#e08a72");
      invalidateRoutes();
      bildir(gecitMi?4:3,
        (gecitMi?"⛰ ":"🚨 ")+target.name+" düştü — "+
        (icBaskin ? "ikmalsiz bıraktığın iç bölgeye sızdılar."
                  : "savunmasız sınır toprağı düşmanın eline geçti.")+
        (gecitMi?" Geçit elden çıktı.":""),
        gecitMi?"gecit":"kayip");
    } else {
      var lost=Math.max(1, Math.round((target.garrison||0)*0.5));
      target.garrison=Math.max(0,(target.garrison||0)-lost);
      var razed="";
      if(defenseStructures(target).length){
        if(target.defenses.length){ target.defenses.pop(); razed="tahkimat yıkıldı"; }
        else if(target.building){ razed=BUILDINGS[target.building].name+" yıkıldı"; target.building=null; }
      }
      state.gold=Math.max(0,state.gold-20);
      addShake(4);
      addBurst(c.x, c.y, 20, ["#b5432f","#8d8266","#cfc4a4"], 1.7, 800);
      addFloater(c.x, c.y-8, "-"+lost+" 🪖", "#e08a72");
      showToast("⚠️ "+atk.icon+" "+atk.name+" savunmanı deldi"+(razed?" · "+razed:"")+
        ". Bir daha vurulursa bölgeyi kaybedersin.");
    }
    drawMap();
  }

  /* Rakip artık sadece yayılmıyor, tahkim de ediyor: zamanla bölgelerine
     savunma yapısı dikiyor. Yani bugün piyadeyle aldığın bir bölge, birkaç tur
     sonra duvarlı olabilir — geciktiğin her cephe pahalılaşır. */
  function botFortify(bot, diff, owned){
    // Zor botlar daha sık ve daha çok tahkim eder.
    var chance = diff.reinforceStep*0.07;
    if(Math.random()>chance) return false;

    var cap = diff.reinforceStep>=3 ? 3 : (diff.reinforceStep>=2 ? 2 : 1);
    var adaylar=owned.filter(function(r){ return r.defenses.length<cap; });
    if(!adaylar.length) return false;

    // Önce sana komşu olan bölgeleri tahkim eder — cephe hattı önceliklidir.
    var cephe=adaylar.filter(function(r){
      var yakin=false;
      r.neighbors.forEach(function(nid){ if(regions[nid].owner==="player") yakin=true; });
      return yakin;
    });
    var hedef=(cephe.length?cephe:adaylar)[randInt(0,(cephe.length?cephe:adaylar).length-1)];

    var eksik=DEFENSIVE.filter(function(k){ return hedef.defenses.indexOf(k)<0; });
    if(!eksik.length) return false;
    var yeni=eksik[randInt(0,eksik.length-1)];
    hedef.defenses.push(yeni);
    hedef.defense=clamp(hedef.defense + Math.round((BUILDINGS[yeni].def||0)*0.5), 3, 60);

    // Yalnızca görebildiğin tahkimattan haberin olur.
    if(isScouted(hedef)){
      showToast("🏗️ Düşman "+BUILDINGS[yeni].name+" dikti — o cephe artık daha sert.");
    }
    return true;
  }

  function botTickAll(){
    if(state.gameOver || state.durakladi || animating || !bots.length) return;
    var changed=false;
    bots.forEach(function(bot){
      var diff=BOT_DIFF[bot.difficulty];
      var owned=regions.filter(function(r){ return r.botId===bot.id && r.owner==="enemy"; });
      if(!owned.length) return;

      bot.power = diff.basePower + Math.floor(owned.length/2)*diff.growthStep;

      var reinforceTarget=owned[randInt(0,owned.length-1)];
      var before=reinforceTarget.defense;
      reinforceTarget.defense=clamp(reinforceTarget.defense + Math.max(1,Math.round(diff.reinforceStep*0.6)), 3, 50);
      if(reinforceTarget.defense!==before) changed=true;

      if(botFortify(bot, diff, owned)) changed=true;

      if(Math.random()<diff.expandChance){
        var candidates=[];
        owned.forEach(function(r){
          r.neighbors.forEach(function(nid){
            var nr=regions[nid];
            if(nr.type==="empty" && nr.owner==="neutral"){ candidates.push(nr); }
          });
        });
        if(candidates.length){
          /* Phase 5: yayılma artık rastgele değil. Bot da oyunun kimliğine
             göre oynuyor — önce geçitler, sonra oyuncunun rotasını kesecek
             bölgeler, sonra sıradan toprak. Ağırlıklı seçim, sert kural değil:
             rakip okunabilir kalsın, hile yapmasın. */
          var rotaUstu={};
          workerRoutes.forEach(function(rt){
            if(rt.durum==="kesildi") return;
            rt.nodes.forEach(function(id){
              regions[id].neighbors.forEach(function(nid){ rotaUstu[nid]=true; });
            });
          });
          var puanli=candidates.map(function(c){
            var p=1;
            if(c.gecit) p+=6;              // geçit: en değerli hedef
            if(rotaUstu[c.id]) p+=3;       // oyuncunun hattını tehdit eder
            return {r:c, p:p};
          });
          var toplamP=0; puanli.forEach(function(x){ toplamP+=x.p; });
          var sec=Math.random()*toplamP, target=puanli[0].r;
          for(var pi=0; pi<puanli.length; pi++){
            sec-=puanli[pi].p;
            if(sec<=0){ target=puanli[pi].r; break; }
          }
          target.type="enemy";
          target.owner="enemy";
          target.botId=bot.id;
          // Geçit aldıysa daha sıkı tutuyor — oyuncu geri almak için bedel ödesin.
          target.defense=clamp(bot.power + randInt(-2,2) + (target.gecit?6:0), 3, 52);
          if(target.gecit) showToast("⛰ "+target.gecit.ad+" düşman eline geçti.");
          changed=true;
          invalidateRoutes();
        }
      }
    });
    if(changed) drawMap();
  }

  function startLoops(){
    state.started=true;
    state.durakladi=false;
    duraklatmaAyarla(false);
    bfStatBump("seferSayisi");
    tickTimer=setInterval(tick, LOOP.tick);
    raidTimer=setInterval(tryRaid, LOOP.raid);
    botTimer=setInterval(botTickAll, LOOP.bot);
    // Önce ekranı doldurmak için gereken asgari yakınlaşmayı kur, sonra
    // oyuncu ilk açılışta kendi başkentini aramasın diye kamerayı oraya kaydır.
    fitMapToScreen();
    if(regions[0]) centerOnAnchor(regions[0].anchor);
  }

  // Lobi #app'i gösterdiği an (display:none'dan çıktığı an) çağrılır —
  // o ana kadar mapWrap'in kutusu 0x0 olduğundan fitMapToScreen()'in daha
  // erken çalışması bir işe yaramaz.
  window.__bfOnShow=function(){ fitMapToScreen(); };

  /* Lobinin harekât haritası için salt-okunur veri. Boyama işini lobby.js
     yapıyor — motor yalnızca ham gerçeği veriyor (ızgara ölçüsü, kara
     pikselleri, iki başkentin adı ve yeri). Böylece lobinin görsel dili
     değiştiğinde game.js'e hiç dokunmak gerekmiyor; bu, çizimin burada
     durduğu eski __bfPaintMiniMap'in yerini alıyor.
     landPixelsList ve anchor'lar generateWorld() ile sayfa yüklenirken
     hazırlandığından lobi ilk karesinde bile doğru haritayı çizebilir. */
  window.__bfLobbyData=function(){
    if(!landPixelsList.length) return null;
    function ozet(r){
      return r ? {id:r.id, name:r.name, x:r.anchor.x, y:r.anchor.y} : null;
    }
    return {
      gridW:GRID_W, gridH:GRID_H,
      geo:{lon0:GEO.lon0, lon1:GEO.lon1, lat0:GEO.lat0, lat1:GEO.lat1},  // gerçek enlem/boylam çerçevesi
      /* Kıyı çizgisi ham poligon olarak: lobi haritayı piksel ızgarasından
         değil bu vektörden çiziyor, böylece köşeli değil temiz çıkıyor.
         Oyun ekranı piksel görünümünü kasten koruyor — bu yalnızca lobi için. */
      sinirlar:{anadolu:ANATOLIA, trakya:THRACE, goller:LAKES},
      land:landPixelsList,                 // {x,y,isBorder,...} — okumak için
      ilSayisi:REGION_COUNT,
      botSayisi:bots.length,
      baskent:ozet(regions[0]),            // oyuncunun karargâhı
      hedef:ozet(regions[1]),              // düşman başkenti (klasik mod hedefi)
      gecitler:GECITLER.map(function(g){
        var r = g.regionId>=0 ? regions[g.regionId] : null;
        return {ad:g.ad, kisa:g.kisa, x:g.gx, y:g.gy, lat:g.lat, lon:g.lon, il:r?r.name:null};
      })
    };
  };

  /* ================= Modals ================= */
  var modalOverlay=document.getElementById("modal-overlay");
  var modalBox=document.getElementById("modal-box");

  function showInstructions(isFirstTime){
    modalBox.className="modal-box";
    modalBox.innerHTML =
      "<h2>Nasıl Oynanır?</h2>"+
      "<div class='legend-row'><span class='lic'>🟩</span><span><b>Boş bölge</b> — altın karşılığı ele geçirilir.</span></div>"+
      "<div class='legend-row'><span class='lic'>⚒️🚜🪓</span><span><b>Kaynak bölgesi</b> — maden, tarım veya orman olabilir; ele geçirince otomatik bina kurulur ve kalıcı olarak altın üretmeye devam eder.</span></div>"+
      "<div class='legend-row'><span class='lic'>🪖</span><span><b>Düşman karakolu</b> — saldırırken hem kaç asker göndereceğini hem <b>hangi saldırı tipini</b> kullanacağını sen seçersin. Yetersiz gönderirsen saldırı başarısız olur ama garnizonu zayıflatırsın.</span></div>"+
      "<hr>"+
      "<div class='legend-row'><span class='lic'>🧠</span><span><b>Asıl mesele burada:</b> her bölgenin tahkimatı farklı saldırıya farklı tepki verir. Yanlış tipi seçersen aynı bölge için <b>üç katı asker</b> harcarsın.</span></div>"+
      "<div class='legend-row'><span class='lic'>⚔️</span><span><b>Piyade Taarruzu</b> — bedava. Ama <b>Duvar ×1.8</b> ve <b>Tüfek Mevzisi ×1.5</b> savunmayı katlar. Tahkimatsız hedefler için.</span></div>"+
      "<div class='legend-row'><span class='lic'>💣</span><span><b>Topçu Barajı</b> — 40💰, kendi <b>Fabrika</b>nı gerektirir. <b>Duvarı tamamen etkisiz kılar</b> ve fethedince yıkar. Bedeli: ganimetin yarısı kül olur.</span></div>"+
      "<div class='legend-row'><span class='lic'>🛩️</span><span><b>Hava Akını</b> — 60💰, kendi <b>Fabrika</b>nı gerektirir. Duvarın ve siperin <b>üstünden uçar</b>, ganimete zarar vermez. Ama <b>Hava Savunması ×2.4</b> ile karşılaşırsa ordunu kaybedersin.</span></div>"+
      "<div class='legend-row'><span class='lic'>☢️</span><span><b>Nükleer füzeler</b> — alt tepsideki kırmızı bölümde. Kartı sürükleyip <b>haritada istediğin bölgeye</b> bırak; komşuluk şartı yoktur, menzil serbesttir. Üç başlık üç farklı patlama alanı demek: <b>Taktik</b> tek bölge, <b>Stratejik</b> hedef + komşuları, <b>Termonükleer</b> iki halka. Sürüklerken alan haritada kırmızı boyanır.</span></div>"+
      "<div class='legend-row'><span class='lic'>🔥</span><span><b>Füze ne yapar</b> — bölgeyi <em>ele geçirmez</em>, yakar: garnizonu eritir, tahkimatı yıkar ve toprağı "+SCORCH_TURNS+" tur üretimsiz bırakır. <b>Kent</b> binası gerektirir. Dağlar patlamayı keser — ve alana giren <b>kendi bölgelerin de yanar</b>, o yüzden sürüklerken çıkan uyarıya bak.</span></div>"+
      "<div class='legend-row'><span class='lic'>🛡️</span><span><b>SAM önlemesi</b> — düşmanın <b>Hava Savunması</b> aynı zamanda füze kalkanıdır. Hedefin kendisinde ya da komşusunda bir SAM varsa füzen havada vurulur; ama SAM bu işte <b>tükenir</b>, yani ikinci füzen geçer. <b>Termonükleer</b> tek SAM'i doyurur — onu durdurmak için iki SAM gerekir. Sürüklerken kaç SAM olduğunu görürsün, kör atış yapmazsın.</span></div>"+
      "<div class='legend-row'><span class='lic'>📊</span><span><b>Saldırı oranı</b> — kaç asker göndereceğini sayıyla değil <b>yüzdeyle</b> seçersin. Ordun büyüdükçe aynı oran daha çok asker demek. \"Tam yetecek\" düğmesi, seçtiğin saldırı tipi için gereken en düşük oranı bulur.</span></div>"+
      "<div class='legend-row'><span class='lic'>👥</span><span><b>Asker tavanı</b> — HUD'da <b>asker/tavan</b> olarak görünür. Tavan fethettiğin toprakla ve <b>Kent</b>lerle yükselir; tavana yaklaştıkça üretim yavaşlar. Sonsuz yığınak yok: daha büyük ordu için ya toprak ya Kent.</span></div>"+
      "<div class='legend-row'><span class='lic'>🚚</span><span><b>Ticaret geliri</b> — işleyen her Fabrika–Kent konvoy hattı tur başına <b>+4 altın</b> getirir. Hattın ucundaki bölge nükleer vurulursa konvoy durur ve gelir kesilir.</span></div>"+
      "<div class='legend-row'><span class='lic'>❓</span><span><b>Keşif</b> — bir bölgenin tahkimatını ancak <b>sınırına dayandığında</b> görebilirsin. Uzaktaki bölgeye körlemesine saldırmak kumardır; genişleme sıran da bir karardır.</span></div>"+
      "<div class='legend-row'><span class='lic'>🪖</span><span><b>Takviye gönder</b> — kendi bölgene dokunup ordundan asker aktarabilirsin. Garnizonu güçlenen bölge baskınları daha kolay atlatır; boş bırakılan sınır bölgesi zamanla düşer. <b>Başkentin de dahil</b> — orası düşerse sefer biter.</span></div>"+
      "<hr>"+
      "<div class='legend-row'><span class='lic'>🧭</span><span><b>Kuşatma</b> — bir bölgeye <em>kaç komşundan</em> dayandığın savaşı etkiler. Tek cepheden saldırmak normal; iki komşundan birden dayanırsan savunma <b>×0.82</b>'ye, üçten <b>×0.68</b>'e düşer. Saldırmadan önce çevresini almak bilinçli bir yol olur.</span></div>"+
      "<div class='legend-row'><span class='lic'>⛰️</span><span><b>Dağlık arazi</b> — bir bölgenin dağ komşuları arttıkça savunması güçlenir (her dağ +%10, tavan +%30). Doğu illeri bu yüzden gerçekten zor: yaklaşma yolu az, savunan dar geçidi tutar.</span></div>"+
      "<hr>"+
      "<div class='legend-row'><span class='lic'>⛰️🌊</span><span><b>Dağ / deniz</b> — geçilemez, etrafından dolaşman gerekir.</span></div>"+
      "<div class='legend-row'><span class='lic'>👑</span><span><b>Düşman başkenti</b> — ele geçirirsen oyunu kazanırsın!</span></div>"+
      "<hr>"+
      "<div class='legend-row'><span class='lic'>⚔️</span><span>Bir bölgeyi fethettiğinde cephe hattı, sınırından başlayıp bölgenin içine <b>pixel pixel</b> yayılır.</span></div>"+
      "<div class='legend-row'><span class='lic'>📈</span><span>Bölge sayın arttıkça asker üretim hızın da otomatik olarak artar.</span></div>"+
      "<div class='legend-row'><span class='lic'>🤖</span><span>Haritada kolay / orta / zor seviyesinde <b>3 düşman botu</b> var. Zamanla boş toprakları ele geçirip güçlenirler — ama asla maden/tarım/orman bölgelerine dokunmazlar, o bölgeler her zaman sana açık kalır.</span></div>"+
      "<div class='legend-row'><span class='lic'>👆</span><span>Alttaki <b>bina panelinden</b> bir kartı basılı tutup kendi bölgene sürükle ve bırak — inşaat orada başlar.</span></div>"+
      "<div class='legend-row'><span class='lic'>🛡️</span><span><b>Savunman da aynı kurala tabi.</b> Düşman baskınları da üç tipten birini seçer ve zamanla <b>senin zayıf noktanı bulmakta ustalaşır</b>. Bir bölgeye tek bina kurabildiğin için asıl soru şu: hangi sınırı neyle kapatacaksın? Her yere aynı binayı dikersen düşman onu aşan tipi bulur.</span></div>"+
      "<div class='legend-row'><span class='lic'>🏭</span><span><b>Fabrika saldırı kapısı da açar</b> — Fabrikan yoksa ne Topçu Barajı ne Hava Akını yapabilirsin. Sadece piyadeyle kalırsın, yani her duvar sana ×1.8 olur. Ekonomi binası aynı zamanda taarruz yatırımıdır.</span></div>"+
      "<div class='legend-row'><span class='lic'>🏭🏙️</span><span><b>Fabrika / Kent</b> — altın ve asker üretimini artırır. İkisine birden sahipsen aralarında <b>işçi konvoyu</b> işlemeye başlar; hat haritada görünür. Nükleer vurulan bölgeye giden hat, toprak soğuyana kadar durur.</span></div>"+
      "<div class='legend-row'><span class='lic'>🏗️</span><span><b>Rakip de ilerler</b> — botlar sadece boş toprağa yayılmakla kalmaz, zamanla bölgelerine <b>savunma yapısı diker</b> ve önce sana komşu olan cepheleri tahkim eder. Bugün piyadeyle alabildiğin bir bölge, birkaç tur sonra duvarlı olabilir: geciktiğin her cephe pahalılaşır.</span></div>"+
      "<button id='start-btn'>"+(isFirstTime?"Anladım, Başla":"Kapat")+"</button>";
    modalOverlay.classList.add("show");
    if(!isFirstTime) modalDuraklat();
    document.getElementById("start-btn").addEventListener("click", function(){
      modalOverlay.classList.remove("show");
      if(isFirstTime) startLoops();
      else modalDevam();
    });
  }

  /* Madde 28: sadece "KAZANDIN" değil, kısa bir sefer raporu. Oyuncu
     "nasıl oynadım?" sorusunun cevabını görsün — ama istatistik tablosu değil,
     beş satır. */
  function seferRaporu(){
    var gd=gecitDurumu(), rd=rotaDurumu(), ik=genelIkmal();
    var bolge=regions.filter(function(r){ return r.owner==="player"; }).length;
    var askeri = state.fetih>=25 ? "Yüksek" : (state.fetih>=10 ? "Orta" : "Düşük");
    var sat=function(k,v){
      return "<div class='stat-row'><span>"+k+"</span><b>"+v+"</b></div>";
    };
    return "<div style='margin:14px 0 4px;text-align:left'>"+
      sat("Geçitler", gd.tut+" / "+gd.toplam)+
      sat("Kontrol edilen bölge", bolge+" il")+
      sat("Ticaret geliri", "+"+state.ticaret+(state.konvoyKaybi?" (−"+state.konvoyKaybi+" baskın)":""))+
      sat("Askerî başarı", askeri+" · "+state.fetih+" fetih")+
      sat("İkmal", "%"+ik)+
      sat("Süre", state.turn+" tur")+
    "</div>";
  }

  function showDefeat(){
    state.gameOver=true;
    clearInterval(tickTimer); clearInterval(raidTimer); clearInterval(botTimer);
    modalBox.className="modal-box defeat";
    modalBox.innerHTML =
      "<div class='big'>🏳️💥</div>"+
      "<h2>Başkentin Düştü</h2>"+
      "<div class='sheet-sub' style='margin-bottom:0;color:var(--text-dim)'>"+
        state.turn+" tur dayandın. Sınır bölgelerini savunmasız bırakmak pahalıya patladı — "+
        "tahkimat kurmadığın her cephe düşmanın giriş kapısıydı.</div>"+
      seferRaporu()+
      "<button id='restart-btn'>Tekrar Dene</button>";
    modalOverlay.classList.add("show");
    document.getElementById("restart-btn").addEventListener("click", function(){
      location.reload();
    });
  }

  function showVictory(){
    state.gameOver=true;
    bfStatBump("kazanildi");
    clearInterval(tickTimer); clearInterval(raidTimer); clearInterval(botTimer);
    modalBox.className="modal-box victory";
    modalBox.innerHTML =
      "<div class='big'>🎉👑</div>"+
      "<h2>Zaferi Kazandın!</h2>"+
      "<div class='sheet-sub' style='margin-bottom:0;color:var(--text-dim)'>"+
        ((MODES[activeMode]||{}).hedef||{}).tip==="gecit"
          ? "Anadolu geçiş ağının çoğunluğu kontrol altında."
          : ("Düşman başkentini "+state.turn+" turda fethettin.")+"</div>"+
      seferRaporu()+
      "<button id='restart-btn'>Tekrar Oyna</button>";
    modalOverlay.classList.add("show");
    document.getElementById("restart-btn").addEventListener("click", function(){
      location.reload();
    });
  }

  document.getElementById("info-btn").addEventListener("click", function(){
    if(!state.started) return;
    showInstructions(false);
  });

  /* ---- Otomatik duraklatma ----
     Yardım, çıkış onayı gibi okuma gerektiren katmanlar açıkken saatler
     durur. Oyuncunun kuralları okurken baskın yemesi tasarım değil kazadır.
     Katman kapanınca yalnızca OTOMATİK duraklatılmışsa devam edilir; oyuncu
     kendisi duraklattıysa duraklatma korunur. */
  var otoDuraklatildi=false;
  function modalDuraklat(){
    if(state.gameOver || state.durakladi) return;
    otoDuraklatildi=true;
    state.durakladi=true;
    var el=document.getElementById("pause-flag");
    if(el) el.hidden=false;
  }
  function modalDevam(){
    if(!otoDuraklatildi) return;
    otoDuraklatildi=false;
    duraklatmaAyarla(false);
  }

  var pauseBtn=document.getElementById("pause-btn");
  if(pauseBtn){
    pauseBtn.addEventListener("click", function(){
      if(!state.started) return;
      otoDuraklatildi=false;
      duraklatmaCevir();
    });
  }

  /* ---- Klavye ----
     Şartname §06'daki girdi haritasının bu fazda uygulanabilen kısmı.
     Harita gezinme (ok tuşları) Faz 11'de eklenecek. */
  document.addEventListener("keydown", function(e){
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    var hedef=e.target;
    if(hedef && (hedef.tagName==="INPUT" || hedef.tagName==="TEXTAREA")) return;
    var k=e.key;
    if(k==="p" || k==="P"){
      if(!state.started || state.gameOver) return;
      e.preventDefault(); otoDuraklatildi=false; duraklatmaCevir();
    } else if(k==="?" || k==="F1"){
      if(!state.started || state.gameOver) return;
      e.preventDefault(); showInstructions(false);
    } else if(k==="Escape"){
      if(sheet && sheet.classList.contains("open")) closeSheet();
      else if(menuSheet && menuSheet.classList.contains("open")) closeMenuSheet();
    }
  });

  /* ================= Alt sekme çubuğu =================
     Kart tepsisinin yerini alan kompakt HUD: Harita (varsayılan) / Ordu /
     Şehirler / Diplomasi / Menü. Menü, bina-füze kartlarını içeren paneli
     açar; diğerleri mevcut sheet mekanizmasını (openSheet) yeniden kullanan
     salt-bilgi ekranları — hiçbiri yeni bir gameplay sistemi icat etmiyor. */
  var bottombar=document.getElementById("bottombar");
  var menuSheet=document.getElementById("menu-sheet");

  var hudBottom=document.getElementById("hud-bottom");
  function setActiveTab(key){
    bottombar.querySelectorAll(".bb-tab").forEach(function(b){
      b.classList.toggle("active", b.dataset.bb===key);
    });
  }
  function closeMenuSheet(){
    menuSheet.classList.remove("open");
    hudBottom.style.opacity="";
    hudBottom.style.pointerEvents="";
  }

  function openArmySheet(){
    var uretim=0;
    regions.forEach(function(r){
      if(r.owner==="player" && r.building && BUILDINGS[r.building].army && !isScorched(r)) uretim+=BUILDINGS[r.building].army;
    });
    var html=
      "<div class='stat-row'><span>Mevcut ordu</span><b>"+state.army+"</b></div>"+
      "<div class='stat-row'><span>Asker tavanı</span><b>"+state.maxArmy+"</b></div>"+
      "<div class='stat-row'><span>Bina üretimi / tur</span><b>+"+uretim+"</b></div>"+
      "<div class='stat-row'><span>Altın / tur</span><b>"+state.gold+"</b></div>";
    openSheet("🪖","Ordu","", html+"<button class='action-btn' id='bb-sheet-close'><span><span class='a-name'>Kapat</span></span></button>");
    document.getElementById("bb-sheet-close").addEventListener("click", closeSheet);
  }

  function openCitiesSheet(){
    var owned=regions.filter(function(r){ return r.owner==="player"; });
    var html=owned.map(function(r){
      var bina = r.building ? BUILDINGS[r.building].name : (r.type==="capital" ? "Başkent" : "—");
      return "<button class='action-btn' data-rid='"+r.id+"'><span><span class='a-name'>"+r.name+"</span>"+
        "<span class='a-desc'>"+bina+"</span></span></button>";
    }).join("");
    openSheet("🏙️","Şehirler", owned.length+" bölge senin kontrolünde", html);
    document.querySelectorAll("#sheet-actions [data-rid]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var r=regions[parseInt(btn.dataset.rid,10)];
        closeSheet();
        if(r) centerOnAnchor(r.anchor);
      });
    });
  }

  bottombar.addEventListener("click", function(e){
    var btn=e.target.closest(".bb-tab");
    if(!btn) return;
    var key=btn.dataset.bb;
    if(key==="menu"){
      var willOpen=!menuSheet.classList.contains("open");
      menuSheet.classList.toggle("open", willOpen);
      setActiveTab(willOpen ? "menu" : "map");
      // Menü açıkken "Bölge Kontrolü" şeridi tepsiyle çakışıyor, geçici gizle.
      hudBottom.style.opacity=willOpen ? "0" : "";
      hudBottom.style.pointerEvents=willOpen ? "none" : "";
      return;
    }
    closeMenuSheet();
    setActiveTab(key);
    if(key==="army") openArmySheet();
    else if(key==="cities") openCitiesSheet();
    else if(key==="diplomacy") showToast("🤝 Diplomasi sistemi henüz yok — yakında.");
  });

  /* Sefer sırasında lobiye dönüş. Yeniden başlatma zaten location.reload()
     ile çalışıyor (bkz. yenilgi/zafer modalları) ve lobi sayfanın açılış
     ekranı olduğu için çıkış da aynı yolu kullanıyor: yarım sıfırlanmış bir
     dünya bırakmaktansa temiz bir harita üretmek daha güvenli. Fetih
     sayaçları localStorage'da olduğu için günlük kaybolmuyor. */
  function confirmQuit(){
    closeMenuSheet();
    modalBox.className="modal-box";
    modalBox.innerHTML =
      "<h2>Seferden çık</h2>"+
      "<p class='quit-note'>Lobiye döneceksin. Bu seferin ilerlemesi kaydedilmez — "+
      "yeni sefer sıfırdan üretilen bir haritada başlar. Sefer günlüğündeki "+
      "toplamların yerinde kalır.</p>"+
      "<button id='quit-yes'>Evet, seferden çık</button>"+
      "<button id='quit-no'>Vazgeç</button>";
    modalOverlay.classList.add("show");
    modalDuraklat();
    document.getElementById("quit-yes").addEventListener("click", function(){
      clearInterval(tickTimer); clearInterval(raidTimer); clearInterval(botTimer);
      location.reload();
    });
    document.getElementById("quit-no").addEventListener("click", function(){
      modalOverlay.classList.remove("show");
      modalDevam();
    });
  }
  document.getElementById("menu-quit").addEventListener("click", confirmQuit);
  document.getElementById("menu-help").addEventListener("click", function(){
    closeMenuSheet();
    showInstructions(false);
  });

  /* ================= Init ================= */
  generateWorld();
  drawMap();
  renderBuildTray();
  // Talimat modalı artık sayfa yüklenir yüklenmez değil, oyuncu açılış
  // ekranından "Seferi Başlat"a bastığında açılıyor (bkz. lobby.js) —
  // #modal-overlay artık #app'in dışında (mağaza da kullanıyor), o yüzden
  // #app gizliyken otomatik gösterilirse açılış ekranının üstüne biner.
  /* Lobi mod kartlarını buradan doldurur; "3 ORDU · ZOR" gibi satırlar
     uydurma değil, aşağıdaki gerçek ayarların özeti. */
  window.__bfModes=function(){
    return Object.keys(MODES).map(function(k){
      var m=MODES[k];
      // Mod sabit dağılım dayatmıyorsa (bots:null) haritada gerçekten atanmış
      // olan bot zorlukları okunuyor — uydurma bir liste değil.
      var keys = m.bots ? m.bots.slice() : bots.map(function(b){ return b.difficulty; });
      var zorluk = m.bots ? m.bots.map(function(d){ return BOT_DIFF[d].label; }).join(" · ") : "Karışık";
      var foes = keys.map(function(d, i){
        return {ad:"CEPHE "+String.fromCharCode(65+i), zorluk:BOT_DIFF[d].label, renk:BOT_COLORS[d], guc:BOT_DIFF[d].basePower};
      });
      return {
        foes:foes,
        key:k, name:m.name, tag:m.tag, desc:m.desc, active:(k===activeMode),
        hedef:m.hedef||{tip:"baskent"},
        stats:[
          {k:"Cephe",  v:REGION_COUNT+" il"},
          {k:"Rakip",  v:(m.bots?m.bots.length:3)+" ordu · "+zorluk},
          {k:"Tempo",  v:(2000/m.tick).toFixed(m.tick===2000?0:1).replace(".",",")+"× hız"},
          {k:"Açılış", v:m.gold+" altın"}
        ]
      };
    });
  };
  window.__bfSetMode=function(key){
    var m=MODES[key];
    if(!m || state.started) return false;
    activeMode=key;
    LOOP.tick=m.tick; LOOP.raid=m.raid; LOOP.bot=m.bot;
    state.gold=m.gold;
    // Botların zorluğu generateWorld() sırasında rastgele atanmıştı; mod
    // sabit bir dağılım istiyorsa burada üzerine yazılıyor.
    if(m.bots){
      bots.forEach(function(b,i){
        var d=m.bots[i % m.bots.length];
        b.difficulty=d; b.power=BOT_DIFF[d].basePower;
      });
    }
    drawMap();                        // HUD'daki altın ve skorbord tazelensin
    return true;
  };

  /* ================= Test dikişi =================
     Kural katmanı DOM'a bağlı olmadığı için başsız koşulabiliyor; bu nesne
     testlerin motora tek giriş noktası. Oyun akışını değiştirmez, yalnızca
     okunur referans verir (şartname §20). */
  window.__bfTest={
    state:state, regions:regions, bots:bots,
    MODES:MODES, BUILDINGS:BUILDINGS, ATTACKS:ATTACKS, NUKES:NUKES, GECITLER:GECITLER,
    sabitler:{MIN_TAARRUZ:MIN_TAARRUZ, BAKIM_BOLEN:BAKIM_BOLEN,
              GECIT_TUTMA:GECIT_TUTMA, IKMAL_ADIM:IKMAL_ADIM, IKMAL_TABAN:IKMAL_TABAN,
              ROTA_GELIR:ROTA_GELIR, GECIT_GELIR:GECIT_GELIR,
              KESIF_BEDEL:KESIF_BEDEL, KESIF_SURE:KESIF_SURE},
    defenseAgainst:defenseAgainst, taarruzEsigi:taarruzEsigi,
    cepheAnalizi:cepheAnalizi, effectiveDefense:effectiveDefense,
    hesaplaIkmal:hesaplaIkmal, rotaDurumu:rotaDurumu, genelIkmal:genelIkmal,
    gecitDurumu:gecitDurumu, gecitZaferKontrol:gecitZaferKontrol,
    baskinGucu:baskinGucu, baskinHedefleri:baskinHedefleri,
    saldirabilecekBotlar:saldirabilecekBotlar,
    tick:tick, tryRaid:tryRaid, botTickAll:botTickAll,
    tryBuild:tryBuild, tryReinforce:tryReinforce, launchNuke:launchNuke,
    invalidateRoutes:invalidateRoutes, drawMap:drawMap,
    bildir:bildir, olaylar:function(){ return state.olaylar; },
    modAyarla:function(k){ return window.__bfSetMode(k); }
  };

  window.__bfShowInstructions=function(){ showInstructions(true); };
  // Lobiden okunan brifing: isFirstTime=false olduğu için kapatınca oyun
  // döngülerini BAŞLATMAZ — oyuncu sefere girmeden kuralları okuyabilsin diye.
  window.__bfShowBriefing=function(){ showInstructions(false); };

})();

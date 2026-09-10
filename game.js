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
    selected:[112,172,232],
    /* Katman renkleri (şartname §10). Sahiplik dışındaki katmanlarda harita
       tek bir soruyu cevaplar; geri kalan her şey solgunlaşır. */
    solgun:[42,46,52],
    ikmalIyi:[54,104,76], ikmalOrta:[132,112,50], ikmalKotu:[142,58,48],
    rotaUstu:[150,120,52], rotaRiskli:[150,86,52],
    gecitBenim:[64,116,168], gecitDusman:[148,58,58], gecitBos:[104,104,110],
    tehditYuksek:[168,76,48], tehditOrta:[146,116,56], tehditYok:[58,74,96]
  };

  /* Binaların açıklaması artık elle yazılmıyor: aşağıdaki sayılardan ve
     ATTACKS tablosundan türetiliyor (bkz. binaAciklama). Bir denge sabiti
     değiştiğinde tepsi, panel, yardım ekranı ve ipuçları birlikte doğru
     kalıyor — şartname §05, tek doğruluk kaynağı. */
  var BUILDINGS={
    tufek:{name:"Tüfek Mevzisi", cost:30, def:5},
    duvar:{name:"Duvar", cost:65, def:8},
    hava:{name:"Hava Savunması", cost:130, def:14, sam:true},
    fabrika:{name:"Fabrika", cost:70, gold:4},
    kent:{name:"Kent", cost:140, gold:2, army:2, popCap:35},
    silo:{name:"Füze Silosu", cost:160}
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
    /* ---- Harita nişanları ----
       Emoji yerine çizim: emoji her platformda farklı görünüyor ve renkli
       gliflerle oyunun piksel/pafta estetiğini bozuyordu. Bu semboller de
       aynı birim kare kaleminden geçiyor, yani her ölçekte aynı netlikte. */
    kale:function(p){                                   // kendi başkentin
      p.poly([.12,.42, .12,.26, .26,.26, .26,.36, .40,.36, .40,.24,
              .60,.24, .60,.36, .74,.36, .74,.26, .88,.26, .88,.42]);
      p.rect(.12,.42,.76,.42);
      p.rect(.42,.60,.16,.24);                          // kapı
      p.line(.12,.58,.88,.58);                          // taş sırası
    },
    tac:function(p){                                    // düşman başkenti
      p.poly([.12,.72, .12,.34, .30,.52, .50,.24, .70,.52, .88,.34, .88,.72]);
      p.rect(.12,.72,.76,.14);
      p.dot(.50,.38,.05);
    },
    dag:function(p){                                    // geçilmez arazi
      p.poly([.06,.82, .34,.30, .52,.58, .62,.44, .94,.82]);
      p.poly([.26,.48, .34,.30, .42,.48]);              // kar hattı
      p.line(.06,.82,.94,.82);
    },
    maden:function(p){
      p.line(.22,.74,.66,.30);                          // kazma sapı
      p.arc(.66,.30,.22, Math.PI*1.05, Math.PI*1.95);   // kazma başı
      p.poly([.16,.86, .34,.62, .54,.86]);              // cevher yığını
    },
    tarim:function(p){
      p.line(.50,.88,.50,.28);                          // sap
      p.arc(.38,.44,.16, Math.PI*1.6, Math.PI*2.4);     // başak solu
      p.arc(.62,.44,.16, Math.PI*0.6, Math.PI*1.4);     // başak sağı
      p.line(.20,.88,.80,.88);                          // tarla
    },
    orman:function(p){
      p.poly([.50,.16, .24,.54, .76,.54]);
      p.poly([.50,.36, .18,.76, .82,.76]);
      p.rect(.44,.76,.12,.12);                          // gövde
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
      desc:"Bedava ama kaba. Tahkimatsız hedefler için."
    },
    bombardiman:{
      name:"Topçu Barajı", icon:"💣", gold:40, requires:"fabrika",
      lootMult:0.45, garrisonMult:0.5, softenMult:1.2,
      bypass:["duvar"], vs:{tufek:1.15}, destroys:"duvar",
      desc:"Duvarı yerle bir eder, ama bölgeyi de harap eder."
    },
    akin:{
      name:"Hava Akını", icon:"🛩️", gold:60, requires:"fabrika",
      lootMult:1.0, garrisonMult:0.6, softenMult:1.5,
      bypass:["duvar","tufek"], vs:{hava:2.4},
      desc:"Duvarın ve siperin üstünden uçar. Hava savunmasına yakalanırsa felaket."
    }
  };
  var ATTACK_KEYS=Object.keys(ATTACKS);

  /* Nükleer saldırılar. Konvansiyonel saldırılardan farklı bir kategoridir:
     bölge ele geçirmez, sadece yakar. Üçünü ayıran şey patlama alanı —
     halka sayısı arttıkça daha çok bölgeye ulaşır ama kendi toprağın da
     alana girebilir. Dağlar patlamayı keser. */
  var NUKES={
    taktik:{ name:"Taktik Başlık", cost:170, rings:0, power:0.55,
      desc:"Cerrahi darbe: sınırdaki sert bir karakolu yumuşatmak için." },
    stratejik:{ name:"Stratejik Başlık", cost:310, rings:1, power:0.70,
      desc:"Hedefi ve çevresini birlikte vurur." },
    termo:{ name:"Termonükleer", cost:520, rings:2, power:0.85,
      desc:"En yıkıcısı — kendi toprağın da alana girebilir." }
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
  var KAYNAK_SEMBOL={maden:"maden", tarim:"tarim", odun:"orman"};

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

  /* Lobiden gelen sefer ayarları. Sahte seçenek yok: burada değişen her
     şeyin haritada gerçek bir karşılığı var (şartname B26). */
  var BOT_SAYISI=3;              // 2–4
  var ZORLUK_SECIMI=null;        // null = karışık, ya da ["orta","zor",...]
  var ZORLUK_KALIP={
    karisik:null,
    dengeli:["kolay","orta","zor"],
    sert:["orta","zor","zor"],
    amansiz:["zor","zor","zor"]
  };

  /* ================= KOMUTANLAR =================
     Anlatı katmanı (şartname §13). Üç rakip; her biri bir bot zorluğuna ve
     bir davranış imzasına bağlı. Amaç oyunu RPG'ye çevirmek değil, cepheye
     bir yüz vermek: oyuncu "orta bot" ile değil, rotasını hedefleyen
     Kervanbaşı ile savaştığını bilsin. Metin bütçesi dar tutuluyor. */
  var KOMUTANLAR={
    /* Ağırlıklar yalnızca metinde kalan bir kişilik tarifi değil: botTickAll
       hedef seçerken tam olarak bu sayıları kullanıyor. Kişilik ile davranış
       ayrışamaz — oyuncu Demirkapı'nın geçide gittiğini haritada görür. */
    zor:  {ad:"Demirkapı", unvan:"Geçit Beyi",
           doktrin:"Kapıyı tutan, şehri tutar.",
           imza:"Geçitlere yönelir, aldığını tahkim eder, geri adım atmaz.",
           gecitAgirlik:10, rotaAgirlik:2, tahkimCarpan:1.5, ateskesCarpan:1.3},
    orta: {ad:"Kervanbaşı", unvan:"Yol Emiri",
           doktrin:"Ordu yürür, para koşar.",
           imza:"Ticaret hattını hedefler; ateşkese en açık olan odur.",
           gecitAgirlik:3, rotaAgirlik:8, tahkimCarpan:1.0, ateskesCarpan:0.7},
    kolay:{ad:"Yel", unvan:"Akıncı",
           doktrin:"Hazırlanana kadar iş biter.",
           imza:"Hızlı yayılır, tahkimatı zayıftır, erken baskın yapar.",
           gecitAgirlik:2, rotaAgirlik:3, tahkimCarpan:0.6, ateskesCarpan:1.0}
  };
  function komutan(bot){
    return (bot && KOMUTANLAR[bot.difficulty]) || KOMUTANLAR.orta;
  }
  function cepheAdi(bot){ return komutan(bot).ad+" Cephesi"; }
  var BOSS_COLOR="#82283a";

  /* ================= Denge sabitleri (v0.2) =================
     Üçü de tek bir sorunu çözüyor: eski sürümde oyun ne sömürüye kapalıydı
     ne de kaybedilebilirdi.
       MIN_TAARRUZ  — 1 askerle sonsuz aşındırma sömürüsünü kapatır.
       BAKIM_BOLEN  — altın biriktirmenin bedeli olur; "bekle ve büyü" biter.
       GECIT_TUTMA  — geçit zaferi anlık değil, tutmaya dayalı hale gelir. */
  var MIN_TAARRUZ=0.20;          // hedefin etkin savunmasının en az %20'si
  /* Konum çarpanları da artık sabit: yardım ekranı ve ipuçları bu tablodan
     okuyor, yani metin ile matematik ayrışamıyor. */
  var KUSATMA=[1, 1, 0.82, 0.68, 0.58];   // 0,1,2,3,4+ cephe
  var ARAZI_ADIM=0.10, ARAZI_TAVAN=0.30;  // dağ komşusu başına / tavan
  var TAVAN_TABAN=40, TAVAN_IL=4;         // asker tavanı: taban + il başına
  var BASKENT_ALTIN=5, BASKENT_ASKER=2;   // başkentin sabit üretimi
  /* Başkentin doğuştan surları var: ölçümde ilk baskının seferi 1. turda
     bitirebildiği görüldü. Başkent artık kendiliğinden dirençli ve açılış
     garnizonuyla başlıyor — ama bakımı yapılmazsa yine düşer. */
  var BASKENT_SAVUNMA=10, BASKENT_GARNIZON=8;
  var GENISLEME_BOLEN=4;                  // her N il başına +1 asker/tur
  var PUSKURTME_ODUL=8;                   // baskını püskürtünce kazanılan altın
  var BAKIM_BOLEN=8;             // ordu bakımı = ceil(ordu / 8) altın/tur
  /* İdari gider: geniş toprak kendi başına pahalıdır. Ölçümde görüldü ki
     bu olmadan en iyi strateji haritayı süpürmek oluyordu — oyunun tezine
     ("toprağı değil geçişi tut") doğrudan aykırı. Artık her dört il bir
     altın/tur yönetim gideri getiriyor: geniş imparatorluk kârlı olmak için
     GERÇEKTEN üretmek zorunda. */
  var IDARI_BOLEN=4;
  /* Ganimet çarpanı: fethin kendini finanse etme oranı. Ölçümde 2,5 ile
     savaşın tamamen kendi kendini beslediği ve haritayı süpürmenin en iyi
     strateji olduğu görüldü. Tek yerde duruyor ki denge ayarı kod
     değiştirmeden yapılabilsin. */
  var GANIMET_CARPAN=1.4;
  /* Tutma süresi ölçümle ayarlandı: 8 turda sefer çok kısa bitiyordu.
     12 tur, botların geçide karşı hamle yapmasına yetecek kadar uzun. */
  var GECIT_TUTMA=12;            // geçit hedefini kaç tur tutmak gerekir
  var BASKENT_KAYIP=0.6;         // başkent kuşatmasında eriyen garnizon oranı

  /* ================= Sefer modları =================
     Lobideki kartlar süs değil: her biri gerçekten motoru değiştiriyor —
     botların zorluğu, tur/baskın/bot saatlerinin hızı ve açılış altını.
     Kurallar burada duruyor (motorun işi), lobi yalnızca okuyup gösteriyor. */
  var MODES={
    gecit:{
      name:"Geçit", tag:"YENİ",
      desc:"4/6 geçidi kontrol et. Rotanı koru, rakibin ikmalini kes.",
      /* Başkent (İstanbul) zaten İstanbul Boğazı'nı tutuyor: oyuncu sefere
         bir geçitle başlıyor ve onun vergisini alıyor. Hedef bu yüzden 5 —
         yani gerçekten kazanılması gereken dört geçit var. */
      hedef:{tip:"gecit", gerek:5, tut:GECIT_TUTMA},
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
             sonUretim:0, sonBakim:0, sonGelir:0, sonIdari:0, sonVergi:0, bakimToplam:0, sonrakiBaskin:0,
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

  /* ================= HARİTA KATMANLARI =================
     Aynı anda tek katman aktif; sahiplik varsayılan. Katman değiştirmek
     haritayı bilgi çöplüğüne çevirmeden aynı yüzeyden farklı soruların
     cevabını okumayı sağlıyor (şartname §10). */
  var KATMANLAR=["sahiplik","ikmal","rota","gecit","tehdit"];
  var KATMAN_AD={sahiplik:"Sahiplik", ikmal:"İkmal", rota:"Rota", gecit:"Geçit", tehdit:"Tehdit"};
  var aktifKatman="sahiplik";
  var rotaUstuCache=null;

  function rotaUstundeMi(id){
    if(!rotaUstuCache){
      rotaUstuCache={};
      workerRoutes.forEach(function(rt){
        if(rt.durum==="kesildi") return;
        rt.nodes.forEach(function(n){ rotaUstuCache[n]=rt.durum; });
      });
    }
    return rotaUstuCache[id]||null;
  }

  /* Bir bölgenin aktif katmandaki rengi. null dönerse sahiplik rengi kullanılır. */
  function katmanKategori(region){
    if(aktifKatman==="sahiplik") return null;

    if(aktifKatman==="ikmal"){
      if(region.owner!=="player") return "solgun";
      var ik=region.ikmal==null?100:region.ikmal;
      return ik>=70 ? "ikmalIyi" : (ik>=40 ? "ikmalOrta" : "ikmalKotu");
    }
    if(aktifKatman==="rota"){
      var d=rotaUstundeMi(region.id);
      if(d==="guvenli") return "rotaUstu";
      if(d==="riskli") return "rotaRiskli";
      return region.owner==="player" ? "empty" : "solgun";
    }
    if(aktifKatman==="gecit"){
      if(!region.gecit) return "solgun";
      if(region.owner==="player") return "gecitBenim";
      if(region.owner==="enemy") return "gecitDusman";
      return "gecitBos";
    }
    if(aktifKatman==="tehdit"){
      if(region.owner!=="player") return region.owner==="enemy" ? "enemy" : "solgun";
      var ikm=region.ikmal==null?100:region.ikmal;
      if(isAdjacentToEnemy(region) && !(region.garrison>0) && !defenseStructures(region).length)
        return "tehditYuksek";
      if(isAdjacentToEnemy(region) || ikm<40) return "tehditOrta";
      return "tehditYok";
    }
    return null;
  }

  function katmanAyarla(key){
    if(KATMANLAR.indexOf(key)<0 || key===aktifKatman) return;
    aktifKatman=key;
    araziKirlet();
    rotaUstuCache=null;
    var kap=document.getElementById("katman-secici");
    if(kap){
      var dugmeler=kap.querySelectorAll(".kt");
      for(var i=0;i<dugmeler.length;i++){
        var b=dugmeler[i];
        var secili = b.dataset.kt===key;
        b.setAttribute("aria-pressed", secili?"true":"false");
        b.classList.toggle("acik", secili);
      }
    }
    if(window.__bfSes) window.__bfSes("uiKisa");
    showToast("🗺 Katman: "+KATMAN_AD[key]);
    drawMap();
  }

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

  /* Ses motoru ayrı bir dosyada (ses.js) ve isteğe bağlı: yüklenmemişse
     oyun sessiz çalışır, hiçbir yerde hata vermez. */
  function ses(ad){ if(window.__bfSes) window.__bfSes(ad); }

  /* ================= TOHUMLANABİLİR RASTGELELİK =================
     İki nedenle şart: (1) kaydedilen bir sefer, haritayı piksel piksel
     saklamadan aynı haritayla geri yüklenebilsin; (2) denge çalışmasında
     iki koşu karşılaştırılabilsin. Tohum verilmezse davranış eskisi gibi. */
  var _tohum=null;
  function tohumAyarla(t){ _tohum = (t===null||t===undefined) ? null : (t>>>0); }
  function tohumAl(){ return _tohum; }
  function rastgele(){
    if(_tohum===null) return Math.random();
    _tohum = (_tohum + 0x6D2B79F5) | 0;
    var t = Math.imul(_tohum ^ (_tohum >>> 15), 1 | _tohum);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function randInt(a,b){return Math.floor(rastgele()*(b-a+1))+a;}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function clampByte(v){return Math.max(0,Math.min(255,Math.round(v)));}
  function dist2(ax,ay,bx,by){var dx=ax-bx, dy=ay-by; return dx*dx+dy*dy;}

  /* ================= World generation ================= */
  /* Kayıttan devam ederken aynı harita yeniden üretilir; diziler kimliklerini
     koruyarak boşaltılır (test dikişi ve kapanışlar referansı sürdürsün). */
  function dunyaSifirla(){
    regions.length=0;
    landPixelsList.length=0;
    pixelRegionId.length=0;
    bots.length=0;
    ilSirasi.length=0;
    GECITLER.forEach(function(g){ g.regionId=-1; });
  }

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
        if(kopya[y3][x3]){ if(k<=2 && rastgele()<0.30) land[y3][x3]=false; }
        else if(k>=4 && rastgele()<0.55){ land[y3][x3]=true; }
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
        defense: r===1?44:null, garrison:(r===0?BASKENT_GARNIZON:0), defenses:[], botId:null, resKind:null, cost:null, goldBonus:null, anchor:{x:seeds[r][0],y:seeds[r][1]}
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
      var rnd=rastgele();
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
    var seedCount=Math.min(BOT_SAYISI, enemyRegions.length);
    var shuffled=enemyRegions.slice().sort(function(){ return rastgele()-0.5; });
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

    var diffs = ZORLUK_SECIMI && ZORLUK_SECIMI.length
      ? ZORLUK_SECIMI.slice()
      : BOT_DIFF_KEYS.slice().sort(function(){ return rastgele()-0.5; });
    /* Dizi yeniden atanmıyor, boşaltılıyor: kayıttan yükleme ve dışarıdan
       tutulan referanslar (lobi, testler) geçerli kalsın. */
    bots.length=0;
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
    var count = rastgele() < clamp(0.18+gd*0.09, 0.18, 0.72) ? (rastgele()<0.30 ? 2 : 1) : 0;
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
      ses("savunma");
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
      if(h.ring===0 || (h.ring===1 && rastgele()<0.5)){
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
    ses("nukleer");

    bildir(3, "☢️ "+n.name+" · "+hits.length+" bölge vuruldu"+
      (razed>0?" · "+razed+" tahkimat yıkıldı":"")+
      (ownHit>0?" · ⚠️ kendi "+ownHit+" bölgen de yandı ("+troopsLost+" asker)":"")+
      " · toprak "+SCORCH_TURNS+" tur üretimsiz.", null);
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
    // Geçit dar bir boğazdır: kim tutuyorsa savunmada avantajlıdır.
    var gecitEk = region.gecit ? GECIT_SAVUNMA : 0;
    if(region.owner==="enemy") return region.defense+gecitEk;
    var taban = region.type==="capital" ? 2+BASKENT_SAVUNMA : 2;
    return taban+gecitEk+(region.garrison||0);
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
    var kusatma = KUSATMA[Math.min(cephe, KUSATMA.length-1)];

    /* Arazi: çevresi dağlarla çevrili bölgeye yaklaşma yolu azdır, savunan
       dar geçidi tutar. Doğu illeri bu yüzden gerçekten zor olur. */
    var arazi = 1 + Math.min(ARAZI_TAVAN, dag*ARAZI_ADIM);

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

  /* ================= METİN KATMANI =================
     Şartname §05'in uygulaması. Kural: oyuncuya gösterilen hiçbir cümlede
     elle yazılmış denge sayısı bulunmaz. Yardım ekranı, tepsi kartları,
     bina panelleri, saldırı kartları ve ipuçları hep buradan beslenir.
     Bir sabit değiştiğinde altı ekran birden doğru kalır. */

  function ondalik(n){ return String(n).replace(".", ","); }
  function yuzde(n){ return "%"+Math.round(n*100); }

  /* Binanın ne işe yaradığı: savunma puanı, üretim, tavan katkısı, hangi
     saldırıyı zorlaştırdığı, hangi saldırının onu aştığı ve neyi açtığı —
     hepsi BUILDINGS + ATTACKS tablolarından okunur. */
  function binaAciklama(key){
    var b=BUILDINGS[key], p=[];
    if(b.def) p.push("+"+b.def+" savunma");
    if(b.gold) p.push("+"+b.gold+" altın/tur");
    if(b.army) p.push("+"+b.army+" asker/tur");
    if(b.popCap) p.push("asker tavanı +"+b.popCap);

    ATTACK_KEYS.forEach(function(ak){
      var m=ATTACKS[ak].vs[key];
      if(m && m>1) p.push(ATTACKS[ak].name+" ×"+ondalik(m)+" zorlaşır");
    });
    var asan=ATTACK_KEYS.filter(function(ak){ return ATTACKS[ak].bypass.indexOf(key)>=0; });
    if(asan.length){
      p.push(asan.map(function(ak){ return ATTACKS[ak].name; }).join(" ve ")+" bu yapıyı aşar");
    }
    var acar=ATTACK_KEYS.filter(function(ak){ return ATTACKS[ak].requires===key; });
    if(acar.length){
      p.push(acar.map(function(ak){ return ATTACKS[ak].name; }).join(" ve ")+" saldırısını açar");
    }
    if(key===NUKE_REQUIRES) p.push("nükleer fırlatmanın ön şartı");
    if(b.sam) p.push("gelen füzeyi önleyebilir");
    if(!p.length) p.push("üretim vermez");
    return p.join(" · ");
  }

  /* Saldırı tipinin künyesi: bedeli, ön şartı, neyi aştığı, neye takıldığı,
     ganimete ve garnizona etkisi. */
  function saldiriKunye(key){
    var a=ATTACKS[key], p=[];
    p.push(a.gold ? a.gold+" altın" : "bedava");
    if(a.requires) p.push(BUILDINGS[a.requires].name+" ister");
    if(a.bypass.length){
      p.push(a.bypass.map(function(k){ return BUILDINGS[k].name; }).join(" ve ")+" aşılır");
    }
    var zor=[];
    Object.keys(a.vs).forEach(function(k){
      if(a.vs[k]>1) zor.push(BUILDINGS[k].name+" ×"+ondalik(a.vs[k]));
    });
    if(zor.length) p.push(zor.join(", ")+" karşısında zorlanır");
    if(a.destroys) p.push(BUILDINGS[a.destroys].name+" yıkılır");
    if(a.lootMult<1) p.push("ganimetin "+yuzde(1-a.lootMult)+"'i yanar");
    if(a.garrisonMult<1) p.push("artan asker garnizona "+yuzde(a.garrisonMult)+" oranında geçer");
    return p.join(" · ");
  }

  function nukeKunye(key){
    var n=NUKES[key];
    var alan = n.rings===0 ? "yalnızca hedef bölge"
             : (n.rings===1 ? "hedef ve komşuları" : n.rings+" halka boyunca yayılır");
    return n.cost+" altın · "+alan+" · şiddet "+yuzde(n.power)+
           " · "+samNeeded(key)+" hava savunması durdurur";
  }

  function rotaKunye(){
    return "güvenli hat +"+ROTA_GELIR.guvenli+" altın/tur · riskli hat +"+ROTA_GELIR.riskli+
           " · kesik hat "+ROTA_GELIR.kesildi+" · hattın üstündeki her geçit +"+GECIT_GELIR;
  }
  function gecitKunye(){
    return "geçiş vergisi +"+GECIT_VERGI+" altın/tur · savunmada +"+GECIT_SAVUNMA+
           " doğuştan direnç · rotandaysa ayrıca +"+GECIT_GELIR;
  }

  function ikmalKunye(){
    return "başkent %100 · her adımda −%"+IKMAL_ADIM+" · taban %"+IKMAL_TABAN+
           " · ikmali düşük bölgeden saldırı "+yuzde(0.5)+"'e kadar pahalı";
  }

  function ekonomiKunye(){
    return "başkent +"+BASKENT_ALTIN+" altın ve +"+BASKENT_ASKER+" asker/tur · "+
           "her "+GENISLEME_BOLEN+" ilde +1 asker/tur · püskürtülen baskın +"+PUSKURTME_ODUL+" altın";
  }
  function bakimKunye(){
    return "her "+BAKIM_BOLEN+" asker için 1 altın/tur · her "+IDARI_BOLEN+
           " il için 1 altın/tur yönetim gideri";
  }

  function kesifKunye(){
    return KESIF_BEDEL+" altın · "+KESIF_SURE+" tur boyunca kesin istihbarat";
  }

  function ateskesKunye(){
    var alt=ateskesBedeli({difficulty:"kolay"}), ust=ateskesBedeli({difficulty:"zor"});
    return alt+"–"+ust+" altın · 10 tur boyunca o cephe baskın yapmaz";
  }

  function taarruzKunye(){
    return "hedefin etkin savunmasının "+yuzde(MIN_TAARRUZ)+"'si (en az 2 asker)";
  }

  function konumKunye(){
    var p=[];
    for(var i=2;i<KUSATMA.length;i++){
      p.push(i+(i===KUSATMA.length-1?"+":"")+" cephe ×"+ondalik(KUSATMA[i]));
    }
    return p.join(" · ")+" · her dağ komşusu +"+Math.round(ARAZI_ADIM*100)+
           "% savunma (tavan +"+Math.round(ARAZI_TAVAN*100)+"%)";
  }
  function tavanKunye(){
    return "taban "+TAVAN_TABAN+" + il başına "+TAVAN_IL+
           " + Kent başına "+BUILDINGS.kent.popCap+" · tavana yaklaştıkça üretim yavaşlar";
  }

  /* Zafer koşulu moda göre okunur — sabit bir cümle değil. */
  function zaferKunye(){
    var m=MODES[activeMode]||{}, h=m.hedef||{tip:"baskent"};
    if(h.tip==="gecit"){
      return "Altı geçidin "+h.gerek+" tanesini "+(h.tut||GECIT_TUTMA)+" tur boyunca elinde tut.";
    }
    return "Düşman başkentini ("+(regions[1]?regions[1].name:"doğu")+") ele geçir.";
  }
  function yenilgiKunye(){
    return "Başkentin garnizonsuz ve tahkimatsızken baskın yerse sefer biter.";
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

  /* Haritadaki nişan (başkent, taç, dağ, kaynak): karo yok, yalnızca
     çizgi. Koyu bir kontur önce basılır ki her zemin üstünde okunsun. */
  function nisanCiz(g, key, cx, cy, size, renk){
    if(!SYMBOLS[key]) return;
    var x0=cx-size/2, y0=cy-size/2;
    g.strokeStyle="rgba(8,12,16,0.85)"; g.fillStyle="rgba(8,12,16,0.85)";
    SYMBOLS[key](symbolPen(g, x0, y0, size, Math.max(1.6, size*0.19)));
    g.strokeStyle=renk; g.fillStyle=renk;
    SYMBOLS[key](symbolPen(g, x0, y0, size, Math.max(0.9, size*0.10)));
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
      var a=rastgele()*Math.PI*2, s=speed*(0.35+rastgele()*0.65);
      particles.push({
        x:cx, y:cy, vx:Math.cos(a)*s, vy:Math.sin(a)*s-speed*0.3,
        life:life*(0.6+rastgele()*0.7), age:0,
        color:colors[randInt(0,colors.length-1)],
        size:rastgele()<0.28?2:1
      });
    }
    startFX();
  }

  /* ---- Halka darbesi ----
     Parçacık süs, halka bilgidir: "burada stratejik bir şey oldu" der ve
     gözü oraya çeker. Azaltılmış hareket tercihinde bile çizilir — çünkü
     bilgi taşır — yalnızca daha kısa ve sarsıntısız.
     (şartname §09 · olay → geri bildirim eşlemesi) */
  var halkalar=[];
  function halkaEkle(cx, cy, renk, sayi, buyukluk){
    var adet=sayi||1;
    for(var i=0;i<adet;i++){
      halkalar.push({
        x:cx, y:cy, renk:renk||"#f0c944",
        age:-i*260, life:REDUCED?420:700,
        r0:4, r1:buyukluk||26
      });
    }
    startFX();
  }

  function paintHalkalar(){
    for(var i=0;i<halkalar.length;i++){
      var h=halkalar[i];
      if(h.age<0) continue;
      var t=h.age/h.life;
      if(t>1) continue;
      ctx.globalAlpha=Math.max(0, 1-t)*0.9;
      ctx.strokeStyle=h.renk;
      ctx.lineWidth=t<0.5?2:1.4;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r0+(h.r1-h.r0)*t, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.globalAlpha=1;
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
    for(var hi=halkalar.length-1;hi>=0;hi--){
      halkalar[hi].age+=dt;
      if(halkalar[hi].age>=halkalar[hi].life) halkalar.splice(hi,1);
    }
    stepWorkers(dt);
    shakeMag = shakeMag>0.06 ? shakeMag*Math.pow(0.87, step) : 0;
    applyTransform();
    composite();
    if(particles.length || floaters.length || halkalar.length || shakeMag>0 || workers.length){
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
    if(shakeMag>0){ dx=(rastgele()*2-1)*shakeMag; dy=(rastgele()*2-1)*shakeMag; }
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

  function invalidateRoutes(){ routesDirty=true; rotaUstuCache=null; araziKirlet(); startFX(); }

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
  /* ---- GEÇİŞ VERGİSİ ----
     Oyunun tezi "toprağı değil geçişi tut" idi ama ölçüm bunun mekaniğe
     yansımadığını gösterdi: geçide yürüyen oyuncu 6 koşunun yalnızca
     2'sini kazanıyordu, çünkü geçit tutmanın ekonomik karşılığı yoktu.
     Artık elindeki her geçit, rotadan bağımsız olarak geçiş vergisi
     üretiyor: dar bir devlet, geniş bir imparatorluk kadar kazanabilir.
     Ve dar geçit savunanı kayırır — geçit ilinin doğuştan direnci var. */
  var GECIT_VERGI=6;               // sahip olunan her geçit: altın/tur
  var GECIT_SAVUNMA=8;             // geçit ilinin doğuştan savunma katkısı

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
      workers.push({route:ri, t:rastgele(), dir:1});
      workers.push({route:ri, t:rastgele(), dir:-1});
    });
    if(workers.length) startFX();
  }

  /* Hat kesilmesi sessizce olmasın: yeni kesilen her hat için bir kez
     kritik bildirim çıkar (her turda tekrar etmez). */
  var sonKesikSayisi=0;
  function rotaKesilmeKontrol(){
    if(routesDirty) rebuildRoutes();
    var kesik=0;
    workerRoutes.forEach(function(rt){ if(rt.durum==="kesildi") kesik++; });
    if(kesik>sonKesikSayisi && state.started){
      bildir(3, "⛔ Bir ticaret hattın kesildi — o üretim bölgesine kendi "+
                "toprağından yol kalmadı. Haritada kırmızı çarpıyla işaretli.", "ikmal");
    }
    sonKesikSayisi=kesik;
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

    /* Kesik hat görünmez olmasın: üretim düğümünün üstüne kırmızı bir çarpı
       konur. Oyuncu "neden gelirim düştü?" sorusunu haritadan cevaplar. */
    for(var kx=0;kx<workerRoutes.length;kx++){
      var krt=workerRoutes[kx];
      if(krt.durum!=="kesildi" || !krt.pts.length) continue;
      var kp=krt.pts[0];
      ctx.strokeStyle="#e0603c"; ctx.lineWidth=1.6;
      ctx.beginPath();
      ctx.moveTo(kp.x-4, kp.y-4); ctx.lineTo(kp.x+4, kp.y+4);
      ctx.moveTo(kp.x+4, kp.y-4); ctx.lineTo(kp.x-4, kp.y+4);
      ctx.stroke();
    }

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

  /* ================= ARAZİ ÖNBELLEĞİ (performans) =================
     Eski sürümde drawMap() her çağrıldığında on binlerce piksel yeniden
     boyanıyordu — her toast'ta, her turda ve fetih animasyonunda saniyede
     ~22 kez. Artık arazi yalnızca gerçekten değiştiğinde yeniden çiziliyor;
     geri kalan karelerde hazır görüntü kopyalanıyor (şartname §17). */
  var araziKirli=true;
  function araziKirlet(){ araziKirli=true; }

  /* Fetih animasyonunda tam yeniden çizim yerine yalnızca yeni dönen
     pikseller araziye işleniyor. */
  function pikselBoya(p, cat){
    tctx.fillStyle=pixelFillStyle(cat, p.noise, p.isBorder);
    tctx.fillRect(p.x*CELL, p.y*CELL, CELL, CELL);
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
        cat=katmanKategori(region) || categoryForRegion(region);
        if(blastPreview && blastPreview.indexOf(p.regionId)>=0) cat="flashHit";
        if(p.isBorder){
          // Seçim halkası her şeyin önünde gelir: "şu an incelediğin bölge
          // bu" bilgisi, duvar/hover tonlarından daha güçlü okunmalı.
          if(dragUygun && dragUygun[p.regionId] && p.regionId!==dragHoverRegionId) selRing=true;
          else if(currentSel && p.regionId===currentSel.id) selRing=true;
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
    paintHalkalar();
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
        nisanCiz(ctx, "dag", cx, cy, CELL*3.2, "#8e93a0");
        continue;
      }
      /* Bölge işareti — referans düzen: tahkimat karoları + üstüne binen sayı rozeti.
         Asker/bayrak ikonu yok; sahiplik zaten bölge renginden okunuyor. Yalnızca
         renkle anlaşılmayan şeyler (başkent, kaynak türü) ikon olarak kalır. */
      var nisan=null, nisanRenk="#e6dfc9";
      if(reg.type==="capital"){ nisan="kale"; nisanRenk="#bcd6f0"; }
      else if(reg.type==="enemyCapital"){
        nisan = reg.owner==="player" ? "kale" : "tac";
        nisanRenk = reg.owner==="player" ? "#bcd6f0" : "#f0c07f";
      }
      else if(reg.type==="resource" && KAYNAK_SEMBOL[reg.resKind]){
        nisan = KAYNAK_SEMBOL[reg.resKind];
        nisanRenk = reg.owner==="player" ? "#e3c887" : "#b6ab8c";
      }
      /* Geçit, sahiplikten bağımsız olarak haritada işaretli: oyunun tezi
         gözle takip edilebilsin. */
      var gecitNisan = reg.gecit ? true : false;

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

      // Başkent / kaynak nişanı sayacın üstünde durur.
      var nisanY = cy-(shown.length||badgeNum!==null ? CELL*2.4 : 0);
      if(nisan) nisanCiz(ctx, nisan, cx, nisanY, CELL*3.0, nisanRenk);
      if(gecitNisan){
        /* Geçit halkası: nişanın etrafında ince bir çember. Sahibine göre
           renk alır, böylece "hangi geçit kimde" haritadan okunur. */
        ctx.strokeStyle = reg.owner==="player" ? "#e3b23c"
                        : (reg.owner==="enemy" ? "#d4834a" : "#9aa0a8");
        ctx.lineWidth=1.2;
        ctx.beginPath();
        ctx.arc(cx, nisanY, CELL*2.3, 0, Math.PI*2);
        ctx.stroke();
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
    if(araziKirli){ paintTerrain(); araziKirli=false; }
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
        bolge:regions.filter(function(r){ return r.owner==="enemy" && r.botId==null; }).length,
        guc:regions[1].defense||44, altin:null, altinBilinir:false,
        anchor: regions[1].anchor
      });
    }
    bots.forEach(function(bot){
      var owned=regions.filter(function(r){ return r.botId===bot.id && r.owner==="enemy"; });
      if(!owned.length) return;
      var sx=0, sy=0;
      owned.forEach(function(r){ sx+=r.anchor.x; sy+=r.anchor.y; });
      rows.push({
        key:"bot"+bot.id, name:cepheAdi(bot), color:BOT_COLORS[bot.difficulty],
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

    /* İmza aynıysa DOM'a hiç dokunulmuyor: eski sürümde skorbord her
       drawMap'te baştan kuruluyor ve her satıra yeniden dinleyici
       bağlanıyordu (fetih animasyonunda saniyede ~22 kez). */
    var imza=rows.map(function(r){ return r.key+r.bolge+r.guc+r.altin; }).join("|");
    if(imza===renderScoreboard.sonImza) return;
    renderScoreboard.sonImza=imza;

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

  /* ================= Seçim şeridi =================
     Panel kapansa bile son incelenen bölgenin künyesi ekranda kalır; iki
     hedefi karşılaştırmak için paneli açıp kapatmak gerekmez (şartname §26.3). */
  function secimSeridi(region){
    var el=document.getElementById("secim-serit");
    if(!el) return;
    if(!region){ el.hidden=true; return; }
    var adEl=document.getElementById("ss-ad");
    var veriEl=document.getElementById("ss-veri");
    if(adEl) adEl.textContent=region.name+(region.gecit?" ⛰":"");
    var parcalar=[];
    if(region.owner==="player"){
      parcalar.push("Senin");
      parcalar.push("garnizon "+(region.garrison||0));
      parcalar.push("ikmal %"+(region.ikmal==null?100:region.ikmal));
      if(region.building) parcalar.push(BUILDINGS[region.building].name);
    } else if(region.owner==="enemy"){
      var sv=istihbarat(region);
      parcalar.push("Düşman");
      parcalar.push(sv>=2 ? "savunma "+region.defense
              : (sv>=1 ? "savunma ~"+region.defense : "savunma ?"));
      var yapilar=sv>=1?defenseStructures(region):[];
      if(yapilar.length) parcalar.push(yapilar.map(function(k){ return BUILDINGS[k].name; }).join(", "));
    } else if(region.type==="obstacle"){
      parcalar.push("Dağ · geçilmez");
    } else if(region.type==="resource"){
      parcalar.push(RESOURCE_KINDS[region.resKind].label);
      parcalar.push(region.cost+" altın");
    } else {
      parcalar.push("Sahipsiz");
      if(region.cost) parcalar.push(region.cost+" altın");
    }
    if(veriEl) veriEl.textContent=parcalar.join(" · ");
    el.hidden=false;
  }

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
        /* Tam yeniden çizim yerine yalnızca dönen piksel araziye işleniyor.
           Fetih animasyonu eski sürümde en pahalı sıcak noktaydı. */
        if(p.noise===undefined){
          var gercek=pixelRegionId[p.y] && regions[region.id];
          pikselBoya({x:p.x, y:p.y, noise:0, isBorder:false}, "player");
        } else {
          pikselBoya(p, "player");
        }
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
      composite();                 // arazi zaten artımlı güncellendi
      if(flipped.size>=total || !queue.length){
        clearInterval(timer);
        animating=null;
        fetihTamamla(region, doneCallback);
      }
    }, 45);
  }

  /* Fetih sonucunun tek yeri: animasyon bittiğinde de, animasyonsuz
     (kural katmanı ya da test) yolda da buradan geçilir. Böylece "bölge el
     değiştirdi" sonucu tek bir yerde tanımlı kalır. */
  function fetihTamamla(region, doneCallback){
    region.owner="player";
    araziKirlet();
    invalidateRoutes();
    bfStatBump("toplamFetih");
    state.fetih++;
    ses("fetih");
    drawMap();
    if(region.gecit){
      var gd=gecitDurumu();
      var gc=regionCenter(region);
      halkaEkle(gc.x, gc.y, "#f0c944", 3, 34);      // stratejik an: üç halka
      addShake(4);
      bildir(4, "⛰ "+region.gecit.ad+" senin"+
        (gd.gerek ? " — "+gd.tut+"/"+gd.gerek+" geçit" : ""), "gecit");
    }
    doneCallback && doneCallback();
    checkVictory();
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
    araziKirlet(); drawMap();
    setTimeout(function(){ flashRegionId=null; araziKirlet(); drawMap(); }, 600);
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

  /* Seçim halkası araziye çizildiği için seçim değişimi de arazi kirletir. */
  function secimAyarla(region){
    if(currentSel===region) return;
    currentSel=region;
    araziKirlet();
  }

  /* Panel açılınca odak içeri taşınır, kapanınca onu açan elemana döner.
     Klavye kullanıcısı için bu bir konfor değil, gereklilik. */
  var odakDonus=null;
  function odakYerlestir(){
    var ilk=sheet.querySelector("button:not([disabled]), [tabindex]");
    if(ilk && ilk.focus) ilk.focus();
  }

  function openSheet(icon,title,sub,actionsHtml){
    odakDonus = document.activeElement && document.activeElement.focus
                ? document.activeElement : null;
    document.getElementById("sheet-icon").textContent=icon;
    document.getElementById("sheet-title").textContent=title;
    document.getElementById("sheet-sub").textContent=sub;
    document.getElementById("sheet-actions").innerHTML=actionsHtml;
    overlay.classList.add("show");
    sheet.classList.add("open");
    setTimeout(odakYerlestir, 30);
  }
  function closeSheet(){
    overlay.classList.remove("show");
    sheet.classList.remove("open");
    if(odakDonus && odakDonus.focus){ try{ odakDonus.focus(); }catch(e){} }
    odakDonus=null;
    if(blastPreview){ blastPreview=null; araziKirlet(); }
    secimAyarla(null);        // seçim halkası ve gizli rakam paneli kapatınca gider
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
    } else if(region.type==="resource" && RESOURCE_KINDS[region.resKind]){
      var rk=RESOURCE_KINDS[region.resKind];
      openCapturePanel(region, {cost:region.cost, icon:rk.raw, label:region.name+" · "+rk.label, desc:"Ele geçirilince otomatik "+rk.built+" kurulur, +"+region.goldBonus+" altın/tur pasif üretim sağlar."});
    } else if(region.type==="enemy" || region.type==="enemyCapital"){
      openAttackPanel(region);
    }
  }

  function openCapturePanel(region, opts){
    secimAyarla(region);
    secimSeridi(region);
    drawMap();
    var canAfford = state.gold>=opts.cost;
    var html = "<button class='action-btn primary' id='do-capture' "+(canAfford?"":"disabled")+">"+
      "<span><span class='a-name'>Ele Geçir</span><span class='a-desc'>"+opts.desc+"</span></span>"+
      "<span class='a-cost'>💰"+opts.cost+"</span></button>";
    openSheet(opts.icon, opts.label, opts.desc, html);
    document.getElementById("do-capture").addEventListener("click", function(){
      var sonuc=bolgeAl(region);
      if(!sonuc.ok){ showToast("❌ "+sonuc.neden); return; }
      closeSheet();
    });
  }

  function openAttackPanel(region){
    secimAyarla(region);
    secimSeridi(region);
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

    /* Keşif artık yalnızca sağ tık menüsünde saklı değil: kararın verildiği
       yerde, saldırı panelinin içinde. */
    var kesifHtml="";
    if(region.owner==="enemy" && !kesin){
      kesifHtml="<button class='action-btn kesif-btn'"+(state.gold<KESIF_BEDEL?" disabled":"")+">"+
        "<span><span class='a-name'>🔭 Keşif yap</span>"+
        "<span class='a-desc'>Kesin savunma ve tahkimat tipleri "+KESIF_SURE+" tur açık kalır — "+
        "başarısız bir saldırıdan ucuz</span></span>"+
        "<span class='a-cost'>💰"+KESIF_BEDEL+"</span></button>";
    }

    var typeHtml=kesifHtml+
      "<div class='atk-label'>Saldırı tipini seç — <b>gereken asker</b> tahkimata göre değişir</div>"+
      "<div class='atk-types' id='atk-types'></div>"+
      "<div class='atk-desc' id='atk-desc'></div>"+
      "<div id='kusatma-oneri'></div>";

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
        konum += "<div class='konum-ipucu'>Bu ile başka bir komşusundan da dayanırsan "+
                 "savunması ×"+ondalik(KUSATMA[2])+"'ye düşer.</div>";
      }
      /* Kuşatma önerisi: hangi komşuyu alırsan bu hedef ucuzlar? Soyut bir
         ipucu değil, haritadaki gerçek il adıyla. */
      var oneriEl=document.getElementById("kusatma-oneri");
      if(oneriEl){
        var adaylar=[];
        region.neighbors.forEach(function(nid){
          var n=regions[nid];
          if(n.owner==="player" || n.type==="obstacle") return;
          if(!isAdjacentToPlayer(n)) return;
          adaylar.push(n);
        });
        if(c.cephe<KUSATMA.length-1 && adaylar.length){
          var yeniCarpan=KUSATMA[Math.min(c.cephe+1, KUSATMA.length-1)];
          oneriEl.innerHTML="<div class='oneri-bas'>Önce şurayı alırsan savunma ×"+
            ondalik(yeniCarpan)+"'e düşer:</div><div class='oneri-liste'>"+
            adaylar.slice(0,3).map(function(n){
              return "<button class='oneri-cip' data-oneri='"+n.id+"'>"+n.name+"</button>";
            }).join("")+"</div>";
          oneriEl.querySelectorAll("[data-oneri]").forEach(function(b){
            b.addEventListener("click", function(){
              var hedef=regions[parseInt(b.dataset.oneri,10)];
              closeSheet();
              centerOnAnchor(hedef.anchor);
              onRegionTap(hedef.id);
            });
          });
        } else { oneriEl.innerHTML=""; }
      }

      effTxt += konum;
      descEl.innerHTML="<div class='atk-line'>"+atk.desc+"</div>"+
        "<div class='atk-line notr-line'>"+saldiriKunye(atkKey)+"</div>"+
        "<div class='atk-line'>"+effTxt+"</div>";

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
        var loot=Math.floor(region.defense*GANIMET_CARPAN*atk.lootMult);
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

    var kesifBtn=document.querySelector("#sheet-actions .kesif-btn");
    if(kesifBtn){
      kesifBtn.addEventListener("click", function(){
        if(state.gold<KESIF_BEDEL){ showToast("🪙 Yeterli altının yok."); return; }
        state.gold-=KESIF_BEDEL;
        region.kesif=state.turn+KESIF_SURE;
        bildir(2, "🔭 "+region.name+" keşfedildi — tahkimatı "+KESIF_SURE+" tur açık.", "kesif");
        drawMap();
        closeSheet();
        openAttackPanel(region);      // panel kesin bilgiyle yeniden kurulur
      });
    }

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
        bildir(2, "⚠️ Bu kuvvetle taarruz düzenlenemez — en az "+esikSon+" asker gerekiyor.", "uiRed");
        return;
      }
      closeSheet();
      taarruzEt(region, atkKey, sent);
    });

    refresh();
  }

  /* ================= Onay diyaloğu =================
     Geri alınamaz ve pahalı eylemler artık sessizce gerçekleşmiyor
     (şartname §02/B19). Modal açıkken saatler duruyor. */
  var ONAY_ESIGI=100;
  function onaySor(baslik, metin, evetMetin, cb, tehlikeli){
    modalBox.className="modal-box onay"+(tehlikeli?" tehlike":"");
    modalBox.innerHTML=
      "<h2>"+baslik+"</h2>"+
      "<p class='onay-metin'>"+metin+"</p>"+
      "<button id='onay-evet' class='"+(tehlikeli?"tehlike":"")+"'>"+evetMetin+"</button>"+
      "<button id='onay-hayir'>Vazgeç</button>";
    modalOverlay.classList.add("show");
    modalDuraklat();
    document.getElementById("onay-evet").addEventListener("click", function(){
      modalOverlay.classList.remove("show"); modalDevam(); cb();
    });
    document.getElementById("onay-hayir").addEventListener("click", function(){
      modalOverlay.classList.remove("show"); modalDevam();
    });
  }

  /* Bir bölgenin bir sonraki baskına dayanıp dayanmayacağı. Baskın, en az
     dirençle karşılaşacağı saldırı tipini seçtiği için hesap da öyle yapılır. */
  function baskinDayanimi(region){
    var enDusuk=Infinity;
    ATTACK_KEYS.forEach(function(k){
      var v=defenseAgainst(region, k, "enemy").value;
      if(v<enDusuk) enDusuk=v;
    });
    var guc=baskinGucu();
    return {deger:enDusuk, guc:guc, yeter:enDusuk>=guc};
  }

  /* Bir binanın TAM BU BÖLGEDE ne kazandıracağı — genel açıklama değil,
     o ilin gerçek sayısı (şartname §25). */
  function binaBolgeEtkisi(region, key){
    var b=BUILDINGS[key], ik=(region.ikmal==null?100:region.ikmal)/100, p=[];
    if(b.def){
      var once=effectiveDefense(region), sonra=once+b.def;
      var d=baskinDayanimi(region);
      p.push("savunma "+once+" → "+sonra);
      p.push(sonra>=d.guc ? "baskını atlatır" : "hâlâ yetmez ("+d.guc+" gerek)");
    }
    if(b.gold) p.push("+"+Math.round(b.gold*ik)+" altın/tur");
    if(b.army) p.push("+"+Math.round(b.army*ik)+" asker/tur");
    if(b.popCap) p.push("tavan +"+b.popCap);
    if(key===NUKE_REQUIRES) p.push("füze fırlatma açılır");
    var acar=ATTACK_KEYS.filter(function(ak){ return ATTACKS[ak].requires===key; });
    if(acar.length && !regions.some(function(r){ return r.owner==="player" && r.building===key; })){
      p.push(acar.map(function(ak){ return ATTACKS[ak].name; }).join(" ve ")+" açılır");
    }
    return p.join(" · ");
  }

  /* Yanlış kurulan bina artık o ili kalıcı olarak mahkûm etmiyor. */
  var YIKIM_IADE=0.4;
  function tryDemolish(region){
    if(!region || region.owner!=="player" || !region.building) return {ok:false};
    var key=region.building, iade=Math.floor(BUILDINGS[key].cost*YIKIM_IADE);
    region.building=null;
    state.gold+=iade;
    invalidateRoutes();
    drawMap();
    bildir(2, "🧨 "+BUILDINGS[key].name+" yıkıldı — "+iade+" altın geri alındı.", "yikim");
    return {ok:true};
  }

  /* ---- Ele geçirme (boş / kaynak toprak) ----
     Panel bu fonksiyonu çağırır; kural burada durur. Böylece arayüz ile
     kural tek bir yerde buluşur ve test edilebilir olur. */
  function bolgeAl(region, animasyonlu){
    if(!region) return {ok:false, neden:"bölge yok"};
    if(region.owner==="player") return {ok:false, neden:"zaten senin"};
    if(region.type==="obstacle") return {ok:false, neden:"geçilmez"};
    if(!isAdjacentToPlayer(region)) return {ok:false, neden:"komşu değil"};
    var bedel=region.cost||0;
    if(state.gold<bedel) return {ok:false, neden:"altın yetmiyor"};
    state.gold-=bedel;
    if(animasyonlu===false){ fetihTamamla(region, null); }
    else {
      animateCapture(region, function(){
        drawMap();
        bildir(2, "🎉 "+region.name+" ele geçirildi, sınırın ilerledi.");
      });
    }
    return {ok:true, bedel:bedel};
  }

  /* ---- Taarruz ----
     Saldırının bütün sonucu (fetih, ganimet, garnizon devri, aşındırma)
     burada çözülür; panel yalnızca girdi toplar. */
  function taarruzEt(region, atkKey, sent, animasyonlu){
    var atk=ATTACKS[atkKey];
    if(!atk) return {ok:false, neden:"saldırı tipi yok"};
    if(!attackAvailability(atkKey).ok) return {ok:false, neden:attackAvailability(atkKey).reason};
    sent=Math.max(0, Math.min(Math.round(sent), state.army));
    var d=defenseAgainst(region, atkKey);
    var esik=taarruzEsigi(d.value);
    if(sent<esik) return {ok:false, neden:"yetersiz kuvvet", esik:esik};

    state.army-=sent;
    state.gold-=atk.gold;

    if(sent>=d.value){
      var leftover=Math.floor((sent-d.value)*atk.garrisonMult);
      var loot=Math.floor(region.defense*GANIMET_CARPAN*atk.lootMult);
      var razed = atk.destroys && hasStructure(region, atk.destroys);
      var bitir=function(){
        region.garrison=leftover;
        if(razed){ region.defenses=region.defenses.filter(function(k){ return k!==atk.destroys; }); }
        state.gold+=loot;
        drawMap();
        var vc=regionCenter(region);
        addShake(2.2);
        addBurst(vc.x, vc.y, 26, ["#f0c944","#d4a72c","#cfc4a4"], 1.7, 900);
        addFloater(vc.x, vc.y-6, "+"+loot+" 💰", "#f0c944");
        bildir(2, atk.icon+" Zafer! "+loot+" altın ganimet"+
          (razed?" · "+BUILDINGS[atk.destroys].name+" yıkıldı":"")+
          (leftover>0?(" · "+leftover+" asker garnizon 🛡️"):"")+".");
      };
      if(animasyonlu===false){ fetihTamamla(region, bitir); }
      else { animateCapture(region, bitir); }
      return {ok:true, fetih:true, ganimet:loot, garnizon:leftover};
    }

    var reduction=Math.floor(sent*atk.softenMult);
    region.defense=Math.max(1, region.defense-reduction);
    drawMap();
    flashRegion(region.id);
    var fc=regionCenter(region);
    addShake(3.5);
    addBurst(fc.x, fc.y, 16, ["#c9c0a4","#8d8266","#b5432f"], 1.5, 620);
    addFloater(fc.x, fc.y-6, "-"+sent+" 🪖", "#e08a72");
    var why = d.mult>1 ? " Tahkimatı bu saldırıyı katladı (×"+d.mult.toFixed(1)+")." : "";
    bildir(2, "💥 Saldırı püskürtüldü, "+sent+" asker gitti."+why+" Garnizon "+region.defense+".", "taarruz");
    return {ok:true, fetih:false, asindirma:reduction};
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
    bildir(2, "🏗️ "+b.name+" inşa edildi — "+binaBolgeEtkisi(region, key)+".", "insa");
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
    var day=baskinDayanimi(region);
    bildir(2, "🪖 "+region.name+" takviye edildi — garnizon "+region.garrison+
      (day.yeter?" · bir sonraki baskını atlatır":" · hâlâ yetersiz"), "insa");
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
    secimAyarla(region);
    secimSeridi(region);
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

    /* Bu bölge bir sonraki baskını atlatır mı? Panelin en üstünde, tek satır. */
    var day=baskinDayanimi(region);
    var bodyHtml=
      "<div class='dayanim "+(day.yeter?"iyi":"kotu")+"'>"+
        (day.yeter ? "🛡️ Bu bölge bir sonraki baskını atlatır"
                   : "⚠️ Bu bölge bir sonraki baskına dayanmaz")+
        " <small>(direnç "+day.deger+" · beklenen baskın "+day.guc+")</small>"+
      "</div>"+
      bolgeDurumSatiri(region)+"<div class='sheet-divider'></div>";

    if(isCapital){
      bodyHtml += "<div class='built-row'><span style='font-size:22px'>🏰</span>"+
        "<span>Asker ve altın üretiminin kalbi: her tur +"+BASKENT_ALTIN+" altın, +"+
        BASKENT_ASKER+" asker. <b>Garnizonsuz ve tahkimatsızken düşerse sefer biter.</b></span></div>";
    } else if(region.building){
      var b=BUILDINGS[region.building];
      bodyHtml += "<div class='built-row'>"+symbolImg(region.building,"sym-img built-sym")+
        "<span>Burada <b>"+b.name+"</b> var.<br><span class='built-desc'>"+
        binaAciklama(region.building)+"</span></span></div>"+
        "<button class='action-btn yikim-btn'>"+
          "<span><span class='a-name'>🧨 Yapıyı yık</span>"+
          "<span class='a-desc'>Yatırımın "+Math.round(YIKIM_IADE*100)+"%'i geri döner — "+
          "yanlış kurulan bina o ili mahkûm etmesin</span></span>"+
          "<span class='a-cost'>+"+Math.floor(b.cost*YIKIM_IADE)+" 🪙</span></button>";
    } else {
      Object.keys(BUILDINGS).forEach(function(key){
        var b=BUILDINGS[key];
        var canAfford = state.gold>=b.cost;
        bodyHtml += "<button class='action-btn build-btn' data-key='"+key+"' "+(canAfford?"":"disabled")+">"+
          "<span><span class='a-name'>"+symbolImg(key,"sym-img a-sym")+b.name+"</span>"+
          "<span class='a-desc'>"+binaBolgeEtkisi(region, key)+"</span>"+
          "<span class='a-desc a-ince'>"+binaAciklama(key)+"</span></span>"+
          "<span class='a-cost'>"+(canAfford?"":"🔒 ")+"💰"+b.cost+"</span></button>";
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

    var yikimBtn=document.querySelector("#sheet-actions .yikim-btn");
    if(yikimBtn){
      yikimBtn.addEventListener("click", function(){
        var key=region.building;
        closeSheet();
        onaySor("Yapıyı yık",
          "<b>"+BUILDINGS[key].name+"</b> yıkılacak ve "+
          Math.floor(BUILDINGS[key].cost*YIKIM_IADE)+" altın geri dönecek. Bu işlem geri alınamaz.",
          "Evet, yık", function(){ tryDemolish(region); }, true);
      });
    }

    if(!isCapital && !region.building){
      document.querySelectorAll(".build-btn").forEach(function(btn){
        btn.addEventListener("click", function(){
          var key=btn.dataset.key;
          var bedel=BUILDINGS[key].cost;
          if(bedel>=ONAY_ESIGI){
            closeSheet();
            onaySor(BUILDINGS[key].name+" kur",
              region.name+" bölgesine <b>"+BUILDINGS[key].name+"</b> kurulacak: "+
              binaBolgeEtkisi(region, key)+". Bedeli <b>"+bedel+" altın</b>.",
              "Kur", function(){ tryBuild(region, key); });
          } else if(tryBuild(region, key).ok){ closeSheet(); }
        });
      });
    }
  }

  /* ================= KLAVYEYLE HARİTA =================
     Oyunun tamamı işaretçi zorunluydu; artık ok tuşlarıyla komşu ile
     geçilebiliyor, Enter paneli açıyor (şartname §18). Yön seçimi
     bölge çapalarının gerçek konumundan hesaplanıyor. */
  function yonundekiKomsu(region, dx, dy){
    var enIyi=null, enIyiPuan=-Infinity;
    region.neighbors.forEach(function(nid){
      var n=regions[nid];
      if(!n.pixels.length) return;
      var vx=n.anchor.x-region.anchor.x, vy=n.anchor.y-region.anchor.y;
      var uzunluk=Math.sqrt(vx*vx+vy*vy) || 1;
      var hiza=(vx*dx+vy*dy)/uzunluk;          // -1..1 arası yön uyumu
      if(hiza<0.35) return;                     // o yönde sayılmaz
      var puan=hiza*2 - uzunluk/40;             // hizalı ve yakın olan kazanır
      if(puan>enIyiPuan){ enIyiPuan=puan; enIyi=n; }
    });
    return enIyi;
  }

  function klavyeSec(region){
    if(!region) return;
    secimAyarla(region);
    secimSeridi(region);
    centerOnAnchor(region.anchor);
    drawMap();
    ses("uiKisa");
  }

  function klavyeYon(dx, dy){
    if(!state.started) return;
    var basla = currentSel || regions[0];
    if(!currentSel){ klavyeSec(basla); return; }
    var hedef=yonundekiKomsu(basla, dx, dy);
    if(hedef) klavyeSec(hedef);
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

  /* Barışın fiyatı komutanın karakterinden çıkar: Kervanbaşı ticaret için
     anlaşmaya en açık olan, Demirkapı en pahalı olandır. */
  function ateskesBedeli(bot){
    var taban=40 + (BOT_DIFF[bot.difficulty] ? BOT_DIFF[bot.difficulty].basePower*4 : 20);
    var k=(KOMUTANLAR[bot.difficulty]||{}).ateskesCarpan || 1;
    return Math.round(taban*k);
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

  /* Kart neden kullanılamıyorsa oyuncu bunu denemeden önce görür:
     sönük kartın gerekçesi kartın üstünde yazar. */
  function renderBuildTray(){
    var tray=document.getElementById("build-tray");
    if(!tray) return;
    var html="";
    Object.keys(BUILDINGS).forEach(function(key){
      var b=BUILDINGS[key];
      var kilit = state.gold<b.cost ? "Yetersiz altın" : "";
      html += "<div class='build-card"+(kilit?" kilitli":"")+"' data-key='"+key+"' title='"+
        binaAciklama(key)+"'>"+
        "<div class='bc-icon'>"+symbolImg(key,"sym-img")+"</div>"+
        "<div class='bc-name'>"+b.name+"</div>"+
        "<div class='bc-cost'>💰"+b.cost+"</div>"+
        (kilit?"<div class='bc-kilit'>"+kilit+"</div>":"")+
      "</div>";
    });
    // Füzeler aynı tepsiden fırlatılır ama ayrı bir bölümde durur:
    // bina kurmakla toprak yakmak aynı kutuya girmesin.
    html += "<div class='tray-split'></div>";
    var siloVar=regions.some(function(r){ return r.owner==="player" && r.building===NUKE_REQUIRES; });
    NUKE_KEYS.forEach(function(key){
      var n=NUKES[key];
      var kilit = !siloVar ? BUILDINGS[NUKE_REQUIRES].name+" gerek"
                : (state.gold<n.cost ? "Yetersiz altın" : "");
      html += "<div class='build-card nuke-card"+(kilit?" kilitli":"")+"' data-nuke='"+key+"' title='"+
        nukeKunye(key)+"'>"+
        "<div class='bc-icon nuke-icon'>☢</div>"+
        "<div class='bc-name'>"+n.name+"</div>"+
        "<div class='bc-cost'>💰"+n.cost+"</div>"+
        (kilit?"<div class='bc-kilit'>"+kilit+"</div>":"")+
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

  /* Sürükleme başlarken kurulabilecek iller hesaplanır ve haritada
     vurgulanır: oyuncu deneyerek değil bakarak öğrenir. */
  var dragUygun=null;
  function insaHedefleriniHesapla(key){
    var out={};
    var b=BUILDINGS[key];
    regions.forEach(function(r){
      if(r.owner!=="player" || r.type==="capital" || r.building) return;
      if(state.gold<b.cost) return;
      out[r.id]=true;
    });
    return out;
  }

  function startDrag(key, pointerId, cardEl, x, y, isNuke){
    if(dragState) return;
    dragUygun = isNuke ? null : insaHedefleriniHesapla(key);
    araziKirlet(); drawMap();     // uygun bölgeler hemen vurgulansın
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
      if(changed){ araziKirlet(); drawMap(); }
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
      araziKirlet(); drawMap();
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
    dragUygun=null;
    dragHoverRegionId=null;
    blastPreview=null;
    araziKirlet(); drawMap();
    if(wasNuke){
      if(!region){ showToast("Fırlatma iptal edildi."); return; }
      if(region.type==="obstacle"){ showToast("⛰️ Dağa fırlatılamaz."); return; }
      var av=nukeAvailability(key);
      if(!av.ok){ showToast("❌ "+av.reason+"."); return; }
      /* Füze onaysız fırlatılmıyor: alan, kendi kaybın ve SAM durumu
         yazılı olarak önüne konuyor (şartname §02/B19). */
      var hits=blastRegions(region, NUKES[key].rings);
      var kendi=hits.filter(function(h){ return h.region.owner==="player"; }).length;
      var sam=samsInRange(region).length, gerek=samNeeded(key);
      onaySor(NUKES[key].name+" fırlat",
        "<b>"+region.name+"</b> hedef alınacak. "+hits.length+" bölge yanacak"+
        (kendi? ", <b class='tehlike-metin'>bunların "+kendi+" tanesi senin</b>":"")+
        ". Toprak "+SCORCH_TURNS+" tur üretimsiz kalacak. Bedel "+NUKES[key].cost+" altın."+
        (sam>=gerek? " <b class='tehlike-metin'>Menzilde "+sam+" hava savunması var — füze önlenir.</b>":""),
        "Fırlat", function(){ launchNuke(region, key); }, true);
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
      if(t.type==="capital"){ goldGain+=BASKENT_ALTIN; armyGain+=BASKENT_ASKER; }
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
    rotaKesilmeKontrol();
    var rd=rotaDurumu();
    goldGain+=rd.gelir;
    state.ticaret+=rd.gelir;

    /* Geçiş vergisi: sahip olunan her geçit, rotadan bağımsız gelir üretir.
       Kavrulmuş toprak vergi toplayamaz. */
    var vergi=0;
    GECITLER.forEach(function(g){
      if(g.regionId<0) return;
      var r=regions[g.regionId];
      if(r && r.owner==="player" && !isScorched(r)) vergi+=GECIT_VERGI;
    });
    goldGain+=vergi;
    state.ticaret+=vergi;
    state.sonVergi=vergi;

    /* Phase 4: riskli hat bir tehdittir, sadece az kazandırmaz. Her riskli
       konvoy turda küçük bir ihtimalle vurulur ve yükünü kaybeder. Oyuncunun
       kararı: hattı koru mu, riski göze al mı? */
    if(rd.riskli>0 && rastgele() < Math.min(0.35, 0.10*rd.riskli)){
      var kayip=Math.min(state.gold, 6+randInt(0,8));
      if(kayip>0){
        state.gold-=kayip; state.konvoyKaybi+=kayip;
        bildir(3, "🚚 Konvoy baskına uğradı — "+kayip+" altın gitti. Riskli hattı koru.", "ikmal");
      }
    }

    var expansionBonus=Math.floor(ownedCount/GENISLEME_BOLEN);
    armyGain += expansionBonus;

    /* Asker tavanı: taban + fethedilen toprak + Kent'ler. Tavana yaklaştıkça
       üretim yavaşlar (OpenFront'un nüfus eğrisi gibi) — sonsuz yığınak yok,
       ordu büyütmek için toprak ya da Kent gerekir. */
    var cap=TAVAN_TABAN + ownedCount*TAVAN_IL;
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
    var idari=Math.floor(ownedCount/IDARI_BOLEN);
    var bakim=Math.ceil(state.army/BAKIM_BOLEN)+idari;
    state.sonIdari=idari;
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
    /* Rota ve ikmal her turda değil, yalnızca gerçekten değişmiş olabilecekse
       yeniden hesaplanıyor: bir kavrulma süresi dolmuşsa. Sahiplik ve bina
       değişimleri zaten kendi yerlerinde invalidateRoutes() çağırıyor. */
    var kavrulmaBitti=false;
    for(var ri=0; ri<regions.length; ri++){
      if(regions[ri].scorched===state.turn){ kavrulmaBitti=true; break; }
    }
    if(kavrulmaBitti) invalidateRoutes();
    /* Sahiplik katmanı tur içinde değişmez; ikmal ve tehdit katmanları
       garnizon/ikmal ile birlikte değişebildiği için onlarda tazeleniyor.
       Böylece arazi her turda değil, gerektiğinde yeniden boyanıyor. */
    if(kavrulmaBitti || aktifKatman==="ikmal" || aktifKatman==="tehdit") araziKirlet();
    if(net>0) showGoldPopup(net);
    gecitZaferKontrol();
    if(state.turn % KAYIT_PERIYOT === 0) kaydet();
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
    state.sonrakiBaskin=Date.now()+LOOP.raid;
    if(state.gameOver || state.durakladi || animating) return;

    var havuz=baskinHedefleri();
    var target=null, lastStand=false, icBaskin=false;
    if(havuz.sinir.length && (!havuz.zayif.length || rastgele()<0.75)){
      target=havuz.sinir[randInt(0,havuz.sinir.length-1)];
    } else if(havuz.zayif.length){
      target=havuz.zayif[randInt(0,havuz.zayif.length-1)];
      icBaskin=true;                       // ikmalsiz iç bölgeye sızma
    } else {
      var cap=regions[0];
      if(cap.owner!=="player") return;
      // Komşuysa normal kuşatma; değilse ancak derin baskın turundan sonra.
      if(!isAdjacentToEnemy(cap) && state.turn<DERIN_BASKIN_TUR) return;
      target=cap; lastStand=true;
    }

    var adaylar=saldirabilecekBotlar(target);
    var saldiranBot=adaylar.length ? adaylar[randInt(0,adaylar.length-1)] : null;
    if(!saldiranBot){
      /* İç sızma ve derin baskında saldırgan hedefe komşu olmak zorunda
         değil: akıncı hattın gerisine iner. Yalnızca sınır baskınında
         komşuluk şartı korunur — ateşkes orada gerçek bir kalkandır. */
      if(!icBaskin && !lastStand) return;
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
    if(rastgele()<smartChance){
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
      /* Ödül yalnızca cephede kazanılan savunma için: başkent kuşatmasını
         atlatmak bir zafer değil, hayatta kalmaktır. Ölçümde hiç hamle
         yapmayan oyuncunun püskürtmelerden altın biriktirdiği görüldü. */
      if(!lastStand) state.gold+=PUSKURTME_ODUL;
      addBurst(c.x, c.y, 10, ["#5fa87f","#cfc4a4"], 1.1, 520);
      ses("savunma");
      showToast("🛡️ "+atk.icon+" "+atk.name+" püskürtüldü! "+
        (def.notes.length?BUILDINGS[def.notes[0].key].name+" işini gördü. ":"")+
        (lastStand ? "Başkent dayandı." : "(+"+PUSKURTME_ODUL+" altın)"));
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
        halkaEkle(c.x, c.y, "#e0603c", 3, 30);        // başkent nabzı
        centerOnAnchor(target.anchor);                // gözü oraya çek
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
      if(gecitMi){ halkaEkle(c.x, c.y, "#e0603c", 3, 34); }
      bildir(gecitMi?4:3,
        (gecitMi?"⛰ ":"🚨 ")+komutan(saldiranBot).ad+" "+target.name+"'i aldı — "+
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
    // Sıklık hem zorluktan hem komutanın doktrininden geliyor.
    var chance = diff.reinforceStep*0.07*((KOMUTANLAR[bot.difficulty]||{}).tahkimCarpan||1);
    if(rastgele()>chance) return false;

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
      showToast("🏗️ "+komutan(bot).ad+" "+hedef.name+"'e "+BUILDINGS[yeni].name+" dikti.");
    }
    return true;
  }

  /* ---- Bot–bot çatışması ----
     Eski sürümde botlar birbirine hiç dokunmuyordu; oyuncu hamle yapmazsa
     harita donuyordu. Artık belirgin biçimde güçlü olan komşu cephe, zayıfın
     bir ilini alabiliyor. Oyuncu için de bilgi: haritadaki denge kendi
     kendine değişiyor, bir cephe büyürse asıl tehdit o oluyor. */
  var BOT_BOT_ORAN=1.5, BOT_BOT_SANS=0.22;
  /* Ölçümde çıkan boşluk: hiç temas kurmayan oyuncu hiç baskın yemiyordu,
     yani "hiçbir şey yapmamak" hâlâ güvenliydi. Belirli bir turdan sonra
     akıncılar derinlere sızabiliyor — ama önce uzun bir hazırlık dönemi
     tanınıyor ki yeni oyuncu ilk dakikalarda ezilmesin. */
  var DERIN_BASKIN_TUR=60;
  var BOT_KAYNAK_TUR=50;   // botlar bu turdan sonra kaynak illerine de yayılır
  function botBotCatismasi(bot){
    if(rastgele()>BOT_BOT_SANS) return false;
    var kendi=regions.filter(function(r){ return r.botId===bot.id && r.owner==="enemy"; });
    if(!kendi.length) return false;

    var adaylar=[];
    kendi.forEach(function(r){
      r.neighbors.forEach(function(nid){
        var n=regions[nid];
        if(n.owner!=="enemy" || n.botId==null || n.botId===bot.id) return;
        var rakip=bots[n.botId];
        if(!rakip || bot.power < rakip.power*BOT_BOT_ORAN) return;
        adaylar.push(n);
      });
    });
    if(!adaylar.length) return false;

    var hedef=adaylar[randInt(0,adaylar.length-1)];
    var eski=bots[hedef.botId];
    hedef.botId=bot.id;
    hedef.defense=clamp(Math.round(hedef.defense*0.8)+2, 3, 52);
    if(hedef.defenses.length) hedef.defenses.pop();
    if(isScouted(hedef)){
      bildir(2, "⚔ "+komutan(bot).ad+", "+komutan(eski).ad+"'ın elindeki "+
                hedef.name+"'i aldı — cepheler kendi arasında da savaşıyor.");
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

      if(botKarar(bot, diff, owned)) changed=true;
    });
    if(changed) drawMap();
  }

  /* ================= BOT KARAR AĞACI =================
     Şartname §15. Bot turda TEK eylem yapar — eskiden aynı turda hem
     takviye ediyor hem tahkim ediyor hem yayılıyordu, bu da hem okunmaz
     hem haksız bir rakip üretiyordu. Sıra: önce tehdidi değerlendir, sonra
     kişiliğe göre tek bir hamle seç. Bot yalnızca oyuncunun da haritada
     görebileceği bilgiyi kullanır — hile yok. */
  function botTehdit(bot, owned){
    /* Cephe hattındaki oyuncu baskısı: bota komşu kendi bölgelerinin
       toplam etkin savunması. Oyuncunun altını ya da keşfetmediği
       tahkimatı bilinmez. */
    var baski=0, temas=0;
    owned.forEach(function(r){
      r.neighbors.forEach(function(nid){
        var n=regions[nid];
        if(n.owner!=="player") return;
        temas++;
        baski+=effectiveDefense(n);
      });
    });
    return {baski:baski, temas:temas,
            guc:owned.reduce(function(a,r){ return a+r.defense; },0)};
  }

  function botTakviye(bot, diff, owned, tehditAltinda){
    /* Tehdit varsa cephe hattını, yoksa rastgele bir ili güçlendirir. */
    var havuz=owned;
    if(tehditAltinda){
      var cephe=owned.filter(function(r){
        var yakin=false;
        r.neighbors.forEach(function(nid){ if(regions[nid].owner==="player") yakin=true; });
        return yakin;
      });
      if(cephe.length) havuz=cephe;
    }
    var hedef=havuz[randInt(0,havuz.length-1)];
    var once=hedef.defense;
    var adim=Math.max(1, Math.round(diff.reinforceStep*(tehditAltinda?1.2:0.6)));
    hedef.defense=clamp(hedef.defense+adim, 3, 50);
    return hedef.defense!==once;
  }

  function botKarar(bot, diff, owned){
    var t=botTehdit(bot, owned);
    var kom=komutan(bot);

    /* 1. Tehdit değerlendirmesi: cephede oyuncu belirgin üstünse
       genişlemek yerine hattı sağlamlaştırır. */
    var tehditAltinda = t.temas>0 && t.baski > t.guc*0.8;
    if(tehditAltinda){
      // Tahkim mi takviye mi? Zor komutan tahkimatı tercih eder.
      if(rastgele() < 0.35*(kom.tahkimCarpan||1) && botFortify(bot, diff, owned)) return true;
      return botTakviye(bot, diff, owned, true);
    }

    /* 2. Fırsat: zayıf komşu cepheyi yutmak (bot–bot). */
    if(botBotCatismasi(bot)) return true;

    /* 3. Doktrine göre yayılma. */
    if(rastgele()<diff.expandChance && botYayil(bot, diff, owned)) return true;

    /* 4. Yayılacak yer yoksa tahkim; o da olmazsa takviye. */
    if(rastgele() < 0.5*(kom.tahkimCarpan||1) && botFortify(bot, diff, owned)) return true;
    return botTakviye(bot, diff, owned, false);
  }

  function botYayil(bot, diff, owned){
        /* Boş toprak bitince botlar donuyordu ve harita ölü bir dengeye
           oturuyordu (ölçümde görüldü). Belirli bir turdan sonra kaynak
           illeri de hedef olabiliyor — düşük ağırlıkla, yani oyuncunun
           genişleme alanı erken oyunda korunuyor. */
        var candidates=[];
        var kaynakAcik = state.turn>=BOT_KAYNAK_TUR;
        owned.forEach(function(r){
          r.neighbors.forEach(function(nid){
            var nr=regions[nid];
            if(nr.owner!=="neutral") return;
            if(nr.type==="empty") candidates.push(nr);
            else if(kaynakAcik && nr.type==="resource") candidates.push(nr);
          });
        });
        if(candidates.length){
          /* Yayılma rastgele değil, KOMUTANIN doktrinine göre ağırlıklı.
             Demirkapı geçide, Kervanbaşı senin ticaret hattına yönelir.
             Ağırlık sert kural değil: rakip okunabilir kalır, hile yapmaz —
             yalnızca oyuncunun da haritada görebildiği bilgiyi kullanır. */
          var kom=komutan(bot);
          var rotaUstu={};
          workerRoutes.forEach(function(rt){
            if(rt.durum==="kesildi") return;
            rt.nodes.forEach(function(id){
              regions[id].neighbors.forEach(function(nid){ rotaUstu[nid]=true; });
            });
          });
          var puanli=candidates.map(function(c){
            var p = c.type==="resource" ? 0.6 : 1;    // kaynak ili son çare
            if(c.gecit) p+=kom.gecitAgirlik||4;
            if(rotaUstu[c.id]) p+=kom.rotaAgirlik||3;
            if(isAdjacentToPlayer(c)) p+=2;           // temas kurmaya eğilim
            return {r:c, p:p};
          });
          var toplamP=0; puanli.forEach(function(x){ toplamP+=x.p; });
          var sec=rastgele()*toplamP, target=puanli[0].r;
          for(var pi=0; pi<puanli.length; pi++){
            sec-=puanli[pi].p;
            if(sec<=0){ target=puanli[pi].r; break; }
          }
          target.type="enemy";
          target.owner="enemy";
          target.botId=bot.id;
          // Geçit aldıysa daha sıkı tutuyor — oyuncu geri almak için bedel ödesin.
          target.defense=clamp(bot.power + randInt(-2,2) + (target.gecit?6:0), 3, 52);
          if(target.gecit){
            var hc=regionCenter(target);
            halkaEkle(hc.x, hc.y, "#e0603c", 2, 30);
            bildir(4, "⛰ "+komutan(bot).ad+" "+target.gecit.ad+"'nı aldı — geçit ağında gedik açıldı.", "gecit");
          }
          invalidateRoutes();
          return true;
        }
    return false;
  }

  function startLoops(){
    state.started=true;
    state.sonrakiBaskin=Date.now()+LOOP.raid;
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

  /* ================= KAYIT VE DEVAM =================
     Şartname §16. Harita piksel piksel saklanmaz — tohumdan yeniden üretilir,
     üstüne yalnızca değişen alanlar yazılır. Bozuk ya da eski sürümlü kayıt
     sessizce temizlenir; oyun hiçbir durumda kayıt yüzünden engellenmez. */
  var KAYIT_ANAHTAR="bf_sefer", KAYIT_SURUM=1, KAYIT_PERIYOT=10;

  function kayitPaketle(){
    return {
      surum:KAYIT_SURUM,
      zaman:Date.now(),
      mod:activeMode,
      tohum:state.tohum,
      s:{
        gold:state.gold, army:state.army, maxArmy:state.maxArmy, turn:state.turn,
        raidCount:state.raidCount, ticaret:state.ticaret, konvoyKaybi:state.konvoyKaybi,
        fetih:state.fetih, bakimToplam:state.bakimToplam, gecitSayaci:state.gecitSayaci,
        lastExpansionBonus:state.lastExpansionBonus, olaylar:state.olaylar.slice(-20)
      },
      b:regions.map(function(r){
        /* Tip'in yanında o tipi anlamlı kılan alanlar da saklanıyor: kaynak
           türü, bedel ve üretim. Aksi hâlde kayıt "burası kaynak bölgesi"
           derken yeniden üretilen dünyada karşılığı olmayabiliyor ve çizim
           çöküyordu. */
        return {i:r.id, o:r.owner, t:r.type, g:r.garrison||0, y:r.building||null,
                d:r.defense||null, f:(r.defenses||[]).slice(), k:r.kesif||0, c:r.scorched||0,
                rk:r.resKind||null, bd:r.cost||null, gb:r.goldBonus||null};
      }),
      bo:bots.map(function(b){ return {i:b.id, z:b.difficulty, g:b.power, a:b.ateskes||0}; })
    };
  }

  function kaydet(){
    if(!state.started || state.gameOver) return false;
    try{
      localStorage.setItem(KAYIT_ANAHTAR, JSON.stringify(kayitPaketle()));
      return true;
    }catch(e){ return false; }
  }
  function kaydiSil(){
    try{ localStorage.removeItem(KAYIT_ANAHTAR); }catch(e){}
  }
  function kayitOku(){
    var ham=null;
    try{ ham=localStorage.getItem(KAYIT_ANAHTAR); }catch(e){ return null; }
    if(!ham) return null;
    try{
      var k=JSON.parse(ham);
      if(!k || k.surum!==KAYIT_SURUM || !k.b || !k.b.length || !k.s) { kaydiSil(); return null; }
      return k;
    }catch(e){ kaydiSil(); return null; }
  }

  /* Kayıttan seferi kur: tohumla aynı dünyayı üret, sonra değişenleri yaz. */
  function kayittanYukle(k){
    if(!k) return false;
    try{
      if(k.mod && MODES[k.mod]){
        activeMode=k.mod;
        LOOP.tick=MODES[k.mod].tick; LOOP.raid=MODES[k.mod].raid; LOOP.bot=MODES[k.mod].bot;
      }
      tohumAyarla(k.tohum);
      dunyaSifirla();
      generateWorld();
      state.tohum=k.tohum;

      Object.keys(k.s).forEach(function(alan){ state[alan]=k.s[alan]; });
      state.olaylar=(k.s.olaylar||[]).slice();

      k.b.forEach(function(kb){
        var r=regions[kb.i];
        if(!r) return;
        r.owner=kb.o; r.type=kb.t; r.garrison=kb.g; r.building=kb.y;
        if(kb.d!=null) r.defense=kb.d;
        r.defenses=kb.f||[]; r.kesif=kb.k||0; r.scorched=kb.c||0;
        if(kb.rk!=null) r.resKind=kb.rk;
        if(kb.bd!=null) r.cost=kb.bd;
        if(kb.gb!=null) r.goldBonus=kb.gb;
        // Tutarsız kayıt oyunu çökertmesin: kaynak türü yoksa boş toprak say.
        if(r.type==="resource" && !RESOURCE_KINDS[r.resKind]){
          r.type="empty"; r.resKind=null;
          if(r.cost==null) r.cost=15+Math.floor(r.pixels.length/15);
        }
      });
      (k.bo||[]).forEach(function(kbot){
        var b=bots[kbot.i];
        if(!b) return;
        b.difficulty=kbot.z; b.power=kbot.g; b.ateskes=kbot.a||0;
      });
      // Bot sahipliği bölgelerden yeniden türetiliyor (kayıtta taşınmıyor).
      regions.forEach(function(r){
        if(r.owner==="enemy" && r.id!==1 && r.botId==null && bots.length){
          r.botId=randInt(0,bots.length-1);
        }
      });
      invalidateRoutes();
      drawMap();
      return true;
    }catch(e){
      kaydiSil();
      return false;
    }
  }

  /* Lobi bu iki kapıyı kullanıyor. */
  window.__bfKayitOzet=function(){
    var k=kayitOku();
    if(!k) return null;
    var il=k.b.filter(function(b){ return b.o==="player"; }).length;
    return {mod:(MODES[k.mod]||{}).name||k.mod, tur:k.s.turn||0, il:il, zaman:k.zaman};
  };
  window.__bfDevamEt=function(){
    var k=kayitOku();
    if(!k) return false;
    if(!kayittanYukle(k)) return false;
    startLoops();
    bildir(2, "📁 Sefer kaldığı yerden sürüyor — "+state.turn+". tur.");
    return true;
  };

  /* ================= Modals ================= */
  var modalOverlay=document.getElementById("modal-overlay");
  var modalBox=document.getElementById("modal-box");

  /* ================= Yardım ekranı =================
     Tamamen METİN KATMANI'ndan üretiliyor: burada elle yazılmış tek bir denge
     sayısı yok. Denge değişince bu ekran kendiliğinden doğru kalıyor —
     eski sürümün en ciddi hata sınıfı (oyuncuya yanlış kural öğretmek)
     böylece yapısal olarak kapanıyor. */
  function yardimSatiri(ikon, baslik, kunye, aciklama){
    return "<div class='yd-satir'>"+
      "<span class='yd-ikon'>"+ikon+"</span>"+
      "<span class='yd-govde'>"+
        "<b>"+baslik+"</b>"+
        (kunye ? "<span class='yd-kunye'>"+kunye+"</span>" : "")+
        (aciklama ? "<span class='yd-ac'>"+aciklama+"</span>" : "")+
      "</span></div>";
  }
  function yardimBolum(baslik, icerik){
    return "<section class='yd-bolum'><h3>"+baslik+"</h3>"+icerik+"</section>";
  }

  function showInstructions(isFirstTime){
    var h=[];

    /* --- Amaç: moda göre, sabit cümle değil --- */
    h.push("<h2>"+(isFirstTime?"Sefer Brifingi":"Nasıl Oynanır")+"</h2>");

    /* Brifing yalnızca sefere girerken: karşındakiler kim, ne yaparlar.
       İki cümleyi geçmez (şartname §13 metin bütçesi). */
    if(isFirstTime && bots.length){
      h.push("<div class='brifing'>"+
        "<div class='brf-bas'>Karşı cepheler</div>"+
        bots.map(function(b){
          var k=komutan(b);
          return "<div class='brf-satir'>"+
            "<span class='brf-nokta' style='background:"+BOT_COLORS[b.difficulty]+"'></span>"+
            "<span class='brf-govde'><b>"+k.ad+"</b> <em>"+k.unvan+"</em>"+
            "<span class='brf-imza'>"+k.imza+"</span></span></div>";
        }).join("")+
      "</div>");
    }
    h.push("<div class='yd-hedef'>"+
      "<span class='yd-hedef-et'>Bu seferin amacı</span>"+
      "<b>"+zaferKunye()+"</b>"+
      "<span class='yd-hedef-alt'>"+yenilgiKunye()+"</span></div>");

    /* --- Harita --- */
    h.push(yardimBolum("Harita",
      yardimSatiri("🟩","Boş toprak", "savaşsız · altınla alınır",
        "Genişlemenin ucuz yolu: her il asker tavanını ve üretimini artırır.")+
      yardimSatiri("⚒️","Kaynak bölgesi", "kalıcı altın üretir",
        "Maden, tarım veya orman. Botlar bu illere dokunmaz.")+
      yardimSatiri("🪖","Düşman karakolu", "garnizon + tahkimat",
        "Başkentten uzaklaştıkça sertleşir.")+
      yardimSatiri("⛰️","Dağ ve deniz", "geçilmez",
        "Dağ komşusu, yanındaki ilin savunmasını güçlendirir ve nükleer patlamayı keser.")+
      yardimSatiri("🏔","Geçit", GECITLER.length+" adet · "+gecitKunye(),
        GECITLER.map(function(g){ return g.ad; }).join(" · "))
    ));

    /* --- Ekonomi --- */
    var binaGelir=Object.keys(BUILDINGS).filter(function(k){
      return BUILDINGS[k].gold || BUILDINGS[k].army;
    }).map(function(k){
      return BUILDINGS[k].name+" ("+binaAciklama(k)+")";
    }).join(" · ");
    h.push(yardimBolum("Ekonomi",
      yardimSatiri("🪙","Gelir", ekonomiKunye(), binaGelir)+
      yardimSatiri("🚚","Ticaret rotaları", rotaKunye(),
        "Rota, başkentten üretim iline kendi toprağından geçen yoldur. Hattın bir düğümü düşman sınırındaysa riskli sayılır ve konvoy baskına uğrayabilir.")+
      yardimSatiri("💸","Ordu bakımı", bakimKunye(),
        "Hazine bakımı karşılamazsa asker firar eder. Büyük ordu tutmak bir karardır.")
    ));

    /* --- Ordu ve saldırı --- */
    h.push(yardimBolum("Ordu",
      yardimSatiri("👥","Asker tavanı", tavanKunye(), null)+
      yardimSatiri("⚔","Taarruz alt sınırı", taarruzKunye(),
        "Bunun altındaki bir kol garnizonu aşındırmaz; taarruz düzenlenmez.")+
      yardimSatiri("🏰","Başkent",
        "doğuştan +"+BASKENT_SAVUNMA+" direnç · "+BASKENT_GARNIZON+" garnizonla başlar",
        "Surları var ama sonsuz değil: baskın gücü büyüdükçe takviye ister.")+
      yardimSatiri("🛡️","Takviye", "ordudan bölgeye kalıcı garnizon",
        "Garnizonsuz ve tahkimatsız sınır ili tek baskında düşer. Başkent de dahil.")
    ));

    h.push(yardimBolum("Saldırı tipleri",
      ATTACK_KEYS.map(function(k){
        return yardimSatiri(ATTACKS[k].icon, ATTACKS[k].name, saldiriKunye(k), ATTACKS[k].desc);
      }).join("")
    ));

    h.push(yardimBolum("Tahkimat",
      DEFENSIVE.map(function(k){
        return yardimSatiri(symbolImg(k,"sym-img yd-sym"), BUILDINGS[k].name,
          BUILDINGS[k].cost+" altın", binaAciklama(k));
      }).join("")+
      yardimSatiri("🏭","Üretim ve destek yapıları",
        Object.keys(BUILDINGS).filter(function(k){ return DEFENSIVE.indexOf(k)<0; })
          .map(function(k){ return BUILDINGS[k].name+" "+BUILDINGS[k].cost; }).join(" · ")+" altın",
        "Bir bölgeye yalnızca tek yapı kurulabilir — asıl kısıt budur.")
    ));

    /* --- Konum ve ikmal: oyunun tezi --- */
    h.push(yardimBolum("Konum ve ikmal",
      yardimSatiri("🧭","Kuşatma ve arazi", konumKunye(),
        "Aynı orduyla iki komşudan dayanmak, hedefe yığınmaktan ucuzdur.")+
      yardimSatiri("⛽","İkmal", ikmalKunye(),
        "Uzun ve beslenmeyen çıkıntı hem az üretir hem saldırıyı pahalılaştırır; ayrıca baskın hedefi olur.")
    ));

    /* --- İstihbarat --- */
    h.push(yardimBolum("İstihbarat ve diplomasi",
      yardimSatiri("❓","Keşif", kesifKunye(),
        "Sınırına dayandığın bölgeyi aralık olarak görürsün; keşif kesin sayıyı ve tahkimat tiplerini açar.")+
      yardimSatiri("🤝","Ateşkes", ateskesKunye(),
        "Bir cepheyi kapatıp diğerine yığınmanın tek yolu. Diplomasi sekmesinden ya da bölgeye sağ tıklayarak.")
    ));

    /* --- Nükleer --- */
    h.push(yardimBolum("Nükleer",
      NUKE_KEYS.map(function(k){
        return yardimSatiri("☢", NUKES[k].name, nukeKunye(k), NUKES[k].desc);
      }).join("")+
      yardimSatiri("🔥","Ne yapar",
        BUILDINGS[NUKE_REQUIRES].name+" ister · toprağı "+SCORCH_TURNS+" tur üretimsiz bırakır",
        "Bölgeyi ele geçirmez, yakar: garnizonu eritir, tahkimatı yıkar. Dağlar patlamayı keser, alana giren kendi bölgelerin de yanar.")+
      yardimSatiri("🛡️","SAM önlemesi",
        "hedefte veya komşusunda "+BUILDINGS.hava.name,
        "Önleyen hava savunması bu işte tükenir; ikinci füzen geçer. Termonükleer için iki tanesi gerekir.")
    ));

    /* --- Kontroller --- */
    h.push(yardimBolum("Kontroller",
      yardimSatiri("👆","Harita", "dokun seç · sürükle kaydır · iki parmak yakınlaştır",
        "Sağ tık (mobilde basılı tutma) bölgenin eylem menüsünü açar.")+
      yardimSatiri("🏗️","İnşa", "kartı bölgeye sürükle",
        "Menü sekmesindeki tepsiden. Füzeler aynı tepsinin kırmızı bölümünde.")+
      yardimSatiri("⌨️","Kısayollar", "P duraklat · F1 yardım · Esc kapat", null)
    ));

    h.push("<button id='start-btn'>"+(isFirstTime?"Anladım, seferi başlat":"Kapat")+"</button>");

    modalBox.className="modal-box yardim";
    modalBox.innerHTML=h.join("");
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

  /* Sefer neden bitti? Uydurma bir cümle değil, seferin kendi verisinden
     kuruluyor (şartname §26.9). */
  function seferGerekce(kazandi){
    var h=(MODES[activeMode]||{}).hedef||{tip:"baskent"};
    var gd=gecitDurumu(), rd=rotaDurumu();
    if(kazandi){
      if(h.tip==="gecit"){
        return "Geçit ağını "+(h.tut||GECIT_TUTMA)+" tur boyunca elinde tuttun: "+
          gd.tut+"/"+gd.toplam+" geçit sende kaldı ve "+state.raidCount+" baskın bunu değiştiremedi.";
      }
      return "Düşman başkentini "+state.turn+". turda aldın; "+state.fetih+
        " il fethettin ve "+state.raidCount+" baskını göğüsledin.";
    }
    var acikVardi=state.olaylar.filter(function(o){ return o.metin.indexOf("düştü")>=0 || o.metin.indexOf("aldı")>=0; }).length;
    return "Başkentin "+state.turn+". turda düştü. "+
      (acikVardi ? acikVardi+" bölgeni kaybettikten sonra savunacak hattın kalmamıştı."
                 : "Başkentini garnizonsuz bırakmak seferi bitirdi.")+
      (rd.kesildi ? " Son turlarda "+rd.kesildi+" ticaret hattın da kesikti." : "");
  }

  /* Seferin dönüm noktaları: kroniğin yalnızca en ağır beş kaydı. */
  function donumNoktalari(){
    var onemli=state.olaylar.filter(function(o){ return o.seviye>=3; }).slice(-5);
    if(!onemli.length) return "";
    return "<div class='donum'><div class='donum-bas'>Seferin dönüm noktaları</div>"+
      onemli.map(function(o){
        return "<div class='donum-satir sv"+o.seviye+"'><span class='kr-tur'>T"+o.tur+"</span>"+
               "<span>"+o.metin+"</span></div>";
      }).join("")+"</div>";
  }

  function sonucEkrani(kazandi, ikon, baslik){
    clearInterval(tickTimer); clearInterval(raidTimer); clearInterval(botTimer);
    kaydiSil();                    // biten sefer devam ettirilemez
    modalBox.className="modal-box "+(kazandi?"victory":"defeat");
    modalBox.innerHTML =
      "<div class='big'>"+ikon+"</div>"+
      "<h2>"+baslik+"</h2>"+
      "<div class='sonuc-gerekce'>"+seferGerekce(kazandi)+"</div>"+
      seferRaporu()+
      donumNoktalari()+
      "<button id='restart-btn'>Yeni sefer</button>"+
      "<button id='lobi-btn' class='ikincil'>Lobiye dön</button>";
    modalOverlay.classList.add("show");
    document.getElementById("restart-btn").addEventListener("click", function(){ location.reload(); });
    document.getElementById("lobi-btn").addEventListener("click", function(){ location.reload(); });
  }

  function showDefeat(){
    if(state.gameOver) return;
    state.gameOver=true;
    ses("yenilgi");
    olayEkle(4, "Sefer kaybedildi — başkent düştü.");
    sonucEkrani(false, "🏳️💥", "Başkentin Düştü");
  }

  function showVictory(){
    if(state.gameOver) return;
    state.gameOver=true;
    ses("zafer");
    bfStatBump("kazanildi");
    olayEkle(4, "Sefer kazanıldı.");
    sonucEkrani(true, "🎉👑", "Zafer");
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

  /* ---- HUD göstergeleri: her biri kendi paneline açılan kapı ---- */
  [["hud-gold", openEkonomiSheet], ["hud-army", openArmySheet],
   ["hud-supply", openIkmalSheet], ["hud-gate", openGecitSheet],
   ["hud-turn", openKronikSheet]].forEach(function(ikili){
    var el=document.getElementById(ikili[0]);
    if(!el) return;
    el.addEventListener("click", function(){
      if(!state.started) return;
      if(window.__bfSes) window.__bfSes("uiTik");
      ikili[1]();
    });
  });

  /* ---- Katman seçici ---- */
  var katmanKap=document.getElementById("katman-secici");
  if(katmanKap){
    katmanKap.addEventListener("click", function(e){
      var btn=e.target.closest ? e.target.closest(".kt") : null;
      if(btn) katmanAyarla(btn.dataset.kt);
    });
  }

  /* ---- Seçim şeridini bırak ---- */
  var ssKapat=document.getElementById("ss-kapat");
  if(ssKapat){
    ssKapat.addEventListener("click", function(){
      secimAyarla(null); secimSeridi(null); drawMap();
    });
  }

  /* ---- Baskın geri sayımı ----
     Baskın artık sürpriz değil: HUD'un altındaki ince şerit bir sonraki
     baskına kalan süreyi gösteriyor, böylece bekleme süresi hazırlık
     süresine dönüşüyor (şartname §26.4). Duraklatmada donuyor. */
  var raidFill=document.getElementById("raid-fill");
  var sonOlcum=Date.now();
  setInterval(function(){
    var simdi=Date.now(), fark=simdi-sonOlcum;
    sonOlcum=simdi;
    if(!state.started || state.gameOver) return;
    if(state.durakladi){ state.sonrakiBaskin+=fark; return; }
    if(!raidFill) return;
    var kalan=Math.max(0, state.sonrakiBaskin-simdi);
    var oran=1-Math.min(1, kalan/LOOP.raid);
    raidFill.style.width=(oran*100).toFixed(1)+"%";
    raidFill.className = "raid-fill"+(kalan<5000 ? " yakin" : "");
  }, 250);

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
    } else if(k==="ArrowLeft" || k==="ArrowRight" || k==="ArrowUp" || k==="ArrowDown"){
      if(!state.started) return;
      e.preventDefault();
      klavyeYon(k==="ArrowLeft"?-1:(k==="ArrowRight"?1:0),
                k==="ArrowUp"?-1:(k==="ArrowDown"?1:0));
    } else if(k==="Enter" || k===" "){
      if(!state.started || !currentSel) return;
      if(sheet && sheet.classList.contains("open")) return;
      e.preventDefault();
      onRegionTap(currentSel.id);
    } else if(k>="1" && k<="5"){
      if(!state.started) return;
      e.preventDefault();
      katmanAyarla(KATMANLAR[parseInt(k,10)-1]);
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

  /* Panellerde tekrar eden etiket:değer satırı. */
  function satir(etiket, deger, sinif){
    return "<div class='stat-row"+(sinif?" "+sinif:"")+"'><span>"+etiket+"</span><b>"+deger+"</b></div>";
  }
  function kapatDugmesi(){
    return "<button class='action-btn' id='bb-sheet-close'><span><span class='a-name'>Kapat</span></span></button>";
  }
  function kapatBagla(){
    var b=document.getElementById("bb-sheet-close");
    if(b) b.addEventListener("click", closeSheet);
  }

  /* ---- ORDU ----
     Eski panel "Altın / tur" diye kasadaki toplamı basıyordu. Artık gerçek
     dökümü veriyor ve tavanın neyden oluştuğunu gösteriyor. */
  function openArmySheet(){
    var binaAsker=0, kentSayisi=0, ownedCount=0;
    regions.forEach(function(r){
      if(r.owner!=="player") return;
      ownedCount++;
      if(r.building && BUILDINGS[r.building].army && !isScorched(r)) binaAsker+=BUILDINGS[r.building].army;
      if(r.building && BUILDINGS[r.building].popCap && !isScorched(r)) kentSayisi++;
    });
    var garnizon=0, garnizonlu=0;
    regions.forEach(function(r){ if(r.owner==="player" && r.garrison>0){ garnizon+=r.garrison; garnizonlu++; } });
    var genisleme=Math.floor(ownedCount/GENISLEME_BOLEN);
    var doluluk=state.maxArmy ? Math.round(state.army/state.maxArmy*100) : 0;
    var guc=baskinGucu();

    var acik=regions.filter(function(r){
      return r.owner==="player" && r.type!=="capital" && isAdjacentToEnemy(r) &&
             !(r.garrison>0) && !defenseStructures(r).length;
    });

    var html=
      satir("Sahra ordusu", state.army+" 🪖")+
      satir("Asker tavanı", state.maxArmy+" · %"+doluluk+" dolu")+
      satir("Tavan bileşenleri", TAVAN_TABAN+" taban + "+ownedCount+"×"+TAVAN_IL+" il"+
            (kentSayisi?" + "+kentSayisi+"×"+BUILDINGS.kent.popCap+" kent":""))+
      satir("Üretim / tur", "+"+(BASKENT_ASKER+binaAsker+genisleme)+
            " <small>(başkent "+BASKENT_ASKER+" · bina "+binaAsker+" · genişleme "+genisleme+")</small>")+
      satir("Bakım gideri", state.sonBakim+" altın/tur", state.sonBakim>state.sonUretim?"kotu":"")+
      "<div class='sheet-divider'></div>"+
      satir("Garnizondaki asker", garnizon+" 🪖 · "+garnizonlu+" bölgede")+
      satir("Beklenen baskın gücü", guc+" 🪖", "vurgu")+
      (acik.length
        ? "<div class='panel-uyari'>⚠️ "+acik.length+" sınır bölgen garnizonsuz ve tahkimatsız — "+
          "ilk baskında düşer: <b>"+acik.slice(0,3).map(function(r){return r.name;}).join(", ")+
          (acik.length>3?" …":"")+"</b></div>"
        : "<div class='panel-olumlu'>✅ Bütün sınır bölgelerinin ya garnizonu ya tahkimatı var.</div>");
    openSheet("🪖","Ordu", tavanKunye(), html+kapatDugmesi());
    kapatBagla();
  }

  /* ---- EKONOMİ ---- */
  function openEkonomiSheet(){
    var kaynak=0, binaAltin=0;
    regions.forEach(function(r){
      if(r.owner!=="player" || isScorched(r)) return;
      var ik=(r.ikmal==null?100:r.ikmal)/100;
      if(r.type==="resource") kaynak+=r.goldBonus*ik;
      if(r.building && BUILDINGS[r.building].gold) binaAltin+=BUILDINGS[r.building].gold*ik;
    });
    var rd=rotaDurumu();
    var html=
      satir("Kasa", state.gold+" 🪙")+
      satir("Net gelir / tur", (state.sonGelir>=0?"+":"")+state.sonGelir+" 🪙",
            state.sonGelir<0?"kotu":"vurgu")+
      "<div class='sheet-divider'></div>"+
      satir("Başkent", "+"+BASKENT_ALTIN)+
      satir("Kaynak bölgeleri", "+"+Math.round(kaynak))+
      satir("Üretim binaları", "+"+Math.round(binaAltin))+
      satir("Ticaret rotaları", "+"+rd.gelir+" <small>("+rd.guvenli+" güvenli · "+
            rd.riskli+" riskli · "+rd.kesildi+" kesik)</small>")+
      satir("Geçiş vergisi", "+"+(state.sonVergi||0)+" <small>("+gecitDurumu().tut+" geçit)</small>",
            (state.sonVergi||0)>0?"vurgu":"")+
      satir("Ordu ve yönetim gideri", "−"+state.sonBakim+
            " <small>(yönetim "+(state.sonIdari||0)+")</small>", "kotu")+
      "<div class='sheet-divider'></div>"+
      satir("Sefer boyunca ticaret", "+"+state.ticaret)+
      satir("Konvoy kaybı", "−"+state.konvoyKaybi, state.konvoyKaybi?"kotu":"")+
      satir("Toplam bakım", "−"+state.bakimToplam)+
      (rd.riskli ? "<div class='panel-uyari'>🚚 "+rd.riskli+" riskli hattın var: gelir düşük ve her tur konvoy baskını riski taşıyor.</div>":"")+
      (rd.kesildi ? "<div class='panel-uyari'>⛔ "+rd.kesildi+" hat kesik — o üretim bölgelerine kendi toprağından yol kalmamış.</div>":"");
    openSheet("🪙","Ekonomi", rotaKunye(), html+kapatDugmesi());
    kapatBagla();
  }

  /* ---- İKMAL ---- */
  function openIkmalSheet(){
    if(routesDirty) rebuildRoutes();
    var liste=regions.filter(function(r){ return r.owner==="player"; })
      .sort(function(a,b){ return (a.ikmal||0)-(b.ikmal||0); });
    var zayif=liste.filter(function(r){ return (r.ikmal==null?100:r.ikmal)<40; });
    var html=
      satir("Genel ikmal", "%"+genelIkmal(), genelIkmal()<45?"kotu":"vurgu")+
      satir("Beslenen bölge", liste.length+" il")+
      satir("Kritik bölge", zayif.length+" il", zayif.length?"kotu":"")+
      "<div class='sheet-divider'></div>"+
      (liste.slice(0,8).map(function(r){
        var ik=r.ikmal==null?100:r.ikmal;
        return "<button class='action-btn ikmal-satir' data-rid='"+r.id+"'>"+
          "<span><span class='a-name'>"+r.name+(r.gecit?" ⛰":"")+"</span>"+
          "<span class='a-desc'>"+(ik>=70?"İyi":(ik>=40?"Zayıf":"Kritik"))+" · saldırı maliyeti ×"+
          ondalik((1+(1-ik/100)*0.5).toFixed(2))+"</span></span>"+
          "<span class='a-cost'>%"+ik+"</span></button>";
      }).join(""))+
      "<div class='panel-ipucu'>"+ikmalKunye()+"</div>";
    openSheet("⛽","İkmal", "En zayıf bölgeler önce listelenir", html+kapatDugmesi());
    kapatBagla();
    document.querySelectorAll("#sheet-actions .ikmal-satir").forEach(function(btn){
      btn.addEventListener("click", function(){
        var r=regions[parseInt(btn.dataset.rid,10)];
        closeSheet(); katmanAyarla("ikmal");
        if(r){ centerOnAnchor(r.anchor); secimSeridi(r); }
      });
    });
  }

  /* ---- GEÇİTLER ---- */
  function openGecitSheet(){
    if(routesDirty) rebuildRoutes();
    var gd=gecitDurumu();
    var html=
      satir("Elindeki geçit", gd.tut+" / "+gd.toplam, gd.gerek&&gd.tut>=gd.gerek?"vurgu":"")+
      (gd.gerek ? satir("Zafer için gereken", gd.gerek+" geçit · "+
        ((MODES[activeMode].hedef.tut)||GECIT_TUTMA)+" tur tutmak") : "")+
      (state.gecitSayaci!=null ? satir("Zafer sayacı", state.gecitSayaci+" tur", "vurgu") : "")+
      "<div class='sheet-divider'></div>"+
      GECITLER.map(function(g){
        var r = g.regionId>=0 ? regions[g.regionId] : null;
        var sahip = !r ? "—" : (r.owner==="player" ? "Sende"
                    : (r.owner==="enemy" ? "Düşmanda" : "Sahipsiz"));
        var rota = r && rotaUstundeMi(r.id) ? " · rotanda" : "";
        return "<button class='action-btn gecit-satir "+
          (r&&r.owner==="player"?"primary":(r&&r.owner==="enemy"?"danger-action":""))+
          "' data-rid='"+(r?r.id:-1)+"'>"+
          "<span><span class='a-name'>⛰ "+g.ad+"</span>"+
          "<span class='a-desc'>"+(r?r.name:"—")+" · "+sahip+rota+"</span></span>"+
          "<span class='a-cost'>"+(r&&r.owner==="player"?"+"+GECIT_GELIR:"")+"</span></button>";
      }).join("")+
      "<div class='panel-ipucu'>"+gecitKunye()+". Botlar da önce geçitleri hedefler.</div>";
    openSheet("⛰","Geçitler", zaferKunye(), html+kapatDugmesi());
    kapatBagla();
    document.querySelectorAll("#sheet-actions .gecit-satir").forEach(function(btn){
      btn.addEventListener("click", function(){
        var id=parseInt(btn.dataset.rid,10);
        if(id<0) return;
        closeSheet(); katmanAyarla("gecit");
        centerOnAnchor(regions[id].anchor); secimSeridi(regions[id]);
      });
    });
  }

  /* ---- SEFER KRONİĞİ ---- */
  function openKronikSheet(){
    var olaylar=state.olaylar.slice().reverse();
    var html=
      satir("Tur", state.turn)+
      satir("Fethedilen il", state.fetih)+
      satir("Baskın", state.raidCount)+
      "<div class='sheet-divider'></div>"+
      (olaylar.length
        ? olaylar.slice(0,14).map(function(o){
            return "<div class='kronik-satir sv"+o.seviye+"'>"+
              "<span class='kr-tur'>T"+o.tur+"</span><span>"+o.metin+"</span></div>";
          }).join("")
        : "<div class='panel-ipucu'>Henüz kayda değer bir olay yok. Kritik ve stratejik anlar burada birikir.</div>");
    openSheet("◉","Sefer Kroniği", zamanEtiketi(state.turn), html+kapatDugmesi());
    kapatBagla();
  }

  /* ---- DİPLOMASİ ----
     Eski sürümde bu sekme "sistem yok" diyordu; oysa ateşkes çalışıyordu ve
     yalnızca sağ tık menüsünde saklıydı. Artık kendi ekranı var. */
  function openDiplomasiSheet(){
    var satirlar=bots.map(function(bot){
      var owned=regions.filter(function(r){ return r.botId===bot.id && r.owner==="enemy"; });
      if(!owned.length) return "";
      var bedel=ateskesBedeli(bot);
      var aktif=bot.ateskes>state.turn;
      var kalan=aktif ? (bot.ateskes-state.turn) : 0;
      var temas=regions.filter(function(r){
        return r.owner==="player" && isAdjacentToEnemy(r) &&
          Array.from(r.neighbors).some(function(n){ return regions[n].botId===bot.id; });
      }).length;
      return "<div class='cephe-kart"+(aktif?" ateskesli":"")+"'>"+
        "<div class='cephe-bas'><span class='cephe-nokta' style='background:"+BOT_COLORS[bot.difficulty]+"'></span>"+
          "<b>"+komutan(bot).ad+"</b><span class='cephe-unvan'>"+komutan(bot).unvan+"</span>"+
          (aktif?"<em class='cephe-rozet'>Ateşkes · "+kalan+" tur</em>":"")+"</div>"+
        "<div class='cephe-doktrin'>“"+komutan(bot).doktrin+"”</div>"+
        "<div class='cephe-veri'>"+owned.length+" il · güç "+bot.power+" · "+
          (temas? temas+" sınır teması" : "seninle teması yok")+" · "+
          BOT_DIFF[bot.difficulty].label.toLocaleLowerCase("tr")+"</div>"+
        "<div class='cephe-imza'>"+komutan(bot).imza+"</div>"+
        "<button class='action-btn "+(aktif||state.gold<bedel?"":"primary")+"' data-bot='"+bot.id+"'"+
          (aktif||state.gold<bedel?" disabled":"")+">"+
          "<span><span class='a-name'>"+(aktif?"Ateşkes sürüyor":"Ateşkes öner")+"</span>"+
          "<span class='a-desc'>"+(aktif? kalan+" tur boyunca baskın yok"
                : "10 tur boyunca bu cephe baskın yapmaz")+"</span></span>"+
          "<span class='a-cost'>"+(aktif?"":bedel+" 🪙")+"</span></button>"+
      "</div>";
    }).join("");

    var bossIl=regions.filter(function(r){ return r.owner==="enemy" && r.botId==null; }).length;
    var html=
      satir("Düşman başkumandanlığı", (regions[1]?regions[1].name:"—")+" · "+bossIl+" il")+
      "<div class='sheet-divider'></div>"+
      (satirlar || "<div class='panel-ipucu'>Haritada aktif bot cephesi kalmadı.</div>")+
      "<div class='panel-ipucu'>"+ateskesKunye()+"</div>";
    openSheet("🤝","Diplomasi", "Cepheler ve ateşkes", html+kapatDugmesi());
    kapatBagla();
    document.querySelectorAll("#sheet-actions [data-bot]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var bot=bots[parseInt(btn.dataset.bot,10)];
        if(!bot) return;
        var bedel=ateskesBedeli(bot);
        if(state.gold<bedel){ showToast("🪙 Yeterli altının yok."); return; }
        state.gold-=bedel;
        bot.ateskes=state.turn+10;
        bildir(2, "🤝 "+komutan(bot).ad+" ile ateşkes kuruldu — 10 tur baskın yok.", "diplomasi");
        closeSheet(); drawMap();
      });
    });
  }

  /* ---- ŞEHİRLER ---- */
  function openCitiesSheet(){
    var owned=regions.filter(function(r){ return r.owner==="player"; });
    var siraliDurum=function(r){
      if(isAdjacentToEnemy(r) && !(r.garrison>0) && !defenseStructures(r).length) return 0;   // açık
      if(isAdjacentToEnemy(r)) return 1;                                                      // cephe
      if((r.ikmal==null?100:r.ikmal)<40) return 2;                                            // ikmalsiz
      return 3;
    };
    owned.sort(function(a,b){ return siraliDurum(a)-siraliDurum(b) || (a.ikmal||0)-(b.ikmal||0); });
    var etiket=["⚠️ Açık","🛡️ Cephe","⛽ İkmalsiz","✓ Güvenli"];
    var html=owned.map(function(r){
      var d=siraliDurum(r);
      var bina = r.building ? BUILDINGS[r.building].name : (r.type==="capital" ? "Başkent" : "Boş");
      return "<button class='action-btn sehir-satir d"+d+"' data-rid='"+r.id+"'>"+
        "<span><span class='a-name'>"+r.name+(r.gecit?" ⛰":"")+"</span>"+
        "<span class='a-desc'>"+etiket[d]+" · "+bina+" · garnizon "+(r.garrison||0)+
        " · ikmal %"+(r.ikmal==null?100:r.ikmal)+"</span></span></button>";
    }).join("");
    var acik=owned.filter(function(r){ return siraliDurum(r)===0; }).length;
    openSheet("🏙️","Şehirler", owned.length+" il · "+(acik?acik+" tanesi savunmasız":"hepsi savunmalı"),
      html+kapatDugmesi());
    kapatBagla();
    document.querySelectorAll("#sheet-actions .sehir-satir").forEach(function(btn){
      btn.addEventListener("click", function(){
        var r=regions[parseInt(btn.dataset.rid,10)];
        closeSheet();
        if(r){ centerOnAnchor(r.anchor); secimSeridi(r); }
      });
    });
  }

  bottombar.addEventListener("click", function(e){
    var btn=e.target.closest(".bb-tab");
    if(!btn) return;
    ses("uiTik");
    var key=btn.dataset.bb;
    if(key==="menu"){
      var willOpen=!menuSheet.classList.contains("open");
      if(willOpen) renderBuildTray();     // altın değiştiyse kilitler tazelensin
      menuSheet.classList.toggle("open", willOpen);
      setActiveTab(willOpen ? "menu" : "map");
      // Menü açıkken alttaki şeritler tepsiyle çakışıyor, geçici gizle.
      hudBottom.style.opacity=willOpen ? "0" : "";
      hudBottom.style.pointerEvents=willOpen ? "none" : "";
      var serit=document.getElementById("secim-serit");
      if(serit) serit.style.opacity=willOpen ? "0" : "";
      return;
    }
    closeMenuSheet();
    setActiveTab(key);
    if(key==="army") openArmySheet();
    else if(key==="cities") openCitiesSheet();
    else if(key==="diplomacy") openDiplomasiSheet();
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
      "<p class='quit-note'>Lobiye döneceksin. Sefer <b>kaydedilir</b>: lobideki "+
      "“Devam et” ile aynı haritada kaldığın yerden sürdürebilirsin.</p>"+
      "<button id='quit-yes'>Evet, seferden çık</button>"+
      "<button id='quit-no'>Vazgeç</button>";
    modalOverlay.classList.add("show");
    modalDuraklat();
    document.getElementById("quit-yes").addEventListener("click", function(){
      kaydet();
      clearInterval(tickTimer); clearInterval(raidTimer); clearInterval(botTimer);
      location.reload();
    });
    document.getElementById("quit-no").addEventListener("click", function(){
      modalOverlay.classList.remove("show");
      modalDevam();
    });
  }
  /* ---- Ses ayarı ----
     Üç kademe: kapalı → kısık → açık. Tek düğme, kalıcı ayar. */
  var sesDugme=document.getElementById("menu-ses");
  function sesEtiketiTazele(){
    if(!sesDugme || !window.__bfSesDurum) return;
    var d=window.__bfSesDurum();
    sesDugme.textContent = !d.acik ? "Ses: Kapalı"
      : (d.seviye<=0.4 ? "Ses: Kısık" : "Ses: Açık");
  }
  if(sesDugme && window.__bfSesAyar){
    sesDugme.addEventListener("click", function(){
      var d=window.__bfSesDurum();
      if(!d.acik) window.__bfSesAyar({acik:true, seviye:0.35});
      else if(d.seviye<=0.4) window.__bfSesAyar({acik:true, seviye:0.75});
      else window.__bfSesAyar({acik:false});
      sesEtiketiTazele();
    });
    sesEtiketiTazele();
  }

  document.getElementById("menu-quit").addEventListener("click", confirmQuit);
  document.getElementById("menu-help").addEventListener("click", function(){
    closeMenuSheet();
    showInstructions(false);
  });

  /* ================= Init ================= */
  /* Her sefer kendi tohumuyla üretilir; tohum kayda giderek aynı haritanın
     geri yüklenmesini sağlar. */
  state.tohum=Math.floor(Math.random()*2147483647);
  tohumAyarla(state.tohum);
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
    bolgeAl:bolgeAl, taarruzEt:taarruzEt, fetihTamamla:fetihTamamla,
    isAdjacentToPlayer:isAdjacentToPlayer, attackAvailability:attackAvailability,
    invalidateRoutes:invalidateRoutes, drawMap:drawMap,
    bildir:bildir, olaylar:function(){ return state.olaylar; },
    kaydet:kaydet, kayitOku:kayitOku, kayittanYukle:kayittanYukle, kaydiSil:kaydiSil,
    kayitPaketle:kayitPaketle, tohumAyarla:tohumAyarla, tohumAl:tohumAl,
    rastgele:rastgele, generateWorld:generateWorld, dunyaSifirla:dunyaSifirla,
    komutan:komutan, seferGerekce:seferGerekce, binaBolgeEtkisi:binaBolgeEtkisi,
    baskinDayanimi:baskinDayanimi, tryDemolish:tryDemolish,
    binaAciklama:binaAciklama, saldiriKunye:saldiriKunye, zaferKunye:zaferKunye,
    katmanAyarla:katmanAyarla, katmanKategori:katmanKategori,
    modAyarla:function(k){ return window.__bfSetMode(k); }
  };

  /* ---- Sefer kurulumu ----
     Lobi burayı çağırır: mod, rakip sayısı, zorluk dağılımı ve harita tohumu.
     Dünya bu ayarlarla YENİDEN üretilir; yani lobide seçilen her şey haritaya
     birebir yansır. Sefer başladıysa artık değiştirilemez. */
  window.__bfSeferKur=function(ayar){
    if(state.started) return null;
    ayar=ayar||{};
    if(ayar.mod && MODES[ayar.mod]) activeMode=ayar.mod;
    BOT_SAYISI=Math.max(2, Math.min(4, ayar.botSayisi||3));
    ZORLUK_SECIMI = ayar.zorluk && ZORLUK_KALIP[ayar.zorluk] ? ZORLUK_KALIP[ayar.zorluk] : null;
    if(ZORLUK_SECIMI){
      // Seçilen kalıbı rakip sayısına göre uzat/kısalt.
      var k=[];
      for(var i=0;i<BOT_SAYISI;i++) k.push(ZORLUK_SECIMI[i % ZORLUK_SECIMI.length]);
      ZORLUK_SECIMI=k;
    }
    state.tohum = (ayar.tohum!=null && !isNaN(ayar.tohum))
      ? (ayar.tohum>>>0) : Math.floor(Math.random()*2147483647);

    tohumAyarla(state.tohum);
    dunyaSifirla();
    generateWorld();

    var m=MODES[activeMode];
    LOOP.tick=m.tick; LOOP.raid=m.raid; LOOP.bot=m.bot;
    state.gold=m.gold;
    invalidateRoutes(); araziKirlet(); drawMap();
    return window.__bfSeferOzet();
  };

  /* Lobinin gösterdiği künye: hepsi haritadan okunan gerçek değerler. */
  window.__bfSeferOzet=function(){
    var m=MODES[activeMode]||{};
    var h=m.hedef||{tip:"baskent"};
    return {
      mod:activeMode, modAd:m.name, tohum:state.tohum,
      hedef:zaferKunye(),
      hedefTip:h.tip,
      baskent:regions[0]?regions[0].name:"—",
      dusmanBaskenti:regions[1]?regions[1].name:"—",
      ilSayisi:REGION_COUNT,
      gecitler:GECITLER.filter(function(g){ return g.regionId>=0; })
                       .map(function(g){ return {ad:g.ad, kisa:g.kisa, il:regions[g.regionId].name}; }),
      acilisAltin:m.gold,
      tempo:(2000/m.tick),
      baskinAralik:Math.round(m.raid/1000),
      komutanlar:bots.map(function(b){
        var k=komutan(b);
        return {ad:k.ad, unvan:k.unvan, doktrin:k.doktrin, imza:k.imza,
                zorluk:BOT_DIFF[b.difficulty].label, renk:BOT_COLORS[b.difficulty],
                guc:b.power};
      }),
      tahminiSure: h.tip==="gecit"
        ? Math.round((90+ (h.tut||GECIT_TUTMA)*3) * (m.tick/1000) / 60)
        : Math.round(140 * (m.tick/1000) / 60)
    };
  };

  window.__bfShowInstructions=function(){ showInstructions(true); };
  // Lobiden okunan brifing: isFirstTime=false olduğu için kapatınca oyun
  // döngülerini BAŞLATMAZ — oyuncu sefere girmeden kuralları okuyabilsin diye.
  window.__bfShowBriefing=function(){ showInstructions(false); };

})();

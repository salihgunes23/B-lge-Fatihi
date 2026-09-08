(function(){
  "use strict";

  /* ================= Config ================= */
  var GRID_W=52, GRID_H=96, CELL=6;
  var REGION_COUNT=20;
  var SEA_FILL="#0d1922";
  var CATEGORY_COLORS={
    player:[79,143,116],
    enemy:[110,58,46],
    enemyCapital:[130,40,58],
    resource:[128,98,42],
    empty:[76,88,70],
    obstacle:[70,70,68],
    flashHit:[181,67,47],
    wall:[176,166,142],
    hover:[230,190,60]
  };

  var BUILDINGS={
    tufek:{name:"Tüfek Mevzisi", icon:"🔫", cost:30, def:5, desc:"+5 savunma"},
    duvar:{name:"Duvar", icon:"🧱", cost:65, def:8, desc:"+8 savunma (orta zorlukta bir engel)"},
    topcu:{name:"Topçu", icon:"💣", cost:100, def:10, splash:4, desc:"+10 savunma, komşu bölgelere +4"},
    hava:{name:"Hava Savunması", icon:"🛰️", cost:130, def:14, desc:"+14 savunma (en güçlü kalkan)"},
    fabrika:{name:"Fabrika", icon:"🏭", cost:70, gold:4, desc:"+4 altın / tur"},
    kent:{name:"Kent", icon:"🏙️", cost:140, gold:2, army:2, desc:"+2 altın, +2 asker / tur"}
  };
  var WALL_ATTRITION_DIVISOR=50;
  var WALL_DEFENSE_BONUS=6;

  var RESOURCE_KINDS={
    maden:{raw:"⛏️", built:"⚒️", label:"Maden Bölgesi"},
    tarim:{raw:"🌾", built:"🚜", label:"Tarım Bölgesi"},
    odun:{raw:"🌲", built:"🪓", label:"Orman Bölgesi"}
  };
  var RESOURCE_KEYS=Object.keys(RESOURCE_KINDS);

  var BOT_DIFF={
    kolay:{label:"Kolay", basePower:5, growthStep:1, expandChance:0.35, reinforceStep:1},
    orta:{label:"Orta", basePower:9, growthStep:2, expandChance:0.55, reinforceStep:2},
    zor:{label:"Zor", basePower:14, growthStep:3, expandChance:0.8, reinforceStep:3}
  };
  var BOT_DIFF_KEYS=Object.keys(BOT_DIFF);
  var bots=[];

  var state={gold:60, army:10, turn:0, gameOver:false, started:false, raidCount:0, lastExpansionBonus:0};

  var pixelRegionId=[];      // [y][x] -> region id or -1
  var landPixelsList=[];     // flat {x,y,regionId,noise,isBorder}
  var regions=[];
  var animating=null;        // {region, flipped:Set}
  var flashRegionId=null;
  var dragHoverRegionId=null;
  var currentSel=null;

  var canvas=document.getElementById("map");
  var ctx=canvas.getContext("2d");
  var LOGICAL_W=GRID_W*CELL, LOGICAL_H=GRID_H*CELL;
  var DPR=Math.min(window.devicePixelRatio||1, 3);
  canvas.width=Math.round(LOGICAL_W*DPR);
  canvas.height=Math.round(LOGICAL_H*DPR);
  ctx.scale(DPR,DPR);

  function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function clampByte(v){return Math.max(0,Math.min(255,Math.round(v)));}
  function dist2(ax,ay,bx,by){var dx=ax-bx, dy=ay-by; return dx*dx+dy*dy;}

  /* ================= World generation ================= */
  function generateWorld(){
    var land=[];
    for(var y=0;y<GRID_H;y++){ land.push(new Array(GRID_W).fill(false)); }

    var ellipses=[
      {cx:GRID_W*0.50, cy:GRID_H*0.50, rx:GRID_W*0.40, ry:GRID_H*0.46},
      {cx:GRID_W*0.42, cy:GRID_H*0.22, rx:GRID_W*0.30, ry:GRID_H*0.20},
      {cx:GRID_W*0.58, cy:GRID_H*0.78, rx:GRID_W*0.28, ry:GRID_H*0.18}
    ];

    for(var y=0;y<GRID_H;y++){
      for(var x=0;x<GRID_W;x++){
        var minD=99;
        for(var e=0;e<ellipses.length;e++){
          var el=ellipses[e];
          var nd=Math.sqrt(Math.pow((x-el.cx)/el.rx,2)+Math.pow((y-el.cy)/el.ry,2));
          if(nd<minD) minD=nd;
        }
        if(minD<0.82){ land[y][x]=true; }
        else if(minD<1.06){
          var p=1-(minD-0.82)/(1.06-0.82);
          land[y][x]=Math.random()<p;
        }
      }
    }

    // keep only the connected landmass containing the grid center
    var startX=Math.floor(GRID_W/2), startY=Math.floor(GRID_H/2);
    var visited=[];
    for(var yy=0;yy<GRID_H;yy++){ visited.push(new Array(GRID_W).fill(false)); }
    var stack=[[startX,startY]];
    visited[startY][startX]=true;
    var mainland=[];
    while(stack.length){
      var cur=stack.pop();
      var cx2=cur[0], cy2=cur[1];
      if(land[cy2][cx2]) mainland.push([cx2,cy2]);
      var nb=[[cx2-1,cy2],[cx2+1,cy2],[cx2,cy2-1],[cx2,cy2+1]];
      for(var i=0;i<nb.length;i++){
        var nx=nb[i][0], ny=nb[i][1];
        if(nx<0||nx>=GRID_W||ny<0||ny>=GRID_H) continue;
        if(visited[ny][nx]) continue;
        if(!land[ny][nx]) continue;
        visited[ny][nx]=true;
        stack.push([nx,ny]);
      }
    }
    for(var y2=0;y2<GRID_H;y2++){
      for(var x2=0;x2<GRID_W;x2++){
        if(land[y2][x2] && !visited[y2][x2]) land[y2][x2]=false;
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
    var capSeed=nearestMainland(GRID_W*0.5, GRID_H*0.90);
    var bossSeed=nearestMainland(GRID_W*0.5, GRID_H*0.08);
    var seeds=[capSeed, bossSeed];

    var MIN_SPACING=8.5;
    var tries=0;
    while(seeds.length<REGION_COUNT && tries<4000){
      tries++;
      var pick=mainland[randInt(0,mainland.length-1)];
      var ok=true;
      var spacing=tries<2000?MIN_SPACING:MIN_SPACING*0.55;
      for(var s=0;s<seeds.length;s++){
        if(dist2(pick[0],pick[1],seeds[s][0],seeds[s][1]) < spacing*spacing){ ok=false; break; }
      }
      if(ok) seeds.push(pick);
    }
    while(seeds.length<REGION_COUNT){
      seeds.push(mainland[randInt(0,mainland.length-1)]);
    }

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
        defense: r===1?44:null, garrison:0, wall:false, botId:null, resKind:null, cost:null, goldBonus:null, anchor:{x:seeds[r][0],y:seeds[r][1]}
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
      if(rnd<0.15){
        region.type="obstacle"; region.owner="neutral";
      } else if(rnd<0.45){
        region.type="resource"; region.owner="neutral";
        region.resKind = RESOURCE_KEYS[randInt(0,RESOURCE_KEYS.length-1)];
        region.cost = 30 + Math.floor(region.pixels.length/12);
        region.goldBonus = 3 + Math.floor(region.pixels.length/40);
      } else if(rnd<0.80){
        region.type="enemy"; region.owner="enemy";
        region.defense = clamp(4 + gd*3 + randInt(0,4), 3, 40);
        region.wall = Math.random()<0.28;
        if(region.wall){ region.defense = clamp(region.defense+WALL_DEFENSE_BONUS, 3, 46); }
      } else {
        region.type="empty"; region.owner="neutral";
        region.cost = 15 + Math.floor(region.pixels.length/15);
      }
    }

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
      bots.push({id:i, difficulty:diffKey, power:BOT_DIFF[diffKey].basePower});
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
    if(region.owner==="player") return "player";
    return categoryForType(region.type);
  }
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
  function effectiveDefense(region){
    var base=2;
    if(region.garrison){ base += region.garrison; }
    if(region.wall){ base += WALL_DEFENSE_BONUS; }
    if(region.building){ base += BUILDINGS[region.building].def || 0; }
    region.neighbors.forEach(function(nid){
      var n=regions[nid];
      if(n.owner==="player" && n.building==="topcu"){ base += BUILDINGS.topcu.splash; }
    });
    return base;
  }

  /* ================= Render ================= */
  function drawMap(){
    ctx.fillStyle=SEA_FILL;
    ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);
    for(var i=0;i<landPixelsList.length;i++){
      var p=landPixelsList[i];
      var region=regions[p.regionId];
      var cat;
      var wallRing=false, hoverRing=false;
      if(animating && p.regionId===animating.region.id){
        var key=p.y*GRID_W+p.x;
        cat = animating.flipped.has(key) ? "player" : categoryForType(region.type);
      } else if(p.regionId===flashRegionId){
        cat="flashHit";
      } else {
        cat=categoryForRegion(region);
        if(p.isBorder){
          if(p.regionId===dragHoverRegionId) hoverRing=true;
          else if(region.wall || region.building==="duvar") wallRing=true;
        }
      }
      ctx.fillStyle = hoverRing ? pixelFillStyle("hover", p.noise, false) : (wallRing ? pixelFillStyle("wall", p.noise, false) : pixelFillStyle(cat,p.noise,p.isBorder));
      ctx.fillRect(p.x*CELL, p.y*CELL, CELL, CELL);
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
      var mainIcon="";
      if(reg.type==="capital") mainIcon="🏰";
      else if(reg.type==="enemyCapital") mainIcon = reg.owner==="player" ? "🏰" : "👑";
      else if(reg.type==="enemy") mainIcon = reg.owner==="player" ? "🚩" : "🪖";
      else if(reg.type==="resource") mainIcon = reg.owner==="player" ? RESOURCE_KINDS[reg.resKind].built : RESOURCE_KINDS[reg.resKind].raw;
      else mainIcon = reg.owner==="player" ? "🚩" : "";
      if(mainIcon){
        ctx.font=Math.floor(CELL*1.8)+"px sans-serif";
        ctx.fillText(mainIcon, cx, cy);
      }
      var badgeNum=null;
      if((reg.type==="enemy"||reg.type==="enemyCapital") && reg.owner==="enemy"){
        badgeNum=reg.defense;
      } else if(reg.owner==="player" && reg.type!=="capital"){
        var ed=effectiveDefense(reg);
        if(ed>2) badgeNum=ed;
      }
      if(badgeNum!==null){
        var txt=String(badgeNum);
        ctx.font="bold "+Math.max(8,Math.floor(CELL*1.05))+"px ui-monospace, monospace";
        var tw=ctx.measureText(txt).width;
        ctx.fillStyle="rgba(0,0,0,0.55)";
        ctx.fillRect(cx-tw/2-3, cy+CELL*1.05-6, tw+6, 12);
        ctx.fillStyle="#f2ede0";
        ctx.fillText(txt, cx, cy+CELL*1.05);
      }
    }

    document.getElementById("gold-val").textContent=state.gold;
    document.getElementById("army-val").textContent=state.army;
    document.getElementById("turn-val").textContent=state.turn;
  }

  /* ================= Pixel-by-pixel capture animation ================= */
  function animateCapture(region, doneCallback){
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
        drawMap();
        doneCallback && doneCallback();
      }
    }, 45);
  }

  function flashRegion(rid){
    flashRegionId=rid;
    drawMap();
    setTimeout(function(){ flashRegionId=null; drawMap(); }, 600);
  }

  /* ================= Toast ================= */
  function showToast(msg){
    var zone=document.getElementById("toast-zone");
    var t=document.createElement("div");
    t.className="toast";
    t.textContent=msg;
    zone.appendChild(t);
    setTimeout(function(){
      t.classList.add("fade");
      setTimeout(function(){ t.remove(); }, 350);
    }, 2400);
  }

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
    if(!isAdjacentToPlayer(region)){
      showToast("⚠️ Önce komşu bölgeleri ele geçirmelisin.");
      return;
    }
    if(region.type==="empty"){
      openCapturePanel(region, {cost:region.cost, icon:"🟩", label:"Boş Bölge", desc:"Sahipsiz toprak. Ele geçirip genişleyebilirsin."});
    } else if(region.type==="resource"){
      var rk=RESOURCE_KINDS[region.resKind];
      openCapturePanel(region, {cost:region.cost, icon:rk.raw, label:rk.label, desc:"Ele geçirilince otomatik "+rk.built+" kurulur, +"+region.goldBonus+" altın/tur pasif üretim sağlar."});
    } else if(region.type==="enemy" || region.type==="enemyCapital"){
      openAttackPanel(region);
    }
  }

  function openCapturePanel(region, opts){
    currentSel=region;
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
        showToast("🎉 Bölge ele geçirildi, sınırın ilerledi.");
      });
    });
  }

  function openAttackPanel(region){
    currentSel=region;
    var isBoss = region.type==="enemyCapital";
    var sub = "Savunma gücü: "+region.defense+" 🪖 · Elindeki asker: "+state.army+" 🪖"+(region.wall?" · 🧱 Duvarlı bölge":"");

    var startAmt = state.army<=0 ? 0 : Math.min(region.defense, state.army);
    var sendAmt = startAmt;

    var html =
      "<div class='qty-row'>"+
        "<button class='qty-btn' id='qty-minus'>−</button>"+
        "<div class='qty-display'><span id='qty-value'>0</span><span class='qty-label'>asker</span></div>"+
        "<button class='qty-btn' id='qty-plus'>+</button>"+
      "</div>"+
      "<div class='qty-presets'>"+
        "<button class='qty-preset' id='qty-min'>Min ("+region.defense+")</button>"+
        "<button class='qty-preset' data-add='5'>+5</button>"+
        "<button class='qty-preset' data-add='10'>+10</button>"+
        "<button class='qty-preset' id='qty-max'>Tümü ("+state.army+")</button>"+
      "</div>"+
      "<div class='outcome-preview' id='outcome-preview'></div>"+
      "<button class='action-btn danger-action' id='do-attack'>"+
        "<span><span class='a-name'>Saldır</span><span class='a-desc'>Seçtiğin kadar askeri gönder</span></span>"+
        "<span class='a-cost' id='attack-cost-tag'></span></button>";

    openSheet(isBoss?"👑":(region.wall?"🧱":"🪖"), isBoss?"Düşman Başkenti":"Düşman Karakolu", sub, html);

    var qtyValEl=document.getElementById("qty-value");
    var previewEl=document.getElementById("outcome-preview");
    var attackBtn=document.getElementById("do-attack");
    var costTag=document.getElementById("attack-cost-tag");

    function clampAmt(v){ return Math.max(0, Math.min(state.army, v)); }

    function refresh(){
      sendAmt=clampAmt(sendAmt);
      qtyValEl.textContent=sendAmt;
      costTag.textContent="🪖"+sendAmt;
      attackBtn.disabled = sendAmt<1;
      if(sendAmt<1){
        previewEl.className="outcome-preview";
        previewEl.textContent="Gönderecek askerin yok.";
      } else if(sendAmt>=region.defense){
        var extra=sendAmt-region.defense;
        var wallLoss = region.wall ? Math.floor(sendAmt/WALL_ATTRITION_DIVISOR) : 0;
        extra=Math.max(0, extra-wallLoss);
        var loot=Math.floor(region.defense*2.5);
        previewEl.className="outcome-preview ok";
        previewEl.textContent="✅ Bu bölgeyi fethedersin · "+loot+" 💰 ganimet"+
          (wallLoss>0?(" · 🧱 duvarı aşarken "+wallLoss+" asker daha kaybedersin"):"")+
          (extra>0?(" · fazladan "+extra+" asker orada garnizon kalıp savunmayı güçlendirir 🛡️"):"")+".";
      } else {
        var mult = region.wall ? 0.5 : 0.8;
        var afterDef=Math.max(1, region.defense-Math.max(1,Math.floor(sendAmt*mult)));
        previewEl.className="outcome-preview bad";
        previewEl.textContent="⚠️ Yetersiz kuvvet — saldırı başarısız olur, "+sendAmt+" askerini kaybedersin. Savunma "+region.defense+" → yaklaşık "+afterDef+"'e zayıflar"+(region.wall?" (duvar sayesinde daha az zayıflıyor)":"")+", tekrar deneyebilirsin.";
      }
    }

    document.getElementById("qty-minus").addEventListener("click", function(){ sendAmt-=1; refresh(); });
    document.getElementById("qty-plus").addEventListener("click", function(){ sendAmt+=1; refresh(); });
    document.getElementById("qty-min").addEventListener("click", function(){ sendAmt=Math.min(region.defense,state.army); refresh(); });
    document.getElementById("qty-max").addEventListener("click", function(){ sendAmt=state.army; refresh(); });
    document.querySelectorAll(".qty-preset[data-add]").forEach(function(btn){
      btn.addEventListener("click", function(){ sendAmt+=parseInt(btn.dataset.add,10); refresh(); });
    });

    attackBtn.addEventListener("click", function(){
      var sent=clampAmt(sendAmt);
      if(sent<1) return;
      state.army-=sent;
      closeSheet();
      if(sent>=region.defense){
        var wallLoss = region.wall ? Math.floor(sent/WALL_ATTRITION_DIVISOR) : 0;
        var leftover=Math.max(0, sent-region.defense-wallLoss);
        var loot=Math.floor(region.defense*2.5);
        animateCapture(region, function(){
          region.garrison=leftover;
          state.gold+=loot;
          drawMap();
          showToast("⚔️ Zafer! "+loot+" altın ganimet"+
            (wallLoss>0?(" · 🧱 duvara "+wallLoss+" asker kaptırdın"):"")+
            (leftover>0?(" · "+leftover+" asker garnizon bıraktın 🛡️"):"")+".");
          if(isBoss){ setTimeout(showVictory, 400); }
        });
      } else {
        var mult = region.wall ? 0.5 : 0.8;
        var reduction=Math.max(1,Math.floor(sent*mult));
        region.defense=Math.max(1, region.defense-reduction);
        drawMap();
        flashRegion(region.id);
        showToast("💥 Saldırı püskürtüldü, "+sent+" asker kaybettin. Savunma "+region.defense+"'e zayıfladı.");
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
    drawMap();
    showToast(b.icon+" "+b.name+" inşa edildi.");
    return {ok:true};
  }

  function openBuildPanel(region){
    currentSel=region;
    if(region.type==="capital"){
      openSheet("🏰","Başkentin","Asker ve altın üretiminin kalbi. Her tur otomatik üretim yapar.","");
      return;
    }
    var html="";
    if(region.building){
      var b=BUILDINGS[region.building];
      html = "<div class='sheet-sub'>Bu bölgede zaten <b style='color:var(--text)'>"+b.name+"</b> inşa edilmiş.</div>";
    } else {
      Object.keys(BUILDINGS).forEach(function(key){
        var b=BUILDINGS[key];
        var canAfford = state.gold>=b.cost;
        html += "<button class='action-btn build-btn' data-key='"+key+"' "+(canAfford?"":"disabled")+">"+
          "<span><span class='a-name'>"+b.icon+" "+b.name+"</span><span class='a-desc'>"+b.desc+"</span></span>"+
          "<span class='a-cost'>💰"+b.cost+"</span></button>";
      });
    }
    openSheet("🏗️","Bölgeye İnşa Et","Bu bölgede bir yapı kurabilirsin, ya da bina panelinden sürükleyip bırakabilirsin.", html);
    document.querySelectorAll(".build-btn").forEach(function(btn){
      btn.addEventListener("click", function(){
        if(tryBuild(region, btn.dataset.key).ok) closeSheet();
      });
    });
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

  canvas.addEventListener("click", function(e){
    var region=regionAtPoint(e.clientX, e.clientY);
    if(!region){ showToast("🌊 Bu alan deniz, buradan geçemezsin."); return; }
    onRegionTap(region.id);
  });

  /* ================= Bina paneli: sürükle-bırak ================= */
  var dragState=null;

  function renderBuildTray(){
    var tray=document.getElementById("build-tray");
    var html="";
    Object.keys(BUILDINGS).forEach(function(key){
      var b=BUILDINGS[key];
      html += "<div class='build-card' data-key='"+key+"'>"+
        "<div class='bc-icon'>"+b.icon+"</div>"+
        "<div class='bc-name'>"+b.name+"</div>"+
        "<div class='bc-cost'>💰"+b.cost+"</div>"+
      "</div>";
    });
    tray.innerHTML=html;
    tray.querySelectorAll(".build-card").forEach(function(cardEl){
      cardEl.addEventListener("pointerdown", function(e){
        e.preventDefault();
        startDrag(cardEl.dataset.key, e.pointerId, cardEl, e.clientX, e.clientY);
      });
    });
  }

  function positionGhost(x,y){
    if(!dragState) return;
    dragState.ghostEl.style.left=x+"px";
    dragState.ghostEl.style.top=y+"px";
  }

  function startDrag(key, pointerId, cardEl, x, y){
    if(dragState) return;
    var b=BUILDINGS[key];
    var ghost=document.createElement("div");
    ghost.id="drag-ghost";
    ghost.innerHTML="<div class='dg-icon'>"+b.icon+"</div><div class='dg-hint' id='drag-hint'>Bir bölgeye sürükle</div>";
    document.body.appendChild(ghost);
    dragState={key:key, cardEl:cardEl, ghostEl:ghost};
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
    if(newHoverId!==dragHoverRegionId){
      dragHoverRegionId=newHoverId;
      drawMap();
    }
    var b=BUILDINGS[dragState.key];
    var hint=document.getElementById("drag-hint");
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
    dragState.ghostEl.remove();
    dragState=null;
    dragHoverRegionId=null;
    drawMap();
    if(region){ tryBuild(region, key); }
    else { showToast("İnşa iptal edildi."); }
  }

  /* ================= Game loops ================= */
  var tickTimer=null, raidTimer=null, botTimer=null;

  function tick(){
    if(state.gameOver) return;
    var goldGain=0, armyGain=0, ownedCount=0;
    regions.forEach(function(t){
      if(t.type==="capital"){ goldGain+=5; armyGain+=2; }
      if(t.owner==="player"){
        ownedCount++;
        if(t.type==="resource") goldGain+=t.goldBonus;
        if(t.building){
          var b=BUILDINGS[t.building];
          if(b.gold) goldGain+=b.gold;
          if(b.army) armyGain+=b.army;
        }
      }
    });
    var expansionBonus=Math.floor(ownedCount/3);
    armyGain += expansionBonus;
    if(expansionBonus>state.lastExpansionBonus){
      state.lastExpansionBonus=expansionBonus;
      showToast("🎖️ Fethedilen topraklar büyüdükçe asker üretimin hızlandı! (+"+expansionBonus+"/tur)");
    }
    state.gold+=goldGain;
    state.army+=armyGain;
    state.turn+=1;
    if(goldGain>0) showGoldPopup(goldGain);
    drawMap();
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

  function tryRaid(){
    if(state.gameOver || animating) return;
    var borders=regions.filter(function(r){
      return r.owner==="player" && r.type!=="capital" && isAdjacentToEnemy(r);
    });
    if(!borders.length) return;
    var target=borders[randInt(0,borders.length-1)];
    state.raidCount+=1;
    var power=6+state.raidCount;
    var def=effectiveDefense(target);
    if(def>=power){
      state.gold+=8;
      showToast("🛡️ Düşman baskını püskürtüldü! (+8 altın)");
    } else {
      state.gold=Math.max(0,state.gold-20);
      state.army=Math.max(0,state.army-2);
      flashRegion(target.id);
      showToast("⚠️ Sınır bölgen baskına uğradı! Kayıplar var.");
    }
    drawMap();
  }

  function botTickAll(){
    if(state.gameOver || animating || !bots.length) return;
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

      if(Math.random()<diff.expandChance){
        var candidates=[];
        owned.forEach(function(r){
          r.neighbors.forEach(function(nid){
            var nr=regions[nid];
            if(nr.type==="empty" && nr.owner==="neutral"){ candidates.push(nr); }
          });
        });
        if(candidates.length){
          var target=candidates[randInt(0,candidates.length-1)];
          target.type="enemy";
          target.owner="enemy";
          target.botId=bot.id;
          target.defense=clamp(bot.power + randInt(-2,2), 3, 46);
          changed=true;
        }
      }
    });
    if(changed) drawMap();
  }

  function startLoops(){
    state.started=true;
    tickTimer=setInterval(tick, 2000);
    raidTimer=setInterval(tryRaid, 28000);
    botTimer=setInterval(botTickAll, 4500);
  }

  /* ================= Modals ================= */
  var modalOverlay=document.getElementById("modal-overlay");
  var modalBox=document.getElementById("modal-box");

  function showInstructions(isFirstTime){
    modalBox.className="modal-box";
    modalBox.innerHTML =
      "<h2>Nasıl Oynanır?</h2>"+
      "<div class='legend-row'><span class='lic'>🟩</span><span><b>Boş bölge</b> — altın karşılığı ele geçirilir.</span></div>"+
      "<div class='legend-row'><span class='lic'>⚒️🚜🪓</span><span><b>Kaynak bölgesi</b> — maden, tarım veya orman olabilir; ele geçirince otomatik bina kurulur ve kalıcı olarak altın üretmeye devam eder.</span></div>"+
      "<div class='legend-row'><span class='lic'>🪖</span><span><b>Düşman karakolu</b> — saldırırken kaç asker göndereceğini sen seçersin. Yetersiz gönderirsen saldırı başarısız olur ama savunmayı zayıflatırsın; fazla gönderirsen ele geçirince oraya garnizon bırakıp savunmayı güçlendirirsin.</span></div>"+
      "<div class='legend-row'><span class='lic'>🧱</span><span><b>Duvarlı bölgeler</b> — sınırlarının çevresinde taş renkli bir halka görürsün. Normalden daha sağlam savunmaya sahiptir; büyük bir orduyla saldırırsan askerinin bir kısmını (yaklaşık her 50 askerden 1'i) duvarı aşarken kaybedersin.</span></div>"+
      "<div class='legend-row'><span class='lic'>⛰️🌊</span><span><b>Dağ / deniz</b> — geçilemez, etrafından dolaşman gerekir.</span></div>"+
      "<div class='legend-row'><span class='lic'>👑</span><span><b>Düşman başkenti</b> — ele geçirirsen oyunu kazanırsın!</span></div>"+
      "<hr>"+
      "<div class='legend-row'><span class='lic'>⚔️</span><span>Bir bölgeyi fethettiğinde cephe hattı, sınırından başlayıp bölgenin içine <b>pixel pixel</b> yayılır.</span></div>"+
      "<div class='legend-row'><span class='lic'>📈</span><span>Bölge sayın arttıkça asker üretim hızın da otomatik olarak artar.</span></div>"+
      "<div class='legend-row'><span class='lic'>🤖</span><span>Haritada kolay / orta / zor seviyesinde <b>3 düşman botu</b> var. Zamanla boş toprakları ele geçirip güçlenirler — ama asla maden/tarım/orman bölgelerine dokunmazlar, o bölgeler her zaman sana açık kalır.</span></div>"+
      "<div class='legend-row'><span class='lic'>👆</span><span>Alttaki <b>bina panelinden</b> bir kartı basılı tutup kendi bölgene sürükle ve bırak — inşaat orada başlar.</span></div>"+
      "<div class='legend-row'><span class='lic'>🔢</span><span><b>Tüfek / Duvar / Topçu / Hava Savunması</b> — kendi bölgene inşa ederek savunmasını güçlendirir. Haritada bina simgesi yerine, o bölgenin toplam savunma gücünü gösteren bir sayı görürsün.</span></div>"+
      "<div class='legend-row'><span class='lic'>🏭🏙️</span><span><b>Fabrika / Kent</b> — altın ve asker üretimini artırır.</span></div>"+
      "<div class='legend-row'><span class='lic'>⚠️</span><span>Düşman zaman zaman sınır bölgelerine baskın yapar — savunman zayıfsa kayıp verirsin.</span></div>"+
      "<button id='start-btn'>"+(isFirstTime?"Anladım, Başla":"Kapat")+"</button>";
    modalOverlay.classList.add("show");
    document.getElementById("start-btn").addEventListener("click", function(){
      modalOverlay.classList.remove("show");
      if(isFirstTime) startLoops();
    });
  }

  function showVictory(){
    state.gameOver=true;
    clearInterval(tickTimer); clearInterval(raidTimer); clearInterval(botTimer);
    modalBox.className="modal-box victory";
    modalBox.innerHTML =
      "<div class='big'>🎉👑</div>"+
      "<h2>Zaferi Kazandın!</h2>"+
      "<div class='sheet-sub' style='margin-bottom:0;color:var(--text-dim)'>Düşman başkentini "+state.turn+" turda fethettin.</div>"+
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

  /* ================= Init ================= */
  generateWorld();
  drawMap();
  renderBuildTray();
  showInstructions(true);

})();
